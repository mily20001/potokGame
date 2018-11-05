import mysql from 'mysql';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import CONFIG from './config';
import errorCodes from './errorCodes';

export default class DatabaseManager {
    constructor() {
        this.connection = mysql.createConnection({
            host: CONFIG.dbHost,
            user: CONFIG.dbUsername,
            password: CONFIG.dbPassword,
            database: CONFIG.dbName,
        });

        this.connected = false;

        this.connection.connect((err) => {
            if (err) {
                console.error(`error connecting: ${err.stack}`);
                return;
            }

            this.connected = true;
            console.log(`connected as id ${this.connection.threadId}`);
        });

        this.promiseQuery = query => new Promise((resolve, reject) => {
            this.connection.query(query, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    getDragons(callback) {
        this.connection.query('SELECT * from Dragons', (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const dragons = results.reduce((allDragons, dragon) =>
                ({ ...allDragons, [dragon.id]: { ...dragon } }), {});

            let queriesToBeDone = results.length;

            Object.keys(dragons).forEach((key) => {
                this.connection.query(`SELECT * from Dragons_leveling WHERE dragon_id=${key}`, (err2, results2) => {
                    if (err2) {
                        console.error(err2);
                        callback({ err: err2 });
                        return;
                    }

                    dragons[key].levels = {};

                    results2.forEach((level) => {
                        dragons[key].levels[level.id] = {
                            level: level.level,
                            xp: level.xp,
                            strength: level.strength,
                            defence: level.defence,
                            range: level.range,
                            hp: level.hp,
                        };
                    });

                    queriesToBeDone--;

                    if (queriesToBeDone === 0) {
                        callback({ dragons });
                    }
                });
            });
        });
    }

    getTeams(callback) {
        const query = 'SELECT Teams.*, ' +
            'CONCAT(Players.name, " ", Players.surname) AS capitan_name ' +
            'from Teams LEFT JOIN Players ON Teams.capitan = Players.id';

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const teams = results.reduce((allTeams, team) =>
                ({ ...allTeams, [team.id]: { ...team } }), {});

            // console.log(teams);
            callback({ teams });
        });
    }

    propagatePoints() {
        this.connection.query('SELECT id from Players WHERE role = "player"', (err, results) => {
            if (err) {
                console.error(err);
                return;
            }

            const users = results.map(user => user.id);

            users.forEach((userId) => {
                const query = 'SELECT DISTINCT date FROM Points WHERE (date) NOT IN ' +
                    `(SELECT DISTINCT date FROM Points WHERE player_id = ${mysql.escape(userId)})`;

                this.connection.query(query, (err2, results2) => {
                    if (err2) {
                        console.error(err2);
                        return;
                    }

                    if (results2.length > 0) {
                        const insertQuery = 'INSERT INTO Points (player_id, date, ' +
                            'points_punktualnosc, points_przygotowanie, points_skupienie, ' +
                            'points_efekt) VALUES ' +
                            `${results2.map(row =>
                                `(${mysql.escape(userId)}, ${mysql.escape(row.date)}, 0, 0, 0, 0)`)
                                .join(', ')}`;

                        console.log(`Inserting ${results2.length} missing point rows`);

                        this.connection.query(insertQuery, (err3) => {
                            if (err3) {
                                console.error(err3);
                            }
                        });
                    }
                });
            });
        });
    }

    propagateFields() {
        this.connection.query('SELECT id from Teams', (err, results) => {
            if (err) {
                console.error(err);
                return;
            }

            const teams = results.map(team => team.id);

            teams.forEach((teamId) => {
                const query = 'SELECT DISTINCT id FROM Regions WHERE (id) NOT IN ' +
                    `(SELECT DISTINCT region_id FROM Fields WHERE team_id = ${mysql.escape(teamId)})`;

                this.connection.query(query, (err2, results2) => {
                    if (err2) {
                        console.error(err2);
                        return;
                    }

                    if (results2.length > 0) {
                        const insertQuery = 'INSERT INTO Fields (region_id, team_id) VALUES ' +
                            `${results2.map(row =>
                                `(${mysql.escape(row.id)}, ${mysql.escape(teamId)})`)
                                .join(', ')}`;

                        console.log(`Inserting ${results2.length} missing fields`);

                        this.connection.query(insertQuery, (err3) => {
                            if (err3) {
                                console.error(err3);
                            }
                        });
                    }
                });
            });
        });
    }

    changePoints(changes, callback) {
        try {
            this.connection.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                const queriesToBeDone = Object.keys(changes).length;
                let queriesDone = 0;
                let errorOccured = false;

                Object.keys(changes).forEach((id) => {
                    if (errorOccured) {
                        return;
                    }
                    if (isNaN(parseInt(id, 10))) {
                        console.log(`Wrong points id provided: ${id}`);
                        errorOccured = true;
                        callback({ err: 'err' });
                        return;
                    }
                    if (!(changes[id] instanceof Array) || changes[id].length !== 4) {
                        console.log(`Wrong points array provided: ${changes[id]}`);
                        errorOccured = true;
                        callback({ err: 'err' });
                        return;
                    }

                    const query = 'UPDATE Points SET ' +
                        `points_punktualnosc = ${mysql.escape(changes[id][0])}, ` +
                        `points_przygotowanie = ${mysql.escape(changes[id][1])}, ` +
                        `points_skupienie = ${mysql.escape(changes[id][2])}, ` +
                        `points_efekt = ${mysql.escape(changes[id][3])} ` +
                        `WHERE id=${mysql.escape(id)}`;

                    this.connection.query(query, (error) => {
                        if (error) {
                            console.error(error);
                            errorOccured = true;
                            this.connection.rollback();
                            callback({ err: 'err' });
                            return;
                        }

                        queriesDone++;
                        if (queriesToBeDone === queriesDone) {
                            this.connection.commit((err2) => {
                                if (err2) {
                                    console.error(err2);
                                    callback({ err: 'err' });
                                    return;
                                }

                                callback({ ok: 'ok' });
                            });
                        }
                    });
                });
            });
        } catch (e) {
            console.error(e);
            callback({ err: 'err' });
        }
    }

    changePointsDate(oldDate, newDate, callback) {
        const query = 'UPDATE Points SET date = ' +
            `DATE_FORMAT(${mysql.escape(newDate)}, "%Y-%m-%d")` +
            `WHERE date = DATE_FORMAT(${mysql.escape(oldDate)}, "%Y-%m-%d")`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
            } else {
                callback({ ok: 'ok' });
            }
        });
    }

    deletePointsFromDate(date, callback) {
        const query = 'DELETE FROM Points WHERE ' +
            `date = DATE_FORMAT(${mysql.escape(date)}, "%Y-%m-%d")`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
            } else {
                callback({ ok: 'ok' });
            }
        });
    }

    getPlayers(requestRole, requestAuthor, callback) {
        const query2 = 'SELECT * from Dragons_leveling';
        this.connection.query(query2, (errq2, resultsq2) => {
            if (errq2) {
                callback({ err: 'err' });
                return;
            }

            const dragonsArr = resultsq2;

            const query = 'SELECT Players.*, Teams.name as team, Dragons.name as dragon, ' +
            'CField.name as current_field_name, NField.name as next_field_name, ' +
            'SUM(Points.points_efekt) + SUM(Points.points_przygotowanie) + ' +
            'SUM(Points.points_punktualnosc) + SUM(Points.points_skupienie) + ' +
            'Players.starting_points as xp, Teams.color as team_color ' +
            'from Players ' +
            'LEFT JOIN Teams ON Teams.id = Players.team_id ' +
            'LEFT JOIN Dragons ON Dragons.id = Players.dragon_id ' +
            'LEFT JOIN Points ON Points.player_id = Players.id ' +
            'LEFT JOIN (' +
                'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name from Fields ' +
                'INNER JOIN Teams ON Fields.team_id = Teams.id ' +
                'INNER JOIN Regions ON Fields.region_id = Regions.id) CField ' +
                'ON CField.id = Players.current_field ' +
            'LEFT JOIN (' +
                'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name from Fields ' +
                'INNER JOIN Teams ON Fields.team_id = Teams.id ' +
                'INNER JOIN Regions ON Fields.region_id = Regions.id) NField ' +
                'ON NField.id = Players.next_field ' +
            `${requestRole === 'admin' ? '' : 'WHERE role = "player"'} ` +
            'GROUP BY Players.id';

            this.connection.query(query, (err, results) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                let players = {};

            // TODO czy pokazywać prawdziwe hp?
                if (requestRole === 'admin') {
                    players = results
                        .map((player) => {
                            if (player.dragon_id) {
                                const dragonLvls = dragonsArr
                                    .filter(dragonLvl => dragonLvl.dragon_id === player.dragon_id)
                                    .sort((a, b) => b.xp - a.xp);

                                const lvl =
                                    DatabaseManager.getCurrentLvl(dragonLvls, player.commited_xp);

                                if (!lvl.err) {
                                    return { ...player, lvl: lvl.lvl };
                                }
                            }

                            return player;
                        })
                        .reduce((allPlayers, player) =>
                    ({ ...allPlayers,
                        [player.id]: {
                            ...player,
                            password: undefined,
                            hp: player.hp === null ? -1 : player.hp,
                        } }), {});
                } else if (requestRole === 'player') {
                    players = results
                    .filter(player => player.hp !== null && player.hp >= 0)
                    .map((player) => {
                        if (player.dragon_id) {
                            const dragonLvls = dragonsArr
                                .filter(dragonLvl => dragonLvl.dragon_id === player.dragon_id)
                                .sort((a, b) => b.xp - a.xp);

                            const lvl =
                                DatabaseManager.getCurrentLvl(dragonLvls, player.commited_xp);

                            if (!lvl.err) {
                                return { ...player, lvl: lvl.lvl };
                            }
                        }

                        return player;
                    })
                    .reduce((allPlayers, player) => ({
                        ...allPlayers,
                        [player.id]: {
                            ...player,
                            password: undefined,
                            next_field: player.team_id === requestAuthor.team_id
                                ? player.next_field : undefined,
                            next_field_name: player.team_id === requestAuthor.team_id
                                ? player.next_field_name : undefined,
                            username: undefined,
                            starting_points: undefined,
                            hp: player.hp,
                            xp: player.commited_xp,
                            commited_xp: undefined,
                            points: undefined,
                        },
                    }), {});
                } else {
                    callback({ err: 'err' });
                    return;
                }

                let queriesToBeDone = Object.keys(players).length;

                Object.keys(players).forEach((key) => {
                    this.connection.query(`SELECT * from Points WHERE player_id=${key}`, (err2, results2) => {
                        if (err2) {
                            console.error(err2);
                            callback({ err: err2 });
                            return;
                        }

                        players[key].points = {};

                        results2.forEach((pointsRow) => {
                            players[key].points[pointsRow.date] = {
                                id: pointsRow.id,
                                points_punktualnosc: pointsRow.points_punktualnosc,
                                points_przygotowanie: pointsRow.points_przygotowanie,
                                points_skupienie: pointsRow.points_skupienie,
                                points_efekt: pointsRow.points_efekt,
                            };
                        });

                        queriesToBeDone--;

                        if (queriesToBeDone === 0) {
                            callback({ players });
                        }
                    });
                });
            });
        });
    }

    getFields(callback) {
        const query = 'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name, Teams.color, Regions.distance ' +
            'from Fields ' +
            'INNER JOIN Teams ON Fields.team_id = Teams.id ' +
            'INNER JOIN Regions ON Fields.region_id = Regions.id';

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const fields = results.reduce((allFields, field) =>
                ({ ...allFields, [field.id]: { ...field } }), {});

            let queriesToBeDone = Object.keys(fields).length;

            Object.keys(fields).forEach((key) => {
                this.connection.query(`SELECT id from Players WHERE current_field=${key} AND hp>=0`, (err2, results2) => {
                    if (err2) {
                        console.error(err2);
                        callback({ err: err2 });
                        return;
                    }

                    fields[key].users = [];

                    results2.forEach((user) => {
                        fields[key].users.push(user.id);
                    });

                    queriesToBeDone--;

                    if (queriesToBeDone === 0) {
                        callback({ fields });
                    }
                });
            });
        });
    }

    moveFields(changes, callback) {
        try {
            this.connection.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                const queriesToBeDone = Object.keys(changes).length;
                let queriesDone = 0;
                let errorOccured = false;

                Object.keys(changes).forEach((fieldId) => {
                    if (errorOccured) {
                        return;
                    }

                    const query = 'UPDATE Fields SET map_x = ' +
                        `${mysql.escape(changes[fieldId].map_x)}, ` +
                        `map_y = ${mysql.escape(changes[fieldId].map_y)} ` +
                        `WHERE id = ${mysql.escape(fieldId)}`;

                    this.connection.query(query, (error) => {
                        if (error) {
                            console.error(error);
                            errorOccured = true;
                            this.connection.rollback();
                            callback({ err: 'err' });
                            return;
                        }

                        queriesDone++;
                        if (queriesToBeDone === queriesDone) {
                            this.connection.commit((err2) => {
                                if (err2) {
                                    console.error(err2);
                                    callback({ err: 'err' });
                                    return;
                                }

                                callback({ ok: 'ok' });
                            });
                        }
                    });
                });
            });
        } catch (e) {
            console.error(e);
            callback({ err: 'err' });
        }
    }

    getRegions(callback) {
        this.connection.query('SELECT * from Regions', (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const regions = results.reduce((allRegions, region) =>
                ({ ...allRegions, [region.id]: { ...region } }), {});

            callback({ regions });
        });
    }

    getImageList(callback) {
        this.connection.query('SELECT id, type, filename, data_type as dataType from Images', (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const images = results.reduce((allImages, image) =>
                ({ ...allImages, [image.id]: { ...image } }), {});

            callback({ images });
        });
    }

    getImage(imageId, callback) {
        this.connection.query(`SELECT * from Images WHERE id=${mysql.escape(imageId)}`, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            if (results.length !== 1) {
                console.error('Requested image doesn\'t exists');
                callback({ err: 'err' });
                return;
            }

            if (results[0].type === 'map') {
                callback({ map: true, dataType: results[0].data_type });
            } else {
                callback({ data: results[0].data, dataType: results[0].data_type });
            }
        });
    }

    getConfig(callback) {
        this.connection.query('SELECT * FROM GameConfig', (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const config = results.reduce((fullConfig, entry) =>
                ({ ...fullConfig, [entry.name]: entry.value }), {});

            callback({ config });
        });
    }

    updateConfig(newValues, callback) {
        try {
            this.connection.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                const queriesToBeDone = Object.keys(newValues).length;
                let queriesDone = 0;
                let errorOccured = false;

                Object.keys(newValues).forEach((key) => {
                    if (errorOccured) {
                        return;
                    }

                    const query = 'INSERT INTO GameConfig (name, value) ' +
                        `VALUES (${mysql.escape(key)}, ${mysql.escape(newValues[key])})` +
                        `ON DUPLICATE KEY UPDATE value=${mysql.escape(newValues[key])}`;

                    this.connection.query(query, (error) => {
                        if (error) {
                            console.error(error);
                            errorOccured = true;
                            this.connection.rollback();
                            callback({ err: 'err' });
                            return;
                        }

                        queriesDone++;
                        if (queriesToBeDone === queriesDone) {
                            this.connection.commit((err2) => {
                                if (err2) {
                                    console.error(err2);
                                    callback({ err: 'err' });
                                    return;
                                }

                                callback({ ok: 'ok' });
                            });
                        }
                    });
                });
            });
        } catch (e) {
            console.error(e);
            callback({ err: 'err' });
        }
    }

    addPoints(newPoints, newDate, callback) {
        try {
            this.connection.beginTransaction((err) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                const queriesToBeDone = Object.keys(newPoints).length;
                let queriesDone = 0;
                let errorOccured = false;

                Object.keys(newPoints).forEach((userId) => {
                    if (errorOccured) {
                        return;
                    }
                    if (isNaN(parseInt(userId, 10))) {
                        console.log(`Wrong user id provided: ${userId}`);
                        errorOccured = true;
                        callback({ err: 'err' });
                        return;
                    }
                    if (!(newPoints[userId] instanceof Array) || newPoints[userId].length !== 4) {
                        console.log(`Wrong points array provided: ${newPoints[userId]}`);
                        errorOccured = true;
                        callback({ err: 'err' });
                        return;
                    }

                    const query = 'INSERT INTO Points (player_id, date, points_punktualnosc, points_przygotowanie, points_skupienie, points_efekt) VALUES (' +
                        `${mysql.escape(userId)}, DATE_FORMAT(${mysql.escape(newDate)}, "%Y-%m-%d"),` +
                        `${newPoints[userId].join(', ')})`;

                    this.connection.query(query, (error) => {
                        if (error) {
                            console.error(error);
                            errorOccured = true;
                            this.connection.rollback();
                            callback({ err: 'err' });
                            return;
                        }

                        queriesDone++;
                        if (queriesToBeDone === queriesDone) {
                            this.connection.commit((err2) => {
                                if (err2) {
                                    console.error(err2);
                                    callback({ err: 'err' });
                                    return;
                                }

                                callback({ ok: 'ok' });
                            });
                        }
                    });
                });
            });
        } catch (e) {
            console.error(e);
            callback({ err: 'err' });
        }
    }

    addPlayer({ username, password, name, surname, role, dragon_id, team_id, current_field,
                  next_field, starting_points, id, hp }, callback) {
        const hash = (password !== undefined) ? bcrypt.hashSync(password, 11) : undefined;
        const user = { username,
            password: hash,
            name,
            surname,
            role,
            dragon_id,
            team_id,
            current_field,
            next_field,
            starting_points,
            hp,
        };

        /* eslint camelcase: "warn" */
        let query;
        if (id === undefined) {
            query = 'INSERT INTO Players (username, password, name, surname, role, dragon_id, team_id) VALUES ' +
                `(${this.connection.escape(username)}, ` +
                `${this.connection.escape(hash)}, ` +
                `${this.connection.escape(name)}, ` +
                `${this.connection.escape(surname)}, ` +
                `${this.connection.escape(role)}, ` +
                `${this.connection.escape(dragon_id)}, ` +
                `${this.connection.escape(team_id)})`;
        } else {
            query = 'UPDATE Players SET ' +
                `${Object.keys(user).filter(key => user[key] !== undefined).map(key => `${mysql.escapeId(key)} = ${mysql.escape(user[key])}`).join(', ')} ` +
                `WHERE id=${mysql.escape(id)}`;
        }

        this.connection.query(query, (err3, results) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            if (id === undefined) {
                const newUserId = results.insertId;
                console.log(`Created new user with id: ${newUserId}`);
                callback({ newUserId });
            } else {
                console.log(`Updated user with id: ${id}`);
                callback({ newUserId: id });
            }
        });
    }

    deleteUser(userId, callback) {
        this.connection.query(`SELECT role FROM Players WHERE id=${mysql.escape(userId)}`, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            if (results.length !== 1) {
                callback({ err: 'err' });
                return;
            }

            this.connection.query('SELECT id FROM Players WHERE role="admin"', (err2, results2) => {
                if (err2) {
                    console.error(err2);
                    callback({ err: err2 });
                    return;
                }

                if (results[0].role === 'admin' && results2.length < 2) {
                    console.log('Can\'t delete user, it is the last admin');
                    callback({ err: 'err' });
                    return;
                }

                this.connection.query(`DELETE FROM Players WHERE id=${mysql.escape(userId)}`, (err3, results3) => {
                    if (err3) {
                        console.error(err3);
                        callback({ err: err3 });
                        return;
                    }

                    if (results3.affectedRows !== 1) {
                        callback({ err: 'err' });
                        return;
                    }

                    callback({ ok: 'ok' });
                });
            });
        });
    }

    addTeam({ id, name, capitan, color }, callback) {
        const team = { name, capitan, color };

        let query;
        if (id === undefined) {
            query = 'INSERT INTO Teams (name, capitan, color) VALUES ' +
                `(${this.connection.escape(name)}, ` +
                `${this.connection.escape(capitan)}, ` +
                `${this.connection.escape(color)})`;
        } else {
            query = 'UPDATE Teams SET ' +
                `${Object.keys(team).filter(key => team[key] !== undefined).map(key => `${mysql.escapeId(key)} = ${mysql.escape(team[key])}`).join(', ')} ` +
                `WHERE id=${mysql.escape(id)}`;
        }

        this.connection.query(query, (err3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            this.propagateFields();
            callback({ ok: 'ok' });
        });
    }

    deleteTeam(teamId, callback) {
        this.connection.query(`DELETE FROM Teams WHERE id=${mysql.escape(teamId)}`, (err3, results3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            if (results3.affectedRows !== 1) {
                callback({ err: 'err' });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    addRegion({ id, name, distance }, callback) {
        const region = { name, distance };

        let query;
        if (id === undefined) {
            query = 'INSERT INTO Regions (name, distance) VALUES ' +
                `(${this.connection.escape(name)}, ` +
                `${this.connection.escape(distance)})`;
        } else {
            query = 'UPDATE Regions SET ' +
                `${Object.keys(region).filter(key => region[key] !== undefined).map(key =>
                    `${mysql.escapeId(key)} = ${mysql.escape(region[key])}`).join(', ')} ` +
                    `WHERE id=${mysql.escape(id)}`;
        }

        this.connection.query(query, (err3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            this.propagateFields();
            callback({ ok: 'ok' });
        });
    }

    deleteRegion(regionId, callback) {
        this.connection.query(`DELETE FROM Regions WHERE id=${mysql.escape(regionId)}`, (err3, results3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            if (results3.affectedRows !== 1) {
                callback({ err: 'err' });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    changeDragonImage(dragonId, newImageId, callback) {
        const query = `UPDATE Dragons SET image = ${mysql.escape(newImageId)} ` +
            `WHERE id = ${mysql.escape(dragonId)}`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    addLevel({ id, xp, strength, defence, range, hp, dragonId, level }, callback) {
        const levelObj = { xp, strength, defence, range, hp, dragon_id: dragonId, level };

        let query;
        if (id === undefined) {
            const fields = Object.keys(levelObj)
                .filter(key => levelObj[key] !== undefined)
                .map(key => (mysql.escapeId(key)))
                .join(', ');

            const values = Object.keys(levelObj)
                .filter(key => levelObj[key] !== undefined)
                .map(key => (mysql.escape(levelObj[key])))
                .join(', ');

            query = `INSERT INTO Dragons_leveling (${fields}) VALUES (${values})`;
        } else {
            query = 'UPDATE Dragons_leveling SET ' +
                `${Object.keys(levelObj).filter(key => levelObj[key] !== undefined).map(key =>
                    `${mysql.escapeId(key)} = ${mysql.escape(levelObj[key])}`).join(', ')} ` +
                `WHERE id=${mysql.escape(id)}`;
        }

        this.connection.query(query, (err3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    deleteLevel(levelId, callback) {
        this.connection.query(`DELETE FROM Dragons_leveling WHERE id=${mysql.escape(levelId)}`, (err3, results3) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            if (results3.affectedRows !== 1) {
                callback({ err: 'err' });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    addDragonByName(dragonName, callback) {
        const query = `INSERT INTO Dragons (name) VALUES (${mysql.escape(dragonName)})`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    changeDragonName(dragonId, dragonName, callback) {
        const query = `UPDATE Dragons SET name = ${mysql.escape(dragonName)} WHERE id = ${mysql.escape(dragonId)}`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    deleteDragon(dragonId, callback) {
        const query = `DELETE FROM Dragons WHERE id = ${mysql.escape(dragonId)}`;

        this.connection.query(query, (err) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            callback({ ok: 'ok' });
        });
    }

    getUserFromId(id, callback) {
        const query = 'SELECT Players.*, Teams.name as team, Dragons.name as dragon, ' +
            'CField.name as current_field_name, NField.name as next_field_name, ' +
            'Players.commited_xp as xp, Logins.login_count, Teams.color as team_color ' +
            'from Players ' +
            'LEFT JOIN Teams ON Teams.id = Players.team_id ' +
            'LEFT JOIN Dragons ON Dragons.id = Players.dragon_id ' +
            'LEFT JOIN (' +
            'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name from Fields ' +
            'INNER JOIN Teams ON Fields.team_id = Teams.id ' +
            'INNER JOIN Regions ON Fields.region_id = Regions.id) CField ' +
            'ON CField.id = Players.current_field ' +
            'LEFT JOIN (' +
            'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name from Fields ' +
            'INNER JOIN Teams ON Fields.team_id = Teams.id ' +
            'INNER JOIN Regions ON Fields.region_id = Regions.id) NField ' +
            'ON NField.id = Players.next_field ' +
            'INNER JOIN (' +
            'SELECT COUNT(cookie) as login_count, user FROM Cookies GROUP BY user) Logins ' +
            'ON Logins.user = Players.id ' +
            `WHERE Players.id=${mysql.escape(id)}`;

        this.connection.query(query, (err, results) => {
            if (err || results.length !== 1) {
                callback({ err: 'err' });
                return;
            }

            if (results[0].role === 'player') {
                this.getReachableFields(id, (reachableFields) => {
                    if (!reachableFields.err) {
                        callback({ user: { ...results[0], ...reachableFields } });
                    } else {
                        callback({ err: 'err2' });
                    }
                });
            } else {
                callback({ user: results[0] });
            }
        });
    }

    login(username, password, callback) {
        this.connection.query(`SELECT id, password from Players WHERE username = ${mysql.escape(username)}`, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            if (results.length !== 1) {
                console.error(`Error while logging in user ${username}: invalid length: ${results.length}`);
                callback({
                    err: new Error(`Error while logging in user ${username}: invalid username`),
                    errCode: errorCodes.invalidUsernameOrPassword,
                });
                return;
            }

            bcrypt.compare(password, results[0].password, (err2, res) => {
                if (err2) {
                    console.error(err2);
                    callback({ err: err2 });
                    return;
                }

                if (res === false) {
                    console.warn(`Invalid password for ${username}`);
                    callback({
                        err: new Error(`Invalid password for ${username}`),
                        errCode: errorCodes.invalidUsernameOrPassword,
                    });
                    return;
                }

                crypto.randomBytes(48, (err3, buffer) => {
                    if (err3) {
                        console.error(err3);
                        callback({ err: err3 });
                        return;
                    }

                    const token = buffer.toString('hex');

                    this.connection.query(`CALL insertCookie(${results[0].id}, '${token}')`, (err4) => {
                        if (err4) {
                            console.error(err4);
                            callback({ err: err4 });
                            return;
                        }

                        this.getUserFromId(results[0].id, (res5) => {
                            if (res5.err) {
                                callback({ err: 'err' });
                                return;
                            }

                            const loggedUser = { ...res5.user, password: undefined };

                            callback({ token, user: loggedUser });
                        });
                    });
                });
            });
        });
    }

    getUserFromCookie(cookie, callback) {
        this.connection.query('SELECT Players.id FROM Players INNER JOIN Cookies ON ' +
            `Cookies.user = Players.id WHERE Cookies.cookie = ${mysql.escape(cookie)}`,
            (err, results) => {
                if (err) {
                    console.error(err);
                    callback({ err });
                    return;
                }

                if (results.length !== 1) {
                    console.error(`Error while getting user with cookie ${cookie}: invalid results length: ${results.length}`);
                    callback({
                        err: new Error(`Error while getting user with cookie ${cookie}: invalid results length: ${results.length}`),
                        errCode: errorCodes.invalidCookie,
                    });
                    return;
                }

                this.getUserFromId(results[0].id, (res5) => {
                    if (res5.err !== undefined) {
                        callback({ err: 'err' });
                        return;
                    }

                    const loggedUser = { ...res5.user, password: undefined };

                    callback({ user: loggedUser });
                });
            });
    }

    logoutCurrent(cookie, callback) {
        this.connection.query(`DELETE FROM Cookies WHERE cookie = ${mysql.escape(cookie)}`, (err) => {
            if (err) {
                callback({ err: 'err' });
            } else {
                callback({ ok: 'ok' });
            }
        });
    }

    logoutAllButCurrent(id, cookie, callback) {
        const query = `DELETE FROM Cookies WHERE (id = ${mysql.escape(id)}
        AND cookie <> ${mysql.escape(cookie)})`;

        this.connection.query(query, (err) => {
            if (err) {
                callback({ err: 'err' });
            } else {
                callback({ ok: 'ok' });
            }
        });
    }

    uploadImage(image, type, filename, dataType, callback) {
        const query = 'INSERT INTO Images (data, type, filename, data_type) VALUES' +
            `(${mysql.escape(image)}, ${mysql.escape(type)}, ` +
            `${mysql.escape(filename)}, ${mysql.escape(dataType)})`;

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const newImageId = results.insertId;

            if (type.toString() !== 'map') {
                console.log(`Added new image with id: ${newImageId} and type ${type}`);
                callback({ id: newImageId });
                return;
            }

            console.log('Removing old maps');

            this.connection.query(`DELETE FROM Images WHERE type='map' AND id <> ${newImageId}`, (err2) => {
                if (err2) {
                    console.error(err2);
                    callback({ err: err2 });
                    return;
                }

                console.log(`Added new image with id: ${newImageId} and type ${type}`);
                callback({ id: newImageId });
            });
        });
    }

    getReachableFields(id, callback) {
        const query = 'SELECT Players.dragon_id, Fields.region_id, Fields.team_id, Regions.distance, ' +
            'Players.commited_xp as xp, Players.last_xp_gain ' +
            'from Players ' +
            'LEFT JOIN Fields ON Fields.id = Players.current_field ' +
            'LEFT JOIN Regions on Fields.region_id = Regions.id ' +
            `WHERE Players.id = ${mysql.escape(id)}`;

        this.connection.query(query, (err, results) => {
            if (err || results.length !== 1) {
                // console.error(err);
                callback({ err: 'err' });
                return;
            }

            // console.log(results[0]);

            const user = results[0];

            const query2 = `SELECT * from Dragons_leveling WHERE dragon_id = ${user.dragon_id}`;
            const userXP = user.xp;

            this.connection.query(query2, (err2, res2) => {
                if (err2) {
                    callback({ err: 'err' });
                    return;
                }

                res2.sort((a, b) => b.xp - a.xp);
                const possibleLvls = res2.filter(lvl => lvl.xp <= userXP);

                if (possibleLvls.length === 0) {
                    console.warn(`no matching dragon level found for ${id} (xp: ${userXP})`);
                    callback({ err: 'err' });
                    return;
                }

                const currentLvl = possibleLvls[0];

                const maxDistance = currentLvl.range;

                const finalResult = {
                    dragonLevel: {
                        level: currentLvl.level,
                        hp: currentLvl.hp,
                        range: currentLvl.range,
                        strength: currentLvl.strength,
                        defence: currentLvl.defence,
                    },
                    reachableFields: [],
                };

                if (user.last_xp_gain <= 0) {
                    callback(finalResult);
                    return;
                }

                const query3 = 'SELECT Fields.id ' +
                    'FROM Fields ' +
                    'LEFT JOIN Regions ON Regions.id = Fields.region_id ' +
                    'LEFT JOIN (SELECT id, IF(next_field is NULL, current_field, next_field) as field_id ' +
                        `FROM Players WHERE team_id = ${user.team_id}) Team on Fields.id = Team.field_id ` +
                    `WHERE Team.field_id is NULL AND IF(Fields.team_id = ${user.team_id}, ` +
                    `ABS(Regions.distance - ${user.distance} + 1), Regions.distance + ${user.distance}) <= ${maxDistance}`;

                // console.log(query3);

                this.connection.query(query3, (err3, res3) => {
                    if (err3) {
                        callback({ err: 'err' });
                        return;
                    }

                    finalResult.reachableFields = res3.map(field => field.id);

                    callback(finalResult);
                });
            });
        });
    }

    safeSetNextField(id, fieldId, callback) {
        this.getReachableFields(id, (result) => {
            if (result.reachableFields.includes(parseInt(fieldId, 10))) {
                const query = `UPDATE Players SET next_field=${mysql.escape(fieldId)} WHERE id=${mysql.escape(id)}`;
                this.connection.query(query, (err) => {
                    if (err) {
                        callback({ err: 'err' });
                        return;
                    }

                    callback({ ok: 'ok' });
                });
            } else {
                callback({ err: 'err' });
                console.warn(`Player ${id} tried to set prohibited next_field`);
            }
        });
    }

    static getCurrentLvl(levelsArr, xp) {
        const possibleLvls = levelsArr.filter(lvl => lvl.xp <= xp);

        if (possibleLvls.length === 0) {
            return { err: 'err' };
        }

        return { lvl: possibleLvls[0] };
    }

    getGameState(callback) {
        this.connection.query('SELECT value FROM GameConfig WHERE name="gameState"', (err, res) => {
            if (err || res.length !== 1) {
                callback({ err: 'err' });
            } else {
                callback({ gameState: res[0].value });
            }
        });
    }

    commitPoints(callback) {
        this.getGameState((gameState) => {
            if (gameState.err) {
                callback({ err: `error in stage 0: ${gameState.err}` });
                return;
            }

            if (gameState.gameState !== 'BEFORE_ROUND') {
                callback({ err: 'error in stage 0: invalid game state for commiting points' });
                return;
            }

            const query = 'SELECT Players.commited_xp, Players.dragon_id, Players.hp, Players.id, ' +
                'SUM(Points.points_efekt) + SUM(Points.points_przygotowanie) + ' +
                'SUM(Points.points_punktualnosc) + SUM(Points.points_skupienie) + ' +
                'Players.starting_points as xp ' +
                'from Players ' +
                'LEFT JOIN Points ON Points.player_id = Players.id ' +
                'WHERE role = "player" AND hp >= 0 ' +
                'GROUP BY Players.id';

            this.connection.query(query, (err, res) => {
                if (err) {
                    callback({ err: `error in stage 1: ${err}` });
                    return;
                }

                const users = res;

                this.connection.query('SELECT * from Dragons_leveling', (err2, res2) => {
                    if (err2) {
                        callback({ err: `error in stage 2: ${err2}` });
                        return;
                    }

                    const dragons = res2;

                    let errOccured = false;

                    const changes = users.map((user) => {
                        if (errOccured) {
                            return undefined;
                        }

                        const userOldXP = user.commited_xp;
                        const userXP = user.xp;

                        const dragonLeveling = dragons
                            .filter(dragonLvl => dragonLvl.dragon_id === user.dragon_id)
                            .sort((a, b) => b.xp - a.xp);

                        const oldLvlObj = DatabaseManager.getCurrentLvl(dragonLeveling, userOldXP);
                        const newLvlObj = DatabaseManager.getCurrentLvl(dragonLeveling, userXP);

                        if (oldLvlObj.err || newLvlObj.err) {
                            callback({ err: `cannot calculate dragon levels for ${user.id}` });
                            errOccured = true;
                            return undefined;
                        }

                        const oldLvl = oldLvlObj.lvl;
                        const newLvl = newLvlObj.lvl;

                        const userChanges = {
                            id: user.id,
                            commited_xp: userXP,
                            last_xp_gain: userXP - userOldXP,
                        };

                        if (oldLvl.hp !== newLvl.hp) {
                            userChanges.hp = user.hp + (newLvl.hp - oldLvl.hp);
                        }

                        return userChanges;
                    });

                    if (errOccured) {
                        return;
                    }

                    let queriesToBeDone = changes.length;

                    this.connection.beginTransaction((trErr) => {
                        if (trErr) {
                            callback({ err: `error in stage 3: ${trErr}` });
                            return;
                        }

                        let trErrOccured = false;

                        changes.forEach((userChange) => {
                            const changedFields = Object.keys(userChange).filter(key => key !== 'id');
                            const cQuery = 'UPDATE Players SET ' +
                                `${changedFields.map(fieldId => `${fieldId}=${userChange[fieldId]}`).join(', ')} ` +
                                `WHERE id = ${userChange.id}`;
                            this.connection.query(cQuery, (cErr) => {
                                if (cErr) {
                                    callback({ err: `error in stage 4: ${trErr}` });
                                    trErrOccured = true;
                                }

                                queriesToBeDone--;

                                if (queriesToBeDone === 0) {
                                    if (trErrOccured) {
                                        this.connection.rollback();
                                    } else {
                                        this.connection.query('UPDATE GameConfig SET value="DURING_ROUND" WHERE name="gameState"', (gcErr) => {
                                            if (gcErr) {
                                                callback({ err: `error in stage 5: ${gcErr}` });
                                                this.connection.rollback();
                                            } else {
                                                this.connection.commit((commitErr) => {
                                                    if (commitErr) {
                                                        callback({ err: `error in stage 6: ${commitErr}` });
                                                        this.connection.rollback();
                                                    } else {
                                                        callback({ ok: 'ok' });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        });
                    });
                });
            });
        });
    }

    calculateNextStep(callback) {
        this.getGameState((gameState) => {
            if (gameState.err) {
                callback({ err: `error in stage 0: ${gameState.err}` });
                return;
            }

            if (gameState.gameState !== 'DURING_ROUND') {
                callback({ err: 'error in stage 0: invalid game state for finishing round' });
                return;
            }

            const query = 'SELECT Players.commited_xp as xp, Players.dragon_id, Players.hp, Players.id, ' +
                'Players.current_field, IF(Players.next_field is NULL, Players.current_field, Players.next_field) as next_field, ' +
                'IF(Players.next_field is NULL, FALSE, TRUE) as is_active, ' +
                'Players.team_id, CONCAT(Players.name, " ", Players.surname) AS name from Players ' +
                'WHERE role = "player" AND hp >= 0 AND Players.is_resping = FALSE ' +
                'GROUP BY Players.id';

            let fields = {};
            let destFields = {};

            const log = [];

            // TODO kiedy ludzie kończą się respić?

            this.promiseQuery(query)
                .then((users) => {
                    const nextFieldsPresent = users
                        .every(user => user.next_field || user.next_field === 0);

                    if (!nextFieldsPresent) {
                        throw new Error('error in stage 1: not all players have assigned current field');
                    }

                    const dragonsPresent = users
                        .every(user => user.dragon_id);

                    if (!dragonsPresent) {
                        throw new Error('error in stage 1: not all players have assigned dragon');
                    }

                    const teamsPresent = users
                        .every(user => user.team_id);

                    if (!teamsPresent) {
                        throw new Error('error in stage 1: not all players have assigned team');
                    }

                    fields = users.reduce((allFields, user) => ({
                        ...allFields,
                        [user.next_field]: [
                            ...(allFields[user.next_field] ? allFields[user.next_field] : []),
                            user,
                        ],
                    }), {});

                    const nextFieldsOk = Object.keys(fields)
                        .every((fieldId) => {
                            const teams = fields[fieldId].map(user => user.team_id);

                            return teams.length === (new Set(teams)).size;
                        });

                    if (!nextFieldsOk) {
                        throw new Error('error in stage 1: players from the same team tried to go to the same field');
                    }

                    return this.promiseQuery('SELECT * FROM Dragons_leveling');
                })
                .then((dragonLevels) => {
                    Object.keys(fields).forEach((fieldId) => {
                        fields[fieldId] = fields[fieldId].map((user) => {
                            const dragonLvls = dragonLevels
                                .filter(dragonLvl => dragonLvl.dragon_id === user.dragon_id)
                                .sort((a, b) => b.xp - a.xp);

                            const lvl =
                                DatabaseManager.getCurrentLvl(dragonLvls, user.xp);

                            if (lvl.err) {
                                throw new Error(`error in stage 2: error while getting levels for player ${user.id}`);
                            }

                            return {
                                ...user,
                                lvl: {
                                    hp: lvl.lvl.hp,
                                    level: lvl.lvl.level,
                                    defence: lvl.lvl.defence,
                                    strength: lvl.lvl.strength,
                                    range: lvl.lvl.range,
                                },
                            };
                        });
                    });

                    return this.promiseQuery('SELECT Fields.id, Fields.team_id, Regions.distance, ' +
                        'CONCAT(Teams.name, " ", Regions.name) as name FROM Fields ' +
                        'LEFT JOIN Regions ON Regions.id = Fields.region_id ' +
                        'INNER JOIN Teams on Fields.team_id = Teams.id ' +
                        'GROUP BY Fields.id');
                })
                .then((allFields) => {
                    destFields = allFields.reduce((tmp, currentField) => ({
                        ...tmp,
                        [currentField.id]: {
                            ...currentField,
                            users: [],
                        },
                    }), {});

                    Object.keys(fields).filter(fieldId => fields[fieldId].length === 1).forEach((fieldId) => {
                        const user = fields[fieldId][0];
                        destFields[user.next_field].users.push({ ...user });
                        const action = user.is_active ? 'dociera na pole' : 'pozostaje na polu';
                        log.push(`Gracz ${user.name} ${action} ${destFields[user.next_field].name}${user.is_active ? ' bez szwanku' : ''}`);
                    });

                    /* eslint no-param-reassign: "warn" */
                    function shuffle(a) {
                        for (let i = a.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [a[i], a[j]] = [a[j], a[i]];
                        }
                        return a;
                    }

                    const fieldsToProcess = Object.keys(fields)
                        .map(fieldId => fields[fieldId])
                        .filter(field => field.length > 1);

                    /* eslint prefer-spread: "warn" */
                    const fieldsOrder = shuffle(Array(...{ length: fieldsToProcess.length })
                        .map(Number.call, Number));

                    // TODO co jak remis
                    function fight(attacker, victim) {
                        const def = victim.lvl.defence;
                        let dmg = 0;
                        for (let i = 0; i < attacker.lvl.strength; i++) {
                            const rand = Math.floor(Math.random() * 8) + 2;
                            if (rand >= def) {
                                dmg++;
                            }
                        }

                        return dmg;
                    }

                    function pairFight(attacker, victim) {
                        const activeUser = attacker;
                        const passiveUser = victim;
                        log.push(`Gracz ${activeUser.name} atakuje gracza ${passiveUser.name}`);

                        const dmg1 = fight(activeUser, passiveUser);
                        passiveUser.hp -= dmg1;
                        log.push(`Gracz ${activeUser.name} zadaje ${dmg1} obrażeń graczowi ${passiveUser.name}`);
                        if (passiveUser.hp > 0) {
                            const dmg2 = fight(passiveUser, activeUser);
                            activeUser.hp -= dmg2;
                            log.push(`Gracz ${passiveUser.name} zadaje ${dmg2} obrażeń graczowi ${activeUser.name}`);
                            if (activeUser.hp > 0) {
                                let winner;
                                let looser;
                                if (dmg1 !== dmg2) {
                                    winner = dmg1 > dmg2 ? activeUser : passiveUser;
                                    looser = dmg1 > dmg2 ? passiveUser : activeUser;
                                } else {
                                    // TODO !!!!
                                }

                                return { winner, looser };
                            }
                                // log.push(`Gracz ${activeUser.name} umiera`);
                            return { winner: passiveUser, looser: activeUser };
                        }
                            // log.push(`Gracz ${passiveUser.name} umiera`);
                        return { winner: activeUser, looser: passiveUser };
                    }

                    function getFortress(player) {
                        const curField = player.current_field;
                        const curFieldTeam = destFields[curField].team_id;

                        const furthest = Math.max(...Object.keys(destFields).map(fieldId => destFields[fieldId].distance));

                        const possibleFields = Object.keys(destFields)
                            .filter(fieldId => destFields[fieldId].distance === furthest
                                && destFields[fieldId].team_id === curFieldTeam);

                        return possibleFields[0];
                    }

                    function getClosestFreeFieldId(player) {
                        const curField = player.current_field;
                        const curFieldTeam = destFields[curField].team_id;
                        const curFieldRegDist = destFields[curField].distance;
                        const isHomeField = destFields[curField].team_id === player.team_id;

                        if (isHomeField) {
                            const possibleFields = Object.keys(destFields)
                                .filter(fieldId => destFields[fieldId].users.length === 0
                                    && destFields[fieldId].distance >= curFieldRegDist
                                    && destFields[fieldId].team_id === curFieldTeam);

                            if (possibleFields.length === 0) {
                                return getFortress(player);
                            }

                            let closestDist = 999999;
                            let closestId = -1;

                            possibleFields.forEach((fieldId) => {
                                const field = destFields[fieldId];
                                if (field.distance - curFieldRegDist < closestDist) {
                                    closestDist = field.distance - curFieldRegDist;
                                    closestId = field.id;
                                }
                            });

                            return closestId;
                        }

                        const possibleFields = Object.keys(destFields)
                            .filter(fieldId => destFields[fieldId].users.length === 0
                                && ((destFields[fieldId].distance <= curFieldRegDist
                                        && destFields[fieldId].team_id !== curFieldTeam)
                                    || destFields[fieldId].team_id === curFieldTeam));

                        if (possibleFields.length === 0) {
                            return getFortress(player);
                        }

                        let closestDist = 999999;
                        let closestId = -1;

                        possibleFields.forEach((fieldId) => {
                            const field = destFields[fieldId];
                            const dist = field.team_id === curFieldTeam ?
                                field.distance + curFieldRegDist
                                :
                                curFieldRegDist - field.distance;

                            if (dist < closestDist) {
                                closestDist = dist;
                                closestId = field.id;
                            }
                        });

                        return closestId;
                    }

                    fieldsOrder.forEach((fieldNum) => {
                        const field = fieldsToProcess[fieldNum];
                        const fieldName = destFields[field[0].next_field].name;
                        if (field.length === 2) {
                            let activeUser;
                            let passiveUser;

                            if (field.some(user => !user.is_active)) {
                                activeUser = field.filter(user => user.is_active)[0];
                                passiveUser = field.filter(user => !user.is_active)[0];
                                log.push(`Gracz ${activeUser.name} atakuje gracza ${passiveUser.name} na polu ${fieldName}`);
                            } else {
                                activeUser = field[0];
                                passiveUser = field[1];

                                if (Math.random() > 0.5) {
                                    const tmpUser = { ...activeUser};
                                    activeUser = passiveUser;
                                    passiveUser = tmpUser;
                                }

                                log.push(`Gracz ${activeUser.name} i ${passiveUser.name} stają do walki o pole ${fieldName}`);
                            }

                            // console.log('PairFight');
                            // console.log(activeUser);
                            // console.log(passiveUser);
                            // console.log(field);
                            // console.log(log);

                            /* eslint max-len: "warn" */
                            const { winner, looser } = pairFight(activeUser, passiveUser);

                            console.log('winner', winner);
                            console.log('looser', looser);

                            destFields[winner.next_field].users.push({ ...winner });

                            let looserField;

                            if (looser.hp <= 0) {
                                log.push(`Gracz ${looser.name} umiera`);
                                looserField = getFortress(looser);
                            } else {
                                looserField = getClosestFreeFieldId(looser);
                                log.push(`Gracz ${winner.name} zdobywa pole ${fieldName}`);
                                log.push(`Gracz ${looser.name} musi cofnąć się na pole ${destFields[looserField].name}`);
                            }

                            console.log(log);
                            console.log(looserField);

                            destFields[looserField].users.push({ ...looser });
                        } else {
                            log.push(`Gracze ${field.map(user => user.name).join(', ')} stają do walki o ${field.name}`);
                            throw new Error('Nieobsługiwane');
                        }
                    });

                    // console.log(destFields);
                    console.log(destFields[75].users[0]);
                    console.log(log);
                    callback({ ok: 'ok' });
                })
                .catch((err) => {
                    console.warn(err);
                    callback({ err });
                });
        });
    }
}

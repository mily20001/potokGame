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

    getPlayers(requestRole, callback) {
        const query = 'SELECT Players.*, Teams.name as team, Dragons.name as dragon, ' +
            'CField.name as current_field_name, NField.name as next_field_name, ' +
            'SUM(Points.points_efekt) + SUM(Points.points_przygotowanie) + ' +
            'SUM(Points.points_punktualnosc) + SUM(Points.points_skupienie) + ' +
            'Players.starting_points as xp ' +
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
                players = results.reduce((allPlayers, player) =>
                    ({ ...allPlayers,
                        [player.id]: {
                            ...player,
                            password: undefined,
                            hp: player.hp === null ? -1 : player.hp,
                        } }), {});
            } else if (requestRole === 'player') {
                players = results.reduce((allPlayers, player) => ({
                    ...allPlayers,
                    [player.id]: {
                        ...player,
                        password: undefined,
                        next_field: undefined,
                        username: undefined,
                        starting_points: undefined,
                        hp: player.hp === null ? 0 : player.hp,
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
    }

    getFields(callback) {
        const query = 'SELECT Fields.*, CONCAT(Teams.name, " ", Regions.name) as name ' +
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

            callback({ fields });
        });
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

            // console.log(teams);
            callback({ data: results[0].data, dataType: results[0].data_type });
        });
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
                  next_field, starting_points, id }, callback) {
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
            'SUM(Points.points_efekt) + SUM(Points.points_przygotowanie) + ' +
            'SUM(Points.points_punktualnosc) + SUM(Points.points_skupienie) + ' +
            'Players.starting_points as xp, Logins.login_count ' +
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
            'INNER JOIN (' +
            'SELECT COUNT(cookie) as login_count, user FROM Cookies GROUP BY user) Logins ' +
            'ON Logins.user = Players.id ' +
            `WHERE Players.id=${mysql.escape(id)}`;

        this.connection.query(query, (err, results) => {
            if (err || results.length !== 1) {
                callback({ err: 'err' });
                return;
            }

            callback({ user: results[0] });
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

            if (type !== 'map') {
                console.log(`Added new image with id: ${newImageId}`);
                callback({ id: newImageId });
                return;
            }

            this.connection.query(`DELETE FROM Images WHERE type='map' AND id <> ${newImageId}`, (err2) => {
                if (err2) {
                    console.error(err2);
                    callback({ err: err2 });
                    return;
                }

                console.log(`Added new image with id: ${newImageId}`);
                callback({ id: newImageId });
            });
        });
    }
}

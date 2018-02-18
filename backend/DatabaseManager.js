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
                        dragons[key].levels[level.level] = {
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
        this.connection.query('SELECT * from Teams', (err, results) => {
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
                    if (isNaN(parseInt(id))) {
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

    getPlayers(requestRole, callback) {
        const query = `SELECT * from Players ${requestRole === 'admin' ? '' : 'WHERE role = "player"'}`;
        this.connection.query(query, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            // TODO czy pokazywać prawdziwe hp?
            if (requestRole === 'admin') {
                const players = results.reduce((allPlayers, player) =>
                    ({ ...allPlayers, [player.id]: { ...player, password: undefined } }), {});

                let queriesToBeDone = results.length;

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
            } else if (requestRole === 'player') {
                const players = results.reduce((allPlayers, player) =>
                    ({ ...allPlayers,
                        [player.id]: { ...player,
                            password: undefined,
                            current_field: undefined,
                            next_field: undefined,
                            role: undefined,
                        } }), {});

                callback({ players });
            } else {
                callback({ err: 'err' });
            }
        });
    }

    getFields(callback) {
        this.connection.query('SELECT * from Fields', (err, results) => {
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
        this.connection.query('SELECT id, type, filename from Images', (err, results) => {
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
            callback({ data: results[0].data });
        });
    }

    addPoints({ userId, date, points_punktualnosc, points_przygotowanie,
                  points_skupienie, points_efekt }, callback) {
        const query = 'INSERT INTO Points (player_id, date, points_punktualnosc, points_przygotowanie, points_skupienie, points_efekt) VALUES ' +
            `(${this.connection.escape(userId)}, ` +
            `${this.connection.escape(date)}, ` +
            `${this.connection.escape(points_punktualnosc)}, ` +
            `${this.connection.escape(points_przygotowanie)}, ` +
            `${this.connection.escape(points_efekt)}` +
            `${this.connection.escape(points_skupienie)})`;

        this.connection.query(query, (err3, results) => {
            if (err3) {
                console.error(err3);
                callback({ err: err3 });
                return;
            }

            const newPointsRowId = results.insertId;
            callback({ newPointsRowId });
        });
    }

    addPlayer({ username, password, name, surname, role, dragon_id, team_id, id }, callback) {
        const hash = (password !== undefined) ? bcrypt.hashSync(password, 11) : undefined;
        const user = { username, password: hash, name, surname, role, dragon_id, team_id };

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

    login(username, password, callback) {
        this.connection.query(`SELECT * from Players WHERE username = ${mysql.escape(username)}`, (err, results) => {
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

                        const loggedUser = { ...results[0], password: undefined };

                        callback({ token, user: loggedUser });
                    });
                });
            });
        });
    }

    getUserFromCookie(cookie, callback) {
        this.connection.query('SELECT Players.* FROM Players INNER JOIN Cookies ON ' +
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

                const loggedUser = { ...results[0], password: undefined };

                // console.log(loggedUser);
                callback({ user: loggedUser });
            });
    }

    uploadImage(image, type, filename, callback) {
        this.connection.query(`INSERT INTO Images (data, type, filename) VALUES (${mysql.escape(image)}, ${mysql.escape(type)}, ${mysql.escape(filename)})`, (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const newImageId = results.insertId;

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

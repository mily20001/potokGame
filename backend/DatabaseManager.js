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
        this.connection.query('SELECT id, name from Dragons', (err, results) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            const dragons = results.reduce((allDragons, dragon) =>
                ({ ...allDragons, [dragon.id]: dragon.name }), {});

            console.log(dragons);
            callback({ dragons });
        });
    }

    addPlayer(username, password, name, surname, callback) {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error(err);
                callback({ err });
                return;
            }

            bcrypt.hash(password, salt, (err2, hash) => {
                if (err2) {
                    console.error(err2);
                    callback({ err: err2 });
                    return;
                }

                const query = 'INSERT INTO Players (username, password, name, surname) VALUES ' +
                    `(${this.connection.escape(username)}, ` +
                    `${this.connection.escape(hash)}, ` +
                    `${this.connection.escape(name)}, ` +
                    `${this.connection.escape(surname)})`;

                this.connection.query(query, (err3, results) => {
                    if (err3) {
                        console.error(err3);
                        callback({ err: err3 });
                        return;
                    }

                    const newUserId = results.insertId;
                    console.log(`Created new user with id: ${newUserId}`);
                    callback(newUserId);
                });
            });
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
                    errCode: errorCodes.invalidUsername,
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
                        errCode: errorCodes.invalidPassword,
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

                        callback(token);
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

                console.log(results[0]);
                callback(results);
            });
    }
}

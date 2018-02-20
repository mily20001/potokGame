import http from 'http';
import fs from 'fs';
import qs from 'qs';
import multiparty from 'multiparty';

import CONFIG from './config';
import DatabaseManager from './DatabaseManager';

const filesMap = {
    '/': { file: 'index.html', code: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    '/index.html': { code: 301, headers: { Location: '/' } },
    '/index': { code: 301, headers: { Location: '/' } },
    '/logo.svg': { file: '', code: 200, headers: { 'Content-Type': 'image/svg+xml' } },
    '/js/main.js': { file: '', code: 200, headers: { 'Content-Type': 'text/javascript' } },
    '/css/main.bundle.css': { file: '', code: 200, headers: { 'Content-Type': 'text/css' } },
};

const databaseManager = new DatabaseManager();

databaseManager.propagatePoints();

// databaseManager.addPlayer('admin', 'milosz', 'Miłosz', 'D.', () => {});
// databaseManager.login('admin', 'milosz', () => {});
// databaseManager.getUserFromCookie('cc0aa36fac252b77a69a810451fa4caa339522051e91
// ff25e9065ea97c49de3817f3aa9cd97643760592aa611079cb74', () => {});

function parseCookies(cookieString = '') {
    const cookies = [];
    cookieString.split(';').forEach((cookie) => {
        const cookieParts = cookie.split('=');
        cookies[cookieParts.shift().trim()] = decodeURI(cookieParts.join('='));
    });

    return cookies;
}

const server = http.createServer((req, res) => {
    const cookies = parseCookies(req.headers.cookie);

    if (req.headers['x-forwarded-protocol'] === 'http') {
        console.log('upgrading to https');
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    } else if (req.method.toUpperCase() === 'GET') {
        console.log('Request:', req.url);
        if (filesMap[req.url] !== undefined) {
            res.writeHead(filesMap[req.url].code, filesMap[req.url].headers);
            if (filesMap[req.url].code === 200) {
                res.end(fs.readFileSync(`${CONFIG.httpBasePath}${req.url}${filesMap[req.url].file}`));
            } else if (filesMap[req.url].code === 301) {
                res.end();
            }
        } else if (req.url === '/get_user') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.end(JSON.stringify({ user: {} }));
                } else {
                    res.end(JSON.stringify({ user: result.user }));
                }
            });
        } else if (req.url === '/get_dragons') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getDragons((result2) => {
                        if (result2.dragons !== undefined) {
                            res.end(JSON.stringify({ dragons: result2.dragons }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/get_teams') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getTeams((result2) => {
                        if (result2.teams !== undefined) {
                            res.end(JSON.stringify({ teams: result2.teams }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/get_users') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getPlayers(result.user.role, (result2) => {
                        if (result2.players !== undefined) {
                            res.end(JSON.stringify({ users: result2.players }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/get_fields') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getFields((result2) => {
                        if (result2.fields !== undefined) {
                            res.end(JSON.stringify({ fields: result2.fields }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/get_regions') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getRegions((result2) => {
                        if (result2.regions !== undefined) {
                            res.end(JSON.stringify({ regions: result2.regions }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/get_image_list') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getImageList((result2) => {
                        if (result2.images !== undefined) {
                            res.end(JSON.stringify({ images: result2.images }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url.substr(0, '/get_image'.length) === '/get_image') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const imageId = req.url.split('?')[1].split('=')[1];
                    databaseManager.getImage(imageId, (result2) => {
                        if (result2.data !== undefined) {
                            res.end(JSON.stringify({ id: imageId, data: result2.data }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url.substr(0, '/delete_user'.length) === '/delete_user') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const userId = req.url.split('?')[1].split('=')[1];
                    databaseManager.deleteUser(userId, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
            /**
             * date has to be in format YYYY_MM_DD
             */
        } else if (req.url.substr(0, '/change_points_date'.length) === '/change_points_date') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else if (req.url.split('?')[1].split('&').length !== 2) {
                    res.writeHead(400);
                    res.end();
                } else {
                    let paramsOk = true;
                    const reqParams = req.url.split('?')[1].split('&').reduce((allParams, param) => {
                        if (param.split('=').length !== 2) {
                            paramsOk = false;
                        }
                        return { ...allParams, [param.split('=')[0]]: param.split('=')[1].replace(/_/g, '-') };
                    }, {});

                    console.log(reqParams);

                    if (!(reqParams.newDate && reqParams.oldDate)) {
                        paramsOk = false;
                    }

                    if (isNaN((new Date(reqParams.newDate)).valueOf())
                        || isNaN((new Date(reqParams.oldDate)).valueOf())
                    ) {
                        paramsOk = false;
                    }

                    if (!paramsOk) {
                        res.writeHead(400);
                        res.end();
                    } else {
                        databaseManager.changePointsDate(reqParams.oldDate, reqParams.newDate,
                            (result2) => {
                                if (result2.ok !== undefined) {
                                    res.end(JSON.stringify({ ok: 'ok' }));
                                } else {
                                    res.writeHead(500);
                                    res.end();
                                }
                            });
                    }
                }
            });
        } else if (req.url.substr(0, '/delete_points_from_date'.length) === '/delete_points_from_date') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if ((req.url.split('?')[1] || req.url.split('?')[1].split('=')[1]) === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    let paramsOk = true;
                    const reqParam = req.url.split('?')[1].split('=')[1].replace(/_/g, '-');

                    console.log(reqParam);

                    if (isNaN((new Date(reqParam)).valueOf())) {
                        paramsOk = false;
                    }

                    if (!paramsOk) {
                        res.writeHead(400);
                        res.end();
                    } else {
                        databaseManager.deletePointsFromDate(reqParam, (result2) => {
                            if (result2.ok !== undefined) {
                                res.end(JSON.stringify({ ok: 'ok' }));
                            } else {
                                res.writeHead(500);
                                res.end();
                            }
                        });
                    }
                }
            });
        } else if (req.url.search(/\./) === -1) {
            res.writeHead(filesMap['/'].code, filesMap['/'].headers);
            res.end(fs.readFileSync(`${CONFIG.httpBasePath}/${filesMap['/'].file}`));
        } else {
            console.log(`Requested file not found: ${req.url}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(`${CONFIG.httpBasePath}/404.html`));
        }
    } else if (req.method.toUpperCase() === 'POST') {
        let body = '';

        if (req.url === '/upload' || req.url === '/add_user' || req.url === '/modify_points') {
            const form = new multiparty.Form();

            form.on('error', (err) => {
                console.log(`Error parsing form: ${err.stack}`);
            });

            form.on('part', (part) => {
                part.resume();

                part.on('error', (err) => {
                    console.log(err);
                });
            });

            form.on('close', () => {
                // res.end();
            });

            form.parse(req, (err, fields, files) => {
                // Object.keys(fields).forEach((name) => {
                //     console.log(`got field named ${name}`);
                // });
                //
                // Object.keys(files).forEach((name) => {
                //     console.log(`got file named ${name}`);
                // });

                if (req.url === '/upload') {
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (fields.filename !== undefined
                            && fields.imageType !== undefined
                            && files.image !== undefined
                        ) {
                            const image = fs.readFileSync(files.image[0].path);
                            databaseManager.uploadImage(image, fields.imageType, fields.filename,
                                (result2) => {
                                    if (result2.err === undefined && result2.id !== undefined) {
                                        res.writeHead(200);
                                        res.end(JSON.stringify({ ok: 'ok' }));
                                    } else {
                                        res.writeHead(500);
                                        res.end(JSON.stringify({ err: 'err' }));
                                    }
                                });
                        } else {
                            res.writeHead(400);
                            res.end(JSON.stringify({ err: 'err' }));
                        }

                        console.log('Upload completed!');
                        console.log(`Received ${Object.keys(files).length} files`);
                        console.log(files.image);
                        console.log(fields.filename);
                    });
                } else if (req.url === '/add_user') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (
                            (fields.id !== undefined && fields.id[0] !== undefined)
                            || (fields.username !== undefined && fields.username[0] !== undefined
                                && fields.name !== undefined && fields.name[0] !== undefined
                                && fields.surname !== undefined && fields.surname[0] !== undefined
                                && fields.password !== undefined && fields.password[0] !== undefined
                                && fields.role !== undefined && fields.role[0] !== undefined
                            )) {
                            const newUser = {};
                            Object.keys(fields).forEach((name) => {
                                newUser[name] = fields[name][0];
                            });
                            databaseManager.addPlayer(newUser, (result2) => {
                                if (result2.newUserId !== undefined) {
                                    res.end(JSON.stringify({ ok: 'ok' }));
                                } else {
                                    res.writeHead(500);
                                    res.end(JSON.stringify({ err: 'err' }));
                                }
                            });
                        } else {
                            res.writeHead(400);
                            res.end(JSON.stringify({ err: 'err' }));
                        }
                    });
                } else if (req.url === '/modify_points') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else {
                            // FIXME can crash server!
                            const changes = Object.keys(fields).reduce((allChanges, changeId) =>
                                ({ ...allChanges, [changeId]: fields[changeId][0].split(',') }), {});

                            databaseManager.changePoints(changes, (result2) => {
                                if (result2.ok === undefined) {
                                    res.writeHead(500);
                                    res.end(JSON.stringify({ err: 'err' }));
                                } else {
                                    res.end(JSON.stringify({ ok: 'ok' }));
                                }
                            });
                        }
                    });
                }
            });
        } else {
            req.on('data', (data) => {
                body += data;
                if (body.length > 1e6) { req.connection.destroy(); }
            });

            req.on('end', () => {
                const post = qs.parse(body);
            // console.log(post);

                if (req.url === '/login') {
                    if (post.username !== undefined && post.password !== undefined) {
                        databaseManager.login(post.username, post.password, (result) => {
                            if (result.err === undefined
                            && result.token !== undefined
                            && result.user !== undefined
                        ) {
                                res.writeHead(200, {
                                    'Set-Cookie': `token=${result.token};` +
                                `Expires=${(new Date('2020')).toUTCString()};` +
                                'Http-only',
                                });
                                res.end(JSON.stringify({ user: result.user }));
                            } else if (result.err !== undefined) {
                                res.end(JSON.stringify({ err: result.errCode }));
                            } else {
                                res.end(JSON.stringify({ err: 'undefined login result error' }));
                            }
                        });
                    } else {
                        res.writeHead(400);
                        res.end();
                    }
                } else {
                    res.writeHead(400);
                    res.end();
                }
            });
        }
    }
});
server.listen(3000);

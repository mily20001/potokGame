import http from 'http';
import fs from 'fs';
import qs from 'qs';
import mv from 'mv';
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
    '/notification.woff': { file: '', code: 200, headers: { 'Content-Type': 'application/font-woff' } },
    '/notification.ttf': { file: '', code: 200, headers: { 'Content-Type': 'application/octet-stream' } },
};

const databaseManager = new DatabaseManager();

databaseManager.propagatePoints();

databaseManager.getReachableFields(2, () => {});
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

function parseRequiredParams(requiredParamArray, paramObject) {
    return requiredParamArray.every(param =>
        paramObject[param] && paramObject[param][0] !== undefined);
}

const server = http.createServer((req, res) => {
    const cookies = parseCookies(req.headers.cookie);

    const urlDotSplitted = req.url.toString().split('.');

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
        } else if (urlDotSplitted.length > 2
            && filesMap[urlDotSplitted
                .filter((a, i) => i !== (urlDotSplitted.length - 2))
                .join('.')] !== undefined
        ) {
            const file = filesMap[urlDotSplitted
                .filter((a, i) => i !== (urlDotSplitted.length - 2))
                .join('.')];

            res.writeHead(file.code, file.headers);

            if (file.code === 200) {
                res.end(fs.readFileSync(`${CONFIG.httpBasePath}${req.url}${file.file}`));
            } else if (file.code === 301) {
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
        } else if (req.url === '/get_config') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.getConfig((result2) => {
                        if (result2.config !== undefined) {
                            res.end(JSON.stringify({ config: result2.config }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url === '/logout') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.logoutCurrent(cookies.token, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end(JSON.stringify({ err: 'err' }));
                        }
                    });
                }
            });
        } else if (req.url === '/logout_all') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined) {
                    res.writeHead(403);
                    res.end();
                } else {
                    databaseManager.logoutAllButCurrent(result.user.id, cookies.token,
                        (result2) => {
                            if (result2.ok !== undefined) {
                                res.end(JSON.stringify({ ok: 'ok' }));
                            } else {
                                res.writeHead(500);
                                res.end(JSON.stringify({ err: 'err' }));
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
                        if (result2.map === true) {
                            res.writeHead(200, { 'Content-Type': result2.dataType.slice(5) });
                            try {
                                res.end(fs.readFileSync('resources/map.image'));
                            } catch (err) {
                                console.warn('error while getting map:', err);
                                res.writeHead(404);
                                res.end(JSON.stringify({ err: 'err' }));
                            }
                        } else if (result2.data !== undefined) {
                            res.writeHead(200, { 'Content-Type': result2.dataType.slice(5) });
                            res.end(result2.data);
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
        } else if (req.url.substr(0, '/delete_team'.length) === '/delete_team') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const teamId = req.url.split('?')[1].split('=')[1];
                    databaseManager.deleteTeam(teamId, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url.substr(0, '/delete_region'.length) === '/delete_region') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const regionId = req.url.split('?')[1].split('=')[1];
                    databaseManager.deleteRegion(regionId, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url.substr(0, '/delete_level'.length) === '/delete_level') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const levelId = req.url.split('?')[1].split('=')[1];
                    databaseManager.deleteLevel(levelId, (result2) => {
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
        } else if (req.url.substr(0, '/change_dragon_image'.length) === '/change_dragon_image') {
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
                        return { ...allParams, [param.split('=')[0]]: param.split('=')[1] };
                    }, {});

                    if (!(reqParams.dragonId && reqParams.imageId)) {
                        paramsOk = false;
                    }

                    if (!paramsOk) {
                        res.writeHead(400);
                        res.end();
                    } else {
                        databaseManager.changeDragonImage(reqParams.dragonId, reqParams.imageId,
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
        } else if (req.url.substr(0, '/change_dragon_name'.length) === '/change_dragon_name') {
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
                        return { ...allParams, [param.split('=')[0]]: param.split('=')[1] };
                    }, {});

                    if (!(reqParams.dragonId && reqParams.newName)) {
                        paramsOk = false;
                    }

                    if (!paramsOk) {
                        res.writeHead(400);
                        res.end();
                    } else {
                        databaseManager.changeDragonName(reqParams.dragonId,
                            decodeURIComponent(reqParams.newName), (result2) => {
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
        } else if (req.url.substr(0, '/add_dragon_by_name'.length) === '/add_dragon_by_name') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const dragonName = decodeURIComponent(req.url.split('?')[1].split('=')[1]);
                    databaseManager.addDragonByName(dragonName, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
                }
            });
        } else if (req.url.substr(0, '/delete_dragon'.length) === '/delete_dragon') {
            databaseManager.getUserFromCookie(cookies.token, (result) => {
                if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                    res.writeHead(403);
                    res.end();
                } else if (req.url.split('?')[1] === undefined || req.url.split('?')[1].split('=')[1] === undefined) {
                    res.writeHead(400);
                    res.end();
                } else {
                    const dragonId = req.url.split('?')[1].split('=')[1];
                    databaseManager.deleteDragon(dragonId, (result2) => {
                        if (result2.ok !== undefined) {
                            res.end(JSON.stringify({ ok: 'ok' }));
                        } else {
                            res.writeHead(500);
                            res.end();
                        }
                    });
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

        if (req.url === '/upload' || req.url === '/add_user' || req.url === '/modify_points'
            || req.url === '/add_points' || req.url === '/add_team' || req.url === '/add_region'
            || req.url === '/add_level' || req.url === '/move_fields' || req.url === '/update_config'
        ) {
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
                            && fields.dataType !== undefined
                            && ['map', 'dragon'].includes(fields.imageType[0])
                        ) {
                            if (fields.imageType[0] !== 'map') {
                                const image = fs.readFileSync(files.image[0].path);
                                databaseManager.uploadImage(image, fields.imageType,
                                    fields.filename, fields.dataType, (result2) => {
                                        if (result2.err === undefined && result2.id !== undefined) {
                                            res.writeHead(200);
                                            res.end(JSON.stringify({ ok: 'ok' }));
                                        } else {
                                            res.writeHead(500);
                                            res.end(JSON.stringify({ err: 'err' }));
                                        }
                                    });
                            } else {
                                console.log('adding map');
                                mv(files.image[0].path, 'resources/map.image', { mkdirp: true }, (err2) => {
                                    if (err2) {
                                        res.writeHead(500);
                                        res.end();
                                    } else {
                                        databaseManager.uploadImage('', fields.imageType,
                                            fields.filename, fields.dataType, (result2) => {
                                                if (result2.err === undefined &&
                                                    result2.id !== undefined
                                                ) {
                                                    res.writeHead(200);
                                                    res.end(JSON.stringify({ ok: 'ok' }));
                                                } else {
                                                    res.writeHead(500);
                                                    res.end(JSON.stringify({ err: 'err' }));
                                                }
                                            });
                                    }
                                });
                            }
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
                        if (result.err !== undefined || result.user === undefined ||
                            (result.user.role !== 'admin' &&
                                (fields.id === undefined ||
                                    result.user.id !== parseInt(fields.id[0], 10))
                            )
                        ) {
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
                                    databaseManager.propagatePoints();
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
                } else if (req.url === '/add_team') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (
                            // TODO maybe not all fields are required
                        (fields.id !== undefined && fields.id[0] !== undefined)
                        || (fields.name !== undefined && fields.name[0] !== undefined
                            && fields.capitan !== undefined && fields.capitan[0] !== undefined
                            && fields.color !== undefined && fields.color[0] !== undefined
                        )) {
                            const newTeam = {};
                            Object.keys(fields).forEach((name) => {
                                newTeam[name] = fields[name][0];
                            });
                            databaseManager.addTeam(newTeam, (result2) => {
                                if (result2.ok !== undefined) {
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
                } else if (req.url === '/add_region') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (
                            (fields.id !== undefined && fields.id[0] !== undefined)
                            || (fields.name !== undefined && fields.name[0] !== undefined
                                && fields.distance !== undefined && fields.distance[0] !== undefined
                            )) {
                            const newRegion = {};
                            Object.keys(fields).forEach((name) => {
                                newRegion[name] = fields[name][0];
                            });
                            databaseManager.addRegion(newRegion, (result2) => {
                                if (result2.ok !== undefined) {
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
                } else if (req.url === '/update_config') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (Object.keys(fields).length) {
                            const newValues = {};
                            Object.keys(fields).forEach((name) => {
                                newValues[name] = fields[name][0];
                            });
                            databaseManager.updateConfig(newValues, (result2) => {
                                if (result2.ok !== undefined) {
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
                } else if (req.url === '/move_fields') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (fields.ids !== undefined) {
                            const changes = {};

                            let error = false;

                            Object.keys(fields.ids).forEach((arrId) => {
                                const id = fields.ids[arrId];
                                changes[id] = {
                                    map_x: fields[`${id}_x`] && fields[`${id}_x`][0],
                                    map_y: fields[`${id}_y`] && fields[`${id}_y`][0],
                                };

                                if (isNaN(parseFloat(changes[id].map_x))
                                    || isNaN(parseFloat(changes[id].map_y))
                                ) {
                                    error = true;
                                }
                            });

                            console.log(changes);

                            if (error) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ err: 'err' }));
                            } else {
                                databaseManager.moveFields(changes, (result2) => {
                                    if (result2.ok !== undefined) {
                                        res.end(JSON.stringify({ ok: 'ok' }));
                                    } else {
                                        res.writeHead(500);
                                        res.end(JSON.stringify({ err: 'err' }));
                                    }
                                });
                            }
                        } else {
                            res.writeHead(400);
                            res.end(JSON.stringify({ err: 'err' }));
                        }
                    });
                } else if (req.url === '/add_level') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else if (
                            (fields.id !== undefined && fields.id[0] !== undefined)
                            || (parseRequiredParams(['xp', 'level', 'strength', 'defence', 'range', 'hp', 'dragonId'], fields)
                        )) {
                            const newLevel = {};
                            Object.keys(fields).forEach((name) => {
                                newLevel[name] = fields[name][0];
                            });
                            databaseManager.addLevel(newLevel, (result2) => {
                                if (result2.ok !== undefined) {
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
                } else if (req.url === '/add_points') {
                    console.log(fields);
                    databaseManager.getUserFromCookie(cookies.token, (result) => {
                        if (result.err !== undefined || result.user === undefined || result.user.role !== 'admin') {
                            res.writeHead(403);
                            res.end();
                        } else {
                            // FIXME can crash server!
                            const newPoints = Object.keys(fields).reduce((allPoints, pointsRow) => {
                                if (isFinite(parseInt(pointsRow, 10))) {
                                    return ({ ...allPoints, [pointsRow]: fields[pointsRow][0].split(',') });
                                }
                                return allPoints;
                            }, {});

                            if (isNaN((new Date(fields.newDate && fields.newDate[0].replace(/_/g, '-'))).valueOf())) {
                                res.writeHead(400);
                                res.end(JSON.stringify({ err: 'err' }));
                            } else {
                                databaseManager.addPoints(newPoints, fields.newDate[0],
                                    (result2) => {
                                        if (result2.ok === undefined) {
                                            res.writeHead(500);
                                            res.end(JSON.stringify({ err: 'err' }));
                                        } else {
                                            res.end(JSON.stringify({ ok: 'ok' }));
                                        }
                                    });
                            }
                        }
                    });
                } else if (req.url === '/modify_points') {
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
                    res.writeHead(404);
                    res.end();
                }
            });
        }
    }
});
server.listen(3000);

// setTimeout(databaseManager.getReachableFields, 2000, 2);

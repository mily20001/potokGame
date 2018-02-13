import http from 'http';
import fs from 'fs';
import qs from 'qs';

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

// databaseManager.addPlayer('admin', 'milosz', 'Miłosz', 'D.', () => {});
// databaseManager.login('admin', 'milosz', () => {});
// databaseManager.getUserFromCookie('cc0aa36fac252b77a69a810451fa4caa339522051e91ff25e9065ea97c49de3817f3aa9cd97643760592aa611079cb74', () => {});

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
});
server.listen(3000);

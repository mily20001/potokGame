import http from 'http';
import fs from 'fs';

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
databaseManager.getUserFromCookie('cc0aa36fac252b77a69a810451fa4caa339522051e91ff25e9065ea97c49de3817f3aa9cd97643760592aa611079cb74', ()=>{});

const server = http.createServer((req, res) => {
    if (req.headers['x-forwarded-protocol'] === 'http') {
        console.log('upgrading to https');
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
    } else {
        console.log('Request:', req.url);
        if (filesMap[req.url] !== undefined) {
            res.writeHead(filesMap[req.url].code, filesMap[req.url].headers);
            if (filesMap[req.url].code === 200) {
                res.end(fs.readFileSync(`${CONFIG.httpBasePath}${req.url}${filesMap[req.url].file}`));
            } else if (filesMap[req.url].code === 301) {
                res.end();
            }
        } else {
            console.log(`Requested file not found: ${req.url}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(`${CONFIG.httpBasePath}/404.html`));
        }
    }
});
server.listen(3000);

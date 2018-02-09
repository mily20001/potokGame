import http from 'http';
import fs from 'fs';

const server = http.createServer(function(req, res) {
    if(req.headers['x-forwarded-protocol'] === 'http') {
        console.log('upgrading to https');
        res.writeHead(301, { 'Location': `https://${req.headers['host']}${req.url}`});
        res.end();
    }
    else
    {
        // res.writeHead(200, { 'Content-Type': 'text/plain' });
        // console.log(req.headers['x-forwarded-protocol']);
        // res.end("hello world!\n");

        const basePath = 'frontend';
        console.log('Request:', req.url);
        if(fs.existsSync(`${basePath}${req.url}`)) {
            if(req.url === '/logo.svg') {
                res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            }
            res.end(fs.readFileSync(`${basePath}${req.url}`));
        }
        else {
            console.log('Not found:', `${basePath}${req.url}`);
            res.end();
        }
    }
});
server.listen(3000);

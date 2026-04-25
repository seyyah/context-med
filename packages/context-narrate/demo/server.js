const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.mp3': 'audio/mpeg',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Redirect root to /ui/ so relative CSS/JS paths resolve correctly
    if (req.url === '/' || req.url === '') {
        res.writeHead(301, { Location: '/ui/' });
        res.end();
        return;
    }

    // Remove query string (cache-busting params like ?v=3)
    let filePath = req.url.split('?')[0];

    // Prevent directory traversal
    filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

    // Resolve relative to __dirname (the demo/ folder)
    let absolutePath = path.join(__dirname, filePath);

    fs.stat(absolutePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            absolutePath = path.join(absolutePath, 'index.html');
        }

        const extname = path.extname(absolutePath).toLowerCase();
        const contentType = MIME_TYPES[extname] || 'application/octet-stream';

        fs.readFile(absolutePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found: ' + filePath);
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server Error: ' + err.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`\nContext Narrate Demo running at:`);
    console.log(`http://localhost:${PORT}\n`);
    console.log(`Press Ctrl+C to stop.`);
});

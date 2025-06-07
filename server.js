const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001;
const publicDir = path.join(__dirname, 'pyre-ui');

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL to remove query parameters
    const url = new URL(req.url, `http://localhost:${port}`);
    let urlPath = url.pathname;
    
    // Handle root path
    if (urlPath === '/') {
        urlPath = '/index.html';
    }
    
    let filePath = path.join(publicDir, urlPath);
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content);
        }
    });
});

server.listen(port, () => {
    console.log(`🔥 Funeral Pyre altar kindled at http://localhost:${port}`);
    console.log('The sacred fire awaits...');
});

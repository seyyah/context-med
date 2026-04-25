'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createCliError } = require('../index');

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function resolveDemoPath(requestUrl, rootDir) {
  const url = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname === '/' ? 'overview.html' : pathname.replace(/^\/+/, '');
  const resolved = path.resolve(rootDir, relative);

  if (!resolved.startsWith(rootDir)) {
    throw createCliError('Invalid path.', 1);
  }

  return resolved;
}

function serveFile(response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[ext] || 'application/octet-stream'
  });
  fs.createReadStream(filePath).pipe(response);
}

async function runServe(options) {
  const port = Number.parseInt(options.port, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw createCliError(`Invalid port: ${options.port}`, 1);
  }

  const host = options.host || '127.0.0.1';
  const rootDir = path.resolve(__dirname, '../../demo');

  if (!fs.existsSync(path.join(rootDir, 'overview.html'))) {
    throw createCliError(`Demo entry not found: ${path.join(rootDir, 'overview.html')}`, 1);
  }

  const server = http.createServer((request, response) => {
    try {
      const filePath = resolveDemoPath(request.url, rootDir);
      serveFile(response, filePath);
    } catch (error) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(error.message);
    }
  });

  server.listen(port, host, () => {
    if (!options.quiet) {
      console.log(`social-agent demo listening at http://${host}:${port}`);
    }
  });
}

module.exports = {
  runServe
};

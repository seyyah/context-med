'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createCliError } = require('../index');
const { createSocialAgentDemo } = require('../api');

const MAX_DEMO_BODY_BYTES = 64 * 1024;

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
  const relative = normalizeDemoRoute(pathname);
  return resolveInsideRoot(rootDir, relative);
}

function resolveStaticPath(requestUrl, rootDir) {
  const url = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname.replace(/^\/+/, '');
  return resolveInsideRoot(rootDir, relative);
}

function resolveInsideRoot(rootDir, relativePath) {
  const resolved = path.resolve(rootDir, relativePath);
  const backtrack = path.relative(rootDir, resolved);
  if (backtrack.startsWith('..') || path.isAbsolute(backtrack)) {
    throw createCliError('Invalid path.', 1);
  }

  return resolved;
}

function normalizeDemoRoute(pathname) {
  if (pathname === '/' || pathname === '') {
    return 'overview.html';
  }

  const trimmed = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!trimmed) {
    return 'overview.html';
  }

  if (path.extname(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.html`;
}

function serveFile(request, response, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'content-type': CONTENT_TYPES[ext] || 'application/octet-stream'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  fs.createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_DEMO_BODY_BYTES) {
        reject(createCliError('Demo request body is too large.', 1));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (_error) {
        reject(createCliError('Invalid JSON request body.', 1));
      }
    });
    request.on('error', reject);
  });
}

async function serveDemoApi(request, response) {
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const options = request.method === 'POST' ? await readJsonBody(request) : {};
  const payload = createSocialAgentDemo(options);
  response.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function runServe(options) {
  const port = Number.parseInt(options.port, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw createCliError(`Invalid port: ${options.port}`, 1);
  }

  const host = options.host || '127.0.0.1';
  const demoDir = path.resolve(__dirname, '../../demo');
  const screensDir = path.join(demoDir, 'screens');

  if (!fs.existsSync(path.join(screensDir, 'overview.html'))) {
    throw createCliError(`Demo entry not found: ${path.join(screensDir, 'overview.html')}`, 1);
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/demo') {
        await serveDemoApi(request, response);
        return;
      }

      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Method not allowed');
        return;
      }

      const isDemoStaticAsset = url.pathname.startsWith('/assets/') || url.pathname.startsWith('/screens/');
      const filePath = isDemoStaticAsset
        ? resolveStaticPath(request.url, demoDir)
        : resolveDemoPath(request.url, screensDir);
      serveFile(request, response, filePath);
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

'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createCliError } = require('../index');
const { createSocialAgentDemoPayload, runWorkspacePipeline } = require('../api');
const { loadPackageEnv } = require('../env');
const { createLlmProvider, getLlmConfig, providerMetadata } = require('../llm');
const { defaultDatabasePath, openWorkflowStore } = require('../storage/sqlite-store');
const {
  createSnapshotFromItems,
  createWorkflowRecordsFromRun,
  saveWorkflowRecords
} = require('../workflow/workflow-records');

const MAX_DEMO_BODY_BYTES = 64 * 1024;
const WORKFLOW_RECORD_TYPES = ['workspace_run', 'content_plan', 'draft', 'draft_version', 'review_item'];
let lastDemoOptions = null;

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

function respondJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
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

  let options = lastDemoOptions || {};
  if (request.method === 'POST') {
    const bodyOptions = await readJsonBody(request);
    if (bodyOptions.reset === true) {
      lastDemoOptions = null;
      options = {};
    } else {
      lastDemoOptions = bodyOptions;
      options = bodyOptions;
    }
  }

  const payload = await createSocialAgentDemoPayload(options);
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

function workflowItemIdFromPath(pathname) {
  const prefix = '/api/workflow-items/';

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const itemId = decodeURIComponent(pathname.slice(prefix.length)).trim();
  return itemId || null;
}

async function serveWorkflowItemsApi(request, response, url) {
  if (request.method === 'OPTIONS') {
    respondJson(response, 204, {});
    return;
  }

  const store = await openWorkflowStore();
  const itemId = workflowItemIdFromPath(url.pathname);

  try {
    if (url.pathname === '/api/workflow-items' && request.method === 'GET') {
      const type = url.searchParams.get('type') || undefined;
      respondJson(response, 200, {
        type: 'workflow_items',
        items: await store.listItems(type)
      });
      return;
    }

    if (url.pathname === '/api/workflow-items' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const item = await store.saveItem(body);
      respondJson(response, 200, {
        type: 'workflow_item',
        item
      });
      return;
    }

    if (url.pathname === '/api/workflow-items' && request.method === 'DELETE') {
      const scope = url.searchParams.get('scope') || 'workflow';
      const types = scope === 'all' ? [] : WORKFLOW_RECORD_TYPES;
      await store.clearItems(types);
      respondJson(response, 200, {
        type: 'workflow_items_cleared',
        scope,
        cleared_types: types
      });
      return;
    }

    if (itemId && request.method === 'GET') {
      const item = await store.getItem(itemId);

      if (!item) {
        respondJson(response, 404, {
          error: 'Workflow item not found.'
        });
        return;
      }

      respondJson(response, 200, {
        type: 'workflow_item',
        item
      });
      return;
    }

    if (itemId && request.method === 'DELETE') {
      await store.deleteItem(itemId);
      respondJson(response, 200, {
        type: 'workflow_item_deleted',
        id: itemId
      });
      return;
    }

    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
  } finally {
    await store.close();
  }
}

async function serveWorkspaceRunsApi(request, response, url) {
  if (request.method === 'OPTIONS') {
    respondJson(response, 204, {});
    return;
  }

  const store = await openWorkflowStore();

  try {
    if (url.pathname === '/api/workspace-runs' && request.method === 'GET') {
      respondJson(response, 200, {
        type: 'workspace_runs',
        items: await store.listItems('workspace_run')
      });
      return;
    }

    if (url.pathname === '/api/workspace-runs/latest' && request.method === 'GET') {
      const items = await store.listItems('workspace_run');
      respondJson(response, 200, {
        type: 'workspace_run',
        item: items[0] || null
      });
      return;
    }

    if (url.pathname === '/api/workspace-runs' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const run = await runWorkspacePipeline({
        sourceText: body.sourceText || body.source || '',
        platforms: body.platforms,
        provider: body.provider,
        model: body.model
      });
      const records = createWorkflowRecordsFromRun(run);
      const savedRecords = await saveWorkflowRecords(store, records);

      respondJson(response, 200, {
        type: 'workspace_run',
        run,
        records: savedRecords
      });
      return;
    }

    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
  } finally {
    await store.close();
  }
}

async function backfillWorkflowRecords(store) {
  const existingPlans = await store.listItems('content_plan');
  const existingDrafts = await store.listItems('draft');
  const existingReviews = await store.listItems('review_item');

  if (existingPlans.length > 0 && existingDrafts.length > 0 && existingReviews.length > 0) {
    return;
  }

  const existingRuns = await store.listItems('workspace_run');
  const latestRun = existingRuns[0]?.payload;

  if (Array.isArray(latestRun?.planSeeds) && Array.isArray(latestRun?.adaptations)) {
    await saveWorkflowRecords(store, createWorkflowRecordsFromRun(latestRun));
  }
}

async function serveWorkflowSnapshotApi(request, response) {
  if (request.method === 'OPTIONS') {
    respondJson(response, 204, {});
    return;
  }

  if (request.method !== 'GET') {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const store = await openWorkflowStore();

  try {
    await backfillWorkflowRecords(store);
    respondJson(response, 200, {
      type: 'workflow_snapshot',
      snapshot: createSnapshotFromItems(await store.listItems())
    });
  } finally {
    await store.close();
  }
}

async function serveProviderStatusApi(request, response) {
  if (request.method === 'OPTIONS') {
    respondJson(response, 204, {});
    return;
  }

  if (request.method !== 'GET') {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  loadPackageEnv();
  const provider = createLlmProvider();
  const config = getLlmConfig();
  const store = await openWorkflowStore();

  try {
    const items = await store.listItems();
    const countByType = items.reduce((counts, item) => ({
      ...counts,
      [item.type]: (counts[item.type] || 0) + 1
    }), {});

    respondJson(response, 200, {
      type: 'provider_status',
      provider: providerMetadata(provider),
      requested: config,
      storage: {
        backend: 'sqlite',
        dbPath: store.dbPath || defaultDatabasePath()
      },
      workflow_counts: {
        workspaceRuns: countByType.workspace_run || 0,
        contentPlans: countByType.content_plan || 0,
        drafts: countByType.draft || 0,
        draftVersions: countByType.draft_version || 0,
        reviewItems: countByType.review_item || 0,
        workflowState: countByType.workflow_state || 0
      }
    });
  } finally {
    await store.close();
  }
}

async function runServe(options) {
  loadPackageEnv();

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

      if (url.pathname === '/api/workspace-runs' || url.pathname === '/api/workspace-runs/latest') {
        await serveWorkspaceRunsApi(request, response, url);
        return;
      }

      if (url.pathname === '/api/workflow-snapshot') {
        await serveWorkflowSnapshotApi(request, response);
        return;
      }

      if (url.pathname === '/api/provider-status') {
        await serveProviderStatusApi(request, response);
        return;
      }

      if (url.pathname === '/api/workflow-items' || url.pathname.startsWith('/api/workflow-items/')) {
        await serveWorkflowItemsApi(request, response, url);
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

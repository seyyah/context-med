/**
 * social-agent CLI Comprehensive Tests
 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
const CLI = path.join(PKG_ROOT, 'bin', 'cli.js');
const DEMO_SCRIPT = path.join(PKG_ROOT, 'demo', 'comprehensive-demo.js');
const FIXTURES = path.join(REPO_ROOT, 'fixtures');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    timeout: options.timeout || 30000
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'social-agent-cli-'));
}

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function requestText(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode, body });
      });
    });

    request.on('error', reject);
    request.end();
  });
}

async function waitForServer(url) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await requestText(url);
      if (response.statusCode === 200) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw lastError || new Error(`Server did not respond at ${url}`);
}

describe('social-agent CLI comprehensive behavior', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('plan writes a stable social calendar schema', () => {
    const output = path.join(tempDir, 'plan.json');
    const result = runCli([
      'plan',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'social_calendar',
      schema_version: 'social-agent.v1',
      platforms: ['linkedin', 'x'],
      approval_required: true
    });
    expect(payload.items.length).toBeGreaterThanOrEqual(4);
    expect(payload.items.map((item) => item.platform)).toEqual(expect.arrayContaining(['linkedin', 'x']));
    payload.items.forEach((item) => {
      expect(item.source_quote).toEqual(expect.any(String));
      expect(item.source_quote.length).toBeGreaterThan(10);
      expect(typeof item.approval_required).toBe('boolean');
    });
  });

  test('plan --dry-run prints JSON and does not write output', () => {
    const output = path.join(tempDir, 'dry-plan.json');
    const result = runCli([
      'plan',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output,
      '--dry-run'
    ]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(output)).toBe(false);
    const payload = JSON.parse(result.stdout);
    expect(payload.type).toBe('social_calendar');
  });

  test('draft creates platform-specific variants', () => {
    const output = path.join(tempDir, 'draft.json');
    const result = runCli([
      'draft',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'social_draft_package',
      schema_version: 'social-agent.v1'
    });

    const linkedIn = payload.drafts.find((draft) => draft.platform === 'linkedin');
    const x = payload.drafts.find((draft) => draft.platform === 'x');
    expect(linkedIn).toBeTruthy();
    expect(x).toBeTruthy();
    expect(linkedIn.body).not.toBe(x.body);
    expect(linkedIn.body.length).toBeGreaterThan(x.body.length);
    expect(linkedIn.source_quote.length).toBeGreaterThan(10);
    expect(x.source_quote.length).toBeGreaterThan(10);
  });

  test('moderate escalates high-risk comments', () => {
    const input = writeTempFile(tempDir, 'crisis.txt', 'This looks like a crisis involving patient privacy and a breach. Can you respond publicly?');
    const output = path.join(tempDir, 'moderation.json');
    const result = runCli([
      'moderate',
      '--input', input,
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'moderation_report',
      schema_version: 'social-agent.v1',
      risk_level: 'high',
      recommended_action: 'escalate',
      approval_required: true
    });
    expect(payload.reply_draft).toMatch(/routing/i);
  });

  test('moderate ignores clear spam without a reply draft', () => {
    const input = writeTempFile(tempDir, 'spam.txt', 'spam');
    const output = path.join(tempDir, 'spam-report.json');
    const result = runCli([
      'moderate',
      '--input', input,
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      classification: 'spam',
      risk_level: 'low',
      recommended_action: 'ignore',
      approval_required: false,
      reply_draft: ''
    });
  });

  test('rejects unsupported format and language', () => {
    const input = path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md');

    const badFormat = runCli([
      'plan',
      '--input', input,
      '--output', path.join(tempDir, 'bad-format.xml'),
      '--format', 'xml'
    ]);
    expect(badFormat.status).toBe(1);
    expect(badFormat.stderr).toMatch(/unsupported format/i);

    const badLanguage = runCli([
      'plan',
      '--input', input,
      '--output', path.join(tempDir, 'bad-language.json'),
      '--language', 'de'
    ]);
    expect(badLanguage.status).toBe(1);
    expect(badLanguage.stderr).toMatch(/unsupported language/i);
  });

  test('rejects nonexistent and empty input files', () => {
    const missing = runCli([
      'plan',
      '--input', path.join(tempDir, 'missing.md'),
      '--output', path.join(tempDir, 'missing.json')
    ]);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/not found/i);

    const emptyInput = writeTempFile(tempDir, 'empty.md', '   \n');
    const empty = runCli([
      'plan',
      '--input', emptyInput,
      '--output', path.join(tempDir, 'empty.json')
    ]);
    expect(empty.status).toBe(2);
    expect(empty.stderr).toMatch(/empty/i);
  });

  test('package API creates a comprehensive demo payload', () => {
    const socialAgent = require('@context-med/social-agent');
    const payload = socialAgent.createSocialAgentDemo();

    expect(payload).toMatchObject({
      type: 'social_agent_demo',
      schema_version: 'social-agent.v1',
      package: {
        name: '@context-med/social-agent'
      }
    });
    expect(payload.plan.items.length).toBeGreaterThanOrEqual(4);
    expect(payload.drafts.drafts.length).toBeGreaterThanOrEqual(2);
    expect(payload.moderation.reports.length).toBeGreaterThanOrEqual(4);
    expect(payload.review_queue.length).toBeGreaterThan(0);
    expect(payload.settings).toMatchObject({
      deterministic_mode: true,
      llm_api_calls: false,
      direct_publishing: false
    });
  });

  test('demo builder script writes package-generated JSON', () => {
    const output = path.join(tempDir, 'social-agent-demo.json');
    const result = spawnSync(process.execPath, [DEMO_SCRIPT, '--output', output], {
      cwd: PKG_ROOT,
      encoding: 'utf8',
      timeout: 30000
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/@context-med\/social-agent/);
    const payload = readJson(output);
    expect(payload.type).toBe('social_agent_demo');
    expect(payload.packages[0]).toMatchObject({
      format: 'json',
      status: 'ready'
    });
  });

  test('serve exposes accepted demo screens with extensionless routes', async () => {
    const port = 3300 + Math.floor(Math.random() * 300);
    const child = spawn(process.execPath, [CLI, 'serve', '--port', String(port), '--quiet'], {
      cwd: PKG_ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    try {
      const overview = await waitForServer(`http://127.0.0.1:${port}/`);
      expect(overview.body).toMatch(/Social-Agent/);
      expect(overview.body).toMatch(/assets\/social-agent-demo\.js/);

      const plan = await requestText(`http://127.0.0.1:${port}/plan`);
      expect(plan.statusCode).toBe(200);
      expect(plan.body).toMatch(/Generated Weekly Plan/);

      const drafts = await requestText(`http://127.0.0.1:${port}/drafts`);
      expect(drafts.statusCode).toBe(200);
      expect(drafts.body).toMatch(/Drafts/);

      const demoApi = await requestText(`http://127.0.0.1:${port}/api/demo`);
      expect(demoApi.statusCode).toBe(200);
      expect(JSON.parse(demoApi.body)).toMatchObject({
        type: 'social_agent_demo',
        package: {
          name: '@context-med/social-agent'
        }
      });

      const demoAsset = await requestText(`http://127.0.0.1:${port}/assets/social-agent-demo.js`);
      expect(demoAsset.statusCode).toBe(200);
      expect(demoAsset.body).toMatch(/api\/demo/);

      const directScreen = await requestText(`http://127.0.0.1:${port}/screens/overview.html`);
      expect(directScreen.statusCode).toBe(200);
      expect(directScreen.body).toMatch(/Social-Agent/);

      const post = await requestText(`http://127.0.0.1:${port}/plan`, 'POST');
      expect(post.statusCode).toBe(405);
    } finally {
      child.kill();
    }
  });
});

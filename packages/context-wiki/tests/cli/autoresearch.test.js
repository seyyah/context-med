const path = require('path');
const fs = require('fs');
const {
  execCli,
  getBinPath,
  setupOutputDir,
  teardownOutputDir,
} = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-wiki';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('autoresearch — fixture', () => {
  test('sample-experiment.json exists and is valid JSON', () => {
    const fixturePath = path.join(__dirname, '../../../../fixtures/experiments/sample-experiment.json');
    expect(fs.existsSync(fixturePath)).toBe(true);
    const raw = fs.readFileSync(fixturePath, 'utf8');
    let parsed;
    expect(() => { parsed = JSON.parse(raw); }).not.toThrow();
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('description');
    expect(parsed).toHaveProperty('query');
    expect(parsed).toHaveProperty('expected_keywords');
    expect(Array.isArray(parsed.expected_keywords)).toBe(true);
  });
});

describe('autoresearch — scorer', () => {
  test('autoresearch run with valid spec exits 0 (dry-run)', () => {
    const specPath = path.join(__dirname, '../../../../fixtures/experiments/sample-experiment.json');
    const wikiDir = path.join(__dirname, '../../../../fixtures/wiki');
    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', specPath,
      '--wiki-dir', wikiDir,
      '--dry-run',
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/score|experiment|passed|failed/i);
  });

  test('autoresearch run with missing spec exits 1', () => {
    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', 'nonexistent.json',
      '--wiki-dir', 'wiki',
    ]);
    expect(r.exitCode).toBe(1);
  });
});

describe('autoresearch — status', () => {
  test('autoresearch status with valid wiki-dir exits 0', () => {
    const wikiDir = path.join(__dirname, '../../../../fixtures/wiki');
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', wikiDir,
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/pending|reviewed|experiment/i);
  });

  test('autoresearch status with missing wiki-dir exits 1', () => {
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', 'nonexistent-wiki',
    ]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });

  test('autoresearch status with valid wiki-dir but no experiments exits 0', () => {
    const emptyWiki = setupOutputDir(PKG, 'status-empty-wiki');
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', emptyWiki,
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/no experiments/i);
  });
});

describe('autoresearch — end to end', () => {
  test('run experiment → log appears in experiments dir', () => {
    const outDir = setupOutputDir(PKG, 'autoresearch-e2e');
    const specPath = path.join(__dirname, '../../../../fixtures/experiments/sample-experiment.json');

    // ingest a page so wiki has content
    const wikiDir = path.join(outDir, 'wiki');
    const sampleTxt = path.join(__dirname, '../../../../fixtures/raw/sample-paper.txt');
    execCli(BIN, ['ingest', '--input', sampleTxt, '--output', wikiDir, '--format', 'md']);

    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', specPath,
      '--wiki-dir', wikiDir,
    ]);

    // exits 0 (passed) or 1 (failed) — both valid, experiment ran
    expect([0, 1]).toContain(r.exitCode);
    expect(r.stdout).toMatch(/score/i);

    // log file written to experiments/
    const experimentsDir = path.join(wikiDir, 'experiments');
    expect(fs.existsSync(experimentsDir)).toBe(true);
    const logs = fs.readdirSync(experimentsDir).filter(f => f.endsWith('.json'));
    expect(logs.length).toBeGreaterThan(0);

    // log file is valid JSON with correct shape
    const logContent = JSON.parse(fs.readFileSync(path.join(experimentsDir, logs[0]), 'utf8'));
    expect(logContent).toHaveProperty('id', 'exp-001');
    expect(logContent).toHaveProperty('score');
    expect(logContent).toHaveProperty('maxScore');
    expect(logContent).toHaveProperty('passed');
    expect(logContent).toHaveProperty('runAt');
    expect(logContent).toHaveProperty('humanReviewed', false);
  });
});

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

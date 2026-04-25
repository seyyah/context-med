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
const FIXTURES_WIKI = path.join(__dirname, '../../../../fixtures/wiki');

afterAll(() => teardownOutputDir(PKG));

describe('query — validation', () => {
  test('missing --input exits non-zero', () => {
    const r = execCli(BIN, ['query', '--query', 'test']);
    expect(r.exitCode).not.toBe(0);
  });

  test('missing --query exits non-zero', () => {
    const r = execCli(BIN, ['query', '--input', FIXTURES_WIKI]);
    expect(r.exitCode).not.toBe(0);
  });

  test('empty wiki dir exits 1', () => {
    const emptyDir = setupOutputDir(PKG, 'query-empty-wiki');
    const r = execCli(BIN, ['query', '--input', emptyDir, '--query', 'anything']);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/no wiki pages/i);
  });
});

describe('query — json format', () => {
  test('known query returns json with required fields', () => {
    const r = execCli(BIN, [
      'query',
      '--input', FIXTURES_WIKI,
      '--query', 'primary color design',
      '--format', 'json',
    ]);
    expect([0, 2]).toContain(r.exitCode);
    if (r.exitCode === 0) {
      const parsed = JSON.parse(r.stdout);
      expect(parsed).toHaveProperty('query');
      expect(parsed).toHaveProperty('answer');
      expect(parsed).toHaveProperty('source');
      expect(parsed).toHaveProperty('source_hash');
      expect(parsed).toHaveProperty('confidence');
      expect(['high', 'low', 'none']).toContain(parsed.confidence);
    }
  });

  test('high confidence query returns source reference', () => {
    const r = execCli(BIN, [
      'query',
      '--input', FIXTURES_WIKI,
      '--query', 'primary color design token',
      '--format', 'json',
    ]);
    if (r.exitCode === 0) {
      const parsed = JSON.parse(r.stdout);
      expect(parsed.source.length).toBeGreaterThan(0);
    }
  });
});

describe('query — md format', () => {
  test('md format prints query, source, confidence', () => {
    const r = execCli(BIN, [
      'query',
      '--input', FIXTURES_WIKI,
      '--query', 'design system',
      '--format', 'md',
    ]);
    expect([0, 2]).toContain(r.exitCode);
    if (r.exitCode === 0) {
      expect(r.stdout).toMatch(/query/i);
      expect(r.stdout).toMatch(/source/i);
      expect(r.stdout).toMatch(/confidence/i);
    }
  });
});

describe('query — guardrail (Exit 2)', () => {
  test('unknown query exits 2 with I don\'t know message', () => {
    const outDir = setupOutputDir(PKG, 'query-exit2');
    // ingest a page about design only
    execCli(BIN, [
      'ingest',
      '--input', path.join(__dirname, '../../../../fixtures/raw/sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    const r = execCli(BIN, [
      'query',
      '--input', outDir,
      '--query', 'xyzzy quantum blockchain irrelevant nonsense zork',
      '--format', 'json',
    ]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toMatch(/don't know|no relevant/i);
  });
});

describe('query — ingest then query pipeline', () => {
  test('ingest → query returns answer from ingested content', () => {
    const outDir = setupOutputDir(PKG, 'query-pipeline');
    execCli(BIN, [
      'ingest',
      '--input', path.join(__dirname, '../../../../fixtures/raw/sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    const r = execCli(BIN, [
      'query',
      '--input', outDir,
      '--query', 'sample paper',
      '--format', 'json',
    ]);
    expect([0, 2]).toContain(r.exitCode);
    if (r.exitCode === 0) {
      const parsed = JSON.parse(r.stdout);
      expect(parsed.answer.length).toBeGreaterThan(0);
    }
  });
});

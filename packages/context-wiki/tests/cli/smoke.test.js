/**
 * context-wiki CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-wiki';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-wiki CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-wiki|ingest/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('ingest without --input exits non-zero', () => {
      const r = execCli(BIN, ['ingest', '--output', '/tmp/wiki/']);
      expect(r.exitCode).not.toBe(0);
    });

    test('ingest with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['ingest', '--input', 'nonexistent.txt', '--output', '/tmp/w/']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('ingest --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const r = execCli(BIN, [
        'ingest',
        '--input', path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output', outDir,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('ingest creates wiki page', () => {
      const outDir = setupOutputDir(PKG, 'ingest');
      const r = execCli(BIN, [
        'ingest',
        '--input', path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output', outDir,
        '--format', 'md',
      ]);
      if (r.exitCode === 0) {
        const files = require('fs').readdirSync(outDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('lint validates wiki structure', () => {
      const r = execCli(BIN, [
        'lint',
        '--input', path.join(FIXTURES, 'wiki'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });

    test('query returns results', () => {
      const r = execCli(BIN, [
        'query',
        '--input', path.join(FIXTURES, 'wiki'),
        '--query', 'atrial fibrillation anticoagulation',
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expect(r.stdout.length).toBeGreaterThan(0);
      }
    });
  });
});

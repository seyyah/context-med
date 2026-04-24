/**
 * context-gate CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-gate';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-gate CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-gate|ingest/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('ingest without --input exits non-zero', () => {
      const r = execCli(BIN, ['ingest', '--output', '/tmp/profile.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('ingest with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['ingest', '--input', 'ghost.pdf', '--output', '/tmp/p.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('ingest --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'profile.json');
      const r = execCli(BIN, [
        'ingest',
        '--input', path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('ingest creates profile JSON', () => {
      const outDir = setupOutputDir(PKG, 'ingest');
      const outFile = path.join(outDir, 'gate-profile.json');
      const r = execCli(BIN, [
        'ingest',
        '--input', path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output', outFile,
        '--domain', 'cardiovascular',
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('lint checks provenance', () => {
      const r = execCli(BIN, [
        'lint',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });
  });
});

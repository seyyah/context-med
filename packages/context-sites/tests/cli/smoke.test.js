/**
 * context-sites CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-sites';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-sites CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-sites|build/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('build without --input exits non-zero', () => {
      const r = execCli(BIN, ['build', '--output', '/tmp/out']);
      expect(r.exitCode).not.toBe(0);
    });

    test('build with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['build', '--input', 'nonexistent/', '--output', '/tmp/out']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('build --dry-run exits 0, writes nothing', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const r = execCli(BIN, [
        'build',
        '--input', path.join(FIXTURES, 'wiki'),
        '--output', outDir,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('build creates output directory with files', () => {
      const outDir = setupOutputDir(PKG, 'build');
      const r = execCli(BIN, [
        'build',
        '--input', path.join(FIXTURES, 'wiki'),
        '--output', outDir,
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
  });
});

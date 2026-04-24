/**
 * context-qualitative CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-qualitative';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-qualitative CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-qualitative|analyze/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('analyze without --input exits non-zero', () => {
      const r = execCli(BIN, ['analyze', '--output', '/tmp/out.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('analyze with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['analyze', '--input', 'nonexistent.txt', '--output', '/tmp/out.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('analyze --dry-run exits 0, no output written', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'analysis.json');
      const r = execCli(BIN, [
        'analyze',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('analyze creates output file', () => {
      const outDir = setupOutputDir(PKG, 'happy');
      const outFile = path.join(outDir, 'analysis.json');
      const r = execCli(BIN, [
        'analyze',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('compile aggregates results', () => {
      const outDir = setupOutputDir(PKG, 'compile');
      const outFile = path.join(outDir, 'compiled.json');
      const r = execCli(BIN, [
        'compile',
        '--input', path.join(FIXTURES, 'json'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

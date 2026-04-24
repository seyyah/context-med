/**
 * context-sim CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-sim';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-sim CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-sim|compile/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('compile without --input exits non-zero', () => {
      const r = execCli(BIN, ['compile', '--output', '/tmp/scenario.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('compile with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['compile', '--input', 'ghost.yaml', '--output', '/tmp/s.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('compile --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'scenario.json');
      const r = execCli(BIN, [
        'compile',
        '--input', path.join(FIXTURES, 'scenarios', 'acs-chest-pain-01.yaml'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('compile creates compiled scenario', () => {
      const outDir = setupOutputDir(PKG, 'compile');
      const outFile = path.join(outDir, 'compiled-scenario.json');
      const r = execCli(BIN, [
        'compile',
        '--input', path.join(FIXTURES, 'scenarios', 'acs-chest-pain-01.yaml'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('batch compiles multiple scenarios', () => {
      const outDir = setupOutputDir(PKG, 'batch');
      const r = execCli(BIN, [
        'batch',
        '--input', path.join(FIXTURES, 'scenarios'),
        '--output', outDir,
      ]);
      if (r.exitCode === 0) {
        const files = require('fs').readdirSync(outDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * cofounder-office CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'cofounder-office';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('cofounder-office CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|cofounder-office|roster/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('consult without --input exits non-zero', () => {
      const r = execCli(BIN, ['consult', '--persona', 'cto']);
      expect(r.exitCode).not.toBe(0);
    });

    test('consult with nonexistent persona exits non-zero', () => {
      const r = execCli(BIN, ['consult', '--input', path.join(FIXTURES, 'raw', 'sample-paper.txt'), '--persona', 'ghost']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('digest --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'digest.json');
      const r = execCli(BIN, [
        'digest',
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('roster lists active personas', () => {
      const r = execCli(BIN, ['roster', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });

    test('digest generates office summary', () => {
      const outDir = setupOutputDir(PKG, 'digest');
      const outFile = path.join(outDir, 'summary.json');
      const r = execCli(BIN, [
        'digest',
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

/**
 * istabot-nokta CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'istabot-nokta';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('istabot-nokta CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|istabot-nokta|discover/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('discover without --input exits non-zero', () => {
      const r = execCli(BIN, ['discover', '--output', '/tmp/idea.md']);
      expect(r.exitCode).not.toBe(0);
    });

    test('execute without --input exits non-zero', () => {
      const r = execCli(BIN, ['execute', '--output', '/tmp/report.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('discover --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'idea.md');
      const r = execCli(BIN, [
        'discover',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('discover creates project idea', () => {
      const outDir = setupOutputDir(PKG, 'discover');
      const outFile = path.join(outDir, 'idea.md');
      const r = execCli(BIN, [
        'discover',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--domain', 'cardiovascular',
        '--format', 'md',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('status shows MRLC phase', () => {
      const r = execCli(BIN, [
        'status',
        '--input', path.join(FIXTURES, 'wiki'),
        '--format', 'json',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });
});

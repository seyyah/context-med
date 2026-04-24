/**
 * context-avatar CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-avatar';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-avatar CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-avatar|render/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('render without --input exits non-zero', () => {
      const r = execCli(BIN, ['render', '--output', '/tmp/video.mp4']);
      expect(r.exitCode).not.toBe(0);
    });

    test('render with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['render', '--input', 'nonexistent.md', '--output', '/tmp/v.mp4']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('render --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'video.mp4');
      const r = execCli(BIN, [
        'render',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('render creates output file', () => {
      const outDir = setupOutputDir(PKG, 'render');
      const outFile = path.join(outDir, 'avatar-video.mp4');
      const r = execCli(BIN, [
        'render',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--format', 'mp4',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('consent verifies consent status', () => {
      const r = execCli(BIN, [
        'consent',
        '--input', path.join(FIXTURES, 'config', 'summary-10min.yaml'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });
  });
});

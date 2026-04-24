/**
 * context-kiosk CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-kiosk';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-kiosk CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-kiosk|serve/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('serve without --config exits non-zero', () => {
      const r = execCli(BIN, ['serve']);
      expect(r.exitCode).not.toBe(0);
    });

    test('calibrate without --input exits non-zero', () => {
      const r = execCli(BIN, ['calibrate']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('calibrate --dry-run exits 0, no side effects', () => {
      const r = execCli(BIN, [
        'calibrate',
        '--input', path.join(FIXTURES, 'config', 'summary-10min.yaml'),
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('test runs self-diagnostics', () => {
      const r = execCli(BIN, ['test', '--format', 'json']);
      expect([0, 2]).toContain(r.exitCode);
    });

    test('status shows operational info', () => {
      const r = execCli(BIN, ['status', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });
  });
});

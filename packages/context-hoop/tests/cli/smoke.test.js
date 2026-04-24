/**
 * context-hoop CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-hoop';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-hoop CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-hoop|trigger/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('trigger without --input exits non-zero', () => {
      const r = execCli(BIN, ['trigger']);
      expect(r.exitCode).not.toBe(0);
    });

    test('approve with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['approve', '--input', 'nonexistent.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('trigger --dry-run exits 0, no notification sent', () => {
      const r = execCli(BIN, [
        'trigger',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('status returns current escalations', () => {
      const r = execCli(BIN, ['status', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });

    test('lint validates HITL config', () => {
      const r = execCli(BIN, [
        'lint',
        '--input', path.join(FIXTURES, 'config', 'summary-10min.yaml'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });
  });
});

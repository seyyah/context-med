/**
 * pixel-office CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'pixel-office';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('pixel-office CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|pixel-office|serve|render/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('render without --output exits non-zero', () => {
      const r = execCli(BIN, ['render']);
      expect(r.exitCode).not.toBe(0);
    });

    test('build without --output exits non-zero', () => {
      const r = execCli(BIN, ['build']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('lint validates sprite assets', () => {
      const r = execCli(BIN, ['lint', '--input', 'assets/', '--format', 'json']);
      expect([0, 2]).toContain(r.exitCode);
    });

    test('status shows event stream status', () => {
      const r = execCli(BIN, ['status', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });
  });
});

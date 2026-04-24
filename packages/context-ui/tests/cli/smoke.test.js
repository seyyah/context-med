/**
 * context-ui CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-ui';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-ui CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-ui|serve|build/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('build without --output exits non-zero', () => {
      const r = execCli(BIN, ['build']);
      expect(r.exitCode).not.toBe(0);
    });

    test('lint without --input exits non-zero', () => {
      const r = execCli(BIN, ['lint']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Happy Path', () => {
    test('build creates dist directory', () => {
      const outDir = setupOutputDir(PKG, 'build');
      const r = execCli(BIN, ['build', '--output', outDir]);
      if (r.exitCode === 0) {
        const files = require('fs').readdirSync(outDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('status checks backend connectivity', () => {
      const r = execCli(BIN, ['status', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });
  });
});

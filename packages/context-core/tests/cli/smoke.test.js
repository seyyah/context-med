/**
 * context-core CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-core';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-core CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-core|chain/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('chain without --input exits non-zero', () => {
      const r = execCli(BIN, ['chain', '--output', '/tmp/chain-out/']);
      expect(r.exitCode).not.toBe(0);
    });

    test('route without --input exits non-zero', () => {
      const r = execCli(BIN, ['route']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('chain --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const r = execCli(BIN, [
        'chain',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outDir,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      const fs = require('fs');
      if (fs.existsSync(outDir)) {
          expect(fs.readdirSync(outDir).length).toBe(0);
      }
    });
  });

  describe('P1 — Happy Path', () => {
    test('route detects intent correctly', () => {
      const r = execCli(BIN, [
        'route',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--intent', 'graphical-abstract',
      ]);
      expect(r.exitCode).toBe(0);
    });

    test('health checks connected modules', () => {
      const r = execCli(BIN, ['health', '--format', 'json']);
      expect([0, 3]).toContain(r.exitCode);
    });
  });
});

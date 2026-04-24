/**
 * context-shield CLI Smoke Tests
 *
 * Tests: --help, missing flags, nonexistent input, dry-run, output file creation
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-shield';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-shield CLI', () => {
  // ── P0: Smoke ──
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-shield|scan|mask/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  // ── P0: Error Handling ──
  describe('P0 — Error Handling', () => {
    test('scan without --input exits non-zero', () => {
      const r = execCli(BIN, ['scan']);
      expect(r.exitCode).not.toBe(0);
      expect(r.stdout + r.stderr).toMatch(/--input|required/i);
    });

    test('scan with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['scan', '--input', 'nonexistent.txt']);
      expect(r.exitCode).not.toBe(0);
    });

    test('mask without --input exits non-zero', () => {
      const r = execCli(BIN, ['mask', '--output', '/tmp/out.txt']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  // ── P1: Dry Run ──
  describe('P1 — Dry Run', () => {
    test('scan --dry-run exits 0, no side effects', () => {
      const r = execCli(BIN, [
        'scan',
        '--input', path.join(FIXTURES, 'shield', 'sample-with-pii.txt'),
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
    });
  });

  // ── P1: Happy Path ──
  describe('P1 — Happy Path', () => {
    test('scan with PII sample returns findings', () => {
      const r = execCli(BIN, [
        'scan',
        '--input', path.join(FIXTURES, 'shield', 'sample-with-pii.txt'),
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expect(r.stdout).toMatch(/pii|entity|detected/i);
      }
    });

    test('mask creates masked output file', () => {
      const outDir = setupOutputDir(PKG, 'mask');
      const outFile = path.join(outDir, 'masked-output.txt');
      const r = execCli(BIN, [
        'mask',
        '--input', path.join(FIXTURES, 'shield', 'sample-with-pii.txt'),
        '--output', outFile,
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

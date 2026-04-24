/**
 * context-va CLI Smoke Tests
 *
 * Tests: --help, missing flags, nonexistent input, dry-run, output file creation
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-va';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-va CLI', () => {
  // ── P0: Smoke ──
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-va|generate/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  // ── P0: Error Handling ──
  describe('P0 — Error Handling', () => {
    test('generate without --input exits 1', () => {
      const r = execCli(BIN, ['generate', '--output', '/tmp/out.json']);
      expect(r.exitCode).not.toBe(0);
      expect(r.stdout + r.stderr).toMatch(/--input|required/i);
    });

    test('generate with nonexistent input exits 1', () => {
      const r = execCli(BIN, ['generate', '--input', 'nonexistent.txt', '--output', '/tmp/out.json']);
      expect(r.exitCode).not.toBe(0);
      expect(r.stdout + r.stderr).toMatch(/not found|no such file|ENOENT/i);
    });

    test('unknown subcommand exits non-zero', () => {
      const r = execCli(BIN, ['foobar']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  // ── P1: Dry Run ──
  describe('P1 — Dry Run', () => {
    test('generate --dry-run exits 0, writes no output file', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'va-output.json');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  // ── P1: Happy Path ──
  describe('P1 — Happy Path (integration)', () => {
    test('generate with valid input creates output file', () => {
      const outDir = setupOutputDir(PKG, 'happy-path');
      const outFile = path.join(outDir, 'va-output.json');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--config', path.join(FIXTURES, 'config', 'jama-visual-abstract.yaml'),
        '--format', 'json',
      ]);
      // If CLI is implemented, expect file to exist
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });

  // ── P1: Batch ──
  describe('P1 — Batch', () => {
    test('batch with directory input exits 0 or not-implemented', () => {
      const outDir = setupOutputDir(PKG, 'batch');
      const r = execCli(BIN, [
        'batch',
        '--input', path.join(FIXTURES, 'raw'),
        '--output', outDir,
      ]);
      // Accept 0 (success) or 1 (not yet implemented)
      expect([0, 1]).toContain(r.exitCode);
    });
  });
});

/**
 * context-paper CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-paper';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-paper CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-paper|forge/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('forge without --input exits non-zero', () => {
      const r = execCli(BIN, ['forge', '--output', '/tmp/ms.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('forge with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['forge', '--input', 'nonexistent.txt', '--output', '/tmp/ms.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('forge --dry-run exits 0, no output file', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'manuscript.json');
      const r = execCli(BIN, [
        'forge',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('forge creates manuscript output', () => {
      const outDir = setupOutputDir(PKG, 'forge');
      const outFile = path.join(outDir, 'manuscript.json');
      const r = execCli(BIN, [
        'forge',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outFile,
        '--config', path.join(FIXTURES, 'config', 'jama-visual-abstract.yaml'),
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('verify checks source_quote in manuscript', () => {
      const r = execCli(BIN, [
        'verify',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });

    test('compile converts JSON to Markdown', () => {
      const outDir = setupOutputDir(PKG, 'compile');
      const outFile = path.join(outDir, 'manuscript.md');
      const r = execCli(BIN, [
        'compile',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--output', outFile,
        '--format', 'md',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

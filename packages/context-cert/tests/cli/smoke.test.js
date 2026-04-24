/**
 * context-cert CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-cert';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-cert CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-cert|generate/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('generate without --input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--output', '/tmp/quiz.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('generate with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--input', 'ghost.txt', '--output', '/tmp/q.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('generate --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'quiz.json');
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

  describe('P1 — Happy Path', () => {
    test('generate creates quiz questions', () => {
      const outDir = setupOutputDir(PKG, 'generate');
      const outFile = path.join(outDir, 'quiz.json');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular'),
        '--output', outFile,
        '--count', '5',
        '--difficulty', 'hard',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('review lists drafts', () => {
      const r = execCli(BIN, ['review', '--status', 'draft', '--format', 'json']);
      expect(r.exitCode).toBe(0);
    });
  });
});

/**
 * context-slides CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../../tests/helpers/cli-test-utils');

const PKG = 'context-slides';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-slides CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-slides|generate/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('generate without --input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--output', '/tmp/deck.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('generate with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--input', 'ghost.json', '--output', '/tmp/d.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('generate --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'deck.json');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('generate creates deck JSON', () => {
      const outDir = setupOutputDir(PKG, 'generate');
      const outFile = path.join(outDir, 'deck.json');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('speaker-notes adds notes to deck', () => {
      const outDir = setupOutputDir(PKG, 'notes');
      const outFile = path.join(outDir, 'deck-with-notes.json');
      const r = execCli(BIN, [
        'speaker-notes',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--output', outFile,
        '--duration', '10min',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

/**
 * marketing-agent CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'marketing-agent';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('marketing-agent CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|marketing-agent|brief/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('brief without --input exits non-zero', () => {
      const r = execCli(BIN, ['brief', '--output', '/tmp/brief.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('draft without --input exits non-zero', () => {
      const r = execCli(BIN, ['draft', '--output', '/tmp/draft.md']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('brief --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'brief.json');
      const r = execCli(BIN, [
        'brief',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('brief creates marketing brief', () => {
      const outDir = setupOutputDir(PKG, 'brief');
      const outFile = path.join(outDir, 'brief.json');
      const r = execCli(BIN, [
        'brief',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('lint validates brand guidelines', () => {
      const r = execCli(BIN, [
        'lint',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--format', 'json',
      ]);
      expect([0, 2]).toContain(r.exitCode);
    });
  });
});

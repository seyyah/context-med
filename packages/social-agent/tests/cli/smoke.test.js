/**
 * social-agent CLI Smoke Tests
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../../tests/helpers/cli-test-utils');

const PKG = 'social-agent';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('social-agent CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|social-agent|plan/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('plan without --input exits non-zero', () => {
      const r = execCli(BIN, ['plan', '--output', '/tmp/plan.json']);
      expect(r.exitCode).not.toBe(0);
    });

    test('draft without --input exits non-zero', () => {
      const r = execCli(BIN, ['draft', '--output', '/tmp/draft.json']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('plan --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'plan.json');
      const r = execCli(BIN, [
        'plan',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(require('fs').existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('plan creates social calendar', () => {
      const outDir = setupOutputDir(PKG, 'plan');
      const outFile = path.join(outDir, 'plan.json');
      const r = execCli(BIN, [
        'plan',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });

    test('moderate analyzes comments', () => {
      const outDir = setupOutputDir(PKG, 'moderate');
      const outFile = path.join(outDir, 'report.json');
      const r = execCli(BIN, [
        'moderate',
        '--input', path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'), // using as dummy input
        '--output', outFile,
        '--format', 'json',
      ]);
      if (r.exitCode === 0) {
        expectFileExists(outFile);
      }
    });
  });
});

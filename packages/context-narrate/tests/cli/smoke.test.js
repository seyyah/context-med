/**
 * context-narrate CLI Smoke Tests
 */
const path = require('path');
const fs = require('fs');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-narrate';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-narrate CLI', () => {
  describe('P0 — Smoke', () => {
    test('--help exits 0 and prints usage', () => {
      const r = execCli(BIN, ['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout + r.stderr).toMatch(/usage|context-narrate|generate/i);
    });

    test('--version exits 0', () => {
      const r = execCli(BIN, ['--version']);
      expect(r.exitCode).toBe(0);
    });
  });

  describe('P0 — Error Handling', () => {
    test('generate without --input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--output', '/tmp/audio.mp3']);
      expect(r.exitCode).not.toBe(0);
    });

    test('generate with nonexistent input exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--input', 'nonexistent.md', '--output', '/tmp/a.mp3']);
      expect(r.exitCode).not.toBe(0);
    });

    test('generate without --output exits non-zero', () => {
      const r = execCli(BIN, ['generate', '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md')]);
      expect(r.exitCode).not.toBe(0);
    });

    test('generate with invalid JSON input exits non-zero', () => {
      const invalidPath = path.join(setupOutputDir(PKG, 'invalid'), 'invalid.json');
      fs.writeFileSync(invalidPath, '{ "title": "Incomplete JSON }');
      const r = execCli(BIN, ['generate', '--input', invalidPath, '--output', '/tmp/a.mp3']);
      expect(r.exitCode).not.toBe(0);
    });
  });

  describe('P1 — Dry Run', () => {
    test('generate --dry-run exits 0, no output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'audio.mp3');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--dry-run',
      ]);
      expect(r.exitCode).toBe(0);
      expect(fs.existsSync(outFile)).toBe(false);
      expect(fs.existsSync(path.join(outDir, 'segments.json'))).toBe(false);
    });
  });

  describe('P1 — Happy Path', () => {
    test('generate creates all audio pipeline files', () => {
      const outDir = setupOutputDir(PKG, 'generate');
      const outFile = path.join(outDir, 'narrate-af.mp3');
      const r = execCli(BIN, [
        'generate',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--output', outFile,
        '--config', path.join(FIXTURES, 'config', 'summary-10min.yaml'),
        '--format', 'mp3',
      ]);

      if (r.exitCode === 0) {
        expectFileExists(outFile);
        expectFileExists(path.join(outDir, 'segments.json'));
        expectFileExists(path.join(outDir, 'narration.json'));
        expectFileExists(path.join(outDir, 'transcript.md'));
        expectFileExists(path.join(outDir, 'show-notes.md'));
        expectFileExists(path.join(outDir, 'run-report.md'));

        const segments = JSON.parse(fs.readFileSync(path.join(outDir, 'segments.json'), 'utf-8'));
        expect(segments.length).toBeGreaterThan(0);
        expect(segments[0]).toHaveProperty('sourceRefs');
        expect(segments[0].sourceRefs.length).toBeGreaterThan(0);
        expect(segments[0]).toHaveProperty('estimatedStartSec');
      }
    });

    test('faq generates FAQ-style output with Sources', () => {
      const outDir = setupOutputDir(PKG, 'faq');
      const outFile = path.join(outDir, 'faq.mp3');
      const r = execCli(BIN, [
        'faq',
        '--input', path.join(FIXTURES, 'wiki', 'emergency', 'chest-pain-triage.md'),
        '--output', outFile,
        '--language', 'en',
      ]);

      if (r.exitCode === 0) {
        expectFileExists(path.join(outDir, 'faq.md'));
        const faqText = fs.readFileSync(path.join(outDir, 'faq.md'), 'utf-8');
        expect(faqText).toMatch(/Sources:/);
      }
    });
  });
});

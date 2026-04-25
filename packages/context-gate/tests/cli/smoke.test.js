/**
 * context-gate CLI smoke and regression tests
 */
const fs = require('fs');
const path = require('path');
const {
  execCli,
  expectFileExists,
  expectValidJson,
  FIXTURES,
  getBinPath,
  setupOutputDir,
  teardownOutputDir,
} = require('../../../../tests/helpers/cli-test-utils');

const PKG = 'context-gate';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-gate CLI', () => {
  describe('P0 - Smoke', () => {
    test('--help exits 0', () => {
      const result = execCli(BIN, ['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout + result.stderr).toMatch(/usage|context-gate|ingest/i);
    });

    test('--version exits 0', () => {
      const result = execCli(BIN, ['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('0.1.0');
    });

    test('status --format json reports capabilities', () => {
      const result = execCli(BIN, ['status', '--format', 'json']);
      expect(result.exitCode).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.module).toBe('context-gate');
      expect(payload.status).toBe('ready');
      expect(payload.supports).toEqual(expect.arrayContaining(['status', 'ingest', 'lint']));
    });
  });

  describe('P0 - Error Handling', () => {
    test('ingest without --input exits non-zero', () => {
      const result = execCli(BIN, ['ingest', '--output', '/tmp/profile.json']);
      expect(result.exitCode).not.toBe(0);
    });

    test('ingest with nonexistent input exits non-zero', () => {
      const result = execCli(BIN, ['ingest', '--input', 'ghost.pdf', '--output', '/tmp/p.json']);
      expect(result.exitCode).toBe(1);
    });

    test('ingest with unsupported format exits non-zero and writes nothing', () => {
      const outDir = setupOutputDir(PKG, 'invalid-format');
      const outFile = path.join(outDir, 'profile.xml');
      const result = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--format',
        'xml',
      ]);
      expect(result.exitCode).toBe(1);
      expect(fs.existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 - Dry Run', () => {
    test('ingest --dry-run exits 0 and does not create output', () => {
      const outDir = setupOutputDir(PKG, 'dry-run');
      const outFile = path.join(outDir, 'profile.json');
      const result = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--dry-run',
      ]);
      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(outFile)).toBe(false);
    });
  });

  describe('P1 - Happy Path', () => {
    test('ingest creates profile JSON with provenance', () => {
      const outDir = setupOutputDir(PKG, 'ingest-json');
      const outFile = path.join(outDir, 'gate-profile.json');
      const result = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--domain',
        'cardiovascular',
        '--format',
        'json',
        '--decision',
        'approve',
      ]);

      expect(result.exitCode).toBe(0);
      const payload = expectValidJson(outFile);
      expect(payload.input.domain).toBe('cardiovascular');
      expect(payload.quality_control.status).toBe('approved');
      expect(payload.provenance.sha256_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('ingest creates YAML profile', () => {
      const outDir = setupOutputDir(PKG, 'ingest-yaml');
      const outFile = path.join(outDir, 'gate-profile.yaml');
      const result = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--domain',
        'oncology',
        '--format',
        'yaml',
        '--decision',
        'approve',
      ]);

      expect(result.exitCode).toBe(0);
      expectFileExists(outFile);
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).toMatch(/quality_control:/);
      expect(content).toMatch(/provenance:/);
    });

    test('ingest exits 1 when decision is reject', () => {
      const outDir = setupOutputDir(PKG, 'reject');
      const outFile = path.join(outDir, 'gate-profile.json');
      const result = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--decision',
        'reject',
      ]);

      expect(result.exitCode).toBe(1);
      expect(fs.existsSync(outFile)).toBe(false);
    });

    test('lint passes for generated gate profile', () => {
      const outDir = setupOutputDir(PKG, 'lint-pass');
      const outFile = path.join(outDir, 'gate-profile.json');
      const ingest = execCli(BIN, [
        'ingest',
        '--input',
        path.join(FIXTURES, 'raw', 'sample-paper.txt'),
        '--output',
        outFile,
        '--decision',
        'approve',
      ]);
      expect(ingest.exitCode).toBe(0);

      const result = execCli(BIN, ['lint', '--input', outFile, '--format', 'json']);
      expect(result.exitCode).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.valid).toBe(true);
      expect(payload.details.status).toBe('ok');
    });

    test('lint fails for fixture without provenance', () => {
      const result = execCli(BIN, [
        'lint',
        '--input',
        path.join(FIXTURES, 'json', 'manuscript-imrad-sample.json'),
        '--format',
        'json',
      ]);
      expect(result.exitCode).toBe(2);
      const payload = JSON.parse(result.stdout);
      expect(payload.valid).toBe(false);
      expect(payload.details.error).toMatch(/Provenance/);
    });
  });
});

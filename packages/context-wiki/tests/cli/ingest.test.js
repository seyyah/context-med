const path = require('path');
const fs = require('fs');
const {
  execCli,
  getBinPath,
  setupOutputDir,
  teardownOutputDir,
  expectFileExists,
} = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-wiki';
const BIN = getBinPath(PKG);
const FIXTURES_RAW = path.join(__dirname, '../../../../fixtures/raw');

afterAll(() => teardownOutputDir(PKG));

describe('ingest — validation', () => {
  test('missing --input exits non-zero', () => {
    const r = execCli(BIN, ['ingest', '--output', '/tmp/wiki']);
    expect(r.exitCode).not.toBe(0);
  });

  test('missing --output exits non-zero', () => {
    const r = execCli(BIN, ['ingest', '--input', path.join(FIXTURES_RAW, 'sample-paper.txt')]);
    expect(r.exitCode).not.toBe(0);
  });

  test('nonexistent input file exits 1', () => {
    const outDir = setupOutputDir(PKG, 'ingest-nonexistent');
    const r = execCli(BIN, ['ingest', '--input', 'no-such-file.txt', '--output', outDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });
});

describe('ingest — dry-run', () => {
  test('dry-run exits 0 and writes nothing', () => {
    const outDir = setupOutputDir(PKG, 'ingest-dryrun');
    const r = execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--dry-run',
    ]);
    expect(r.exitCode).toBe(0);
    expect(fs.readdirSync(outDir).length).toBe(0);
  });

  test('dry-run --verbose prints would-write message', () => {
    const outDir = setupOutputDir(PKG, 'ingest-dryrun-verbose');
    const r = execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--dry-run',
      '--verbose',
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/dry-run/i);
  });
});

describe('ingest — md format', () => {
  test('creates .md file in output dir', () => {
    const outDir = setupOutputDir(PKG, 'ingest-md');
    const r = execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    expect(r.exitCode).toBe(0);
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.md'));
    expect(files.length).toBe(1);
  });

  test('output .md contains required frontmatter fields', () => {
    const outDir = setupOutputDir(PKG, 'ingest-md-frontmatter');
    execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    const files = fs.readdirSync(outDir).filter(f => f.endsWith('.md'));
    expect(files.length).toBeGreaterThan(0);
    const content = fs.readFileSync(path.join(outDir, files[0]), 'utf8');
    expect(content).toMatch(/title:/);
    expect(content).toMatch(/source:/);
    expect(content).toMatch(/source_hash:/);
    expect(content).toMatch(/generated_at:/);
    expect(content).toMatch(/model:/);
    expect(content).toMatch(/human_reviewed:/);
  });

  test('output filename matches input basename', () => {
    const outDir = setupOutputDir(PKG, 'ingest-md-name');
    execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    expectFileExists(path.join(outDir, 'sample-paper.md'));
  });
});

describe('ingest — json format', () => {
  test('creates .json file in output dir', () => {
    const outDir = setupOutputDir(PKG, 'ingest-json');
    const r = execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--format', 'json',
    ]);
    expect(r.exitCode).toBe(0);
    expectFileExists(path.join(outDir, 'sample-paper.json'));
  });

  test('output .json is valid and has frontmatter + content keys', () => {
    const outDir = setupOutputDir(PKG, 'ingest-json-valid');
    execCli(BIN, [
      'ingest',
      '--input', path.join(FIXTURES_RAW, 'sample-paper.txt'),
      '--output', outDir,
      '--format', 'json',
    ]);
    const raw = fs.readFileSync(path.join(outDir, 'sample-paper.json'), 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('frontmatter');
    expect(parsed).toHaveProperty('content');
    expect(parsed.frontmatter).toHaveProperty('title');
    expect(parsed.frontmatter).toHaveProperty('source_hash');
    expect(typeof parsed.frontmatter.source_hash).toBe('string');
    expect(parsed.frontmatter.source_hash.length).toBeGreaterThan(0);
  });
});

describe('ingest — multiple inputs', () => {
  test('ingesting multiple files produces multiple outputs', () => {
    const outDir = setupOutputDir(PKG, 'ingest-multi');
    const files = ['sample-paper.txt', 'sample-meeting-notes.txt', 'sample-thesis-abstract.txt'];
    for (const file of files) {
      execCli(BIN, [
        'ingest',
        '--input', path.join(FIXTURES_RAW, file),
        '--output', outDir,
        '--format', 'md',
      ]);
    }
    const written = fs.readdirSync(outDir).filter(f => f.endsWith('.md'));
    expect(written.length).toBe(3);
  });
});

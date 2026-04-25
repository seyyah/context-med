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

afterAll(() => teardownOutputDir(PKG));

function createWikiPage(dir, name, extraFrontmatter = {}) {
  const frontmatter = Object.assign({
    title: 'Test Page',
    source: 'raw/test.txt',
    source_hash: 'abc123',
    generated_at: '2026-01-01T00:00:00Z',
    model: 'test-model',
    human_reviewed: false,
  }, extraFrontmatter);
  const lines = ['---'];
  for (const [k, v] of Object.entries(frontmatter)) {
    lines.push(`${k}: ${v}`);
  }
  lines.push('---', '', '## Content', '', 'Test content here.');
  fs.writeFileSync(path.join(dir, name), lines.join('\n'));
}

function createInputFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content);
  return path.join(dir, name);
}

describe('writeback — validation', () => {
  test('missing --input exits non-zero', () => {
    const r = execCli(BIN, ['writeback', '--output', '/tmp/wiki']);
    expect(r.exitCode).not.toBe(0);
  });

  test('missing --output exits non-zero', () => {
    const r = execCli(BIN, ['writeback', '--input', 'result.md']);
    expect(r.exitCode).not.toBe(0);
  });

  test('nonexistent input file exits 1', () => {
    const wikiDir = setupOutputDir(PKG, 'wb-no-input');
    const r = execCli(BIN, ['writeback', '--input', 'no-such-file.md', '--output', wikiDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });

  test('nonexistent output wiki dir exits 1', () => {
    const dir = setupOutputDir(PKG, 'wb-no-output');
    const inputFile = createInputFile(dir, 'result.md', '## New content\n\nSome text.');
    const r = execCli(BIN, ['writeback', '--input', inputFile, '--output', 'nonexistent-wiki/']);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });

  test('target page not found without --force exits 1', () => {
    const inputDir = setupOutputDir(PKG, 'wb-no-target-input');
    const wikiDir = setupOutputDir(PKG, 'wb-no-target-wiki');
    // input is result.md but wiki has no result.md → target not found
    const inputFile = createInputFile(inputDir, 'result.md', '## Content\n\nNew info.');
    const r = execCli(BIN, ['writeback', '--input', inputFile, '--output', wikiDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found|use --force/i);
  });
});

describe('writeback — dry-run', () => {
  test('dry-run exits 0 and does not modify target', () => {
    const dir = setupOutputDir(PKG, 'wb-dryrun');
    createWikiPage(dir, 'existing.md');
    const inputFile = createInputFile(dir, 'result.md', '## New\n\nNew content.');
    const originalContent = fs.readFileSync(path.join(dir, 'existing.md'), 'utf8');
    const r = execCli(BIN, [
      'writeback',
      '--input', inputFile,
      '--output', dir,
      '--dry-run',
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/dry-run/i);
    const afterContent = fs.readFileSync(path.join(dir, 'existing.md'), 'utf8');
    expect(afterContent).toBe(originalContent);
  });
});

describe('writeback — append to existing page', () => {
  test('appends content under ## Writeback section', () => {
    const dir = setupOutputDir(PKG, 'wb-append');
    createWikiPage(dir, 'result.md');
    const inputFile = createInputFile(dir, 'result.md', '## Findings\n\nNew experiment result.');
    execCli(BIN, ['writeback', '--input', inputFile, '--output', dir]);
    const content = fs.readFileSync(path.join(dir, 'result.md'), 'utf8');
    expect(content).toMatch(/## Writeback/);
    expect(content).toMatch(/New experiment result/);
  });

  test('prints success message to stdout', () => {
    const dir = setupOutputDir(PKG, 'wb-success-msg');
    createWikiPage(dir, 'result.md');
    const inputFile = createInputFile(dir, 'result.md', 'Some result content.');
    const r = execCli(BIN, ['writeback', '--input', inputFile, '--output', dir]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/written back/i);
  });
});

describe('writeback — --reviewed flag', () => {
  test('--reviewed sets human_reviewed: true in frontmatter', () => {
    const dir = setupOutputDir(PKG, 'wb-reviewed');
    createWikiPage(dir, 'result.md', { human_reviewed: false });
    const inputFile = createInputFile(dir, 'result.md', '## Review notes\n\nApproved.');
    execCli(BIN, ['writeback', '--input', inputFile, '--output', dir, '--reviewed']);
    const content = fs.readFileSync(path.join(dir, 'result.md'), 'utf8');
    expect(content).toMatch(/human_reviewed:\s*true/);
  });

  test('without --reviewed human_reviewed stays false', () => {
    const dir = setupOutputDir(PKG, 'wb-not-reviewed');
    const inputDir = setupOutputDir(PKG, 'wb-not-reviewed-input');
    createWikiPage(dir, 'result.md', { human_reviewed: false });
    const inputFile = createInputFile(inputDir, 'result.md', '## Notes\n\nSome notes.');
    execCli(BIN, ['writeback', '--input', inputFile, '--output', dir]);
    const content = fs.readFileSync(path.join(dir, 'result.md'), 'utf8');
    expect(content).toMatch(/human_reviewed:\s*false/);
  });
});

describe('writeback — --force flag', () => {
  test('--force creates new page if target does not exist', () => {
    const dir = setupOutputDir(PKG, 'wb-force');
    const inputFile = createInputFile(dir, 'new-page.md', '## New Page\n\nCreated by force.');
    const r = execCli(BIN, ['writeback', '--input', inputFile, '--output', dir, '--force']);
    expect(r.exitCode).toBe(0);
    expectFileExists(path.join(dir, 'new-page.md'));
  });
});

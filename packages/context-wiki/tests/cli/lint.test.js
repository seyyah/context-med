const path = require('path');
const fs = require('fs');
const {
  execCli,
  getBinPath,
  setupOutputDir,
  teardownOutputDir,
} = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-wiki';
const BIN = getBinPath(PKG);
const FIXTURES_WIKI = path.join(__dirname, '../../../../fixtures/wiki');

afterAll(() => teardownOutputDir(PKG));

describe('lint — validation', () => {
  test('missing --input exits non-zero', () => {
    const r = execCli(BIN, ['lint']);
    expect(r.exitCode).not.toBe(0);
  });

  test('nonexistent wiki dir exits 2 with directory not found error', () => {
    const r = execCli(BIN, ['lint', '--input', 'nonexistent-wiki', '--format', 'json']);
    expect(r.exitCode).toBe(2);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.valid).toBe(false);
    expect(parsed.checked).toBe(0);
    expect(parsed.errors[0].message).toMatch(/not found/i);
  });
});

describe('lint — json format', () => {
  test('valid wiki exits 0 with json output', () => {
    const r = execCli(BIN, ['lint', '--input', FIXTURES_WIKI, '--format', 'json']);
    expect([0, 2]).toContain(r.exitCode);
    const parsed = JSON.parse(r.stdout);
    expect(parsed).toHaveProperty('valid');
    expect(parsed).toHaveProperty('errors');
    expect(parsed).toHaveProperty('checked');
    expect(Array.isArray(parsed.errors)).toBe(true);
    expect(typeof parsed.checked).toBe('number');
  });

  test('json output has correct shape on valid wiki', () => {
    const outDir = setupOutputDir(PKG, 'lint-valid-wiki');
    // ingest a file first to create a valid wiki page
    const ingestBin = BIN;
    execCli(ingestBin, [
      'ingest',
      '--input', path.join(__dirname, '../../../../fixtures/raw/sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    const r = execCli(BIN, ['lint', '--input', outDir, '--format', 'json']);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.valid).toBe(true);
    expect(parsed.errors.length).toBe(0);
    expect(parsed.checked).toBeGreaterThan(0);
  });
});

describe('lint — md format', () => {
  test('valid pages prints success message', () => {
    const outDir = setupOutputDir(PKG, 'lint-md-valid');
    execCli(BIN, [
      'ingest',
      '--input', path.join(__dirname, '../../../../fixtures/raw/sample-paper.txt'),
      '--output', outDir,
      '--format', 'md',
    ]);
    const r = execCli(BIN, ['lint', '--input', outDir, '--format', 'md']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/valid/i);
  });
});

describe('lint — invalid pages', () => {
  test('page missing required frontmatter field exits 2', () => {
    const outDir = setupOutputDir(PKG, 'lint-invalid');
    // write a page with missing fields
    fs.writeFileSync(path.join(outDir, 'broken.md'), `---
title: Broken Page
---

Content without required frontmatter fields.
`);
    const r = execCli(BIN, ['lint', '--input', outDir, '--format', 'json']);
    expect(r.exitCode).toBe(2);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.valid).toBe(false);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  test('error report includes field name and file', () => {
    const outDir = setupOutputDir(PKG, 'lint-error-detail');
    fs.writeFileSync(path.join(outDir, 'incomplete.md'), `---
title: Incomplete
---
`);
    const r = execCli(BIN, ['lint', '--input', outDir, '--format', 'json']);
    expect(r.exitCode).toBe(2);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.errors[0]).toHaveProperty('file');
    expect(parsed.errors[0]).toHaveProperty('field');
    expect(parsed.errors[0]).toHaveProperty('message');
  });
});

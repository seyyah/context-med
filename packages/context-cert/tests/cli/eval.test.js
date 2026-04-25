/**
 * context-cert CLI Eval Tests
 *
 * Tests the ratchet evaluation logic.
 */
const path = require('path');
const fs = require('fs');
const { execCli, getBinPath, setupOutputDir, teardownOutputDir } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-cert';
const BIN = getBinPath(PKG);

describe('context-cert CLI eval', () => {
  let outDir;

  beforeAll(() => {
    outDir = setupOutputDir(PKG, 'eval');
  });

  afterAll(() => teardownOutputDir(PKG));

  const createQuiz = (name, questions) => {
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, JSON.stringify({ quiz: { questions } }, null, 2));
    return filePath;
  };

  test('PASS when new quiz score >= baseline score', () => {
    const base = createQuiz('base.json', [
      { stem: 'Q1', options: ['A', 'B'], source_quote: 'Fact 1' }
    ]);
    const next = createQuiz('next.json', [
      { stem: 'Q1', options: ['A', 'B', 'C', 'D'], source_quote: 'Fact 1' }
    ]);

    const r = execCli(BIN, ['eval', '--input', next, '--baseline', base]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/PASS/i);
  });

  test('FAIL (Exit 2) when new quiz score < baseline score', () => {
    const base = createQuiz('high-quality.json', [
      { stem: 'Q1', options: ['A', 'B', 'C', 'D'], source_quote: 'Fact 1' },
      { stem: 'Q2', options: ['A', 'B', 'C', 'D'], source_quote: 'Fact 2' }
    ]);
    const next = createQuiz('low-quality.json', [
      { stem: 'Q1', options: ['A', 'B'], source_quote: '' } // missing source_quote drops score significantly
    ]);

    const r = execCli(BIN, ['eval', '--input', next, '--baseline', base]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toMatch(/RATCHET FAILURE/i);
  });

  test('Exit 1 on missing files', () => {
    const r = execCli(BIN, ['eval', '--input', 'missing.json', '--baseline', 'missing.json']);
    expect(r.exitCode).toBe(1);
  });
});

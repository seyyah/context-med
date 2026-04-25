/**
 * context-cert Comprehensive CLI Tests
 * 
 * This suite ensures that all CLI commands (generate, review, eval)
 * behave correctly across various formats, options, and edge cases.
 */
const path = require('path');
const fs = require('fs');
const { 
  execCli, 
  getBinPath, 
  FIXTURES, 
  setupOutputDir, 
  teardownOutputDir, 
  expectFileExists, 
  expectValidJson, 
  expectNonEmptyFile 
} = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-cert';
const BIN = getBinPath(PKG);

describe('context-cert CLI Comprehensive', () => {
  let outDir;

  beforeAll(() => {
    outDir = setupOutputDir(PKG, 'comprehensive');
  });

  afterAll(() => teardownOutputDir(PKG));

  describe('generate command', () => {
    const inputMd = path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt');

    test('generate --format json produces valid JSON', () => {
      const outFile = path.join(outDir, 'gen-basic.json');
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', outFile,
        '--format', 'json'
      ]);
      expect(r.exitCode).toBe(0);
      const json = expectValidJson(outFile);
      expect(json.quiz).toBeDefined();
      expect(json.quiz.questions.length).toBeGreaterThan(0);
    });

    test('generate --format md produces markdown', () => {
      const outFile = path.join(outDir, 'gen-basic.md');
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', outFile,
        '--format', 'md'
      ]);
      expect(r.exitCode).toBe(0);
      expectFileExists(outFile);
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).toContain('# Quiz');
      expect(content).toContain('**Answer:**');
    });

    test('generate respects --count', () => {
      const outFile = path.join(outDir, 'gen-count.json');
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', outFile,
        '--count', '3'
      ]);
      expect(r.exitCode).toBe(0);
      const json = expectValidJson(outFile);
      expect(json.quiz.questions.length).toBe(3);
    });

    test('generate respects --difficulty', () => {
      const outFile = path.join(outDir, 'gen-hard.json');
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', outFile,
        '--difficulty', 'hard'
      ]);
      expect(r.exitCode).toBe(0);
      const json = expectValidJson(outFile);
      expect(json.quiz.difficulty).toBe('hard');
    });

    test('generate --dry-run does not write file', () => {
      const outFile = path.join(outDir, 'dry-run.json');
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', outFile,
        '--dry-run'
      ]);
      expect(r.exitCode).toBe(0);
      expect(fs.existsSync(outFile)).toBe(false);
    });

    test('generate fails on missing input', () => {
      const r = execCli(BIN, [
        'generate',
        '--input', 'non-existent-file.txt',
        '--output', 'out.json'
      ]);
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/input error/i);
    });

    test('generate fails on invalid difficulty', () => {
      const r = execCli(BIN, [
        'generate',
        '--input', inputMd,
        '--output', 'out.json',
        '--difficulty', 'super-hard'
      ]);
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/invalid difficulty/i);
    });
  });

  describe('review command', () => {
    let reviewCwd;
    let storeDir;

    beforeAll(() => {
      reviewCwd = path.join(outDir, 'review-cwd');
      storeDir = path.join(reviewCwd, 'cert-output');
      fs.mkdirSync(storeDir, { recursive: true });
      // Create some mock quizzes
      fs.writeFileSync(path.join(storeDir, 'draft1.json'), JSON.stringify({
        quiz: { status: 'draft', difficulty: 'medium', questions: [{}, {}], generated_at: '2023-01-01' }
      }));
      fs.writeFileSync(path.join(storeDir, 'approved1.json'), JSON.stringify({
        quiz: { status: 'approved', difficulty: 'hard', questions: [{}, {}, {}], generated_at: '2023-01-02' }
      }));
    });

    test('review --status draft --format json --quiet', () => {
      const r = execCli(BIN, ['review', '--status', 'draft', '--format', 'json', '--quiet'], { cwd: reviewCwd });
      expect(r.exitCode).toBe(0);
      const json = JSON.parse(r.stdout);
      expect(json.length).toBe(1);
      expect(json[0].file).toBe('draft1.json');
    });

    test('review --status approved --format table', () => {
      const r = execCli(BIN, ['review', '--status', 'approved', '--format', 'table'], { cwd: reviewCwd });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('approved1.json');
      expect(r.stdout).toContain('approved');
      expect(r.stdout).toContain('hard');
    });

    test('review handles empty store', () => {
      const emptyCwd = path.join(outDir, 'empty-cwd');
      fs.mkdirSync(emptyCwd, { recursive: true });
      const r = execCli(BIN, ['review'], { cwd: emptyCwd });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('(no items found)');
    });

    test('review fails on invalid status', () => {
      const r = execCli(BIN, ['review', '--status', 'unknown'], { cwd: reviewCwd });
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/invalid --status/i);
    });
  });

  describe('eval command', () => {
    const createQuiz = (name, questions) => {
      const filePath = path.join(outDir, name);
      fs.writeFileSync(filePath, JSON.stringify({ quiz: { questions } }, null, 2));
      return filePath;
    };

    test('eval PASS on identical score', () => {
      const q = [
        { stem: 'Q1', options: ['A', 'B', 'C', 'D'], source_quote: 'Fact 1' }
      ];
      const base = createQuiz('eval-base.json', q);
      const next = createQuiz('eval-next.json', q);

      const r = execCli(BIN, ['eval', '--input', next, '--baseline', base]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toMatch(/PASS/i);
    });

    test('eval FAIL on regression', () => {
      const base = createQuiz('eval-high.json', [
        { stem: 'Q1', options: ['A', 'B', 'C', 'D'], source_quote: 'Fact 1' }
      ]);
      const next = createQuiz('eval-low.json', [
        { stem: 'Q1', options: ['A', 'B'], source_quote: '' } // worse score
      ]);

      const r = execCli(BIN, ['eval', '--input', next, '--baseline', base]);
      expect(r.exitCode).toBe(2);
      expect(r.stderr).toMatch(/RATCHET FAILURE/i);
    });

    test('eval fails on invalid JSON', () => {
      const base = createQuiz('eval-valid.json', []);
      const invalid = path.join(outDir, 'invalid.json');
      fs.writeFileSync(invalid, '{ broken json');

      const r = execCli(BIN, ['eval', '--input', invalid, '--baseline', base]);
      expect(r.exitCode).toBe(1);
      expect(r.stderr).toMatch(/invalid json/i);
    });
  });
});

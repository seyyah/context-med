'use strict';
/**
 * context-cert eval command
 *
 * Ratchet evaluation — compares a new quiz JSON against a baseline.
 * The new quiz must match or exceed the baseline's quality score.
 *
 * Quality metrics:
 *  - source_quote coverage: % of questions with non-empty source_quote
 *  - mean option count: avg number of options per question
 *  - question count: number of questions
 *
 * Exit codes:
 *  0 = new quiz passes (score ≥ baseline)
 *  1 = error (file not found, invalid JSON)
 *  2 = ratchet failure (regression detected)
 */

const fs = require('fs');
const { makeLogger } = require('../index');

/**
 * Compute a quality score for a quiz.
 * Returns { score, details }.
 */
function scoreQuiz(quiz) {
  const questions = quiz.questions || [];
  const total = questions.length;

  if (total === 0) {
    return { score: 0, details: { total: 0, sourceQuoteCoverage: 0, meanOptions: 0 } };
  }

  const withSourceQuote = questions.filter((q) => q.source_quote && q.source_quote.trim().length > 0).length;
  const sourceQuoteCoverage = withSourceQuote / total;

  const meanOptions = questions.reduce((sum, q) => sum + (Array.isArray(q.options) ? q.options.length : 0), 0) / total;

  // Weighted score: source_quote coverage (60%) + option completeness (40%)
  const optionScore = Math.min(meanOptions / 4, 1); // max at 4 options
  const score = sourceQuoteCoverage * 0.6 + optionScore * 0.4;

  return {
    score: Math.round(score * 100) / 100,
    details: {
      total,
      sourceQuoteCoverage: Math.round(sourceQuoteCoverage * 100),
      meanOptions: Math.round(meanOptions * 10) / 10,
    },
  };
}

/**
 * Load and parse a quiz JSON file.
 */
function loadQuizFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in: ${filePath}`);
  }
  if (!parsed.quiz) {
    throw new Error(`File does not contain a "quiz" root key: ${filePath}`);
  }
  return parsed.quiz;
}

// ─── Command handler ──────────────────────────────────────────────────────────

module.exports = function evalCmd(opts) {
  const log = makeLogger(opts);

  // Load both files
  let newQuiz, baselineQuiz;
  try {
    newQuiz = loadQuizFile(opts.input);
    baselineQuiz = loadQuizFile(opts.baseline);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const newResult = scoreQuiz(newQuiz);
  const baseResult = scoreQuiz(baselineQuiz);

  log.info('=== context-cert eval ===');
  log.info(`Baseline score : ${baseResult.score} (${JSON.stringify(baseResult.details)})`);
  log.info(`New quiz score : ${newResult.score} (${JSON.stringify(newResult.details)})`);

  if (newResult.score >= baseResult.score) {
    log.info('✅ PASS — new quiz meets or exceeds baseline quality.');
    process.exit(0);
  } else {
    const delta = Math.round((baseResult.score - newResult.score) * 100);
    console.error(`❌ RATCHET FAILURE — new quiz score (${newResult.score}) is ${delta} points below baseline (${baseResult.score}).`);
    process.exit(2);
  }
};

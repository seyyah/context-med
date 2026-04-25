'use strict';
/**
 * context-cert review command
 *
 * Lists existing draft question sets from the default output store.
 * Since context-cert is a pure CLI tool (no database), "review" reads
 * JSON files in the current working directory's cert-output/ folder
 * and filters by --status field in the quiz metadata.
 *
 * Exit codes: 0 = success, 1 = error
 */

const fs = require('fs');
const path = require('path');
const { makeLogger } = require('../index');

const STORE_DIR = path.join(process.cwd(), 'cert-output');

/**
 * Read all quiz JSON files from STORE_DIR.
 * Returns an array of { file, quiz } objects.
 */
function loadQuizFiles(log) {
  if (!fs.existsSync(STORE_DIR)) {
    log.verbose(`Store directory not found: ${STORE_DIR}`);
    return [];
  }

  const entries = fs.readdirSync(STORE_DIR).filter((f) => f.endsWith('.json'));
  const results = [];

  for (const entry of entries) {
    const fp = path.join(STORE_DIR, entry);
    try {
      const raw = fs.readFileSync(fp, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.quiz) {
        results.push({ file: entry, quiz: parsed.quiz });
      }
    } catch {
      log.verbose(`Skipping invalid JSON: ${entry}`);
    }
  }

  return results;
}

/**
 * Filter quizzes by status.
 * Status is stored in quiz.status field, defaulting to "draft".
 */
function filterByStatus(quizzes, status) {
  return quizzes.filter((q) => (q.quiz.status || 'draft') === status);
}

/**
 * Render as a simple ASCII table.
 */
function renderTable(items) {
  if (items.length === 0) {
    return '(no items found)';
  }
  const rows = items.map((item) => ({
    file: item.file,
    questions: (item.quiz.questions || []).length,
    difficulty: item.quiz.difficulty || 'n/a',
    status: item.quiz.status || 'draft',
    generated_at: item.quiz.generated_at || 'n/a',
  }));

  const header = ['file', 'questions', 'difficulty', 'status', 'generated_at'];
  const widths = header.map((h) => Math.max(h.length, ...rows.map((r) => String(r[h]).length)));

  const line = widths.map((w) => '-'.repeat(w)).join('-+-');
  const fmt = (row) => header.map((h, i) => String(row[h]).padEnd(widths[i])).join(' | ');

  return [fmt(Object.fromEntries(header.map((h) => [h, h]))), line, ...rows.map(fmt)].join('\n');
}

// ─── Command handler ──────────────────────────────────────────────────────────

module.exports = function review(opts) {
  const log = makeLogger(opts);

  const validStatuses = ['draft', 'approved', 'rejected'];
  if (!validStatuses.includes(opts.status)) {
    console.error(`Invalid --status "${opts.status}". Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  log.verbose(`Looking for quizzes with status="${opts.status}" in: ${STORE_DIR}`);

  const all = loadQuizFiles(log);
  const filtered = filterByStatus(all, opts.status);

  log.info(`Found ${filtered.length} quiz file(s) with status="${opts.status}"`);

  if (opts.format === 'json') {
    console.log(JSON.stringify(filtered, null, 2));
  } else if (opts.format === 'md') {
    if (filtered.length === 0) {
      console.log('_No quizzes found._');
    } else {
      filtered.forEach((item) => {
        console.log(`### ${item.file}`);
        console.log(`- **Questions:** ${(item.quiz.questions || []).length}`);
        console.log(`- **Difficulty:** ${item.quiz.difficulty || 'n/a'}`);
        console.log(`- **Status:** ${item.quiz.status || 'draft'}`);
        console.log(`- **Generated:** ${item.quiz.generated_at || 'n/a'}`);
        console.log('');
      });
    }
  } else {
    // table (default)
    console.log(renderTable(filtered));
  }

  process.exit(0);
};

'use strict';
/**
 * context-cert — Shared helpers & public API
 *
 * Invariants (from AGENT.md §9):
 *  1. Extract, Never Generate — every question traces back to source_quote
 *  2. Deterministic — same input + flags → same output
 *  3. Zero PII in logs
 */

const fs = require('fs');
const path = require('path');

/**
 * Read a file or all .md/.txt files in a directory.
 * Returns an array of { filePath, content } objects.
 *
 * @param {string} inputPath
 * @returns {{ filePath: string, content: string }[]}
 */
function readInputFiles(inputPath) {
  const resolved = path.resolve(inputPath);

  if (!fs.existsSync(resolved)) {
    const err = new Error(`Input not found: ${resolved}`);
    err.code = 'ENOENT';
    throw err;
  }

  const stat = fs.statSync(resolved);

  if (stat.isFile()) {
    return [{ filePath: resolved, content: fs.readFileSync(resolved, 'utf8') }];
  }

  if (stat.isDirectory()) {
    const entries = fs.readdirSync(resolved);
    const files = entries
      .filter((f) => /\.(md|txt)$/i.test(f))
      .sort()
      .map((f) => {
        const fp = path.join(resolved, f);
        return { filePath: fp, content: fs.readFileSync(fp, 'utf8') };
      });

    if (files.length === 0) {
      const err = new Error(`No .md or .txt files found in directory: ${resolved}`);
      err.code = 'ENOENT';
      throw err;
    }

    return files;
  }

  throw new Error(`Input path is neither a file nor a directory: ${resolved}`);
}

/**
 * Validate difficulty level.
 * @param {string} level
 */
function validateDifficulty(level) {
  const valid = ['easy', 'medium', 'hard'];
  if (!valid.includes(level)) {
    throw new Error(`Invalid difficulty "${level}". Must be one of: ${valid.join(', ')}`);
  }
}

/**
 * Validate output format.
 * @param {string} format
 */
function validateFormat(format) {
  const valid = ['json', 'md'];
  if (!valid.includes(format)) {
    throw new Error(`Invalid format "${format}". Must be one of: ${valid.join(', ')}`);
  }
}

/**
 * Logger — respects --quiet and --verbose flags.
 */
function makeLogger(opts = {}) {
  return {
    info: (...args) => { if (!opts.quiet) console.log(...args); },
    verbose: (...args) => { if (opts.verbose && !opts.quiet) console.log('[verbose]', ...args); },
    error: (...args) => console.error('[error]', ...args),
  };
}

/**
 * Write output to a file or stdout, respecting --dry-run.
 * @param {string} outputPath
 * @param {string} content
 * @param {boolean} dryRun
 * @param {object} log
 */
function writeOutput(outputPath, content, dryRun, log) {
  if (dryRun) {
    log.info('[dry-run] Would write to:', outputPath);
    return;
  }
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf8');
  log.info('Output written to:', outputPath);
}

module.exports = {
  readInputFiles,
  validateDifficulty,
  validateFormat,
  makeLogger,
  writeOutput,
};

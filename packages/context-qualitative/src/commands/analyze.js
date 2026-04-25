'use strict';

/**
 * analyze command — Process qualitative text data through the multi-agent pipeline.
 *
 * Supports input formats: .txt (single text), .xlsx (Excel with text_data column)
 * Output formats: .json, .xlsx
 */

const fs = require('fs');
const path = require('path');
const { processBatch, buildOutput, createLogger } = require('../pipeline');

/**
 * Read input texts from a file.
 * - .txt → single text entry
 * - .xlsx → reads "text_data" column (requires xlsx package)
 */
function readInput(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    const content = fs.readFileSync(inputPath, 'utf-8').trim();
    if (!content) throw new Error('Input file is empty');
    return [content];
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const texts = data
      .map((row) => row.text_data || row.Text || row.text || row.content || '')
      .filter((t) => t.trim().length > 0);

    if (texts.length === 0) {
      throw new Error(
        "No text data found. Excel file must contain a column named 'text_data', 'Text', 'text', or 'content'."
      );
    }
    return texts;
  }

  throw new Error(`Unsupported input format: ${ext}. Use .txt, .md, .xlsx, or .xls`);
}

/**
 * Write output to the specified format.
 */
function writeOutput(outputPath, output, format) {
  const dir = path.dirname(outputPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (format === 'xlsx') {
    const XLSX = require('xlsx');
    const rows = output.analysis.entries.map((e) => ({
      'Original Text': e.original_text,
      'Open Codes': Array.isArray(e.open_codes) ? e.open_codes.join(', ') : e.open_codes,
      'Axial Categories': Array.isArray(e.axial_categories) ? e.axial_categories.join(', ') : e.axial_categories,
      'Validation Result': e.validation.result,
      'Validation Reason': e.validation.reason,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analysis');
    XLSX.writeFile(wb, outputPath);
  } else {
    // Default: JSON
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  }
}

/**
 * Main analyze command handler.
 */
async function analyze(opts) {
  const logger = createLogger({ verbose: opts.verbose, quiet: opts.quiet });

  // Validate input file exists
  if (!fs.existsSync(opts.input)) {
    throw new Error(`Input file not found: ${opts.input}`);
  }

  // Load environment variables
  try {
    require('dotenv').config();
  } catch {
    // dotenv is optional in test/CI environments
  }

  // Read input texts
  const texts = readInput(opts.input);
  logger.info(`Loaded ${texts.length} text entries from ${opts.input}`);

  // Dry run — validate only, don't call LLMs or write files
  if (opts.dryRun) {
    logger.info('[dry-run] Would process the following:');
    logger.info(`[dry-run]   Input: ${opts.input} (${texts.length} entries)`);
    logger.info(`[dry-run]   Output: ${opts.output}`);
    logger.info(`[dry-run]   Format: ${opts.format}`);
    logger.info(`[dry-run]   Batch size: ${opts.batchSize}`);
    logger.info('[dry-run] No files written, no LLM calls made.');
    return;
  }

  // Run the pipeline
  logger.info('Starting Multi-Agent Qualitative Analysis Pipeline');
  const batchSize = parseInt(opts.batchSize, 10) || 5;

  const results = await processBatch(texts, {
    batchSize,
    logger,
    onProgress: (processed, total) => {
      logger.info(`Progress: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`);
    },
  });

  // Build output envelope
  const output = buildOutput(results);

  // Write output
  writeOutput(opts.output, output, opts.format);
  logger.info(`Results saved to ${opts.output}`);

  // Summary
  const { summary } = output.analysis;
  logger.info(`Pipeline completed: ${summary.successful}/${summary.total} successful`);

  if (!opts.quiet) {
    console.log(JSON.stringify(output, null, 2));
  }
}

module.exports = { analyze };

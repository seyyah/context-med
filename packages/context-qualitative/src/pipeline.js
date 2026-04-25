'use strict';

/**
 * QualitativeAnalysisPipeline
 * Orchestrates the 3-agent MapReduce pipeline for qualitative data analysis.
 * Node.js port of Python's QualitativeAnalysisPipeline class.
 */

const { extractCodes } = require('./agents/open-coder');
const { synthesizeCategories } = require('./agents/axial-coder');
const { validateCategorization } = require('./agents/cross-validator');

/**
 * Create a simple logger that respects verbose/quiet flags.
 */
function createLogger(opts = {}) {
  const noop = () => {};
  return {
    info: opts.quiet ? noop : (msg) => console.log(`[INFO] ${msg}`),
    warn: opts.quiet ? noop : (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    debug: opts.verbose ? (msg) => console.log(`[DEBUG] ${msg}`) : noop,
  };
}

/**
 * Process a single text entry through all three agents.
 *
 * @param {string} text - Raw qualitative text
 * @param {number} rowNum - Row number
 * @param {object} logger - Logger instance
 * @returns {object} Analysis result
 */
async function processSingleText(text, rowNum, logger) {
  try {
    // Agent A: Extract open codes
    const openCodes = await extractCodes(text, rowNum, logger);

    // Agent B: Synthesize into axial categories
    const axialCategories = await synthesizeCategories(openCodes, rowNum, logger);

    // Agent C: Cross-validate
    const validation = await validateCategorization(text, axialCategories, rowNum, logger);

    return {
      original_text: text,
      open_codes: openCodes.split(',').map((c) => c.trim()).filter(Boolean),
      axial_categories: axialCategories.split(',').map((c) => c.trim()).filter(Boolean),
      validation: {
        result: validation.result,
        reason: validation.reason,
      },
      source_quote: text,
    };
  } catch (err) {
    logger.error(`Row ${rowNum} - Pipeline failed: ${err.message}`);
    return {
      original_text: text,
      open_codes: [],
      axial_categories: [],
      validation: { result: 'ERROR', reason: err.message },
      source_quote: text,
    };
  }
}

/**
 * Process multiple texts in batches to manage rate limits.
 * Equivalent to Python's process_batch with asyncio.gather.
 *
 * @param {string[]} texts - Array of raw text entries
 * @param {object} options - { batchSize, logger }
 * @param {Function} [onProgress] - Progress callback (processed, total)
 * @returns {object[]} Array of analysis results
 */
async function processBatch(texts, options = {}) {
  const batchSize = options.batchSize || 5;
  const logger = options.logger || createLogger();
  const onProgress = options.onProgress || (() => {});
  const results = [];

  const totalBatches = Math.ceil(texts.length / batchSize);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    logger.info(`Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`);

    // Process batch concurrently (equivalent to asyncio.gather)
    const batchResults = await Promise.allSettled(
      batch.map((text, j) => processSingleText(text, i + j + 1, logger))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.error(`Batch processing error: ${result.reason}`);
      }
    }

    onProgress(Math.min(i + batchSize, texts.length), texts.length);

    // Delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      logger.debug('Waiting between batches...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * Build the standard output JSON envelope.
 */
function buildOutput(results) {
  const successful = results.filter((r) => r.validation.result !== 'ERROR').length;
  return {
    analysis: {
      entries: results,
      summary: {
        total: results.length,
        successful,
        failed: results.length - successful,
      },
      provenance: {
        models: [
          'groq/llama3-8b-8192',
          'gemini/gemini-1.5-flash',
          'ollama/qwen3:4b',
        ],
        generated_at: new Date().toISOString(),
      },
    },
  };
}

module.exports = { processSingleText, processBatch, buildOutput, createLogger };

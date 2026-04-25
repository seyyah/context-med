'use strict';

/**
 * compile command — Aggregate multiple analysis JSON files into a unified codebook.
 *
 * Reads all JSON analysis outputs from a directory and produces a merged
 * thematic summary with deduplicated codes and categories.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../pipeline');

/**
 * Load all analysis JSON files from a directory.
 */
function loadAnalysisFiles(inputPath) {
  const stat = fs.statSync(inputPath);

  if (stat.isFile()) {
    const content = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    return [content];
  }

  if (stat.isDirectory()) {
    const files = fs.readdirSync(inputPath).filter((f) => f.endsWith('.json'));
    if (files.length === 0) {
      throw new Error(`No JSON files found in directory: ${inputPath}`);
    }
    return files.map((f) => {
      const filePath = path.join(inputPath, f);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });
  }

  throw new Error(`Input path is neither a file nor a directory: ${inputPath}`);
}

/**
 * Merge multiple analysis results into a unified codebook.
 */
function compileCodebook(analyses) {
  const allCodes = new Map();    // code → frequency
  const allCategories = new Map(); // category → [codes]
  const allEntries = [];

  for (const analysis of analyses) {
    const entries = analysis.analysis ? analysis.analysis.entries : (analysis.entries || []);

    for (const entry of entries) {
      allEntries.push(entry);

      // Count open codes
      const codes = Array.isArray(entry.open_codes) ? entry.open_codes : [];
      for (const code of codes) {
        const normalized = code.toLowerCase().trim();
        allCodes.set(normalized, (allCodes.get(normalized) || 0) + 1);
      }

      // Map categories → codes
      const categories = Array.isArray(entry.axial_categories) ? entry.axial_categories : [];
      for (const cat of categories) {
        const normalizedCat = cat.toLowerCase().trim();
        if (!allCategories.has(normalizedCat)) {
          allCategories.set(normalizedCat, new Set());
        }
        for (const code of codes) {
          allCategories.get(normalizedCat).add(code.toLowerCase().trim());
        }
      }
    }
  }

  // Build codebook
  const codebook = {
    themes: Array.from(allCategories.entries())
      .map(([category, codes]) => ({
        category,
        codes: Array.from(codes),
        frequency: Array.from(codes).reduce((sum, c) => sum + (allCodes.get(c) || 0), 0),
      }))
      .sort((a, b) => b.frequency - a.frequency),
    all_codes: Array.from(allCodes.entries())
      .map(([code, frequency]) => ({ code, frequency }))
      .sort((a, b) => b.frequency - a.frequency),
    summary: {
      total_entries: allEntries.length,
      unique_codes: allCodes.size,
      unique_categories: allCategories.size,
      sources: analyses.length,
    },
    provenance: {
      compiled_at: new Date().toISOString(),
    },
  };

  return codebook;
}

/**
 * Main compile command handler.
 */
async function compile(opts) {
  const logger = createLogger({ verbose: opts.verbose, quiet: opts.quiet });

  // Validate input exists
  if (!fs.existsSync(opts.input)) {
    throw new Error(`Input path not found: ${opts.input}`);
  }

  // Load analyses
  const analyses = loadAnalysisFiles(opts.input);
  logger.info(`Loaded ${analyses.length} analysis file(s) from ${opts.input}`);

  // Dry run
  if (opts.dryRun) {
    logger.info('[dry-run] Would compile the following:');
    logger.info(`[dry-run]   Input: ${opts.input} (${analyses.length} files)`);
    logger.info(`[dry-run]   Output: ${opts.output}`);
    logger.info('[dry-run] No files written.');
    return;
  }

  // Compile codebook
  const codebook = compileCodebook(analyses);
  logger.info(`Compiled codebook: ${codebook.summary.unique_codes} codes, ${codebook.summary.unique_categories} categories`);

  // Write output
  const dir = path.dirname(opts.output);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(opts.output, JSON.stringify(codebook, null, 2), 'utf-8');
  logger.info(`Codebook saved to ${opts.output}`);

  if (!opts.quiet) {
    console.log(JSON.stringify(codebook, null, 2));
  }
}

module.exports = { compile };

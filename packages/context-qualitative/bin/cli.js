#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('context-qualitative')
  .version(pkg.version)
  .description('Multi-agent qualitative data analysis pipeline for medical research');

// --- analyze command ---
program
  .command('analyze')
  .description('Analyze qualitative text data using multi-agent pipeline (open coding → axial coding → validation)')
  .requiredOption('--input <path>', 'Input file (txt, xlsx, or directory)')
  .requiredOption('--output <path>', 'Output file path')
  .option('--config <path>', 'YAML configuration file')
  .option('--format <type>', 'Output format (json|xlsx)', 'json')
  .option('--language <lang>', 'Language (en|tr)', 'en')
  .option('--batch-size <n>', 'Number of texts to process concurrently', '5')
  .option('--dry-run', 'Simulate without writing files or calling LLMs', false)
  .option('--verbose', 'Enable detailed logging', false)
  .option('--quiet', 'Suppress all output except errors', false)
  .action(async (opts) => {
    try {
      const { analyze } = require('../src/commands/analyze');
      await analyze(opts);
      process.exit(0);
    } catch (err) {
      if (!opts.quiet) console.error(`Error: ${err.message}`);
      // Exit code 3 for external dependency errors (API), 1 for general
      const code = err.code === 'EXTERNAL_DEPENDENCY' ? 3 : 1;
      process.exit(code);
    }
  });

// --- compile command ---
program
  .command('compile')
  .description('Aggregate multiple analysis results into a unified codebook / thematic summary')
  .requiredOption('--input <path>', 'Input directory containing analysis JSON files')
  .requiredOption('--output <path>', 'Output file path')
  .option('--format <type>', 'Output format (json|md)', 'json')
  .option('--language <lang>', 'Language (en|tr)', 'en')
  .option('--dry-run', 'Simulate without writing files', false)
  .option('--verbose', 'Enable detailed logging', false)
  .option('--quiet', 'Suppress all output except errors', false)
  .action(async (opts) => {
    try {
      const { compile } = require('../src/commands/compile');
      await compile(opts);
      process.exit(0);
    } catch (err) {
      if (!opts.quiet) console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();

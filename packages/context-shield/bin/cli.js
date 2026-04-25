#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const { scan } = require('../src/core/scanner');
const { mask } = require('../src/core/masker');

program
  .name('context-shield')
  .version(pkg.version)
  .description('PII Detection and Masking CLI');

// Standard Global/Common Options
program
  .option('-i, --input <path>', 'Input file or directory path')
  .option('-o, --output <path>', 'Output file or directory path')
  .option('-f, --format <type>', 'Output format (json|md|html|pdf)', 'json')
  .option('-c, --config <path>', 'YAML configuration file')
  .option('-l, --language <lang>', 'Language (en|tr)', 'en')
  .option('--dry-run', 'Simulate without side effects', false)
  .option('-v, --verbose', 'Detailed log output', false)
  .option('-q, --quiet', 'Only error output', false);

// Scan Command
program
  .command('scan')
  .description('Scan input for PII and sensitive data')
  .option('-i, --input <path>', 'Input file or directory path (override)')
  .action((options) => {
    const opts = { ...program.opts(), ...options };
    
    if (!opts.input) {
      console.error('Error: --input is required for scan');
      process.exit(1);
    }

    if (!fs.existsSync(opts.input)) {
      console.error(`Error: Input file not found: ${opts.input}`);
      process.exit(1);
    }

    const content = fs.readFileSync(opts.input, 'utf8');

    if (opts.dryRun) {
      if (!opts.quiet) console.log(`[Dry Run] Scanning ${opts.input}...`);
      process.exit(0);
    }

    const results = scan(content);

    if (opts.format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else {
      if (!opts.quiet) {
        console.log(`Scan complete for ${opts.input}. Found ${results.entities.length} entities.`);
      }
    }
    
    process.exit(0);
  });

// Mask Command
program
  .command('mask')
  .description('Mask PII in the input file')
  .option('-i, --input <path>', 'Input file or directory path (override)')
  .option('-o, --output <path>', 'Output file or directory path (override)')
  .action((options) => {
    const opts = { ...program.opts(), ...options };

    if (!opts.input) {
      console.error('Error: --input is required for mask');
      process.exit(1);
    }

    if (!opts.output) {
      console.error('Error: --output is required for mask');
      process.exit(1);
    }

    if (!fs.existsSync(opts.input)) {
      console.error(`Error: Input file not found: ${opts.input}`);
      process.exit(1);
    }

    const content = fs.readFileSync(opts.input, 'utf8');

    if (opts.dryRun) {
      if (!opts.quiet) console.log(`[Dry Run] Masking ${opts.input} to ${opts.output}...`);
      process.exit(0);
    }

    const scanResults = scan(content);
    const maskedText = mask(content, scanResults.map);

    try {
      const outputDir = path.dirname(opts.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(opts.output, maskedText);
      if (!opts.quiet) {
        console.log(`Successfully masked ${opts.input} and saved to ${opts.output}`);
      }
      process.exit(0);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

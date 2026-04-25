#!/usr/bin/env node
/**
 * context-cert CLI entry point
 *
 * Usage:
 *   context-cert generate --input <path> --output <path>
 *   context-cert review --status draft
 *   context-cert eval --input new.json --baseline v1.json
 */
'use strict';

const { program } = require('commander');
const { version } = require('../package.json');

const generateCmd = require('../src/commands/generate');
const reviewCmd = require('../src/commands/review');
const evalCmd = require('../src/commands/eval');

program
  .name('context-cert')
  .description('Medical certification exam question generator')
  .version(version);

// ── generate ──────────────────────────────────────────────────────────────────
program
  .command('generate')
  .description('Generate quiz questions from a wiki page or raw text file')
  .requiredOption('-i, --input <path>', 'Input file or directory (.md, .txt)')
  .requiredOption('-o, --output <path>', 'Output JSON file')
  .option('-n, --count <number>', 'Number of questions to generate', '10')
  .option('-d, --difficulty <level>', 'Difficulty: easy | medium | hard', 'medium')
  .option('-f, --format <type>', 'Output format: json | md', 'json')
  .option('-l, --language <lang>', 'Language: en | tr', 'en')
  .option('--dry-run', 'Simulate without writing files')
  .option('-v, --verbose', 'Detailed log output')
  .option('-q, --quiet', 'Only error output')
  .action((opts) => generateCmd(opts));

// ── review ────────────────────────────────────────────────────────────────────
program
  .command('review')
  .description('List and filter existing draft question sets')
  .option('--status <status>', 'Filter by status: draft | approved | rejected', 'draft')
  .option('-f, --format <type>', 'Output format: json | md | table', 'table')
  .option('-v, --verbose', 'Detailed log output')
  .option('-q, --quiet', 'Only error output')
  .action((opts) => reviewCmd(opts));

// ── eval ──────────────────────────────────────────────────────────────────────
program
  .command('eval')
  .description('Ratchet evaluation — new quiz must match or exceed baseline quality')
  .requiredOption('-i, --input <path>', 'New quiz JSON to evaluate')
  .requiredOption('--baseline <path>', 'Baseline quiz JSON for comparison')
  .option('-v, --verbose', 'Detailed log output')
  .option('-q, --quiet', 'Only error output')
  .action((opts) => evalCmd(opts));

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});

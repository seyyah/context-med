#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const pkg = require('../package.json');
const { runPlan } = require('../src/commands/plan');
const { runDraft } = require('../src/commands/draft');
const { runModerate } = require('../src/commands/moderate');
const { runServe } = require('../src/commands/serve');

const program = new Command();

function addCommonOptions(command) {
  return command
    .requiredOption('-i, --input <path>', 'Input file path')
    .requiredOption('-o, --output <path>', 'Output file path')
    .option('-f, --format <type>', 'Output format: json', 'json')
    .option('-l, --language <lang>', 'Language: en or tr', 'en')
    .option('--dry-run', 'Simulate without writing output', false)
    .option('-v, --verbose', 'Print detailed logs', false)
    .option('-q, --quiet', 'Only print errors', false);
}

function handle(action) {
  return async (options) => {
    try {
      await action(options);
    } catch (error) {
      const exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
      if (!options.quiet) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(exitCode);
    }
  };
}

program
  .name('social-agent')
  .description('Plan, draft, moderate, and serve social-agent workflows.')
  .version(pkg.version);

addCommonOptions(
  program
    .command('plan')
    .description('Create a deterministic social calendar from source context.')
).action(handle(runPlan));

addCommonOptions(
  program
    .command('draft')
    .description('Create platform-specific social drafts from source context.')
).action(handle(runDraft));

addCommonOptions(
  program
    .command('moderate')
    .description('Classify social comments or text and produce a moderation report.')
).action(handle(runModerate));

program
  .command('serve')
  .description('Start the standalone social-agent demo UI server.')
  .option('-p, --port <number>', 'Port to listen on', '3000')
  .option('--host <host>', 'Host to bind', '127.0.0.1')
  .option('-q, --quiet', 'Only print errors', false)
  .action(handle(runServe));

program.parseAsync(process.argv);

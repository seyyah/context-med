import { Command } from 'commander';
import { runIngest } from '../commands/ingest';
import { runLint } from '../commands/lint';
import { runQuery } from '../commands/query';
import { runWriteback } from '../commands/writeback';
import { runAutoresearch } from '../commands/autoresearch';
import * as path from 'path';
const pkg = require(path.resolve(__dirname, '../../package.json'));

const program = new Command();

program
  .name('context-wiki')
  .description('CLI-first knowledge substrate for AI agents')
  .version(pkg.version);

program
  .command('ingest')
  .description('Ingest a raw document into the wiki')
  .requiredOption('-i, --input <path>', 'Input file path')
  .requiredOption('-o, --output <path>', 'Output wiki directory')
  .option('-f, --format <type>', 'Output format: md | json', 'md')
  .option('--dry-run', 'Simulate without writing files', false)
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runIngest({
      input: opts.input,
      output: opts.output,
      format: opts.format,
      dryRun: opts.dryRun,
      verbose: opts.verbose,
    });
  });

program
  .command('lint')
  .description('Validate wiki page structure and provenance')
  .requiredOption('-i, --input <path>', 'Wiki directory path')
  .option('-f, --format <type>', 'Output format: md | json', 'md')
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runLint({
      input: opts.input,
      format: opts.format,
      verbose: opts.verbose,
    });
  });

program
  .command('query')
  .description('Query the wiki for an answer')
  .requiredOption('-i, --input <path>', 'Wiki directory path')
  .requiredOption('-q, --query <text>', 'Query string')
  .option('-f, --format <type>', 'Output format: md | json', 'json')
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runQuery({
      input: opts.input,
      query: opts.query,
      format: opts.format,
      verbose: opts.verbose,
    });
  });

program
  .command('writeback')
  .description('Write a result or experiment back into the wiki')
  .requiredOption('-i, --input <path>', 'Input result file')
  .requiredOption('-o, --output <path>', 'Target wiki directory')
  .option('--reviewed', 'Mark page as human_reviewed: true', false)
  .option('--force', 'Create page if it does not exist', false)
  .option('--dry-run', 'Simulate without writing', false)
  .action((opts) => {
    runWriteback({
      input: opts.input,
      output: opts.output,
      reviewed: opts.reviewed,
      force: opts.force,
      dryRun: opts.dryRun,
    });
  });

program
  .command('autoresearch <subcommand>')
  .description('Autoresearch loop management')
  .action((subcommand) => {
    runAutoresearch(subcommand);
  });

program.parse(process.argv);

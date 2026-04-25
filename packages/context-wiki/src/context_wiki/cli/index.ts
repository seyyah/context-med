import { Command } from 'commander';
import { runIngest } from '../commands/ingest';
import { runLint } from '../commands/lint';
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

program.parse(process.argv);

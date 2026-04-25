import { Command } from 'commander';
import * as path from 'path';
// Resolve package.json relative to the compiled output location (dist/cli/ → package root)
const pkg = require(path.resolve(__dirname, '../../package.json'));

const program = new Command();

program
  .name('context-wiki')
  .description('CLI-first knowledge substrate for AI agents')
  .version(pkg.version);

program.parse(process.argv);

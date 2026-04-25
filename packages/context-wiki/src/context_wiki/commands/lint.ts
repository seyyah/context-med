// packages/context-wiki/src/context_wiki/commands/lint.ts
import { LintOptions } from '../types';
import { lintDirectory } from '../core/validator';

export function runLint(options: LintOptions): void {
  const result = lintDirectory(options.input);

  if (options.format === 'json') {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    if (result.valid) {
      process.stdout.write(`✓ All ${result.checked} wiki pages are valid.\n`);
    } else {
      process.stderr.write(`✗ ${result.errors.length} error(s) in ${result.checked} pages:\n`);
      for (const err of result.errors) {
        process.stderr.write(`  [${err.file}] ${err.field}: ${err.message}\n`);
      }
    }
  }

  if (!result.valid) process.exit(2);
}

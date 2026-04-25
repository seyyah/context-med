// packages/context-wiki/src/context_wiki/commands/autoresearch.ts
export function runAutoresearch(subcommand: string): void {
  if (subcommand === 'run') {
    process.stdout.write('Autoresearch loop: not yet implemented.\n');
    process.stdout.write('Future: periodic experiment → score → human-approved writeback.\n');
    process.exit(0);
  }
  process.stderr.write(`Unknown autoresearch subcommand: ${subcommand}\n`);
  process.exit(1);
}

// packages/context-wiki/src/context_wiki/commands/writeback.ts
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { WritebackOptions } from '../types';

export function runWriteback(options: WritebackOptions): void {
  if (!fs.existsSync(options.input)) {
    process.stderr.write(`Error: Input file not found: ${options.input}\n`);
    process.exit(1);
  }

  if (!fs.existsSync(options.output)) {
    process.stderr.write(`Error: Output wiki directory not found: ${options.output}\n`);
    process.exit(1);
  }

  const inputContent = fs.readFileSync(options.input, 'utf8');
  const slug = path.basename(options.input, path.extname(options.input));
  const targetPath = path.join(options.output, `${slug}.md`);

  if (!fs.existsSync(targetPath) && !options.force) {
    process.stderr.write(`Error: Target wiki page not found: ${targetPath}. Use --force to create.\n`);
    process.exit(1);
  }

  if (options.dryRun) {
    process.stdout.write(`[dry-run] Would write back to: ${targetPath}\n`);
    process.exit(0);
  }

  if (fs.existsSync(targetPath)) {
    const existing = fs.readFileSync(targetPath, 'utf8');
    const { data, content } = matter(existing);
    if (options.reviewed) data.human_reviewed = true;
    const appendSection = `\n\n## Writeback\n\n${inputContent}\n`;
    fs.writeFileSync(targetPath, matter.stringify(content + appendSection, data));
  } else {
    fs.writeFileSync(targetPath, inputContent);
  }

  process.stdout.write(`Written back to: ${targetPath}\n`);
}

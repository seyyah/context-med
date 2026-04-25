// packages/context-wiki/src/context_wiki/commands/ingest.ts
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { IngestOptions, WikiPageFrontmatter } from '../types';
import { buildFrontmatter, rawTextToWikiContent } from '../core/parser';

function titleFromFilename(filePath: string): string {
  return path.basename(filePath, path.extname(filePath))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function runIngest(options: IngestOptions): void {
  if (!fs.existsSync(options.input)) {
    process.stderr.write(`Error: Input file not found: ${options.input}\n`);
    process.exit(1);
  }

  const rawText = fs.readFileSync(options.input, 'utf8');
  const title = titleFromFilename(options.input);
  const frontmatter: WikiPageFrontmatter = buildFrontmatter(options.input, title);
  const content = rawTextToWikiContent(rawText);

  if (options.dryRun) {
    if (options.verbose) {
      process.stdout.write(`[dry-run] Would write wiki page: ${title}\n`);
      process.stdout.write(`[dry-run] Frontmatter: ${JSON.stringify(frontmatter, null, 2)}\n`);
    }
    process.exit(0);
  }

  fs.mkdirSync(options.output, { recursive: true });
  const slug = path.basename(options.input, path.extname(options.input));

  if (options.format === 'json') {
    const outPath = path.join(options.output, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ frontmatter, content }, null, 2));
    if (options.verbose) process.stdout.write(`Written: ${outPath}\n`);
  } else {
    const outPath = path.join(options.output, `${slug}.md`);
    const mdContent = matter.stringify(content, frontmatter as any);
    fs.writeFileSync(outPath, mdContent);
    if (options.verbose) process.stdout.write(`Written: ${outPath}\n`);
  }
}

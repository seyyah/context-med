// packages/context-wiki/src/context_wiki/commands/query.ts
import { QueryOptions } from '../types';
import { loadWikiPages, queryWiki } from '../core/retrieval';

export function runQuery(options: QueryOptions): void {
  const pages = loadWikiPages(options.input);

  if (pages.length === 0) {
    process.stderr.write(`Error: No wiki pages found in: ${options.input}\n`);
    process.exit(1);
  }

  const result = queryWiki(pages, options.query);

  if (result.confidence === 'none') {
    process.stderr.write(`I don't know. No relevant wiki page found for: "${options.query}"\n`);
    process.exit(2);
  }

  if (options.format === 'json') {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(`Query: ${result.query}\n`);
    process.stdout.write(`Source: ${result.source}\n`);
    process.stdout.write(`Confidence: ${result.confidence}\n\n`);
    process.stdout.write(`${result.answer}\n`);
  }
}

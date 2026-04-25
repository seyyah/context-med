// packages/context-wiki/src/context_wiki/core/retrieval.ts
import * as fs from 'fs';
import * as path from 'path';
import { WikiPage, QueryResult } from '../types';
import { parseWikiPage } from './parser';

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function score(tokens: string[], text: string): number {
  const pageTokens = tokenize(text);
  return tokens.reduce((acc, t) => acc + (pageTokens.includes(t) ? 1 : 0), 0);
}

export function loadWikiPages(dirPath: string): WikiPage[] {
  if (!fs.existsSync(dirPath)) return [];

  const files: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) files.push(full);
    }
  }
  walk(dirPath);

  return files.map(f => {
    try { return parseWikiPage(f); } catch { return null; }
  }).filter(Boolean) as WikiPage[];
}

export function queryWiki(pages: WikiPage[], queryText: string): QueryResult {
  const tokens = tokenize(queryText);

  const scored = pages.map(page => ({
    page,
    score: score(tokens, page.frontmatter.title + ' ' + page.content),
  })).sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (!best || best.score === 0) {
    return {
      query: queryText,
      answer: 'I don\'t know. No relevant wiki page found for this query.',
      source: '',
      source_hash: '',
      confidence: 'none',
    };
  }

  const excerpt = best.page.content.split('\n').filter(l => {
    const lt = l.toLowerCase();
    return tokens.some(t => lt.includes(t));
  }).slice(0, 5).join('\n');

  return {
    query: queryText,
    answer: excerpt || best.page.content.split('\n').slice(0, 5).join('\n'),
    source: best.page.frontmatter.source || path.basename(best.page.filePath),
    source_hash: best.page.frontmatter.source_hash || '',
    confidence: best.score >= 3 ? 'high' : 'low',
  };
}

// packages/context-wiki/src/context_wiki/core/parser.ts
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { WikiPage, WikiPageFrontmatter } from '../types';
import { hashFile } from './hasher';

export function parseWikiPage(filePath: string): WikiPage {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return {
    frontmatter: data as WikiPageFrontmatter,
    content,
    filePath,
  };
}

export function buildFrontmatter(
  inputPath: string,
  title: string,
  model = 'static'
): WikiPageFrontmatter {
  return {
    title,
    source: path.basename(inputPath),
    source_hash: hashFile(inputPath),
    generated_at: new Date().toISOString(),
    model,
    human_reviewed: false,
  };
}

export function rawTextToWikiContent(rawText: string): string {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);

  const sections: string[] = [];
  let currentSection: string[] = [];

  for (const line of lines) {
    if (line.startsWith('-') || line.match(/^\w.*:$/)) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
    }
    currentSection.push(line);
  }
  if (currentSection.length > 0) sections.push(currentSection.join('\n'));

  return sections.join('\n\n');
}

// packages/context-wiki/src/context_wiki/core/validator.ts
import * as fs from 'fs';
import * as path from 'path';
import { WikiPage, LintError, LintResult } from '../types';
import { parseWikiPage } from './parser';
import { hashFile } from './hasher';

const REQUIRED_FIELDS: (keyof import('../types').WikiPageFrontmatter)[] = [
  'title', 'source', 'source_hash', 'generated_at', 'model', 'human_reviewed',
];

export function lintPage(page: WikiPage, wikiDir: string): LintError[] {
  const errors: LintError[] = [];
  const file = path.basename(page.filePath);

  for (const field of REQUIRED_FIELDS) {
    if (page.frontmatter[field] === undefined || page.frontmatter[field] === null) {
      errors.push({ file, field, message: `Missing required field: ${field}` });
    }
  }

  if (page.frontmatter.source_hash) {
    const sourcePath = path.join(path.dirname(wikiDir), 'raw', page.frontmatter.source);
    if (fs.existsSync(sourcePath)) {
      const actualHash = hashFile(sourcePath);
      if (actualHash !== page.frontmatter.source_hash) {
        errors.push({
          file,
          field: 'source_hash',
          message: `Hash mismatch: expected ${page.frontmatter.source_hash}, got ${actualHash}`,
        });
      }
    }
  }

  if (!page.content || page.content.trim().length === 0) {
    errors.push({ file, field: 'content', message: 'Wiki page has no content' });
  }

  return errors;
}

export function lintDirectory(dirPath: string): LintResult {
  if (!fs.existsSync(dirPath)) {
    return { valid: false, errors: [{ file: dirPath, field: 'path', message: 'Directory not found' }], checked: 0 };
  }

  const mdFiles = fs.readdirSync(dirPath, { recursive: true } as any)
    .filter((f: any) => String(f).endsWith('.md'))
    .map((f: any) => path.join(dirPath, String(f)));

  const allErrors: LintError[] = [];

  for (const filePath of mdFiles) {
    try {
      const page = parseWikiPage(filePath);
      const errors = lintPage(page, dirPath);
      allErrors.push(...errors);
    } catch (e) {
      allErrors.push({ file: path.basename(filePath), field: 'parse', message: `Failed to parse: ${e}` });
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    checked: mdFiles.length,
  };
}

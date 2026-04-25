// packages/context-wiki/src/context_wiki/core/hasher.ts
import { createHash } from 'crypto';
import { readFileSync } from 'fs';

export function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export function hashString(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

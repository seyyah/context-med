# context-wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `context-wiki` CLI paketini sıfırdan inşa et — raw dökümanları yapılandırılmış micro-wiki sayfalarına dönüştüren, sorgulayan, doğrulayan ve writeback yapan agent memory substrate.

**Architecture:** TypeScript-first CLI (commander), üç katman: raw (değişmez) → micro-wiki (frontmatter'lı markdown/json) → autoresearch (otonom deney + writeback). Her komut ayrı dosyada, core logic CLI parsing'den ayrı. Guardrail: query cevabı wiki'ye ataç edilemiyorsa Exit 2.

**Tech Stack:** Node.js ≥18, TypeScript, commander ≥11, jest ≥29, crypto (built-in SHA-256), gray-matter (frontmatter parse), marked (md→html dönüşüm)

---

## File Map

```
packages/context-wiki/
├── package.json
├── tsconfig.json
├── bin/
│   └── cli.js                        ← compiled JS entry, shebang
├── src/
│   └── context_wiki/
│       ├── types/
│       │   └── index.ts              ← WikiPage, ProvenanceRecord, QueryResult, LintResult
│       ├── core/
│       │   ├── parser.ts             ← raw text → WikiPage struct
│       │   ├── hasher.ts             ← SHA-256 file hash
│       │   ├── retrieval.ts          ← keyword token overlap query
│       │   └── validator.ts          ← lint rules (frontmatter, source_hash)
│       ├── cli/
│       │   └── index.ts              ← commander root program
│       ├── commands/
│       │   ├── ingest.ts             ← raw doc → wiki page (md/json)
│       │   ├── query.ts              ← sorgu → kaynaklı cevap veya Exit 2
│       │   ├── lint.ts               ← wiki klasörü doğrulama
│       │   ├── writeback.ts          ← cevap/deney → wiki'ye geri yaz
│       │   └── autoresearch.ts       ← planlı deney döngüsü (stub)
│       └── utils/
└── tests/
    └── cli/
        └── smoke.test.js             ← mevcut, tüm P0/P1 testleri geçmeli
```

---

## Task 1: Proje İskeleti (package.json + tsconfig + bin/cli.js)

**Files:**
- Create: `packages/context-wiki/package.json`
- Create: `packages/context-wiki/tsconfig.json`
- Create: `packages/context-wiki/bin/cli.js`
- Create: `packages/context-wiki/src/context_wiki/cli/index.ts`

- [ ] **Step 1: package.json yaz**

```json
{
  "name": "@context-med/context-wiki",
  "version": "0.1.0",
  "description": "CLI-first knowledge substrate for AI agents",
  "bin": {
    "context-wiki": "./bin/cli.js"
  },
  "main": "./dist/cli/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/context_wiki/cli/index.ts",
    "test": "jest",
    "test:cli": "jest tests/cli"
  },
  "dependencies": {
    "commander": "^11.1.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: tsconfig.json yaz**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src/context_wiki",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/context_wiki/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: bin/cli.js yaz** (build sonrası dist'i çağıran shebang dosyası)

```javascript
#!/usr/bin/env node
require('../dist/cli/index.js');
```

- [ ] **Step 3b: bin/cli.js'e execute izni ver**

```bash
chmod +x packages/context-wiki/bin/cli.js
```

- [ ] **Step 4: src/context_wiki/cli/index.ts stub yaz** — sadece --help ve --version çalışsın

```typescript
import { Command } from 'commander';
const pkg = require('../../../package.json');

const program = new Command();

program
  .name('context-wiki')
  .description('CLI-first knowledge substrate for AI agents')
  .version(pkg.version);

program.parse(process.argv);
```

- [ ] **Step 5: Bağımlılıkları kur ve build al**

```bash
cd packages/context-wiki
npm install
npm run build
```

Beklenen: `dist/cli/index.js` oluşur, hata yok.

- [ ] **Step 6: Smoke testleri çalıştır — sadece P0 Smoke geçmeli**

```bash
npx jest tests/cli/smoke.test.js --testNamePattern="Smoke"
```

Beklenen: `--help exits 0` ve `--version exits 0` PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/context-wiki/package.json packages/context-wiki/tsconfig.json packages/context-wiki/bin/cli.js packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(context-wiki): project scaffold with CLI entry point"
```

---

## Task 2: Types

**Files:**
- Create: `packages/context-wiki/src/context_wiki/types/index.ts`

- [ ] **Step 1: Tüm domain type'larını yaz**

```typescript
// packages/context-wiki/src/context_wiki/types/index.ts

export interface WikiPageFrontmatter {
  title: string;
  source: string;
  source_hash: string;
  generated_at: string;
  model: string;
  human_reviewed: boolean;
}

export interface WikiPage {
  frontmatter: WikiPageFrontmatter;
  content: string;
  filePath: string;
}

export interface QueryResult {
  query: string;
  answer: string;
  source: string;
  source_hash: string;
  confidence: 'high' | 'low' | 'none';
}

export interface LintError {
  file: string;
  field: string;
  message: string;
}

export interface LintResult {
  valid: boolean;
  errors: LintError[];
  checked: number;
}

export interface IngestOptions {
  input: string;
  output: string;
  format: 'md' | 'json';
  dryRun: boolean;
  verbose: boolean;
}

export interface QueryOptions {
  input: string;
  query: string;
  format: 'md' | 'json';
  verbose: boolean;
}

export interface LintOptions {
  input: string;
  format: 'md' | 'json';
  verbose: boolean;
}

export interface WritebackOptions {
  input: string;
  output: string;
  reviewed: boolean;
  force: boolean;
  dryRun: boolean;
}
```

- [ ] **Step 2: Build alarak type hatası olmadığını doğrula**

```bash
cd packages/context-wiki && npm run build
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
git add packages/context-wiki/src/context_wiki/types/index.ts
git commit -m "feat(context-wiki): domain types — WikiPage, QueryResult, LintResult"
```

---

## Task 3: Core — hasher + parser

**Files:**
- Create: `packages/context-wiki/src/context_wiki/core/hasher.ts`
- Create: `packages/context-wiki/src/context_wiki/core/parser.ts`

- [ ] **Step 1: hasher.ts yaz**

```typescript
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
```

- [ ] **Step 2: parser.ts yaz** — raw text → WikiPage struct

```typescript
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
```

- [ ] **Step 3: Build al**

```bash
cd packages/context-wiki && npm run build
```

Beklenen: Hata yok.

- [ ] **Step 4: Commit**

```bash
git add packages/context-wiki/src/context_wiki/core/hasher.ts packages/context-wiki/src/context_wiki/core/parser.ts
git commit -m "feat(context-wiki): core hasher and raw-text parser"
```

---

## Task 4: Core — validator (lint kuralları)

**Files:**
- Create: `packages/context-wiki/src/context_wiki/core/validator.ts`

- [ ] **Step 1: validator.ts yaz**

```typescript
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
```

- [ ] **Step 2: Build al**

```bash
cd packages/context-wiki && npm run build
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
git add packages/context-wiki/src/context_wiki/core/validator.ts
git commit -m "feat(context-wiki): lint validator — frontmatter + hash checks"
```

---

## Task 5: Core — retrieval (query engine)

**Files:**
- Create: `packages/context-wiki/src/context_wiki/core/retrieval.ts`

- [ ] **Step 1: retrieval.ts yaz** — keyword tabanlı, token overlap scoring (v0)

```typescript
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
```

- [ ] **Step 2: Build al**

```bash
cd packages/context-wiki && npm run build
```

Beklenen: Hata yok.

- [ ] **Step 3: Commit**

```bash
git add packages/context-wiki/src/context_wiki/core/retrieval.ts
git commit -m "feat(context-wiki): keyword retrieval engine for wiki query"
```

---

## Task 6: Commands — ingest

**Files:**
- Create: `packages/context-wiki/src/context_wiki/commands/ingest.ts`

- [ ] **Step 1: ingest.ts yaz**

```typescript
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
```

- [ ] **Step 2: src/context_wiki/cli/index.ts'e ingest komutunu ekle**

```typescript
import { Command } from 'commander';
import { runIngest } from '../commands/ingest';
const pkg = require('../../../package.json');

const program = new Command();

program
  .name('context-wiki')
  .description('CLI-first knowledge substrate for AI agents')
  .version(pkg.version);

program
  .command('ingest')
  .description('Ingest a raw document into the wiki')
  .requiredOption('-i, --input <path>', 'Input file path')
  .requiredOption('-o, --output <path>', 'Output wiki directory')
  .option('-f, --format <type>', 'Output format: md | json', 'md')
  .option('--dry-run', 'Simulate without writing files', false)
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runIngest({
      input: opts.input,
      output: opts.output,
      format: opts.format,
      dryRun: opts.dryRun,
      verbose: opts.verbose,
    });
  });

program.parse(process.argv);
```

- [ ] **Step 3: Build al**

```bash
cd packages/context-wiki && npm run build
```

- [ ] **Step 4: Manuel smoke — ingest test**

```bash
node packages/context-wiki/bin/cli.js ingest \
  --input fixtures/raw/sample-paper.txt \
  --output /tmp/wiki-test/ \
  --format md \
  --verbose
```

Beklenen: `/tmp/wiki-test/sample-paper.md` oluşur, frontmatter içerir.

- [ ] **Step 5: Jest CLI testlerini çalıştır**

```bash
cd packages/context-wiki && npx jest tests/cli/smoke.test.js
```

Beklenen: `ingest without --input exits non-zero` ve `ingest --dry-run` testleri PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/context-wiki/src/context_wiki/commands/ingest.ts packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(context-wiki): ingest command — raw doc to wiki page"
```

---

## Task 7: Commands — lint

**Files:**
- Create: `packages/context-wiki/src/context_wiki/commands/lint.ts`
- Modify: `packages/context-wiki/src/context_wiki/cli/index.ts`

- [ ] **Step 1: lint.ts yaz**

```typescript
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
```

- [ ] **Step 2: cli/index.ts'e lint komutunu ekle**

`program.parse(process.argv)` satırından önce ekle:

```typescript
import { runLint } from '../commands/lint';

// ... mevcut ingest komutu ...

program
  .command('lint')
  .description('Validate wiki page structure and provenance')
  .requiredOption('-i, --input <path>', 'Wiki directory path')
  .option('-f, --format <type>', 'Output format: md | json', 'md')
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runLint({
      input: opts.input,
      format: opts.format,
      verbose: opts.verbose,
    });
  });
```

- [ ] **Step 3: Build + lint smoke**

```bash
cd packages/context-wiki && npm run build
node bin/cli.js lint --input ../../fixtures/wiki --format json
```

Beklenen: Exit 0 veya 2, JSON çıktı.

- [ ] **Step 4: Testleri çalıştır**

```bash
npx jest tests/cli/smoke.test.js --testNamePattern="lint"
```

Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-wiki/src/context_wiki/commands/lint.ts packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(context-wiki): lint command — wiki structure validation"
```

---

## Task 8: Commands — query

**Files:**
- Create: `packages/context-wiki/src/context_wiki/commands/query.ts`
- Modify: `packages/context-wiki/src/context_wiki/cli/index.ts`

- [ ] **Step 1: query.ts yaz**

```typescript
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
```

- [ ] **Step 2: cli/index.ts'e query komutunu ekle**

```typescript
import { runQuery } from '../commands/query';

program
  .command('query')
  .description('Query the wiki for an answer')
  .requiredOption('-i, --input <path>', 'Wiki directory path')
  .requiredOption('-q, --query <text>', 'Query string')
  .option('-f, --format <type>', 'Output format: md | json', 'json')
  .option('-v, --verbose', 'Verbose output', false)
  .action((opts) => {
    runQuery({
      input: opts.input,
      query: opts.query,
      format: opts.format,
      verbose: opts.verbose,
    });
  });
```

- [ ] **Step 3: Build + manuel query testi**

```bash
cd packages/context-wiki && npm run build
node bin/cli.js query \
  --input ../../fixtures/wiki \
  --query "atrial fibrillation anticoagulation" \
  --format json
```

Beklenen: JSON çıktı, `source` dolu, `confidence: high`.

- [ ] **Step 4: Testleri çalıştır**

```bash
npx jest tests/cli/smoke.test.js --testNamePattern="query"
```

Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-wiki/src/context_wiki/commands/query.ts packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(context-wiki): query command — wiki retrieval with Exit 2 guardrail"
```

---

## Task 9: Commands — writeback + autoresearch stub

**Files:**
- Create: `packages/context-wiki/src/context_wiki/commands/writeback.ts`
- Create: `packages/context-wiki/src/context_wiki/commands/autoresearch.ts`
- Modify: `packages/context-wiki/src/context_wiki/cli/index.ts`

- [ ] **Step 1: writeback.ts yaz**

```typescript
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
```

- [ ] **Step 2: autoresearch.ts stub yaz**

```typescript
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
```

- [ ] **Step 3: cli/index.ts'e writeback + autoresearch ekle**

```typescript
import { runWriteback } from '../commands/writeback';
import { runAutoresearch } from '../commands/autoresearch';

program
  .command('writeback')
  .description('Write a result or experiment back into the wiki')
  .requiredOption('-i, --input <path>', 'Input result file')
  .requiredOption('-o, --output <path>', 'Target wiki directory')
  .option('--reviewed', 'Mark page as human_reviewed: true', false)
  .option('--force', 'Create page if it does not exist', false)
  .option('--dry-run', 'Simulate without writing', false)
  .action((opts) => {
    runWriteback({
      input: opts.input,
      output: opts.output,
      reviewed: opts.reviewed,
      force: opts.force,
      dryRun: opts.dryRun,
    });
  });

program
  .command('autoresearch <subcommand>')
  .description('Autoresearch loop management')
  .action((subcommand) => {
    runAutoresearch(subcommand);
  });
```

- [ ] **Step 4: Build + tüm testleri çalıştır**

```bash
cd packages/context-wiki && npm run build
npx jest tests/cli/smoke.test.js
```

Beklenen: Tüm P0 ve P1 testleri PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-wiki/src/context_wiki/commands/writeback.ts packages/context-wiki/src/context_wiki/commands/autoresearch.ts packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(context-wiki): writeback and autoresearch stub commands"
```

---

## Task 10: Final — Tüm testler + temizlik

- [ ] **Step 1: Tüm test suite'i çalıştır**

```bash
cd packages/context-wiki && npx jest tests/cli/smoke.test.js --verbose
```

Beklenen çıktı:
```
PASS tests/cli/smoke.test.js
  context-wiki CLI
    P0 — Smoke
      ✓ --help exits 0 and prints usage
      ✓ --version exits 0
    P0 — Error Handling
      ✓ ingest without --input exits non-zero
      ✓ ingest with nonexistent input exits non-zero
    P1 — Dry Run
      ✓ ingest --dry-run exits 0, no output
    P1 — Happy Path
      ✓ ingest creates wiki page
      ✓ lint validates wiki structure
      ✓ query returns results
```

- [ ] **Step 2: `context-wiki --help` çıktısını doğrula** — tüm komutlar listelenmeli

```bash
node packages/context-wiki/bin/cli.js --help
```

Beklenen: `ingest`, `query`, `lint`, `writeback`, `autoresearch` görünür.

- [ ] **Step 3: Final commit**

```bash
git add packages/context-wiki/
git commit -m "feat(context-wiki): complete CLI — ingest, query, lint, writeback, autoresearch"
```

---

### Task 11: Autoresearch loop v1 — experiment spec, scoring, logs, status

> Full implementation detail: `docs/superpowers/plans/2026-04-25-autoresearch-loop.md`

**Files:**
- Modify: `packages/context-wiki/src/context_wiki/types/index.ts`
- Create: `packages/context-wiki/src/context_wiki/core/experiment.ts`
- Modify: `packages/context-wiki/src/context_wiki/commands/autoresearch.ts`
- Modify: `packages/context-wiki/src/context_wiki/cli/index.ts`
- Create: `packages/context-wiki/tests/cli/autoresearch.test.js`
- Create: `fixtures/experiments/sample-experiment.json`

- [ ] **Step 1: Add types** — `ExperimentSpec`, `ExperimentResult`, `AutoresearchOptions` → `types/index.ts`
- [ ] **Step 2: Build** — `npm run build`, exit 0
- [ ] **Step 3: Commit** — `feat(autoresearch): add ExperimentSpec and ExperimentResult types`
- [ ] **Step 4: Create fixture** — `fixtures/experiments/sample-experiment.json`
- [ ] **Step 5: Create `core/experiment.ts`** — `loadSpec`, `scoreResult`, `runExperiment`, `logExperiment`
- [ ] **Step 6: Wire commands** — replace stub in `commands/autoresearch.ts`, update `cli/index.ts` with `run` + `status` subcommands
- [ ] **Step 7: Build + full test suite** — `npm test`, all tests PASS
- [ ] **Step 8: Commit** — `feat(autoresearch): autoresearch loop v1 — run, status, experiment scoring`

**Behaviour contract:**
- `autoresearch run` — wiki boşsa `queryWiki` confidence `none` döner, score `0/N` loglanır, exit `1` (not passed). Kabul edilebilir durum.
- `autoresearch status` — wiki dizini yoksa exit `1` + stderr "not found"; var ama experiments yoksa exit `0` + "No experiments found".

---

## Özet — Mevcut Durum vs Hedef

| Bileşen | Şu An | Hedef |
|---|---|---|
| `package.json` | Yok | ✅ Task 1 |
| `bin/cli.js` | Yok | ✅ Task 1 |
| Types | Yok | ✅ Task 2 |
| hasher + parser | Yok | ✅ Task 3 |
| validator (lint core) | Yok | ✅ Task 4 |
| retrieval (query core) | Yok | ✅ Task 5 |
| `ingest` komutu | Yok | ✅ Task 6 |
| `lint` komutu | Yok | ✅ Task 7 |
| `query` komutu | Yok | ✅ Task 8 |
| `writeback` komutu | Yok | ✅ Task 9 |
| `autoresearch` stub | Yok | ✅ Task 9 |
| Smoke testler PASS | ❌ | ✅ Task 10 |
| Autoresearch loop v1 | Stub | ✅ Task 11 |

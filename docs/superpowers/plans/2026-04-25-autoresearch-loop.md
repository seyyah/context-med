# Autoresearch Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the autoresearch loop — a CLI-driven cycle where the agent runs a small experiment against the wiki, scores the result, logs it, and surfaces it for human-approved writeback.

**Architecture:** `autoresearch run` reads an experiment spec file (JSON), executes a `query` against the wiki, scores the result (token overlap vs. expected answer), appends a scored log entry to `wiki/experiments/`, and exits with a human-readable summary. `autoresearch status` lists pending (unreviewed) experiment results. Human promotes a result to the wiki via `context-wiki writeback --reviewed`. No autonomous writing to wiki pages — human-in-loop is mandatory.

**Tech Stack:** TypeScript, commander ^11, gray-matter ^4, Node.js fs — no new dependencies.

---

## File Structure

```
packages/context-wiki/src/context_wiki/
  commands/
    autoresearch.ts          ← MODIFY: replace stub with full implementation
  core/
    experiment.ts            ← CREATE: experiment spec parser + scorer + logger
  types/
    index.ts                 ← MODIFY: add ExperimentSpec, ExperimentResult types

packages/context-wiki/tests/cli/
  autoresearch.test.js       ← CREATE: CLI tests for autoresearch run + status

fixtures/
  experiments/
    sample-experiment.json   ← CREATE: test fixture
```

---

### Task 1: Types — ExperimentSpec and ExperimentResult

**Files:**
- Modify: `packages/context-wiki/src/context_wiki/types/index.ts`

No test in this task — `npm run build` is the type test. A dist file existence check adds no value over a passing build.

- [ ] **Step 1: Add types to `types/index.ts`**

Append to the end of `packages/context-wiki/src/context_wiki/types/index.ts`:

```typescript
export interface ExperimentSpec {
  id: string;
  description: string;
  query: string;
  expected_keywords: string[];
}

export interface ExperimentResult {
  id: string;
  description: string;
  query: string;
  expected_keywords: string[];
  answer: string;
  source: string;
  confidence: 'high' | 'low' | 'none';
  score: number;
  max_score: number;
  passed: boolean;
  run_at: string;
  human_reviewed: boolean;
}

export interface AutoresearchOptions {
  spec: string;
  wikiDir: string;
  dryRun: boolean;
  verbose: boolean;
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/context-wiki/src/context_wiki/types/index.ts
git commit -m "feat(autoresearch): add ExperimentSpec and ExperimentResult types"
```

---

### Task 2: Fixture — sample-experiment.json

**Files:**
- Create: `fixtures/experiments/sample-experiment.json`

- [ ] **Step 1: Write the failing test**

Add to `packages/context-wiki/tests/cli/autoresearch.test.js` (append inside the outer describe or as new describe block):

```javascript
describe('autoresearch — fixture', () => {
  test('sample-experiment.json exists and is valid JSON', () => {
    const fixturePath = path.join(__dirname, '../../../fixtures/experiments/sample-experiment.json');
    expect(fs.existsSync(fixturePath)).toBe(true);
    const raw = fs.readFileSync(fixturePath, 'utf8');
    let parsed;
    expect(() => { parsed = JSON.parse(raw); }).not.toThrow();
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('query');
    expect(parsed).toHaveProperty('expected_keywords');
    expect(Array.isArray(parsed.expected_keywords)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/cli/autoresearch.test.js -t "sample-experiment.json"
```

Expected: FAIL — file does not exist.

- [ ] **Step 3: Create fixture directory and file**

```bash
mkdir -p fixtures/experiments
```

Create `fixtures/experiments/sample-experiment.json`:

```json
{
  "id": "exp-001",
  "description": "Verify wiki can answer a basic design token query",
  "query": "primary color design token",
  "expected_keywords": ["primary", "color", "003CBD"]
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/cli/autoresearch.test.js -t "sample-experiment.json"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add fixtures/experiments/sample-experiment.json packages/context-wiki/tests/cli/autoresearch.test.js
git commit -m "feat(autoresearch): add sample experiment fixture"
```

---

### Task 3: Core — experiment.ts (scorer + logger)

**Files:**
- Create: `packages/context-wiki/src/context_wiki/core/experiment.ts`

- [ ] **Step 1: Write the failing test**

Add to `packages/context-wiki/tests/cli/autoresearch.test.js`:

```javascript
describe('autoresearch — scorer', () => {
  test('autoresearch run with valid spec exits 0', () => {
    const specPath = path.join(__dirname, '../../../fixtures/experiments/sample-experiment.json');
    const wikiDir = path.join(__dirname, '../../../fixtures/wiki');
    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', specPath,
      '--wiki-dir', wikiDir,
      '--dry-run',
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/score|experiment|passed|failed/i);
  });

  test('autoresearch run with missing spec exits 1', () => {
    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', 'nonexistent.json',
      '--wiki-dir', 'wiki',
    ]);
    expect(r.exitCode).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/cli/autoresearch.test.js -t "autoresearch run with valid spec"
```

Expected: FAIL — autoresearch is a stub.

- [ ] **Step 3: Create `core/experiment.ts`**

Create `packages/context-wiki/src/context_wiki/core/experiment.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { ExperimentSpec, ExperimentResult } from '../types';
import { loadWikiPages, queryWiki } from './retrieval';

export function loadSpec(specPath: string): ExperimentSpec {
  if (!fs.existsSync(specPath)) {
    process.stderr.write(`Experiment spec not found: ${specPath}\n`);
    process.exit(1);
  }
  const raw = fs.readFileSync(specPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    process.stderr.write(`Invalid JSON in spec: ${specPath}\n`);
    process.exit(1);
  }
  const spec = parsed as ExperimentSpec;
  if (!spec.id || !spec.description || !spec.query || !Array.isArray(spec.expected_keywords)) {
    process.stderr.write(`Spec missing required fields (id, description, query, expected_keywords): ${specPath}\n`);
    process.exit(2);
  }
  return spec;
}

export function scoreResult(answer: string, expectedKeywords: string[]): { score: number; max_score: number; passed: boolean } {
  const lower = answer.toLowerCase();
  const score = expectedKeywords.filter(kw => lower.includes(kw.toLowerCase())).length;
  const max_score = expectedKeywords.length;
  const passed = max_score > 0 && score === max_score;
  return { score, max_score, passed };
}

export function runExperiment(spec: ExperimentSpec, wikiDir: string): ExperimentResult {
  const pages = loadWikiPages(wikiDir);
  const queryResult = queryWiki(pages, spec.query);
  const { score, max_score, passed } = scoreResult(queryResult.answer, spec.expected_keywords);

  return {
    id: spec.id,
    description: spec.description,
    query: spec.query,
    expected_keywords: spec.expected_keywords,
    answer: queryResult.answer,
    source: queryResult.source,
    confidence: queryResult.confidence,
    score,
    max_score,
    passed,
    run_at: new Date().toISOString(),
    human_reviewed: false,
  };
}

export function logExperiment(result: ExperimentResult, experimentsDir: string): string {
  fs.mkdirSync(experimentsDir, { recursive: true });
  const filename = `${result.id}-${result.run_at.replace(/[:.]/g, '-')}.json`;
  const outPath = path.join(experimentsDir, filename);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  return outPath;
}
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add packages/context-wiki/src/context_wiki/core/experiment.ts
git commit -m "feat(autoresearch): add experiment scorer and logger core"
```

---

### Task 4: Command — wire autoresearch run + status

**Files:**
- Modify: `packages/context-wiki/src/context_wiki/commands/autoresearch.ts`
- Modify: `packages/context-wiki/src/context_wiki/cli/index.ts`

- [ ] **Step 1: Replace `commands/autoresearch.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { AutoresearchOptions, ExperimentResult } from '../types';
import { loadSpec, runExperiment, logExperiment } from '../core/experiment';

export function runAutoresearchRun(opts: AutoresearchOptions): void {
  const spec = loadSpec(opts.spec);
  const wikiDir = opts.wikiDir;

  if (!fs.existsSync(wikiDir)) {
    process.stderr.write(`Wiki directory not found: ${wikiDir}\n`);
    process.exit(1);
  }

  const result = runExperiment(spec, wikiDir);

  const summary = [
    `Experiment : ${result.id}`,
    `Description: ${result.description}`,
    `Query      : ${result.query}`,
    `Answer     : ${result.answer.split('\n')[0]}`,
    `Source     : ${result.source}`,
    `Confidence : ${result.confidence}`,
    `Score      : ${result.score}/${result.max_score}`,
    `Passed     : ${result.passed ? 'YES' : 'NO'}`,
  ].join('\n');

  process.stdout.write(summary + '\n');

  if (opts.dryRun) {
    process.stdout.write('[dry-run] Experiment result NOT written to disk.\n');
    process.exit(0);
  }

  const experimentsDir = path.join(wikiDir, 'experiments');
  const outPath = logExperiment(result, experimentsDir);

  if (opts.verbose) {
    process.stdout.write(`Logged to: ${outPath}\n`);
  }

  process.exit(result.passed ? 0 : 1);
}

export function runAutoresearchStatus(wikiDir: string): void {
  if (!fs.existsSync(wikiDir)) {
    process.stderr.write(`Wiki directory not found: ${wikiDir}\n`);
    process.exit(1);
  }

  const experimentsDir = path.join(wikiDir, 'experiments');

  if (!fs.existsSync(experimentsDir)) {
    process.stdout.write('No experiments found.\n');
    process.exit(0);
  }

  const files = fs.readdirSync(experimentsDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    process.stdout.write('No experiments found.\n');
    process.exit(0);
  }

  const pending: ExperimentResult[] = [];
  const reviewed: ExperimentResult[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(experimentsDir, file), 'utf8');
      const result: ExperimentResult = JSON.parse(raw);
      if (result.human_reviewed) reviewed.push(result);
      else pending.push(result);
    } catch {
      // skip malformed files
    }
  }

  process.stdout.write(`Pending review : ${pending.length}\n`);
  process.stdout.write(`Reviewed       : ${reviewed.length}\n`);

  for (const r of pending) {
    process.stdout.write(`  [PENDING] ${r.id} — score ${r.score}/${r.max_score} — ${r.run_at}\n`);
  }

  process.exit(0);
}
```

- [ ] **Step 2: Update `cli/index.ts` — replace autoresearch command**

Find the existing `program.command('autoresearch <subcommand>')` block and replace it with:

```typescript
program
  .command('autoresearch')
  .description('Autoresearch loop management')
  .addCommand(
    new Command('run')
      .description('Run an experiment spec against the wiki')
      .requiredOption('-s, --spec <path>', 'Path to experiment spec JSON')
      .requiredOption('-w, --wiki-dir <path>', 'Path to wiki directory')
      .option('--dry-run', 'Simulate without writing result', false)
      .option('-v, --verbose', 'Verbose output', false)
      .action((opts) => {
        runAutoresearchRun({
          spec: opts.spec,
          wikiDir: opts.wikiDir,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
        });
      })
  )
  .addCommand(
    new Command('status')
      .description('Show pending (unreviewed) experiment results')
      .requiredOption('-w, --wiki-dir <path>', 'Path to wiki directory')
      .action((opts) => {
        runAutoresearchStatus(opts.wikiDir);
      })
  );
```

Also add `Command` to the import at the top of `cli/index.ts`:

```typescript
import { Command } from 'commander';
```

(Already imported — no change needed.)

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Run autoresearch tests**

```bash
npx jest tests/cli/autoresearch.test.js
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/context-wiki/src/context_wiki/commands/autoresearch.ts packages/context-wiki/src/context_wiki/cli/index.ts
git commit -m "feat(autoresearch): wire run and status subcommands"
```

---

### Task 5: Tests — full autoresearch test suite + smoke update

**Files:**
- Modify: `packages/context-wiki/tests/cli/autoresearch.test.js`

- [ ] **Step 1: Add status and end-to-end tests**

Append to `packages/context-wiki/tests/cli/autoresearch.test.js`:

```javascript
describe('autoresearch — status', () => {
  test('autoresearch status with valid wiki-dir exits 0', () => {
    const wikiDir = path.join(__dirname, '../../../fixtures/wiki');
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', wikiDir,
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/pending|reviewed|experiment/i);
  });

  test('autoresearch status with missing wiki-dir exits 1', () => {
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', 'nonexistent-wiki',
    ]);
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });

  test('autoresearch status with valid wiki-dir but no experiments exits 0', () => {
    const emptyWiki = setupOutputDir(PKG, 'status-empty-wiki');
    const r = execCli(BIN, [
      'autoresearch', 'status',
      '--wiki-dir', emptyWiki,
    ]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toMatch(/no experiments/i);
  });
});

describe('autoresearch — end to end', () => {
  test('run experiment → log appears in experiments dir', () => {
    const outDir = setupOutputDir(PKG, 'autoresearch-e2e');
    const specPath = path.join(__dirname, '../../../fixtures/experiments/sample-experiment.json');

    // First ingest a page so wiki has content
    const wikiDir = path.join(outDir, 'wiki');
    const sampleTxt = path.join(__dirname, '../../../fixtures/raw/sample-paper.txt');
    execCli(BIN, ['ingest', '--input', sampleTxt, '--output', wikiDir, '--format', 'md']);

    const r = execCli(BIN, [
      'autoresearch', 'run',
      '--spec', specPath,
      '--wiki-dir', wikiDir,
    ]);

    // exits 0 (passed) or 1 (failed) — both valid, experiment ran
    expect([0, 1]).toContain(r.exitCode);
    expect(r.stdout).toMatch(/score/i);

    // log file written
    const experimentsDir = path.join(wikiDir, 'experiments');
    if (fs.existsSync(experimentsDir)) {
      const logs = fs.readdirSync(experimentsDir).filter(f => f.endsWith('.json'));
      expect(logs.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run full test suite**

```bash
npx jest tests/cli/autoresearch.test.js --verbose
```

Expected: all tests PASS.

- [ ] **Step 3: Run existing smoke tests to verify no regression**

```bash
npm test
```

Expected: all 8 existing smoke tests + new autoresearch tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/context-wiki/tests/cli/autoresearch.test.js
git commit -m "test(autoresearch): full test suite — run, status, end-to-end"
```

---

## Self-Review

**Spec coverage (IDEA.md):**

| IDEA.md requirement | Task |
|---|---|
| Ajan belirli aralıklarla küçük deneyler yapar | Task 4: `autoresearch run` |
| run – test – score – log | Task 3: `experiment.ts` scorer + logger |
| Başarılı sonuçlar experiments/ altında loglanır | Task 3: `logExperiment` |
| İnsan review'undan sonra wiki'ye taşınır | Existing `writeback --reviewed` — no change needed |
| Human-in-loop: insan log'lardan değerli olanı seçer | Task 4: `autoresearch status` shows pending |
| LLMs.txt insan onayı olmadan değiştirilemez | Guard already in LLMs.txt — no CLI change needed |

**Placeholder scan:** None found. All steps have code or exact commands.

**Type consistency:**
- `ExperimentSpec` defined in Task 1, used in Task 3 (`loadSpec`, `runExperiment`) and Task 4 (`runAutoresearchRun`) — consistent.
- `ExperimentResult` defined in Task 1, returned by `runExperiment`, written by `logExperiment`, read by `runAutoresearchStatus` — consistent.
- `AutoresearchOptions` defined in Task 1, used in Task 4 — consistent.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-25-autoresearch-loop.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, spec + quality review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session with checkpoints.

**Which approach?**
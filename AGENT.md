# AGENT.md

## Rol
Bu repo, akademik yayın pipeline'ı üretir. Her değişiklik net kapsamlı, bağımsız ve test edilebilir olmalıdır.

## Geliştirme Kuralları
- Bir phase'i tamamlamadan sonrakine geçme (bkz. `PLAN.md`).
- Her pakette değişiklik yaparken yalnızca o paketin kapsamında kal; cross-cutting değişiklikleri ayrı commit'e al.
- `packages/context-*/IDEA.md` dosyası o modülün kanonik tasarım belgesidir — davranış buradan türetilir.
- Halüsinasyon bariyeri kırılmazdır: üretilen her sayısal değer kaynak belgede verbatim bulunmalıdır.

## Versiyonlama ve Etiketleme
Her tamamlanan iterasyon sonunda şu adımları çalıştır:

```bash
# 1. Semver tag (MAJOR.MINOR.PATCH — kırıcı değişiklik / yeni özellik / düzeltme)
gh release create vX.Y.Z --title "vX.Y.Z — <tek satır özet>" --notes "$(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md | head -n -1)"

# 2. CHANGELOG.md başına yeni giriş ekle (bkz. Keep a Changelog formatı)
```

## CHANGELOG Formatı
`CHANGELOG.md` dosyasını [Keep a Changelog](https://keepachangelog.com) standardında tut:
- `### Added` / `### Changed` / `### Fixed` / `### Removed` başlıklarını kullan.
- Her release girişi `## [X.Y.Z] — YYYY-MM-DD` satırıyla açılır.
- Unreleased değişiklikler `## [Unreleased]` altında birikir; release anında versiyona taşınır.

---

## CLI Development & Testing Guide

> **This section is the canonical reference for all developers** building CLI
> commands in any `context-med` package. Every package **must** have a working
> CLI with tests before it can be considered complete.

### 1. Infrastructure

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| npm | ≥ 9 | Package manager |
| commander | ≥ 11 | CLI framework (argument parsing) |
| jest | ≥ 29 | Test framework |

Each package must have:

```
packages/<name>/
├── package.json          # "bin" field maps CLI name → entry point
├── bin/
│   └── cli.js            # #!/usr/bin/env node — CLI entry point
├── src/
│   ├── commands/          # One file per verb (generate.js, batch.js, etc.)
│   └── index.js           # Shared logic
├── tests/
│   ├── cli/               # CLI integration tests
│   │   ├── generate.test.js
│   │   ├── batch.test.js
│   │   └── helpers.js     # Shared test utilities
│   └── unit/              # Unit tests for modules
└── IDEA.md
```

### 2. CLI Naming Convention

**Rule: CLI name = package directory name.** No aliases, no abbreviations.

| Package Directory | CLI Command | ✅/❌ |
|-------------------|-------------|-------|
| `context-va` | `context-va generate` | ✅ |
| `context-gate` | `context-gate ingest` | ✅ |
| `context-gate` | `curator ingest` | ❌ (old alias, do not use) |
| `context-slides` | `context-slides generate` | ✅ |
| `context-slides` | `deckforge generate` | ❌ (old alias, do not use) |

### 3. Standard Verb Taxonomy

Use these verbs consistently across all packages:

| Verb | Purpose | Required Flags | Example |
|------|---------|----------------|---------|
| `generate` | Create single output from input | `--input`, `--output` | `context-va generate --input af.md --output va.json` |
| `batch` | Process multiple inputs from directory | `--input`, `--output` | `context-narrate batch --input wiki/ --output audio/` |
| `eval` | Run ratchet evaluation | `--input`, `--baseline` | `context-va eval --input new.json --baseline v1.json` |
| `compile` | Compile sources into structured data | `--input`, `--output` | `context-wiki compile --input raw/ --output wiki/` |
| `ingest` | Ingest external source into raw/ | `--input`, `--output` | `context-gate ingest --input paper.pdf --output raw/` |
| `convert` | Transform between formats | `--input`, `--output`, `--format` | `context-slides convert --input deck.json --output deck.pptx --format pptx` |
| `compare` | Compare two or more outputs | `--input`, `--baseline` | `context-slides compare --input v2.json --baseline v1.json` |
| `lint` | Validate content or configuration | `--input` | `context-wiki lint --input wiki/` |
| `serve` | Start local dev/preview server | `--port` | `context-ui serve --port 3000` |
| `status` | Show process/job status | | `context-hoop status` |

### 4. Standard Flags (Mandatory for ALL Packages)

```
--input,    -i  <path>    Input file or directory (required for most verbs)
--output,   -o  <path>    Output file or directory (required for most verbs)
--config,   -c  <path>    YAML configuration file
--format,   -f  <type>    Output format: json | md | html | pdf (default: json)
--language, -l  <lang>    Language: en | tr (default: en)
--dry-run                 Simulate without writing files
--verbose,  -v            Detailed log output
--quiet,    -q            Only error output
--help,     -h            Show help text (auto-generated)
--version,  -V            Show semantic version (auto-generated)
```

### 5. Exit Code Standard

| Code | Meaning | When |
|------|---------|------|
| `0` | Success | Normal completion |
| `1` | General error | Missing file, invalid argument, bad config |
| `2` | Validation error | Schema mismatch, hallucination detected, source_quote missing |
| `3` | External dependency error | API timeout, model unavailable, network failure |

### 6. Shared Fixtures

All packages use the **shared `fixtures/` directory** at the monorepo root for
test data. **Never commit real patient data.**

```
fixtures/
├── wiki/                    # Sample micro-wiki pages
│   ├── cardiovascular/
│   ├── oncology/
│   └── emergency/
├── raw/                     # Sample raw source documents
├── config/                  # Sample YAML configurations
├── json/                    # Sample structured outputs
├── scenarios/               # Sample simulation scenarios
└── shield/                  # PII masking test data
```

Reference in tests:

```javascript
const FIXTURES = path.resolve(__dirname, '../../../../fixtures');
const wikiInput = path.join(FIXTURES, 'wiki/cardiovascular/atrial-fibrillation.md');
```

### 7. CLI Test Writing Instructions

#### Framework & Conventions

```bash
# Run tests for a single package
cd packages/<name>
npm test

# Run only CLI tests
npm run test:cli
```

#### Test Categories (by priority)

| # | Category | What to Test | Priority |
|---|----------|-------------|----------|
| 1 | **Smoke** | `--help` displays usage, `--version` shows semver | P0 |
| 2 | **Happy Path** | Valid input → correct output file with valid schema | P0 |
| 3 | **Error Path** | Missing `--input`, nonexistent file, corrupt config | P0 |
| 4 | **Edge Case** | Empty file input, Unicode content, very large file | P1 |
| 5 | **Dry Run** | `--dry-run` does NOT write files | P1 |
| 6 | **source_quote** | All numerical results have non-empty `source_quote` | P1 |
| 7 | **Ratchet** | New output ≥ baseline quality (no regression) | P2 |
| 8 | **Integration** | Full pipeline: ingest → compile → generate → eval | P2 |

#### Test File Naming

```
tests/cli/
├── generate.test.js          # generate verb — all scenarios
├── batch.test.js             # batch verb — all scenarios
├── eval.test.js              # eval verb — ratchet scenarios
└── helpers.js                # runCLI(), FIXTURES path, temp dir helpers
```

#### Minimal Test Example (copy & adapt)

Use the shared test utility located at `tests/helpers/cli-test-utils.js` from the repository root:

```javascript
// tests/cli/smoke.test.js
const path = require('path');
const { execCli, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists } = require('../../../tests/helpers/cli-test-utils');

const PKG = '<package-name>';
const BIN = path.resolve(__dirname, '../../bin/cli.js');


  afterAll(() => teardownOutputDir(PKG));

  // P0 — Smoke
  test('--help displays usage information', () => {
    const { stdout, exitCode } = execCli(BIN, ['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
  });

  test('--version displays semver', () => {
    const { stdout, exitCode } = execCli(BIN, ['--version']);
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  // P0 — Happy Path
  test('produces valid JSON from wiki input', () => {
    const outDir = setupOutputDir(PKG, 'happy-path');
    const out = path.join(outDir, 'result.json');
    const { exitCode } = execCli(BIN, [
      'generate',
      '--input', path.join(FIXTURES, 'wiki/cardiovascular/atrial-fibrillation.md'),
      '--output', out
    ]);
    expect(exitCode).toBe(0);
    expectFileExists(out);
  });

  // P0 — Error: missing input
  test('exits 1 when --input is missing', () => {
    const { exitCode, stderr } = execCli(BIN, ['generate', '--output', '/tmp/out.json']);
    expect(exitCode).not.toBe(0);
    expect(stderr).toMatch(/input/i);
  });

  // P0 — Error: nonexistent file
  test('exits 1 when input file does not exist', () => {
    const { exitCode, stderr } = execCli(BIN, [
      'generate', 
      '--input', '/no/such/file.md', 
      '--output', '/tmp/out.json'
    ]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toMatch(/found|enoent/i);
  });

  // P1 — Dry Run
  test('--dry-run does not write output file', () => {
    const outDir = setupOutputDir(PKG, 'dry-run');
    const out = path.join(outDir, 'result.json');
    const { exitCode } = execCli(BIN, [
      'generate',
      '--input', path.join(FIXTURES, 'wiki/cardiovascular/atrial-fibrillation.md'),
      '--output', out,
      '--dry-run'
    ]);
    expect(exitCode).toBe(0);
    expect(require('fs').existsSync(out)).toBe(false);
  });
});
```

### 8. Developer Workflow

```
1. Read IDEA.md → understand your package's purpose and CLI commands
2. Initialize Node.js project:
   npm init -y
   npm install --save commander
   npm install --save-dev jest
3. Create bin/cli.js with #!/usr/bin/env node shebang
4. Register commands matching IDEA.md scenarios
5. Write tests in tests/cli/ using shared fixtures
6. Run: npm test
7. Verify: all P0 tests pass before PR
```

### 9. Invariants (MUST NOT be violated)

1. **"Extract, Never Generate"** — Every data point in output must trace back to a source document. The CLI must never fabricate information.
2. **source_quote Discipline** — All numerical values in JSON output must include a `source_quote` field with verbatim text from the source.
3. **Ratchet Evaluation** — Once an `eval` baseline is set, new versions must match or exceed its quality score. Regressions are hard failures.
4. **Deterministic Output** — Given the same input + config, the CLI must produce identical output (excluding timestamps).
5. **Zero PII in Logs** — CLI verbose/debug output must never contain patient-identifiable information.

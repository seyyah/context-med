# CLI Best Practices Template

> This template defines the **mandatory CLI Reference section** that every package's
> `IDEA.md` must contain. Copy the relevant portions into your package's `IDEA.md`,
> fill in the blanks, and remove any instructions (marked with `<!-- ... -->`).

---

## CLI Reference

### Infrastructure

```
Node.js ≥ 18, npm ≥ 9
Entry point: bin/cli.js (with #!/usr/bin/env node shebang)
package.json: "bin" field maps CLI name to entry point
```

#### package.json (minimal)

```json
{
  "name": "@context-med/<package-name>",
  "version": "0.1.0",
  "bin": {
    "<package-name>": "./bin/cli.js"
  },
  "scripts": {
    "test": "jest --verbose",
    "test:cli": "jest tests/cli/ --verbose",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

#### bin/cli.js (skeleton)

```javascript
#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name(pkg.name.split('/').pop())
  .version(pkg.version)
  .description('<!-- one-line description -->');

// --- Commands ---

program
  .command('generate')
  .description('<!-- verb description -->')
  .requiredOption('--input <path>', 'Input file or directory')
  .requiredOption('--output <path>', 'Output file or directory')
  .option('--config <path>', 'YAML configuration file')
  .option('--format <type>', 'Output format (json|md|html)', 'json')
  .option('--language <lang>', 'Language (en|tr)', 'en')
  .option('--dry-run', 'Simulate without writing files', false)
  .option('--verbose', 'Enable detailed logging', false)
  .option('--quiet', 'Suppress all output except errors', false)
  .action(async (opts) => {
    try {
      // ... implementation
      if (!opts.quiet) console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
```

### Command Structure

```
<package-name> <verb> [flags] [args]
```

<!-- Replace <package-name> with your CLI name (must match directory name). -->

### Standard Verbs

Pick from these standard verbs where applicable:

| Verb | Purpose | When to Use |
|------|---------|-------------|
| `generate` | Primary production command | Single-item creation |
| `batch` | Bulk processing | Multiple items from directory |
| `eval` | Ratchet evaluation | Quality benchmarking |
| `compile` | Source compilation | Wiki/raw → structured data |
| `ingest` | Source ingestion | External → raw/ layer |
| `convert` | Format transformation | Output format change |
| `compare` | Multi-output comparison | A/B or multi-version diff |
| `lint` | Validation/checking | Config or content validation |
| `serve` | Start local server | UI or API packages |
| `status` | Show current state | Long-running processes |

### Standard Flags

**All packages MUST support these flags:**

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--input` | `-i` | `string` | *required* | Input file or directory path |
| `--output` | `-o` | `string` | *required* | Output file or directory path |
| `--config` | `-c` | `string` | `null` | YAML configuration file |
| `--format` | `-f` | `string` | `json` | Output format (json\|md\|html\|pdf) |
| `--language` | `-l` | `string` | `en` | Language (en\|tr) |
| `--dry-run` | | `boolean` | `false` | Simulate without side effects |
| `--verbose` | `-v` | `boolean` | `false` | Detailed log output |
| `--quiet` | `-q` | `boolean` | `false` | Only error output |
| `--help` | `-h` | | | Show help (auto-generated) |
| `--version` | `-V` | | | Show version (auto-generated) |

### Command Table

<!-- Fill this table for YOUR package. Example below: -->

| Command | Description | Required Flags | Optional Flags |
|---------|-------------|----------------|----------------|
| `<pkg> generate` | Generate single output | `--input`, `--output` | `--config`, `--format`, `--language` |
| `<pkg> batch` | Process directory of inputs | `--input`, `--output` | `--config`, `--format`, `--concurrency` |
| `<pkg> eval` | Run ratchet evaluation | `--input`, `--baseline` | `--output`, `--format` |

### Usage Scenarios

<!-- Each scenario MUST include:
     1. Bash command
     2. Expected input description
     3. Expected output (JSON schema or sample)
     4. Exit code
-->

#### Scenario 1 — Happy Path (single item)

```bash
<package-name> generate \
  --input fixtures/wiki/cardiovascular/atrial-fibrillation.md \
  --output output/result.json \
  --config fixtures/config/jama-visual-abstract.yaml \
  --format json
```

**Input:** Markdown wiki page with structured clinical content.
**Expected Output:** JSON file at `output/result.json` matching the package schema.
**Exit Code:** `0`

#### Scenario 2 — Batch Processing

```bash
<package-name> batch \
  --input fixtures/wiki/ \
  --output output/batch/ \
  --config fixtures/config/jama-visual-abstract.yaml \
  --format json
```

**Input:** Directory of markdown wiki pages.
**Expected Output:** One JSON file per input in `output/batch/`.
**Exit Code:** `0`

#### Scenario 3 — Missing Required Input (Error)

```bash
<package-name> generate --output output/result.json
# Missing --input flag
```

**Expected:** Error message to stderr.
**Exit Code:** `1`

#### Scenario 4 — Invalid Input File (Error)

```bash
<package-name> generate \
  --input nonexistent/path.md \
  --output output/result.json
```

**Expected:** `Error: Input file not found: nonexistent/path.md`
**Exit Code:** `1`

#### Scenario 5 — Dry Run

```bash
<package-name> generate \
  --input fixtures/wiki/cardiovascular/atrial-fibrillation.md \
  --output output/result.json \
  --dry-run
```

**Expected:** Prints what would be generated to stdout. No file is written.
**Exit Code:** `0`

#### Scenario 6 — Invalid Config File (Error)

```bash
<package-name> generate \
  --input fixtures/wiki/cardiovascular/atrial-fibrillation.md \
  --output output/result.json \
  --config nonexistent.yaml
```

**Expected:** `Error: Config file not found: nonexistent.yaml`
**Exit Code:** `1`

### Exit Codes

| Code | Meaning | Example |
|------|---------|---------|
| `0` | Success | Normal completion |
| `1` | General error | Missing file, invalid argument |
| `2` | Validation error | Schema mismatch, hallucination detected |
| `3` | External dependency error | API timeout, model unavailable |

### Output Schema

<!-- Define the JSON schema for your primary output. Example: -->

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["study_id", "title", "key_results"],
  "properties": {
    "study_id": { "type": "string" },
    "title": { "type": "string" },
    "key_results": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["metric", "value", "source_quote"],
        "properties": {
          "metric": { "type": "string" },
          "value": { "type": "string" },
          "source_quote": { "type": "string", "minLength": 1 }
        }
      }
    }
  }
}
```

### Configuration File Format

<!-- Define the YAML config structure your package expects. -->

```yaml
# <package-name> configuration
format: json           # Output format
language: en           # Language (en|tr)
# ... package-specific options
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONTEXT_MED_FIXTURES` | Path to shared fixtures directory | `../../fixtures` |
| `CONTEXT_MED_LOG_LEVEL` | Logging level (debug\|info\|warn\|error) | `info` |
| `NODE_ENV` | Environment (development\|test\|production) | `development` |

---

## CLI Testing Guide

### Test Framework

```
jest ≥ 29
Test runner: node --experimental-vm-modules (if ESM)
Fixture path: ../../fixtures (shared monorepo fixtures)
```

### Test File Structure

```
tests/
├── cli/
│   ├── generate.test.js    # generate command tests
│   ├── batch.test.js       # batch command tests
│   ├── eval.test.js        # eval command tests
│   └── helpers.js          # shared test utilities
└── unit/
    └── ...                 # unit tests for modules
```

### Test Naming Convention

```
test_<verb>_<scenario>.js

Examples:
  generate.test.js      → test('should generate output from valid wiki input')
  generate.test.js      → test('should fail with missing --input flag')
  batch.test.js         → test('should process all files in directory')
  eval.test.js          → test('should pass ratchet evaluation against baseline')
```

### Test Categories

| Category | Purpose | Priority |
|----------|---------|----------|
| Smoke | `--help` works, `--version` works | P0 |
| Happy Path | Valid input → expected output | P0 |
| Error Path | Missing file, invalid flag, bad config | P0 |
| Edge Case | Empty input, large file, Unicode chars | P1 |
| Ratchet | New version ≥ baseline quality | P1 |
| Integration | Full pipeline end-to-end | P2 |

### Example Test Code

```javascript
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CLI = path.resolve(__dirname, '../../bin/cli.js');
const FIXTURES = path.resolve(__dirname, '../../../../fixtures');

function runCLI(args) {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return { stdout, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status,
    };
  }
}

describe('<package-name> CLI', () => {

  // --- Smoke Tests ---

  test('--help should display usage information', () => {
    const { stdout, exitCode } = runCLI('--help');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('generate');
  });

  test('--version should display version number', () => {
    const { stdout, exitCode } = runCLI('--version');
    expect(exitCode).toBe(0);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  // --- Happy Path ---

  test('generate should produce valid JSON output', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'));
    const outputPath = path.join(tmpDir, 'result.json');

    const { exitCode } = runCLI(
      `generate --input ${FIXTURES}/wiki/cardiovascular/atrial-fibrillation.md --output ${outputPath}`
    );

    expect(exitCode).toBe(0);
    expect(fs.existsSync(outputPath)).toBe(true);

    const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(result).toHaveProperty('study_id');
    expect(result).toHaveProperty('title');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
  });

  // --- Error Path ---

  test('generate should fail with exit code 1 when --input is missing', () => {
    const { exitCode, stderr } = runCLI('generate --output /tmp/out.json');
    expect(exitCode).toBe(1);
    expect(stderr).toContain('--input');
  });

  test('generate should fail when input file does not exist', () => {
    const { exitCode, stderr } = runCLI(
      'generate --input nonexistent.md --output /tmp/out.json'
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('not found');
  });

  // --- Dry Run ---

  test('generate --dry-run should not write output file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'));
    const outputPath = path.join(tmpDir, 'result.json');

    const { exitCode, stdout } = runCLI(
      `generate --input ${FIXTURES}/wiki/cardiovascular/atrial-fibrillation.md --output ${outputPath} --dry-run`
    );

    expect(exitCode).toBe(0);
    expect(fs.existsSync(outputPath)).toBe(false);
    expect(stdout).toContain('dry-run');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
  });

  // --- source_quote Discipline ---

  test('all numerical values in output must have source_quote', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'));
    const outputPath = path.join(tmpDir, 'result.json');

    const { exitCode } = runCLI(
      `generate --input ${FIXTURES}/wiki/cardiovascular/atrial-fibrillation.md --output ${outputPath}`
    );

    expect(exitCode).toBe(0);
    const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

    if (result.key_results) {
      result.key_results.forEach((r) => {
        expect(r.source_quote).toBeDefined();
        expect(r.source_quote.length).toBeGreaterThan(0);
      });
    }

    fs.rmSync(tmpDir, { recursive: true });
  });
});
```

---

## Checklist for IDEA.md Authors

Before submitting your IDEA.md CLI Reference section, verify:

- [ ] All standard flags (`--input`, `--output`, `--config`, `--format`, `--language`, `--dry-run`, `--verbose`, `--quiet`) are documented
- [ ] At least 6 usage scenarios are defined (happy path, batch, error × 2, dry run, config error)
- [ ] Exit codes table is present (0, 1, 2, 3)
- [ ] Output schema is defined (JSON Schema)
- [ ] CLI name matches the package directory name
- [ ] All scenarios reference `fixtures/` for test data
- [ ] source_quote discipline is enforced for any numerical output
- [ ] `--help` output is documented or auto-generated via commander

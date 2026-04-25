# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

You are a senior-level TypeScript and Python engineer with advanced software architecture, CLI design, agent tooling, knowledge-system development expertise.

Your task is to develop the `context-wiki` package inside the `context-med` monorepo.

## Project Scope

All development for this feature must stay inside:

```text
context-med/packages/context-wiki/src/context_wiki
context-med/packages/context-wiki/tests/cli
```

Do not modify unrelated packages unless explicitly requested.

## Goal

`context-wiki` is a CLI-first knowledge substrate for AI agents.

It should help agents and developers:

- ingest raw documents
- generate structured wiki pages
- query existing wiki knowledge
- validate wiki structure
- enforce guardrails
- support future agent adapters such as Claude, Codex, OpenCode, Aider, and MCP-based agents

This package is not just a document converter.
It is the foundation of a disciplined agent memory layer.

## Technical Direction

Primary implementation language: **TypeScript**

Python may be used only when it provides clear value, such as:
- document parsing
- experimental pipelines
- evaluation scripts
- future ML/retrieval helpers

Core CLI, command handling, validation, and agent-facing interfaces should be TypeScript-first.

Use npm-compatible development practices.

## Expected CLI Surface

```bash
context-wiki --help
context-wiki --version
context-wiki ingest --input ./raw/file.txt --output ./wiki --format md
context-wiki query --input ./wiki --query "some question" --format json
context-wiki lint --input ./wiki --format json
context-wiki writeback --input ./result.md --output ./wiki
context-wiki autoresearch run --spec ./experiments/exp-001.json --wiki-dir ./wiki
context-wiki autoresearch status --wiki-dir ./wiki
```

## Design Principles

1. CLI-first architecture
2. Small composable modules
3. Testable command handlers
4. Separation between CLI parsing and business logic
5. Deterministic outputs
6. No hidden side effects
7. Safe defaults
8. Dry-run support
9. Human-readable Markdown output
10. Machine-readable JSON output

## Actual Structure

```text
src/context_wiki/
  cli/
    index.ts          ← Commander root, registers all commands
  commands/
    ingest.ts
    lint.ts
    query.ts
    writeback.ts
    autoresearch.ts
  core/
    hasher.ts         ← SHA-256 for files and strings
    parser.ts         ← gray-matter parse/stringify, frontmatter builder
    validator.ts      ← lint rules, required field checks
    retrieval.ts      ← token overlap scoring, wiki page loader
    experiment.ts     ← experiment spec loader, scorer, logger (autoresearch)
  types/
    index.ts          ← all shared interfaces

tests/cli/
  smoke.test.js
  autoresearch.test.js
```

## Engineering Expectations

- Code like a staff-level engineer
- Prefer explicit typing
- Prefer small reusable modules
- Avoid overengineering
- Minimize dependencies
- No hallucinated APIs
- No fake implementations

## Agent Memory Concepts

Design with support for:
- raw knowledge ingestion
- micro-wiki generation
- provenance tracking
- hallucination guards
- writeback contracts
- autoresearch loops
- ratchet/eval safety

## Future Optional Extensions

```text
packages/core
packages/cli
packages/mcp-server
packages/obsidian-plugin
packages/adapters
```

Potential adapters:

- Claude
- Codex
- OpenCode
- Aider
- MCP agents

## Commands

```bash
# Install dependencies (run from packages/context-wiki/)
npm install

# Build TypeScript
npm run build

# Run all tests
npm test

# Run only CLI tests
npm run test:cli

# Run a single test file
npx jest tests/cli/smoke.test.js
npx jest tests/cli/autoresearch.test.js

# Run a single named test
npx jest --testNamePattern="--help exits 0"
```

Tests use the shared utility at `tests/helpers/cli-test-utils.js` (monorepo root).
Fixtures live at `fixtures/` (monorepo root) — never commit real patient data.
Test files are `.js` (Jest runs compiled output, not TypeScript source directly).

## Three-Layer Architecture

This is not a doc site, RAG solution, or search engine. It is a discipline layer that forces agents to:

1. **Raw** — Unmodified source documents (`fixtures/raw/`). Never modified by the CLI. SHA-256 hash must be preserved.
2. **Micro-wiki** — LLM-compiled structured pages with provenance frontmatter. This is the agent's primary context source.
3. **Autoresearch loop** — Autonomous experiment → score → human-approved writeback cycle.

### Micro-wiki Page Schema

Every generated wiki page must have this frontmatter:

```markdown
---
title: <topic>
source: raw/<filename>
source_hash: <sha256>
generated_at: <ISO8601>
model: <model-id>
human_reviewed: false
---
```

### Micro-wiki Folder Layout (output of `ingest`)

```
wiki/
  LLMs.txt          # Agent operational contract: do/don't, priority order, guard rules
  guards/           # hallucination-guards.md — hard red-lines, never-fabricate zones
  cookbook/         # recipes.md — validated patterns and snippets
  experiments/      # autoresearch results, benchmarks, scored logs
  design/           # architecture.md, domain boundaries
  style/            # style-guide.md, naming, conventions
```

## Runtime Query Flow

When `context-wiki query` is called:

1. Classify intent (how-to, debug, refactor, design, pattern search)
2. Search wiki pages first (token overlap scoring on frontmatter + body — v0, no vector DB)
3. If wiki coverage is insufficient → surface "insufficient context" signal (Exit 2), never fabricate
4. If covered → return answer with explicit wiki page reference (`source:` field in JSON output)

**Guardrail:** Any query response that cannot be traced to a wiki page must return `Exit 2` and a "I don't know" message — never a hallucinated answer.

## Writeback Contract

`context-wiki writeback` follows this contract:

- Only writes to wiki pages that already exist (no silent new-page creation)
- Appends under a `## Experiments` or `## Cookbook` section
- Requires `--reviewed` flag to mark `human_reviewed: true` in frontmatter
- Never overwrites existing frontmatter fields without explicit `--force`

## Ratchet / Eval Expectations

- Once an anti-pattern is added to the eval set (`/eval/wiki-eval.jsonl`), it must never pass again
- New `ingest` output must match or exceed baseline quality score
- `query` responses for known questions must remain consistent across versions
- Forbidden: fabricating a source, generating a `source_hash` that doesn't match the actual file

## Working Rule

Before adding complexity ask:

Does this make the agent memory substrate more reliable?

If not, simplify.

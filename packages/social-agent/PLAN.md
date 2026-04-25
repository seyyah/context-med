# social-agent - Implementation Plan

> CLI once, standalone UI after. Each phase must have a concrete command, output, or demo acceptance criterion. Do not move to the next phase before the current phase is usable.

---

## Scope

This plan is local to `packages/social-agent/`.

Allowed work area:

- `packages/social-agent/AGENT.md`
- `packages/social-agent/DESIGN.md`
- `packages/social-agent/IDEA.md`
- `packages/social-agent/PLAN.md`
- `packages/social-agent/package.json`
- `packages/social-agent/bin/`
- `packages/social-agent/src/`
- `packages/social-agent/demo/`

Read-only for now:

- `packages/social-agent/tests/`
- Root `tests/`
- Root `fixtures/`
- Other `packages/*`
- Root config and workflow files

If test infrastructure requires a change under `tests/`, that is a separate approval decision. For now, implementation must work around this boundary.

---

## References

- Root `AGENT.md`: CLI-first development, Node.js, Commander, Jest, standard flags, exit codes, and safety invariants.
- Root `PLAN.md`: phase discipline; CLI before UI; no phase skipping.
- Root `DESIGN.md`: canonical Xtatistix UI design language.
- Root `README.md1`: Context-Med product context.
- Local `IDEA.md`: canonical product concept for `social-agent`.
- Local `demo/`: accepted Stitch UI reference screens.
- Local `tests/cli/smoke.test.js`: read-only smoke behavior reference.

---

## Product Goal

`social-agent` is a standalone social operations package. It uses brand, product, and community context to produce social plans, platform-aware drafts, moderation reports, and review-ready outputs.

The package is not only a caption generator. It should behave like an operational layer for social media work:

- generate platform-aware plans and drafts;
- mark risk and review requirements;
- avoid unsupported medical, legal, or financial claims;
- keep deterministic local behavior for the MVP;
- expose the same core workflow through CLI first, then standalone UI.

Implementation order:

1. Build CLI/domain core for `plan`, `draft`, and `moderate`.
2. Add `serve` for local standalone UI.
3. Build UI from the accepted `demo/` screens without inventing a different product flow.

---

## MVP Boundaries

Included in the first implementation:

- Node.js package
- Commander CLI
- deterministic local JSON output
- LinkedIn and X as first platforms
- `plan`, `draft`, `moderate`, and `serve` commands
- standalone local UI planned from accepted Stitch screens
- Xtatistix design language

Excluded from the first implementation:

- LLM/API calls
- direct social media publishing
- scheduler integration
- production SaaS account system
- analytics writeback automation
- multi-brand persistence
- root helper/test changes
- integration with other packages

---

## Accepted UI Reference

`packages/social-agent/demo/` contains the accepted Stitch-generated UI reference. These screens define the approved information architecture, navigation model, page names, and Xtatistix visual direction.

Accepted screens:

- `overview.html`
- `workspace.html`
- `plan.html`
- `drafts.html`
- `moderation.html`
- `review-queue.html`
- `packages.html`
- `writeback.html`
- `settings.html`

Rule: `demo/` is the accepted visual and workflow reference. It is not automatically the final production implementation. The working standalone UI should preserve the same flow and design language, whether implemented under `src/ui/` or later moved into `demo/` if the project owner requires it.

---

## Package Structure

Planned structure:

```text
packages/social-agent/
  AGENT.md
  DESIGN.md
  IDEA.md
  PLAN.md
  package.json
  bin/
    cli.js
  src/
    index.js
    commands/
      plan.js
      draft.js
      moderate.js
      serve.js
    ui/
      app.js
      data.js
      routes.js
      styles.css
      views/
        overview.js
        workspace.js
        plan.js
        drafts.js
        moderation.js
        review-queue.js
        packages.js
        writeback.js
        settings.js
  demo/
    overview.html
    workspace.html
    plan.html
    drafts.html
    moderation.html
    review-queue.html
    packages.html
    writeback.html
    settings.html
  tests/
    cli/
      smoke.test.js
```

Rules:

- `src/index.js` owns shared domain helpers and output builders.
- `src/commands/*` exposes CLI commands.
- `src/ui/` is the working standalone UI implementation for now.
- `demo/` remains the accepted Stitch reference.
- `tests/` is read-only for now.

---

## Phase 0 - Package Skeleton

**Hedef:** `packages/social-agent` becomes a runnable Node package with a CLI entry point.

**Teslimatlar:**

- `package.json`
- `bin/cli.js`
- `src/index.js`
- `src/commands/plan.js`
- `src/commands/draft.js`
- `src/commands/moderate.js`
- `src/commands/serve.js`

**Tamamlanma kriteri:**

- `node bin/cli.js --help` works.
- `node bin/cli.js --version` works.
- Help output lists `plan`, `draft`, `moderate`, and `serve`.
- No root files are changed.
- `tests/` is not changed.

---

## Phase 1 - Plan Command

**Hedef:** `social-agent plan` reads source context and produces a weekly social calendar JSON.

**CLI:**

```bash
social-agent plan --input <path> --output <path> --format json
```

**Teslimatlar:**

- Input file validation
- deterministic plan output
- LinkedIn and X plan items
- risk and approval metadata
- `--dry-run` behavior

**Output contract:**

```json
{
  "type": "social_calendar",
  "platforms": ["linkedin", "x"],
  "items": [],
  "risk_level": "low",
  "approval_required": true,
  "provenance": {
    "input": "",
    "mode": "deterministic"
  }
}
```

**Tamamlanma kriteri:**

- Missing `--input` exits non-zero.
- Nonexistent input exits non-zero.
- `--dry-run` does not write the output file.
- Valid input writes JSON output.
- Output contains platform, topic, pillar, suggested day, CTA, risk, and approval fields.

---

## Phase 2 - Draft Command

**Hedef:** `social-agent draft` creates platform-specific draft packages from source context.

**CLI:**

```bash
social-agent draft --input <path> --output <path> --format json
```

**Teslimatlar:**

- LinkedIn draft builder
- X draft builder
- shared claim/risk metadata
- approval metadata

**Output contract:**

```json
{
  "type": "social_draft_package",
  "drafts": [
    {
      "platform": "linkedin",
      "hook": "",
      "body": "",
      "cta": "",
      "risk_level": "medium",
      "approval_required": true,
      "source_quote": ""
    }
  ]
}
```

**Tamamlanma kriteri:**

- Missing `--input` exits non-zero.
- Same source idea is rewritten per platform, not copied verbatim.
- LinkedIn output is more explanatory.
- X output is shorter and sharper.
- Risky or factual output requires approval.

---

## Phase 3 - Moderate Command

**Hedef:** `social-agent moderate` classifies comments or social text and produces a review-ready moderation report.

**CLI:**

```bash
social-agent moderate --input <path> --output <path> --format json
```

**Teslimatlar:**

- comment/text classifier
- risk scoring
- recommended action
- optional reply draft
- escalation metadata

**Output contract:**

```json
{
  "type": "moderation_report",
  "classification": "question",
  "risk_level": "low",
  "recommended_action": "reply",
  "approval_required": true,
  "reply_draft": ""
}
```

**Tamamlanma kriteri:**

- Missing `--input` exits non-zero.
- Valid input writes JSON output.
- Output classifies content as question, complaint, praise, spam, risk, or crisis signal.
- Risky topics recommend `escalate`, not automatic reply.

---

## Phase 4 - Standalone UI

**Hedef:** `social-agent serve` starts a local UI that follows the accepted `demo/` screens and uses the same domain logic as the CLI.

**CLI:**

```bash
social-agent serve --port 3000
```

**Design source:**

- `packages/social-agent/DESIGN.md`
- accepted `packages/social-agent/demo/*.html`

**UI screens:**

- Overview
- Workspace
- Plan
- Drafts
- Moderation
- Review Queue
- Packages
- Writeback
- Settings

**UI rules:**

- No landing page.
- First screen is an operational overview.
- Use Xtatistix design language.
- Use dense, professional dashboard layout.
- Do not publish to real social platforms.
- Support review, export, and local workflow states.

**Tamamlanma kriteri:**

- `serve` starts a local server.
- Overview screen loads.
- Navigation reaches all accepted screens.
- Plan, drafts, moderation, and review queue views map to CLI/domain outputs.
- UI follows the accepted Stitch visual flow.

---

## Phase 5 - Safety And Ratchet

**Hedef:** `social-agent` becomes safer than a simple smoke-test CLI by enforcing package-level behavioral invariants.

**Rules:**

- Do not create unsupported medical, legal, or financial claims.
- If a factual or numerical claim appears, include `source_quote`.
- High-risk content cannot recommend automatic publishing.
- PII must not be logged.
- Same input must produce deterministic output in MVP mode.

**Tamamlanma kriteri:**

- Safety checks are centralized in shared domain helpers.
- CLI and UI both use the same risk metadata.
- High-risk moderation output escalates.
- Unsupported claim generation is rejected or marked for review.

---

## CLI Standards

Production commands should support:

- `--input`, `-i`
- `--output`, `-o`
- `--format`, `-f`
- `--language`, `-l`
- `--dry-run`
- `--verbose`, `-v`
- `--quiet`, `-q`
- `--help`, `-h`
- `--version`, `-V`

Standalone UI command:

- `serve --port <number>`

Exit codes:

- `0`: success
- `1`: general error, missing input, missing file
- `2`: validation or safety error
- `3`: external dependency error

MVP is deterministic and local, so exit code `3` is not expected before external services are added.

---

## Test Strategy

Current read-only smoke reference:

```bash
cd packages/social-agent
npm test -- tests/cli/smoke.test.js
```

Expected smoke behaviors:

- `--help`
- `--version`
- `plan` missing input
- `draft` missing input
- `plan --dry-run`
- `plan` happy path
- `moderate` happy path

Note: `tests/` is read-only for now. If the current test import path or root helper setup blocks execution, that is tracked as a test-infrastructure issue and requires separate approval.

---

## Implementation Order

1. Add `package.json`.
2. Add `bin/cli.js`.
3. Add shared domain helpers in `src/index.js`.
4. Add `plan`, `draft`, `moderate`, and `serve` command modules.
5. Implement deterministic JSON output.
6. Add local `serve` command.
7. Build `src/ui/` using accepted `demo/` screens as reference.
8. Verify commands without changing `tests/`.

---

## Ozet

| Phase | Area | Command | Output | Dependency |
|-------|------|---------|--------|------------|
| 0 | Package skeleton | `--help`, `--version` | CLI entry point | none |
| 1 | Plan | `plan` | social calendar JSON | skeleton |
| 2 | Draft | `draft` | draft package JSON | plan/domain helpers |
| 3 | Moderation | `moderate` | moderation report JSON | domain helpers |
| 4 | Standalone UI | `serve` | local UI | CLI/domain core, demo reference |
| 5 | Safety | command-level checks | risk and review metadata | phases 1-4 |

---

## Planning Lock

The following decisions are locked before implementation starts:

- First platforms: LinkedIn and X.
- First commands: `plan`, `draft`, `moderate`, `serve`.
- First output format: JSON.
- MVP mode: deterministic, no LLM/API.
- UI source: accepted Stitch screens under `demo/`.
- Working UI path for now: `src/ui/`.
- `tests/` remains read-only.
- PR scope remains inside `packages/social-agent/`.

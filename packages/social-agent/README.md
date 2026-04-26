# social-agent

Standalone social operations package for Context-Med.

`social-agent` helps turn source context and community comments into review-ready social media work. It currently supports LinkedIn and X workflows through a package-local CLI, JSON outputs, and a local demo UI.

The package is designed as a small social operations layer, not only a caption generator. It takes a source briefing, creates a platform-aware plan, drafts social copy, checks community comments, and keeps risky or sensitive items behind a human review step before package handoff.

## Project Goal

Context-Med content can include healthcare-adjacent topics, privacy concerns, crisis signals, and product claims that should not be published without review. `social-agent` keeps those constraints visible while producing useful social workflow output.

The current goal is to provide a demoable MVP that shows:

- how a source briefing becomes a social plan;
- how the same idea is adapted differently for LinkedIn and X;
- how community comments are classified before public response;
- how review-required work is collected in one queue;
- how generated work can be exported as JSON for manual handoff.

The package intentionally avoids direct publishing. It focuses on planning, drafting, moderation, review, and export.

## What It Does

- Builds a social plan from source context.
- Creates platform-aware LinkedIn and X draft outputs.
- Classifies community comments for moderation and review.
- Collects approval/escalation items in a review queue.
- Serves a local standalone demo UI from `packages/social-agent/demo/`.

## Workflow

The main workflow is:

1. Add source context and community comments in Workspace.
2. Generate a package payload.
3. Review the planned LinkedIn/X schedule in Plan.
4. Inspect and edit final platform copy in Drafts.
5. Check community comments in Moderation.
6. Approve, request changes, or escalate items in Review Queue.
7. Export the package from Packages for manual handoff.

All screens read from the same generated package state, so the demo behaves like one connected workflow instead of separate static pages.

## Screens

### Workspace

Workspace is the main input surface. It accepts:

- source context;
- community comments;
- local deterministic generation or optional Gemini-backed generation.

The generated package feeds the other demo screens.

### Plan

Plan shows scheduled social items for LinkedIn and X. It includes platform, suggested day, topic, CTA, risk, status, and approval state. The UI also avoids assigning the same platform to the same day more than once when generated items collide.

### Drafts

Drafts shows final platform copy for LinkedIn and X. It keeps metadata separate from the actual post text, supports final copy editing in the demo state, and includes copy/export behavior for handoff.

### Moderation

Moderation classifies community comments by risk and recommended action. Spam can be ignored, normal questions can receive a reviewed reply draft, and sensitive items can be escalated.

### Review Queue

Review Queue is the human approval gate. It collects plan, draft, and moderation items that require review before package handoff. Demo actions include approve, request changes, and escalate.

### Packages

Packages shows the export-ready JSON package. Direct publishing is out of scope; the package is meant for manual review and handoff.

### Writeback and Settings

Writeback documents that external publishing and analytics writeback are disabled in the MVP. Settings shows platform and generation mode metadata.

## Boundaries

- No direct social publishing.
- No database requirement.
- No external server framework.
- Gemini generation is optional. Without `GEMINI_API_KEY`, the package uses deterministic local fallback output.
- Human review remains required for risky or sensitive outputs.

## Output Shape

The package API produces a single demo payload with:

- `summary` - high-level topic, risk, and package counts.
- `plan` - social calendar items.
- `drafts` - platform-specific final copy and adaptation metadata.
- `moderation` - community comment reports.
- `review_queue` - items that need approval, revision, or escalation.
- `packages` - export package metadata.
- `writeback` - disabled writeback status.
- `settings` - supported platforms and generation mode.

This shape is used by both the demo UI and package API.

## Setup

```bash
cd packages/social-agent
npm install
```

Optional live generation:

```bash
copy .env.example .env
```

Then set:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## CLI Usage

```bash
npm run cli -- plan --input demo/social-agent-source.md --output out/plan.json
npm run cli -- draft --input demo/social-agent-source.md --output out/drafts.json
npm run cli -- moderate --input comments.txt --output out/moderation.json
```

The CLI commands are useful for validating package behavior without opening the demo UI.

Command responsibilities:

- `plan` creates a social calendar.
- `draft` creates LinkedIn and X draft outputs.
- `moderate` classifies a comment input and returns review guidance.
- `serve` starts the local demo UI.

Dry run example:

```bash
npm run cli -- plan --input demo/social-agent-source.md --dry-run
```

## Demo UI

```bash
npm start
```

Then open:

```text
http://127.0.0.1:3000
```

The Workspace screen accepts source context and community comments. Generated output is reused across Plan, Drafts, Moderation, Review Queue, Packages, Writeback, and Settings screens.

## React Standalone UI

A React/Vite standalone UI lives under:

```text
demo/standalone-ui/
```

This is intentionally separate from the current CLI-served demo. It keeps the CLI and package API in place while rebuilding the UI as a component-based app.

Run the React dev server:

```bash
npm run ui:dev
```

Build the React app:

```bash
npm run ui:build
```

Preview the built React app:

```bash
npm run ui:preview
```

Current status:

- The React app has separate pages for Overview, Workspace, Plan, Drafts, Moderation, Review Queue, Packages, Writeback, and Settings.
- Shared shell, navigation, draft cards, panels, badges, and metric components live under `demo/standalone-ui/src/components/`.
- Page-level UI lives under `demo/standalone-ui/src/pages/`.
- It does not replace `npm start` yet.
- It does not yet call `/api/demo`.
- The existing CLI, package API, and static demo remain unchanged.

Example Workspace source:

```md
# Patient intake dashboard update

Context-Med is releasing a patient intake dashboard update for care coordination teams.

The communication should focus on operational visibility, reduced manual sorting, privacy-safe review, and clearer escalation paths.

Do not claim that the dashboard diagnoses patients, recommends treatment, or replaces clinical judgment.
```

Example community comments:

```text
Can this dashboard diagnose symptoms from intake messages?
How do you stop private patient details from being used in public replies?
What happens if someone mentions self-harm or a safety crisis?
Buy cheap followers now crypto promo
```

## Demo Package Build

```bash
npm run demo:build
```

This writes a package-generated demo payload under `demo/generated/`.

## Tests

```bash
npm test -- tests/cli/smoke.test.js tests/cli/comprehensive.test.js
```

Current package-level coverage focuses on CLI behavior, package API output, demo API behavior, and browser-demo rendering checks.

The smoke test file is kept as the baseline behavior reference. Additional coverage lives in the comprehensive CLI test file.

## Main Files

- `bin/cli.js` - CLI entrypoint.
- `src/api.js` - package API and demo payload assembly.
- `src/commands/` - CLI command implementations.
- `src/gemini.js` - optional Gemini workspace generation.
- `demo/screens/` - accepted demo screen HTML.
- `demo/assets/` - demo runtime JS/CSS.
- `tests/cli/` - package-local CLI and demo tests.

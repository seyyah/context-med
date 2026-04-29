# Changelog

All notable changes to `social-agent` will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com) - [Semantic Versioning](https://semver.org).

## [Unreleased]

## [social-agent-v0.4.4] - 2026-04-29

### Contributors

- Akbulut55

### Changed

- Connected the React Drafts plan dropdown to the same content queue data used by the React Plan page.
- Replaced the React Drafts plan dropdown with a selected-plan card and searchable change-plan popover.
- Added collapsible React sidebar behavior for wider workspace views.
- Fixed React Workspace pipeline connector alignment and compacted Drafts slot card layout.
- Bumped package metadata to `0.4.4`.

## [social-agent-v0.4.3] - 2026-04-27

### Contributors

- Akbulut55

### Added

- Added a staged React Workspace generation pipeline that mock-generates adaptations, plan seeds, draft seeds, and review items.
- Added a package-local CLI LLM provider layer with mock, Gemini, Groq, and OpenRouter provider stubs.
- Added optional `social-agent draft --platform <platform>` filtering for single-platform draft output.

### Changed

- Renamed React Workspace output labels so generated content is presented as adaptation drafts instead of final publish-ready copy.
- Reordered the React sidebar to follow the social-agent workflow from Workspace through review, package handoff, writeback, and moderation.
- Reworked the React Drafts page around selectable weekly plan slots, editable platform copy, and selected-slot review context.
- Reworked the React Review Queue page around selectable review items, functional status filters, reviewer notes, and mock approval decisions.
- Updated `.env.example` to document `LLM_PROVIDER`, `LLM_MODEL`, and provider-specific API key variables.
- Bumped package metadata to `0.4.3`.

## [social-agent-v0.4.2] - 2026-04-26

### Contributors

- Akbulut55

### Added

- Added a deterministic React Workspace mock generator for source-based LinkedIn and X output generation.

### Changed

- Replaced the React Workspace community comments input with a vertical platform selection list for draft generation.
- Renamed React Plan table labels to emphasize weekly scheduling, channel, message focus, review gates, and draft packages.
- Split the React Plan page into a source content queue and a selected-content weekly schedule with multiple non-package content examples.
- Made React Plan schedule rows selectable so the rationale panel reflects the selected daily slot.
- Replaced the React Plan pillar filter with functional week and platform filters for the content queue.
- Updated React Plan regeneration so it applies to the selected content item without resetting filters.
- Bumped package metadata to `0.4.2`.

## [social-agent-v0.4.1] - 2026-04-26

### Contributors

- Akbulut55

### Changed

- Reworked the React/Vite standalone UI scaffold into a multi-page static app with shared shell components and separate Overview, Workspace, Plan, Drafts, Moderation, Review Queue, Packages, Writeback, and Settings pages.
- Updated the React Plan, Moderation, and Review Queue pages to follow the accepted HTML reference layouts more closely.
- Updated the React Packages and Writeback pages to follow the accepted HTML reference layouts more closely.
- Updated the React Settings page to follow the accepted HTML reference layout more closely.
- Simplified the React topbar by removing the centered page title and notification/help icons.
- Bumped package metadata to `0.4.1`.

## [social-agent-v0.4.0] - 2026-04-26

### Contributors

- Akbulut55

### Added

- Added package-local `README.md` with setup, CLI, demo, and test instructions.
- Added an empty React/Vite UI scaffold under `demo/standalone-ui/` with separate `ui:dev`, `ui:build`, and `ui:preview` scripts.

### Changed

- Bumped package metadata to `0.4.0`.

## [social-agent-v0.3.1] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added platform hashtag output and hashtag policy metadata for LinkedIn and X drafts.
- Added functional plan board, draft handoff, and moderation triage sections to the standalone demo UI.
- Added final-copy copy actions for platform draft cards.
- Added Review Queue decision actions for approving, requesting changes, or escalating queued items in the demo UI.
- Added Drafts screen edit/save actions for updating final platform copy in the demo package state.

### Changed

- Updated LinkedIn and X final outputs so hashtags are part of the generated post copy when useful.
- Expanded plan filters to include risk and approval state.
- Updated `/api/demo` so it returns the latest Workspace-generated payload after custom input is submitted, with reset support for returning to the default demo.
- Simplified the Workspace input form by removing the language selector and increasing source/comment editor height.
- Normalized generated plan schedules so the same platform is not assigned to the same day more than once.
- Updated draft review queue items to expose the current draft copy preview.
- Bumped package metadata to `0.3.1`.

## [social-agent-v0.3.0] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added optional Gemini-backed workspace generation through server-side `GEMINI_API_KEY` configuration.
- Added package-local `.env.example` for local demo API configuration.
- Added explicit platform adaptation metadata to draft outputs for LinkedIn and X.
- Added visible workspace result panels for plan, drafts, moderation, and review queue outputs.
- Added client-side routing for sidebar and internal demo links.

### Changed

- Updated the workspace UI to show live Gemini versus local fallback generation status.
- Reworked draft rendering so Workspace shows final platform-ready LinkedIn and X outputs above operational metadata.
- Moved final output metadata into consistent collapsed adaptation details for both LinkedIn and X cards.
- Improved deterministic LinkedIn/X draft bodies from plain summaries into platform-ready post structures.
- Added draft repair guardrails for generic Gemini launch language before final platform outputs are shown.
- Updated Gemini workspace prompting to require platform-specific rewriting instead of shortened copies.
- Fixed the demo shell scroll behavior so long Workspace output remains reachable below the fold.
- Improved sidebar active-route styling so demo navigation behaves like an application shell.
- Reworked workspace output from compact tables into a clearer run summary, stage flow, and result cards.
- Bumped package metadata to `0.3.0`.

## [social-agent-v0.2.4] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added interactive demo workspace inputs for regenerating package output from custom source context and comments.
- Added JSON copy/download actions and plan filtering controls to the demo UI.
- Added `POST /api/demo` for custom package-backed demo payload generation.

### Changed

- Extended comprehensive tests for interactive demo controls and custom demo API requests.
- Bumped package metadata to `0.2.4`.

## [social-agent-v0.2.3] - 2026-04-25

### Contributors

- Akbulut55

### Changed

- Reworked demo browser UI to replace placeholder screen content with route-specific package output from `/api/demo`.
- Bumped package metadata to `0.2.3`.

## [social-agent-v0.2.2] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added public package API for generating a comprehensive Social-Agent demo payload.
- Added `npm run demo:build` for writing package-generated demo JSON.
- Added demo UI assets that render package output inside the accepted demo screens.
- Added `/api/demo` to the local demo server.

### Changed

- Bumped package metadata to `0.2.2`.
- Extended comprehensive CLI coverage for package API, demo builder, and demo API behavior.
- Moved accepted demo HTML screens under `demo/screens/` while keeping existing demo routes stable.

## [social-agent-v0.2.1] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added comprehensive CLI coverage for schema, validation, dry-run, moderation, and demo server routes.

### Changed

- Added `schema_version` metadata to CLI JSON payloads.
- Improved `source_quote` extraction for Markdown and JSON inputs.
- Added language validation for `en` and `tr`.
- Improved demo server route handling for extensionless URLs such as `/plan`.

## [social-agent-v0.2.0] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added Node.js CLI package scaffold with Commander.
- Added `plan`, `draft`, `moderate`, and `serve` command entry points.
- Added deterministic JSON builders for social calendars, draft packages, and moderation reports.
- Added local demo server command for the accepted Social-Agent UI reference screens.
- Added package-local `.gitignore` for generated Node, output, and test artifacts.

## [social-agent-v0.1.1] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Added package-local `CHANGELOG.md` tracking for `social-agent`.
- Added package-local planning document for `social-agent`.
- Added package-local `AGENT.md` and `DESIGN.md` references.
- Added accepted Stitch/Xtatistix demo screens under `demo/`.
- Defined CLI-first and standalone UI implementation phases.
- Defined the initial MVP scope: LinkedIn and X, JSON output, deterministic local behavior, deferred LLM/API calls, and no direct publishing.
- Documented the working structure for CLI/domain code, standalone UI implementation, accepted demo references, and read-only tests.

## [social-agent-v0.1.0] - 2026-04-25

### Contributors

- Akbulut55

### Added

- Initialized `social-agent` package release tracking.

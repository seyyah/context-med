# Changelog

All notable changes to `social-agent` will be documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com) - [Semantic Versioning](https://semver.org).

## [Unreleased]

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

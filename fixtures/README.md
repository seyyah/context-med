# fixtures/ — Shared Mock & Dummy Data

Shared test fixtures for all `context-med` packages. Every package's CLI tests
should reference this directory for input data, ensuring consistent and
reproducible test runs across the monorepo.

## Directory Structure

```
fixtures/
├── wiki/                    # Sample micro-wiki pages (markdown)
│   ├── cardiovascular/
│   │   └── atrial-fibrillation.md
│   ├── oncology/
│   │   └── breast-cancer.md
│   └── emergency/
│       └── chest-pain-triage.md
├── raw/                     # Sample raw source documents
│   ├── sample-paper.txt
│   ├── sample-meeting-notes.txt
│   └── sample-thesis-abstract.txt
├── config/                  # Sample YAML configurations
│   ├── summary-10min.yaml
│   ├── conference-10min.yaml
│   └── jama-visual-abstract.yaml
├── json/                    # Sample structured outputs
│   ├── visual-abstract-sample.json
│   └── manuscript-imrad-sample.json
├── scenarios/               # Sample simulation scenarios
│   └── acs-chest-pain-01.yaml
├── shield/                  # PII masking test data
│   └── sample-with-pii.txt
└── README.md                # This file
```

## Usage in CLI Tests

```javascript
const path = require('path');
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');

// Example: reference a wiki fixture
const wikiPath = path.join(FIXTURES_DIR, 'wiki/cardiovascular/atrial-fibrillation.md');
```

## Rules

1. **Never commit real patient data.** All fixtures are synthetic/mock.
2. **Keep fixtures minimal.** Just enough to exercise CLI commands.
3. **Use English as the primary language** for fixture content; Turkish (`_tr` suffix) variants are optional.
4. Fixture files should be **deterministic** — no randomized content.

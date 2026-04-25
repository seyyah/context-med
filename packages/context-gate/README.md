# context-gate

Input quality control and ingestion module for Context-Med.

## CLI

```bash
python -m context_gate.cli status --format json
python -m context_gate.cli ingest --input ./paper.txt --output ./out/gate-profile.json --domain cardiovascular
python -m context_gate.cli lint --input ./out/gate-profile.json --format json
```

`ingest` reads a supported source document, runs baseline quality checks, writes a structured gate profile, and copies the approved source plus provenance manifest into `packages/context-gate/raw/`.

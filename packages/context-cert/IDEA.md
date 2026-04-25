# context-cert — IDEA.md

## Purpose

`context-cert` generates medical certification exam questions (MCQ / short-answer)
from wiki pages or raw academic text. It is a standalone CLI with no hard
dependencies on other context-med modules.

## CLI Commands

| Verb | Purpose | Required Flags |
|------|---------|----------------|
| `generate` | Create quiz questions from input | `--input`, `--output` |
| `review` | List/filter existing draft question sets | `--status` |
| `eval` | Ratchet evaluation against a baseline | `--input`, `--baseline` |

## Output Schema

```json
{
  "quiz": {
    "source": "<path or URI of input>",
    "generated_at": "<ISO-8601 timestamp>",
    "difficulty": "easy|medium|hard",
    "questions": [
      {
        "id": "q1",
        "type": "mcq",
        "stem": "Which score is used to stratify stroke risk in AF?",
        "options": ["GRACE", "CHA₂DS₂-VASc", "TIMI", "HEART"],
        "answer": "CHA₂DS₂-VASc",
        "source_quote": "The CHA₂DS₂-VASc score is the standard tool for stroke risk stratification",
        "explanation": "..."
      }
    ]
  }
}
```

## Invariants

1. **Extract, Never Generate** — Every question stem and answer must trace back
   verbatim to a passage in the source document (`source_quote` field required).
2. **Deterministic** — Same input + flags → same output (timestamps excluded).
3. **Zero PII** — No patient-identifiable information in generated questions.

## Flags

```
generate
  --input,      -i  <path>   Input file or directory (md, txt)
  --output,     -o  <path>   Output JSON file
  --count,      -n  <int>    Number of questions to generate (default: 10)
  --difficulty, -d  <level>  easy | medium | hard (default: medium)
  --format,     -f  <type>   json | md (default: json)
  --language,   -l  <lang>   en | tr (default: en)
  --dry-run                  Parse + plan without writing output
  --verbose,    -v           Detailed logs
  --quiet,      -q           Errors only

review
  --status      <s>   draft | approved | rejected (default: draft)
  --format      <f>   json | md | table (default: table)

eval
  --input       <path>  New quiz JSON
  --baseline    <path>  Previous quiz JSON (baseline)
```

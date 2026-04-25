# context-narrate

## Project Overview
This module transforms verified wiki content into a multi-role, segment-based audio narration pipeline. It guarantees source transparency and deterministic outputs.

## CLI Usage
Example commands to use the CLI:
```bash
node bin/cli.js --help
node bin/cli.js generate --input demo/sample-wiki.json --output demo/output
node bin/cli.js generate --input demo/sample-wiki.json --output demo/output --dry-run
node bin/cli.js faq --input demo/sample-wiki.json --output demo/output
```

## Output Files
When running the `generate` command, the following files are produced:
- `segments.json`: Detailed segment array with id, role, section, text, sourceRefs, verified, and estimated timings.
- `narration.json`: The overarching pipeline configuration containing metadata and segments.
- `transcript.md`: A formatted transcript showing timestamps and speaker roles.
- `show-notes.md`: Podcast-style show notes summarizing the content, sources, and policies.
- `run-report.md`: Summary of the execution, segments count, and total duration.
- `audio.mp3`: The final audio output stream (currently mock).
- `faq.md`: Output from the `faq` command with Q&A and source references.

## Roles Explanation
The narrative utilizes a multi-role casting model:
- **narrator**: The primary voice delivering the main content.
- **emphasizer**: Focuses on critical numbers, warnings, contrasts, risks, or key clinical data.
- **citation**: Explicitly voices source references.
- **expert**: Delivers explanatory clinical interpretations derived strictly from the input.
- **cohost**: Provides transitions, summaries, and acts as a conversational partner.

## Verification Policy
Every generated statement is derived from the provided wiki input. No unsupported medical or academic claim is added.

## TTS Usage
The CLI integrates with the OpenAI TTS API to generate real audio streams. If no API key is provided, it falls back to a deterministic dummy `audio.mp3` file to preserve tests and demo structure.

### Generating Mock Audio (Default)
```bash
node bin/cli.js generate --input demo/sample-wiki.json --output demo/output --tts mock
```
*Note: Mock mode is the default and guarantees test and demo backwards compatibility.*

### Generating Real Audio (OpenAI)
To generate real spoken audio, provide your OpenAI key:
```bash
OPENAI_API_KEY=your_key node bin/cli.js generate --input demo/sample-wiki.json --output demo/output --tts openai --voice alloy
```
*If the API key is missing or the request fails, the adapter safely degrades to `mock` mode.*

## Demo UI (Localhost)
The package includes a built-in demo UI that visualizes the generated output.

### How to produce the demo output:
You can generate all necessary output files for the demo in one go:
```bash
cd demo
npm install
npm run demo:all
```
This runs the generate and faq commands and places `segments.json`, `transcript.md`, `show-notes.md`, etc., in the `demo/output` directory.

### How to run the Demo UI on localhost:
To view the UI without encountering local file fetch errors in the browser, start the built-in HTTP server:
```bash
cd demo
npm run dev
```
The server will start at `http://localhost:5173`. Open this URL in your browser. The UI will automatically read the generated `demo/output` files and the `sample-wiki.json` source.

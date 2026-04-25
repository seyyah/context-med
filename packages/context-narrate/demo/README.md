# Context Narrate Demo

## Demo Objective
To demonstrate the production of a deterministic, multi-role narration from verified text inputs using the `context-narrate` CLI.

## Setup & Installation
Install the parent package locally in the demo folder:
```bash
npm install
```

## Running the Demo Scripts
You can easily generate all outputs by running:
```bash
npm run demo:all
```
*Alternatively, run individual commands:*
- `npm run demo:generate`: Generates full pipeline.
- `npm run demo:dry-run`: Runs generation without writing files.
- `npm run demo:faq`: Generates FAQ markdown.

## Design Reference
The high-tech Stitch design mockups that guide the dashboard aesthetic are located in:
- `demo/design/source-mapping.png`
- `demo/design/wiki-repository.png`
- `demo/design/script-roles.png`
- `demo/design/audio-learning.png`

## Output Folder Files
Running the demo commands populates the `output` directory with:
- `narration.json`: Pipeline configuration with metadata.
- `segments.json`: Detailed segment list with roles, sections, timestamps and sources.
- `transcript.md`: Formatted transcript with timestamps and role markers.
- `show-notes.md`: Podcast-style show notes with verification policy.
- `run-report.md`: Summary of the generation process.
- `audio.mp3`: Output audio stream (mock).
- `faq.md`: FAQ generated with source transparency.

## Visual Demo UI
A visual dashboard corresponding to the Stitch design files is provided to visualize the pipeline outputs.

### Opening the UI
To ensure the UI can read the local JSON files properly without browser CORS issues, a zero-dependency local HTTP server is provided.

1. Open your terminal in the `demo` directory.
2. Run the local server script:
   ```bash
   npm run dev
   ```
3. The server will output a localhost URL (e.g., `http://localhost:5173`). Open this URL in your browser. It will automatically load the UI and read from the `demo/output` files correctly.

#!/usr/bin/env node
'use strict';

const express = require('express');
const { execFileSync, execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const REPO_ROOT = path.resolve(__dirname, '../../..');
const CLI = path.join(REPO_ROOT, 'packages/context-wiki/bin/cli.js');
const FIXTURES_RAW = path.join(REPO_ROOT, 'fixtures/raw');
const FIXTURES_EXPERIMENTS = path.join(REPO_ROOT, 'fixtures/experiments');

// Shared temp wiki dir for the demo session
const DEMO_WIKI = path.join(os.tmpdir(), 'context-wiki-demo-' + process.pid);
fs.mkdirSync(DEMO_WIKI, { recursive: true });

function runCli(args, options = {}) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env },
      ...options,
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

// GET /api/files — list available raw fixture files
app.get('/api/files', (_req, res) => {
  const files = fs.readdirSync(FIXTURES_RAW)
    .filter(f => f.endsWith('.txt') || f.endsWith('.md'));
  res.json({ files });
});

// GET /api/experiments — list available experiment specs
app.get('/api/experiments', (_req, res) => {
  const files = fs.readdirSync(FIXTURES_EXPERIMENTS)
    .filter(f => f.endsWith('.json'));
  const specs = files.map(f => {
    try {
      return { file: f, ...JSON.parse(fs.readFileSync(path.join(FIXTURES_EXPERIMENTS, f), 'utf8')) };
    } catch {
      return { file: f };
    }
  });
  res.json({ specs });
});

// GET /api/wiki-pages — list pages currently in demo wiki
app.get('/api/wiki-pages', (_req, res) => {
  const files = fs.readdirSync(DEMO_WIKI)
    .filter(f => f.endsWith('.md') || f.endsWith('.json'));
  res.json({ pages: files, wikiDir: DEMO_WIKI });
});

// POST /api/ingest — ingest a file into the demo wiki
app.post('/api/ingest', (req, res) => {
  const { filename, format = 'md' } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });

  const inputPath = path.join(FIXTURES_RAW, path.basename(filename));
  if (!fs.existsSync(inputPath)) {
    return res.status(404).json({ error: `File not found: ${filename}` });
  }

  const result = runCli([
    'ingest',
    '--input', inputPath,
    '--output', DEMO_WIKI,
    '--format', format,
  ]);

  if (result.exitCode !== 0) {
    return res.status(500).json({
      error: result.stderr || 'Ingest failed',
      exitCode: result.exitCode,
    });
  }

  // Read the generated file to show frontmatter preview
  const outFile = path.join(DEMO_WIKI, path.basename(filename, path.extname(filename)) + '.' + format);
  let preview = '';
  if (fs.existsSync(outFile)) {
    const raw = fs.readFileSync(outFile, 'utf8');
    // Extract frontmatter block (first 400 chars of file for preview)
    preview = raw.slice(0, 600);
  }

  const pages = fs.readdirSync(DEMO_WIKI).filter(f => f.endsWith('.md') || f.endsWith('.json'));
  res.json({
    success: true,
    stdout: result.stdout,
    preview,
    pages,
    wikiDir: DEMO_WIKI,
  });
});

// POST /api/query — query the demo wiki
app.post('/api/query', (req, res) => {
  const { query, format = 'json' } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  const pages = fs.readdirSync(DEMO_WIKI).filter(f => f.endsWith('.md'));
  if (pages.length === 0) {
    return res.status(400).json({ error: 'No wiki pages. Run Ingest first.' });
  }

  const result = runCli([
    'query',
    '--input', DEMO_WIKI,
    '--query', query,
    '--format', 'json',
  ]);

  if (result.exitCode === 2) {
    // Guardrail: I don't know
    let parsed = null;
    try { parsed = JSON.parse(result.stdout); } catch {}
    return res.status(200).json({
      exitCode: 2,
      answer: null,
      confidence: 'none',
      source: null,
      source_hash: null,
      stderr: result.stderr,
      parsed,
    });
  }

  if (result.exitCode !== 0) {
    return res.status(500).json({
      error: result.stderr || 'Query failed',
      exitCode: result.exitCode,
    });
  }

  let parsed = null;
  try { parsed = JSON.parse(result.stdout); } catch {}

  res.json({
    exitCode: 0,
    ...parsed,
  });
});

// POST /api/autoresearch — run an experiment spec
app.post('/api/autoresearch', (req, res) => {
  const { specFile } = req.body;
  if (!specFile) return res.status(400).json({ error: 'specFile required' });

  const specPath = path.join(FIXTURES_EXPERIMENTS, path.basename(specFile));
  if (!fs.existsSync(specPath)) {
    return res.status(404).json({ error: `Spec not found: ${specFile}` });
  }

  const pages = fs.readdirSync(DEMO_WIKI).filter(f => f.endsWith('.md'));
  if (pages.length === 0) {
    return res.status(400).json({ error: 'No wiki pages. Run Ingest first.' });
  }

  // autoresearch run logs to wiki/experiments/
  const result = runCli([
    'autoresearch', 'run',
    '--spec', specPath,
    '--wiki-dir', DEMO_WIKI,
  ]);

  if (result.exitCode !== 0) {
    return res.status(500).json({
      error: result.stderr || result.stdout || 'Experiment failed',
      exitCode: result.exitCode,
    });
  }

  // Find the logged experiment file
  const experimentsDir = path.join(DEMO_WIKI, 'experiments');
  let logFile = null;
  let logData = null;
  if (fs.existsSync(experimentsDir)) {
    const logs = fs.readdirSync(experimentsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    if (logs.length > 0) {
      logFile = logs[0];
      try {
        logData = JSON.parse(fs.readFileSync(path.join(experimentsDir, logFile), 'utf8'));
      } catch {}
    }
  }

  res.json({
    success: true,
    stdout: result.stdout,
    logFile,
    result: logData,
  });
});

// GET /api/lint — lint the demo wiki
app.get('/api/lint', (_req, res) => {
  const pages = fs.readdirSync(DEMO_WIKI).filter(f => f.endsWith('.md'));
  if (pages.length === 0) {
    return res.json({ valid: true, checked: 0, errors: [], message: 'No pages to lint.' });
  }

  const result = runCli([
    'lint',
    '--input', DEMO_WIKI,
    '--format', 'json',
  ]);

  let parsed = null;
  try { parsed = JSON.parse(result.stdout); } catch {}
  res.json(parsed ?? { valid: false, checked: 0, errors: [{ message: result.stderr }] });
});

// POST /api/reset — clear the demo wiki
app.post('/api/reset', (_req, res) => {
  for (const f of fs.readdirSync(DEMO_WIKI)) {
    const full = path.join(DEMO_WIKI, f);
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true });
    } else {
      fs.unlinkSync(full);
    }
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`context-wiki demo running at http://localhost:${PORT}`);
  console.log(`Demo wiki dir: ${DEMO_WIKI}`);
  console.log(`CLI: ${CLI}`);
});

import * as fs from 'fs';
import * as path from 'path';
import { AutoresearchOptions, ExperimentResult } from '../types';
import { loadSpec, runExperiment, logExperiment } from '../core/experiment';

export function runAutoresearchRun(opts: AutoresearchOptions): void {
  const spec = loadSpec(opts.spec);
  const wikiDir = opts.wikiDir;

  if (!fs.existsSync(wikiDir)) {
    process.stderr.write(`Wiki directory not found: ${wikiDir}\n`);
    process.exit(1);
  }

  const result = runExperiment(spec, wikiDir);

  const summary = [
    `Experiment : ${result.id}`,
    `Description: ${result.description}`,
    `Query      : ${result.query}`,
    `Answer     : ${result.answer.split('\n')[0]}`,
    `Source     : ${result.source}`,
    `Confidence : ${result.confidence}`,
    `Score      : ${result.score}/${result.maxScore}`,
    `Passed     : ${result.passed ? 'YES' : 'NO'}`,
  ].join('\n');

  process.stdout.write(summary + '\n');

  if (opts.dryRun) {
    process.stdout.write('[dry-run] Experiment result NOT written to disk.\n');
    process.exit(0);
  }

  const experimentsDir = path.join(wikiDir, 'experiments');
  const outPath = logExperiment(result, experimentsDir);

  if (opts.verbose) {
    process.stdout.write(`Logged to: ${outPath}\n`);
  }

  process.exit(result.passed ? 0 : 1);
}

export function runAutoresearchStatus(wikiDir: string): void {
  if (!fs.existsSync(wikiDir)) {
    process.stderr.write(`Wiki directory not found: ${wikiDir}\n`);
    process.exit(1);
  }

  const experimentsDir = path.join(wikiDir, 'experiments');

  if (!fs.existsSync(experimentsDir)) {
    process.stdout.write('No experiments found.\n');
    process.exit(0);
  }

  const files = fs.readdirSync(experimentsDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    process.stdout.write('No experiments found.\n');
    process.exit(0);
  }

  const pending: ExperimentResult[] = [];
  const reviewed: ExperimentResult[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(experimentsDir, file), 'utf8');
      const result: ExperimentResult = JSON.parse(raw);
      if (result.humanReviewed) reviewed.push(result);
      else pending.push(result);
    } catch {
      // skip malformed files
    }
  }

  process.stdout.write(`Pending review : ${pending.length}\n`);
  process.stdout.write(`Reviewed       : ${reviewed.length}\n`);

  for (const r of pending) {
    process.stdout.write(`  [PENDING] ${r.id} — score ${r.score}/${r.maxScore} — ${r.runAt}\n`);
  }

  process.exit(0);
}

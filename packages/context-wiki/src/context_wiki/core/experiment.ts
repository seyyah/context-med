// packages/context-wiki/src/context_wiki/core/experiment.ts
import * as fs from 'fs';
import * as path from 'path';
import { ExperimentSpec, ExperimentResult } from '../types';
import { loadWikiPages, queryWiki } from './retrieval';

export function loadSpec(specPath: string): ExperimentSpec {
  if (!fs.existsSync(specPath)) {
    process.stderr.write(`Experiment spec not found: ${specPath}\n`);
    process.exit(1);
  }
  const raw = fs.readFileSync(specPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    process.stderr.write(`Invalid JSON in spec: ${specPath}\n`);
    process.exit(1);
  }
  const spec = parsed as ExperimentSpec;
  if (
    typeof spec.id !== 'string' || !spec.id ||
    typeof spec.description !== 'string' || !spec.description ||
    typeof spec.query !== 'string' || !spec.query ||
    !Array.isArray(spec.expected_keywords)
  ) {
    process.stderr.write(`Spec missing required fields (id, description, query, expected_keywords): ${specPath}\n`);
    process.exit(2);
  }
  if (spec.expected_keywords.length === 0) {
    process.stderr.write(`expected_keywords must not be empty: ${specPath}\n`);
    process.exit(2);
  }
  return spec;
}

export function scoreResult(
  answer: string,
  expectedKeywords: string[],
): { score: number; maxScore: number; passed: boolean } {
  const lower = answer.toLowerCase();
  const score = expectedKeywords.filter(kw => lower.includes(kw.toLowerCase())).length;
  const maxScore = expectedKeywords.length;
  const passed = maxScore > 0 && score === maxScore;
  return { score, maxScore, passed };
}

export function runExperiment(spec: ExperimentSpec, wikiDir: string): ExperimentResult {
  const pages = loadWikiPages(wikiDir);
  const queryResult = queryWiki(pages, spec.query);
  const { score, maxScore, passed } = scoreResult(queryResult.answer, spec.expected_keywords);

  return {
    ...spec,
    answer: queryResult.answer,
    source: queryResult.source,
    source_hash: queryResult.source_hash,
    confidence: queryResult.confidence,
    score,
    maxScore,
    passed,
    runAt: new Date().toISOString(),
    humanReviewed: false,
  };
}

export function logExperiment(result: ExperimentResult, experimentsDir: string): string {
  fs.mkdirSync(experimentsDir, { recursive: true });
  const filename = `${result.id}-${result.runAt.replace(/[:.]/g, '-')}.json`;
  const outPath = path.join(experimentsDir, filename);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  return outPath;
}

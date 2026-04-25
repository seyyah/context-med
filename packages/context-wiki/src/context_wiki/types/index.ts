// packages/context-wiki/src/context_wiki/types/index.ts

export interface WikiPageFrontmatter {
  title: string;
  source: string;
  source_hash: string;
  generated_at: string;
  model: string;
  human_reviewed: boolean;
}

export interface WikiPage {
  frontmatter: WikiPageFrontmatter;
  content: string;
  filePath: string;
}

export interface QueryResult {
  query: string;
  answer: string;
  source: string;
  source_hash: string;
  confidence: 'high' | 'low' | 'none';
}

export interface LintError {
  file: string;
  field: string;
  message: string;
}

export interface LintResult {
  valid: boolean;
  errors: LintError[];
  checked: number;
}

export interface IngestOptions {
  input: string;
  output: string;
  format: 'md' | 'json';
  dryRun: boolean;
  verbose: boolean;
}

export interface QueryOptions {
  input: string;
  query: string;
  format: 'md' | 'json';
  verbose: boolean;
}

export interface LintOptions {
  input: string;
  format: 'md' | 'json';
  verbose: boolean;
}

export interface WritebackOptions {
  input: string;
  output: string;
  reviewed: boolean;
  force: boolean;
  dryRun: boolean;
}

export interface ExperimentSpec {
  id: string;
  description: string;
  query: string;
  expected_keywords: string[];
}

export interface ExperimentResult {
  id: string;
  description: string;
  query: string;
  expected_keywords: string[];
  answer: string;
  source: string;
  confidence: 'high' | 'low' | 'none';
  score: number;
  max_score: number;
  passed: boolean;
  run_at: string;
  human_reviewed: boolean;
}

export interface AutoresearchOptions {
  spec: string;
  wikiDir: string;
  dryRun: boolean;
  verbose: boolean;
}

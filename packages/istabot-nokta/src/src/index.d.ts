export interface Pico {
  P: string;
  I: string;
  C: string;
  O: string;
}

export interface TimelineMilestone {
  month: string;
  milestone: string;
}

export interface Scale {
  name: string;
  items: number;
  validatedTr: boolean;
  recommended: boolean;
}

export interface PowerAnalysis {
  minimumN: number;
  targetN: number;
  alpha: number;
  power: number;
  effectSize: number;
  notes: string;
}

export interface DataCollection {
  method: string;
  platform: string;
  notes: string;
}

export interface StudyDesign {
  type: string;
  inclusionCriteria: string;
  exclusionCriteria: string;
}

export interface DataDiagnostics {
  missingData: string;
  outlierRisk: string;
  normalityAssessment: string;
  distributionType: "parametric" | "non-parametric";
}

export interface TestSelection {
  primaryTest: string;
  rationale: string;
  alternativeTest: string;
}

export interface AnalysisPlan {
  dependentVariable: string;
  independentVariables: string[];
  covariates: string[];
  reportedStatistics: string[];
}

export interface InterpretationGuide {
  significanceThreshold: number;
  clinicalRelevanceNotes: string;
  limitations: string;
}

export interface Manuscript {
  title: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
}

export interface Reference {
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}

export interface JournalRecommendation {
  name: string;
  impactFactor: number;
  /** Scope match percentage (0-100) */
  scopeMatchScore: number;
  submissionNote: string;
}

export type Provider = "claude" | "openai";

export interface PublishContext {
  discover?: DiscoverResult;
  design?: DesignResult;
  execute?: ExecuteResult;
}

export interface BaseOptions {
  /**
   * API key for the selected provider.
   * Claude: falls back to ANTHROPIC_API_KEY env var.
   * OpenAI: falls back to OPENAI_API_KEY env var.
   */
  apiKey?: string;
  /**
   * LLM provider. Default: "claude"
   * "claude" → Anthropic Claude API
   * "openai" → OpenAI Chat Completions API
   */
  provider?: Provider;
  /**
   * Model ID.
   * Claude default: claude-sonnet-4-6
   * OpenAI default: gpt-4o
   */
  model?: string;
  /** Response language. Default: "tr" */
  language?: "tr" | "en";
  /** Max tokens. Default: 2000 (publish: 4000) */
  maxTokens?: number;
  /** Enable streaming. Requires onChunk. */
  stream?: boolean;
  /** Called with each streamed text chunk when stream=true. */
  onChunk?: (chunk: string) => void;
}

export interface DiscoverOptions extends BaseOptions {
  /** Clinical domain hint (e.g. "periodontology") */
  domain?: string;
}

export interface DiscoverResult {
  text: string;
  pico: Pico | null;
  researchQuestion: string | null;
  literatureGap: string | null;
  methodology: string | null;
  timeline: TimelineMilestone[] | null;
}

export interface DesignResult {
  text: string;
  powerAnalysis: PowerAnalysis | null;
  scales: Scale[] | null;
  dataCollection: DataCollection | null;
  studyDesign: StudyDesign | null;
}

export interface ExecuteResult {
  text: string;
  dataDiagnostics: DataDiagnostics | null;
  testSelection: TestSelection | null;
  analysisplan: AnalysisPlan | null;
  interpretationGuide: InterpretationGuide | null;
}

export interface PublishResult {
  text: string;
  manuscript: Manuscript | null;
  /** Total word count across all IMRAD sections (title excluded) */
  wordCount: number;
  references: Reference[] | null;
  titleAlternatives: string[] | null;
  journalRecommendations: JournalRecommendation[] | null;
}

export interface PipelineResult {
  discover: DiscoverResult;
  design: DesignResult;
  execute: ExecuteResult;
  publish: PublishResult;
}

export interface PipelineOptions extends DiscoverOptions {
  /** Called after each phase completes. */
  onProgress?: (phase: "discover" | "design" | "execute" | "publish", result: object) => void;
}

export declare function discover(input: string, options?: DiscoverOptions): Promise<DiscoverResult>;
export declare function design(input: string, options?: BaseOptions): Promise<DesignResult>;
export declare function execute(input: string, options?: BaseOptions): Promise<ExecuteResult>;
export interface PublishOptions extends BaseOptions {
  /**
   * Önceki faz sonuçları. Verilirse her IMRAD bölümü ilgili fazın çıktısından beslenir.
   * Introduction ← discover, Methods ← design, Results/Discussion ← execute
   */
  context?: PublishContext;
}

export declare function publish(input: string, options?: PublishOptions): Promise<PublishResult>;
export declare function pipeline(input: string, options?: PipelineOptions): Promise<PipelineResult>;

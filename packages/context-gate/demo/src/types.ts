import type { GateDemoArtifact } from 'context-med-gate';

export type Stage = 'upload' | 'analyzing' | 'hitl' | 'success';

export type FlowState = {
  stage: Stage;
  artifact: GateDemoArtifact | null;
  uploadedFile: File | null;
  activeAnalysisStep: number;
  note: string;
  domain: string;
  notebook: string;
};

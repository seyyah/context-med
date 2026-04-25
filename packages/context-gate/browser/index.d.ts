export type GateMetric = {
  label: string;
  value: string;
};

export type GateDemoArtifact = {
  file: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
  input: {
    path: string;
    file_name: string;
    domain: string;
    notebook: string;
    preview: string;
  };
  quality_control: {
    word_count: number;
    status: string;
    feedback: string;
    risk_level: string;
    swot: {
      strengths: string;
      weaknesses: string;
    };
  };
  provenance: {
    source_file: string;
    source_path: string;
    notebook: string;
    domain: string;
    ingested_at: string;
    sha256_hash: string;
    metrics: {
      word_count: number;
      quality_status: string;
    };
  };
  recommendation: 'approve' | 'reject';
  raw_delivery_path: string;
  manifest_path: string;
  completed_steps: string[];
  live_metrics: GateMetric[];
};

export const clinicalCuratorTheme: {
  colors: Record<string, string>;
  fonts: Record<string, string>;
  radius: Record<string, number>;
};

export const acceptedFormats: string[];
export const recommendedDomains: string[];
export const pipelineBlueprint: Array<{
  id: 'upload' | 'analyzing' | 'hitl' | 'success';
  label: string;
  description: string;
}>;

export function buildGateDemoArtifact(
  file: File,
  options?: { domain?: string; notebook?: string },
): Promise<GateDemoArtifact>;

export function createVirtualFile(
  name: string,
  content: string,
  type?: string,
): Promise<File>;

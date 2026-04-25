import { ArrowRight, CheckCircle2, FolderOutput, ScrollText } from 'lucide-react';
import type { GateDemoArtifact } from 'context-med-gate';
import { StageShell } from './StageShell';

type SuccessStageProps = {
  artifact: GateDemoArtifact;
  onReset: () => void;
};

export function SuccessStage({ artifact, onReset }: SuccessStageProps) {
  return (
    <StageShell
      eyebrow="Success state"
      title="Approved and ready for downstream raw delivery"
      description="The receipt keeps the palette restrained: emerald signals completion, while cyan and slate remain the core visual system."
      side={
        <div className="panel panel-subtle stack-md">
          <div className="side-header tone-success">
            <CheckCircle2 size={18} />
            <strong>Receipt summary</strong>
          </div>
          <div className="stack-xs">
            {artifact.completed_steps.map((step) => (
              <div key={step} className="receipt-step">
                <span className="receipt-dot" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="success-grid">
        <div className="panel panel-subtle success-hero">
          <div className="success-mark">
            <CheckCircle2 size={30} />
          </div>
          <div>
            <h2>{artifact.file.name} was approved</h2>
            <p>
              Gate profile and provenance manifest are ready for archival and downstream distribution.
            </p>
          </div>
        </div>

        <div className="panel panel-subtle stack-md">
          <div className="side-header">
            <ScrollText size={18} />
            <strong>Generated profile</strong>
          </div>
          <code className="digest">{artifact.manifest_path}</code>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Notebook</span>
              <strong>{artifact.input.notebook}</strong>
            </div>
            <div className="stat-card">
              <span>Domain</span>
              <strong>{artifact.input.domain}</strong>
            </div>
          </div>
        </div>

        <div className="panel panel-subtle stack-md">
          <div className="side-header">
            <FolderOutput size={18} />
            <strong>Raw delivery</strong>
          </div>
          <code className="digest">{artifact.raw_delivery_path}</code>
          <code className="digest">{artifact.provenance.sha256_hash.slice(0, 24)}...</code>
          <button type="button" className="button button-secondary" onClick={onReset}>
            Ingest another document
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </StageShell>
  );
}

import { AlertTriangle, CircleCheckBig, Fingerprint, NotebookPen } from 'lucide-react';
import type { GateDemoArtifact } from 'context-med-gate';
import { StageShell } from './StageShell';

type ReviewStageProps = {
  artifact: GateDemoArtifact;
  onApprove: () => void;
  onReject: () => void;
};

export function ReviewStage({ artifact, onApprove, onReject }: ReviewStageProps) {
  return (
    <StageShell
      eyebrow="HITL review"
      title="Clinical integrity review before raw delivery"
      description="This stage surfaces the same profile, provenance, and recommendation data a clinician or operator would review before approval."
      side={
        <>
          <div className="panel panel-subtle stack-sm">
            <div className="side-header tone-attention">
              <AlertTriangle size={18} />
              <strong>Human attention required</strong>
            </div>
            <p>
              System recommendation: high-confidence extraction. Review the atypical markers before
              releasing the raw artifact.
            </p>
          </div>
          <div className="panel panel-subtle stack-sm">
            <div className="side-header">
              <Fingerprint size={18} />
              <strong>Provenance digest</strong>
            </div>
            <code className="digest">{artifact.provenance.sha256_hash}</code>
          </div>
        </>
      }
    >
      <div className="review-banner">
        <AlertTriangle size={18} />
        <span>Amber is reserved for review prompts in the Stitch-derived design system.</span>
      </div>

      <div className="review-grid">
        <div className="panel panel-subtle stack-md">
          <div className="document-row">
            <div className="file-badge">{artifact.file.extension}</div>
            <div>
              <h2>{artifact.file.name}</h2>
              <p>
                {artifact.input.domain} domain · {artifact.input.notebook} notebook
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Word count</span>
              <strong>{artifact.quality_control.word_count.toLocaleString('en-US')}</strong>
            </div>
            <div className="stat-card">
              <span>Risk tier</span>
              <strong>{artifact.quality_control.risk_level}</strong>
            </div>
            <div className="stat-card">
              <span>Quality status</span>
              <strong>{artifact.quality_control.status}</strong>
            </div>
            <div className="stat-card">
              <span>Manifest</span>
              <strong>Ready</strong>
            </div>
          </div>
        </div>

        <div className="panel panel-subtle stack-md">
          <div className="side-header">
            <NotebookPen size={18} />
            <strong>Clinical note preview</strong>
          </div>
          <p className="note-preview">{artifact.input.preview}</p>
          <div className="review-actions">
            <button type="button" className="button button-secondary" onClick={onReject}>
              Flag for re-analysis
            </button>
            <button type="button" className="button button-primary" onClick={onApprove}>
              <CircleCheckBig size={18} />
              Approve extraction
            </button>
          </div>
        </div>
      </div>
    </StageShell>
  );
}

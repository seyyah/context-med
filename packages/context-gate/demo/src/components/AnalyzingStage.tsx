import { motion } from 'framer-motion';
import { Activity, Binary, FileScan, ShieldCheck } from 'lucide-react';
import type { GateDemoArtifact } from 'context-med-gate';
import { StageShell } from './StageShell';

const labels = [
  { icon: FileScan, title: 'Text extraction', body: 'Preparing the source for deterministic checks.' },
  { icon: Activity, title: 'Quality control', body: 'Estimating word count, feedback, and risk posture.' },
  { icon: Binary, title: 'SHA-256 provenance', body: 'Creating a portable hash for delivery and audit.' },
  { icon: ShieldCheck, title: 'Raw delivery package', body: 'Assembling profile and manifest for HITL review.' },
];

type AnalyzingStageProps = {
  artifact: GateDemoArtifact | null;
  activeStep: number;
};

export function AnalyzingStage({ artifact, activeStep }: AnalyzingStageProps) {
  const progress = ((activeStep + 1) / labels.length) * 100;

  return (
    <StageShell
      eyebrow="Analyze state"
      title="Neural-quality processing with visible checkpoints"
      description="The demo advances through the same conceptual steps as the CLI: extraction, quality control, provenance, and raw delivery."
      side={
        <div className="panel panel-subtle stack-md">
          <div className="side-header">
            <Activity size={18} />
            <strong>Live intelligence stream</strong>
          </div>
          <div className="stats-grid">
            {artifact?.live_metrics.map((metric) => (
              <div key={metric.label} className="stat-card">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <div className="analysis-hero panel panel-subtle">
        <div className="analysis-ring-wrap">
          <motion.div
            className="analysis-ring"
            animate={{ rotate: 360 }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 9, ease: 'linear' }}
          />
          <motion.div
            className="analysis-core"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.2, ease: 'easeInOut' }}
          >
            <span>{Math.round(progress)}%</span>
          </motion.div>
        </div>
        <div className="analysis-copy">
          <h2>Context Gate is building an approval packet</h2>
          <p>
            {artifact?.file.name ?? 'Uploaded file'} is moving through a staged pipeline designed for calm
            visibility instead of hidden background work.
          </p>
        </div>
      </div>

      <div className="timeline">
        {labels.map((item, index) => {
          const Icon = item.icon;
          const state =
            index < activeStep ? 'is-complete' : index === activeStep ? 'is-active' : 'is-pending';

          return (
            <div key={item.title} className={`timeline-step ${state}`}>
              <div className="timeline-icon">
                <Icon size={18} />
              </div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            </div>
          );
        })}
      </div>
    </StageShell>
  );
}

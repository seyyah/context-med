import { CheckCheck, FileUp, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { pipelineBlueprint } from 'context-med-gate';
import type { Stage } from '../types';

const icons = {
  upload: FileUp,
  analyzing: ScanSearch,
  hitl: Sparkles,
  success: ShieldCheck,
} as const;

type ProcessRailProps = {
  stage: Stage;
};

export function ProcessRail({ stage }: ProcessRailProps) {
  const activeIndex = pipelineBlueprint.findIndex((step) => step.id === stage);

  return (
    <aside className="process-rail panel">
      <div className="brand-lockup">
        <div className="brand-mark">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="eyebrow">Context Gate</p>
          <h2>Clinical Curator</h2>
        </div>
      </div>

      <div className="rail-copy">
        <h3>Ingestion workflow</h3>
        <p>
          Stitch-derived dark editorial system for a trustworthy intake and approval experience.
        </p>
      </div>

      <ol className="rail-steps">
        {pipelineBlueprint.map((step, index) => {
          const Icon = icons[step.id];
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li
              key={step.id}
              className={[
                'rail-step',
                isComplete ? 'is-complete' : '',
                isActive ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="rail-step-icon">
                {isComplete ? <CheckCheck size={18} /> : <Icon size={18} />}
              </div>
              <div>
                <strong>{step.label}</strong>
                <span>{step.description}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rail-footer panel panel-subtle">
        <span className="eyebrow">Design system</span>
        <p>Deep navy glass surfaces, cyan guidance, amber review prompts, and measured emerald success.</p>
      </div>
    </aside>
  );
}

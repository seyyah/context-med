import { Fragment, useRef, useState } from 'react';
import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { Panel } from '../components/Panel.jsx';
import { sourceContext } from '../data/workflowData.js';
import { generateWorkspaceRun } from '../services/mockWorkspaceGenerator.js';
import { runWorkspacePipeline } from '../services/workspacePipelineClient.js';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

const platformOptions = [
  ['linkedin', 'LinkedIn', 'Professional narrative, thought leadership, operational detail', true, false],
  ['x', 'X', 'Short-form post, sharper hook, direct question', true, false],
  ['instagram', 'Instagram', 'Caption-first visual adaptation', false, true],
  ['tiktok', 'TikTok', 'Short video hook and scene outline', false, true],
  ['youtube-shorts', 'YouTube Shorts', 'Short video script and overlay notes', false, true],
  ['reddit', 'Reddit', 'Community-aware discussion prompt', false, true]
];

const initialSelectedPlatforms = platformOptions
  .filter(([, , , checked, disabled]) => checked && !disabled)
  .map(([id]) => id);

const providerStage = {
  id: 'provider',
  label: 'Provider: mock',
  description: 'LLM_PROVIDER=mock; local deterministic generation; no API key required.',
  completedLabel: 'Mock ready',
  runningLabel: 'Checking',
  pendingLabel: 'Not checked'
};

const generationStages = [
  {
    id: 'adaptations',
    label: 'Raw adaptations',
    description: 'Rewrite source for selected platforms.',
    completedLabel: 'Complete',
    runningLabel: 'Generating',
    pendingLabel: 'Waiting'
  },
  {
    id: 'planSeeds',
    label: 'Plan seeds',
    description: 'Create weekly schedule candidates.',
    completedLabel: 'Complete',
    runningLabel: 'Generating',
    pendingLabel: 'Waiting'
  },
  {
    id: 'draftSeeds',
    label: 'Draft seeds',
    description: 'Build draft copy from plan slots.',
    completedLabel: 'Complete',
    runningLabel: 'Generating',
    pendingLabel: 'Waiting'
  },
  {
    id: 'reviewItems',
    label: 'Review items',
    description: 'Route risky items to review.',
    completedLabel: 'Complete',
    runningLabel: 'Generating',
    pendingLabel: 'Waiting'
  }
];
const pipelineStages = [providerStage, ...generationStages];

function createPipelineStatus(status = 'completed') {
  return pipelineStages.reduce((statuses, stage) => ({ ...statuses, [stage.id]: status }), {});
}

function createPendingPipelineStatus() {
  return {
    provider: 'completed',
    ...generationStages.reduce((statuses, stage) => ({ ...statuses, [stage.id]: 'pending' }), {})
  };
}

function createEmptyRun(sourceText = '') {
  return {
    sourcePreview: sourceText.slice(0, 140),
    adaptations: [],
    planSeeds: [],
    draftSeeds: [],
    reviewItems: []
  };
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function riskTone(risk) {
  if (risk === 'High Risk') {
    return 'danger';
  }

  if (risk === 'Medium Risk') {
    return 'warning';
  }

  return 'success';
}

export function WorkspacePage() {
  const { refreshSnapshot, storageStatus, updateWorkspace, workflowState } = useWorkflowStore();
  const activeRunRef = useRef(0);
  const [pipelineStatus, setPipelineStatus] = useState(() => createPipelineStatus('completed'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const {
    source: workspaceSource,
    selectedPlatforms,
    run: workspaceRun
  } = workflowState.workspace;
  const workspaceDrafts = workspaceRun.adaptations;

  function togglePlatform(platformId) {
    updateWorkspace((currentWorkspace) => {
      const currentPlatforms = currentWorkspace.selectedPlatforms;

      return {
        ...currentWorkspace,
        selectedPlatforms: currentPlatforms.includes(platformId)
          ? currentPlatforms.filter((id) => id !== platformId)
          : [...currentPlatforms, platformId]
      };
    });
  }

  async function generateOutput() {
    if (!workspaceSource.trim()) {
      setFeedback('Add source content before generating the workspace run.');
      updateWorkspace({ run: createEmptyRun('') });
      setPipelineStatus(createPendingPipelineStatus());
      return;
    }

    if (!selectedPlatforms.length) {
      setFeedback('Select at least one supported platform.');
      updateWorkspace({ run: createEmptyRun(workspaceSource) });
      setPipelineStatus(createPendingPipelineStatus());
      return;
    }

    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    setIsGenerating(true);
    setFeedback('Starting backend workspace pipeline.');
    updateWorkspace({ run: createEmptyRun(workspaceSource) });
    setPipelineStatus(createPendingPipelineStatus());

    const pipelineResult = await runWorkspacePipeline({
      sourceText: workspaceSource,
      platforms: selectedPlatforms
    });
    const nextRun = pipelineResult.run;
    setFeedback(pipelineResult.message);

    for (const stage of generationStages) {
      if (activeRunRef.current !== runId) {
        return;
      }

      setPipelineStatus((currentStatus) => ({ ...currentStatus, [stage.id]: 'running' }));
      setFeedback(`Generating ${stage.label.toLowerCase()}...`);
      await wait(520);

      if (activeRunRef.current !== runId) {
        return;
      }

      updateWorkspace((currentWorkspace) => ({
        ...currentWorkspace,
        run: {
          ...currentWorkspace.run,
          [stage.id]: nextRun[stage.id]
        }
      }));
      setPipelineStatus((currentStatus) => ({ ...currentStatus, [stage.id]: 'completed' }));
    }

    updateWorkspace({ run: nextRun });
    if (pipelineResult.backend === 'api') {
      await refreshSnapshot();
    }
    setIsGenerating(false);
    setFeedback(
      `Workspace run complete: ${nextRun.adaptations.length} adaptations, ${nextRun.planSeeds.length} plan seeds, ${nextRun.draftSeeds.length} draft seeds, ${nextRun.reviewItems.length} review items.`
    );
  }

  function resetWorkspace() {
    const resetRun = generateWorkspaceRun({
      sourceText: sourceContext,
      platforms: initialSelectedPlatforms
    });

    activeRunRef.current += 1;
    updateWorkspace({
      source: sourceContext,
      selectedPlatforms: initialSelectedPlatforms,
      run: resetRun
    });
    setPipelineStatus(createPipelineStatus('completed'));
    setIsGenerating(false);
    setFeedback('Workspace input reset to the default source and mock run.');
  }

  return (
    <div className="page workspace-page">
      <header className="page-header">
        <div>
          <h1>Workspace</h1>
          <p>Add the source content you want to share, then choose which platforms should receive adapted outputs.</p>
        </div>
      </header>

      <Panel
        className="input-panel"
        title="Source and target platforms"
        description="Provide the source content, then select the channels that should receive platform-native copy."
      >
        <div className="input-grid">
          <label className="source-context-field">
            <textarea value={workspaceSource} onChange={(event) => updateWorkspace({ source: event.target.value })} />
          </label>
          <section className="platform-selection-panel" aria-labelledby="workspace-platforms">
            <div>
              <span id="workspace-platforms">Platform Selection</span>
              <p>Select target platforms for platform-specific rewriting. LinkedIn and X are the current MVP outputs.</p>
            </div>
            <div className="platform-option-list">
              {platformOptions.map(([id, label, description, checked, disabled]) => (
                <label className={disabled ? 'platform-option disabled' : 'platform-option'} key={id}>
                  <input
                    checked={disabled ? false : selectedPlatforms.includes(id)}
                    disabled={disabled}
                    onChange={() => togglePlatform(id)}
                    type="checkbox"
                  />
                  <div>
                    <strong>{label}</strong>
                    <small>{description}</small>
                    {disabled ? <em>Later phase</em> : null}
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
        <div className="input-actions">
          <button className="primary" disabled={isGenerating} onClick={generateOutput} type="button">
            <Icon name="refresh" />
            {isGenerating ? 'Generating...' : 'Generate Output'}
          </button>
          <button disabled={isGenerating} onClick={resetWorkspace} type="button">
            <Icon name="restart_alt" />
            Reset Input
          </button>
        </div>
      </Panel>

      <section className="workspace-pipeline" aria-live="polite">
        <header>
          <div>
            <span className="kicker">Generation Pipeline</span>
            <h2>Workspace run</h2>
            <p>Mock generation moves from source adaptation to planning, draft creation, and review routing.</p>
          </div>
          <span className={isGenerating ? 'pipeline-run-state running' : 'pipeline-run-state'}>
            {isGenerating ? 'Running' : 'Ready'}
          </span>
        </header>
        <div className="pipeline-track">
          {pipelineStages.map((stage, index) => {
            const status = pipelineStatus[stage.id];
            const provider = workspaceRun.generation;
            const title = stage.id === 'provider' && provider ? `Provider: ${provider.provider}` : stage.label;
            const description = stage.id === 'provider'
              ? `${provider?.model || stage.description} Storage: ${storageStatus.backend === 'sqlite' ? 'SQLite' : storageStatus.backend === 'browser' ? 'browser fallback' : 'loading'}.`
              : stage.description;

            return (
              <article className={`pipeline-step ${status}`} key={stage.id}>
                <div className="pipeline-marker">
                  {status === 'completed' ? <Icon name="check" /> : status === 'running' ? <Icon name="sync" /> : index + 1}
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span>
                    {status === 'completed'
                      ? stage.completedLabel
                      : status === 'running'
                        ? stage.runningLabel
                        : stage.pendingLabel}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Panel
        title="Workspace run output"
        description="Generated run data includes platform adaptation drafts, plan seeds, draft seeds, and review queue items."
      >
        {feedback ? <p className="workspace-feedback">{feedback}</p> : null}
        <div className="workspace-run-summary">
          <article>
            <span>Raw adaptations</span>
            <strong>{workspaceRun.adaptations.length}</strong>
          </article>
          <article>
            <span>Plan seeds</span>
            <strong>{workspaceRun.planSeeds.length}</strong>
          </article>
          <article>
            <span>Draft seeds</span>
            <strong>{workspaceRun.draftSeeds.length}</strong>
          </article>
          <article>
            <span>Review items</span>
            <strong>{workspaceRun.reviewItems.length}</strong>
          </article>
        </div>
        {workspaceDrafts.length ? (
          <div className="platform-output-grid">
            {workspaceDrafts.map((draft) => (
            <article className="platform-output" key={draft.id}>
              <div className="platform-output-head">
                <div>
                  <span>{draft.platform}</span>
                  <h3>{draft.hook}</h3>
                </div>
                <div className="badges">
                  <Badge tone={riskTone(draft.risk)}>{draft.risk}</Badge>
                  <Badge tone="warning">{draft.status}</Badge>
                </div>
              </div>
              <div className="post-preview">
                {draft.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {draft.cta ? <p>{draft.cta}</p> : null}
                {draft.hashtags ? <p>{draft.hashtags}</p> : null}
              </div>
              <details>
                <summary>Adaptation details</summary>
                <dl>
                  {draft.adaptationDetails.map(([label, value]) => (
                    <Fragment key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </Fragment>
                  ))}
                </dl>
              </details>
            </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-state">
            <strong>No platform output yet</strong>
            <p>Add source content and select LinkedIn, X, or both before generating output.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

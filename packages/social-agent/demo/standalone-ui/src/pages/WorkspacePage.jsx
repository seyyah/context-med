import { Fragment, useState } from 'react';
import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { Panel } from '../components/Panel.jsx';
import { sourceContext } from '../data/mockData.js';
import { generateWorkspaceDrafts } from '../services/mockWorkspaceGenerator.js';

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
  const [workspaceSource, setWorkspaceSource] = useState(sourceContext);
  const [selectedPlatforms, setSelectedPlatforms] = useState(initialSelectedPlatforms);
  const [workspaceDrafts, setWorkspaceDrafts] = useState(() =>
    generateWorkspaceDrafts({
      sourceText: sourceContext,
      platforms: initialSelectedPlatforms
    })
  );
  const [feedback, setFeedback] = useState('');

  function togglePlatform(platformId) {
    setSelectedPlatforms((currentPlatforms) =>
      currentPlatforms.includes(platformId)
        ? currentPlatforms.filter((id) => id !== platformId)
        : [...currentPlatforms, platformId]
    );
  }

  function generateOutput() {
    if (!workspaceSource.trim()) {
      setFeedback('Add source content before generating platform outputs.');
      setWorkspaceDrafts([]);
      return;
    }

    if (!selectedPlatforms.length) {
      setFeedback('Select at least one supported platform.');
      setWorkspaceDrafts([]);
      return;
    }

    const nextDrafts = generateWorkspaceDrafts({
      sourceText: workspaceSource,
      platforms: selectedPlatforms
    });

    setWorkspaceDrafts(nextDrafts);
    setFeedback(`Generated ${nextDrafts.length} platform output${nextDrafts.length === 1 ? '' : 's'} from the current source.`);
  }

  function resetWorkspace() {
    setWorkspaceSource(sourceContext);
    setSelectedPlatforms(initialSelectedPlatforms);
    setWorkspaceDrafts(
      generateWorkspaceDrafts({
        sourceText: sourceContext,
        platforms: initialSelectedPlatforms
      })
    );
    setFeedback('Workspace input reset to the default source.');
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
            <textarea value={workspaceSource} onChange={(event) => setWorkspaceSource(event.target.value)} />
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
          <button className="primary" onClick={generateOutput} type="button">
            <Icon name="refresh" />
            Generate Output
          </button>
          <button onClick={resetWorkspace} type="button">
            <Icon name="restart_alt" />
            Reset Input
          </button>
        </div>
      </Panel>

      <Panel
        title="Final platform outputs"
        description="The source input is rewritten into platform-native copy instead of being copied across channels."
      >
        {feedback ? <p className="workspace-feedback">{feedback}</p> : null}
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

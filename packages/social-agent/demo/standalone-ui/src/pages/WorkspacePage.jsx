import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { Panel } from '../components/Panel.jsx';
import { communityComments, drafts, sourceContext } from '../data/mockData.js';

export function WorkspacePage() {
  return (
    <div className="page workspace-page">
      <header className="page-header">
        <div>
          <span className="kicker">Live Input</span>
          <h1>Workspace</h1>
          <p>Edit source context and community comments before generating the package used by every screen.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Icon name="content_copy" />
            Copy JSON
          </button>
          <button className="primary" type="button">
            <Icon name="autorenew" />
            Generate Output
          </button>
        </div>
      </header>

      <Panel className="input-panel">
        <div className="input-grid">
          <label>
            <span>Source Context</span>
            <textarea defaultValue={sourceContext} />
          </label>
          <label>
            <span>Community Comments</span>
            <textarea defaultValue={communityComments} />
          </label>
        </div>
        <div className="input-actions">
          <button className="primary" type="button">
            <Icon name="refresh" />
            Generate Demo Output
          </button>
          <button type="button">
            <Icon name="restart_alt" />
            Reset Demo
          </button>
        </div>
      </Panel>

      <Panel
        kicker="Generated Output"
        title="Final platform outputs"
        description="The source input is rewritten into platform-native copy instead of being copied across channels."
      >
        <div className="platform-output-grid">
          {drafts.map((draft) => (
            <article className="platform-output" key={draft.id}>
              <div className="platform-output-head">
                <div>
                  <span>{draft.platform}</span>
                  <h3>{draft.hook}</h3>
                </div>
                <div className="badges">
                  <Badge tone="success">{draft.risk}</Badge>
                  <Badge tone="warning">{draft.status}</Badge>
                </div>
              </div>
              <div className="post-preview">
                {draft.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <p>{draft.cta}</p>
                <p>{draft.hashtags}</p>
              </div>
              <details>
                <summary>Adaptation details</summary>
                <dl>
                  <dt>Strategy</dt>
                  <dd>{draft.tone === 'linkedin' ? 'Professional narrative with operational guardrails.' : 'Short, direct, and constraint-aware.'}</dd>
                  <dt>Boundary</dt>
                  <dd>No diagnosis, treatment, or clinical judgment replacement claims.</dd>
                </dl>
              </details>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

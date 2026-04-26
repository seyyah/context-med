import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';

const writebackItems = [
  ['WB-882', 'Approved LinkedIn copy is ready for manual handoff, but direct publishing remains disabled.', 'LinkedIn', 92, 'Pending'],
  ['WB-881', 'X short-form copy can be exported after review queue approval.', 'X', 88, 'Pending'],
  ['WB-880', 'Privacy-sensitive moderation response requires escalation before any public reply.', 'Community', 74, 'Blocked'],
  ['WB-879', 'Package manifest can be copied into an external workflow after human approval.', 'Package', 95, 'Pending']
];

export function WritebackPage() {
  return (
    <div className="page writeback-page original-writeback-page">
      <header className="section-title-row writeback-title-row">
        <div>
          <h1>Pending Writeback</h1>
          <p>Review handoff candidates before committing them to external systems or team workflows.</p>
        </div>
        <button type="button">
          <Icon name="filter_list" />
          Filter Queue
        </button>
      </header>

      <section className="writeback-summary-grid">
        <article>
          <div>
            <span>Pending Review</span>
            <Icon name="hourglass_empty" />
          </div>
          <p>
            <strong>4</strong>
            <span>writeback candidates</span>
          </p>
        </article>
        <article>
          <div>
            <span>Accepted Handoffs</span>
            <Icon name="check_circle" />
          </div>
          <p>
            <strong>12</strong>
            <span>this demo session</span>
          </p>
        </article>
        <article>
          <div>
            <span>Rejected</span>
            <Icon name="cancel" />
          </div>
          <p>
            <strong>1</strong>
            <span>policy boundary</span>
          </p>
        </article>
      </section>

      <div className="writeback-workspace-grid">
        <section className="writeback-queue-card">
          <header>
            <h2>Extraction Queue</h2>
            <label>
              <Icon name="search" />
              <input placeholder="Search statements..." />
            </label>
          </header>

          <div className="table-wrap">
            <table className="dense-table writeback-table">
              <thead>
                <tr>
                  <th>Insight ID</th>
                  <th>Extracted Statement</th>
                  <th>Platform</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {writebackItems.map(([id, statement, platform, confidence, status], index) => (
                  <tr className={index === 0 ? 'selected-row' : ''} key={id}>
                    <td>{id}</td>
                    <td>{statement}</td>
                    <td>
                      <span className="writeback-platform">
                        <Icon name={platform === 'LinkedIn' ? 'business_center' : platform === 'X' ? 'alternate_email' : platform === 'Community' ? 'forum' : 'inventory_2'} />
                        {platform}
                      </span>
                    </td>
                    <td>
                      <span className="confidence-meter">
                        <i style={{ width: `${confidence}%` }} />
                      </span>
                      <small>{confidence}%</small>
                    </td>
                    <td>
                      <Badge tone={status === 'Blocked' ? 'danger' : 'neutral'}>{status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="writeback-context-panel">
          <header>
            <div>
              <Icon name="memory" />
              <h2>Handoff Context</h2>
            </div>
            <span>WB-882</span>
          </header>

          <div className="writeback-context-body">
            <section>
              <label>Extracted Statement</label>
              <p>Approved LinkedIn copy is ready for manual handoff, but direct publishing remains disabled.</p>
            </section>

            <section>
              <label>
                Source Evidence
                <span>
                  <Icon name="check_circle" />
                  92% Conf
                </span>
              </label>
              <blockquote>
                "The package includes plan, drafts, moderation, and review queue artifacts. It should be exported manually after human approval."
              </blockquote>
              <div className="evidence-tags">
                <span>Boundary: No direct publishing</span>
                <span>Intent: Manual handoff</span>
              </div>
            </section>

            <section>
              <label>Suggested Destination</label>
              <div className="destination-card">
                <Icon name="folder_special" />
                <div>
                  <strong>External Review Folder / Social-Agent Demo</strong>
                  <span>Append as exported package documentation.</span>
                </div>
              </div>
            </section>
          </div>

          <footer>
            <button className="primary" type="button">
              <Icon name="done_all" />
              Accept Handoff
            </button>
            <button type="button">
              <Icon name="close" />
              Reject
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

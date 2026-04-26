import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { planItems } from '../data/mockData.js';

const selectedPlan = planItems[0];

function PlatformMark({ platform }) {
  const isLinkedIn = platform === 'LinkedIn';
  return <span className={isLinkedIn ? 'platform-mark linkedin-mark-small' : 'platform-mark x-mark-small'}>{isLinkedIn ? 'in' : 'X'}</span>;
}

export function PlanPage() {
  return (
    <div className="page plan-page original-plan-page">
      <div className="plan-title-row">
        <h1>Generated Weekly Plan</h1>
        <div className="plan-filter-row">
          <button type="button">
            <Icon name="calendar_today" />
            Current Week
            <Icon name="arrow_drop_down" />
          </button>
          <button type="button">
            <Icon name="filter_list" />
            Platform: All
            <Icon name="arrow_drop_down" />
          </button>
          <button type="button">
            <Icon name="category" />
            Pillar: All
            <Icon name="arrow_drop_down" />
          </button>
          <button className="primary" type="button">
            <Icon name="refresh" filled />
            Regenerate Plan
          </button>
        </div>
      </div>

      <div className="plan-workspace-grid">
        <section className="plan-table-card">
          <div className="table-wrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Platform</th>
                  <th>Pillar / Objective</th>
                  <th>Hook Angle</th>
                  <th>Risk / Review</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {planItems.map((item, index) => (
                  <tr className={index === 0 ? 'selected-row' : ''} key={item.id}>
                    <td>{item.day}</td>
                    <td>
                      <span className="platform-cell">
                        <PlatformMark platform={item.platform} />
                        {item.platform}
                      </span>
                    </td>
                    <td>
                      <strong>{item.pillar}</strong>
                      <span>{index % 2 === 0 ? 'Engagement' : 'Awareness'}</span>
                    </td>
                    <td>{item.topic}. {item.cta}</td>
                    <td>
                      <div className="risk-stack">
                        <Badge tone={item.risk === 'High' ? 'danger' : 'warning'}>{item.risk} Risk</Badge>
                        {item.status !== 'Draft' ? <Badge>Review Req</Badge> : null}
                      </div>
                    </td>
                    <td>
                      <a className="output-link" href="#">
                        <Icon name="code" />
                        {item.platform.toLowerCase()}_{index + 1}.json
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>Showing 4 generated artifacts for this week</span>
            <div>
              <button type="button">
                <Icon name="chevron_left" />
              </button>
              <button type="button">
                <Icon name="chevron_right" />
              </button>
            </div>
          </footer>
        </section>

        <aside className="rationale-panel">
          <div>
            <div className="rationale-meta">
              <Badge tone="neutral">{selectedPlan.day}</Badge>
              <span>{selectedPlan.platform}</span>
            </div>
            <h2>Artifact Rationale</h2>
            <p>Detailed breakdown of generation logic for the selected plan item.</p>
          </div>

          <div className="rationale-stack">
            <article>
              <h3>
                <Icon name="insights" />
                Why this idea now?
              </h3>
              <p>The patient intake update is framed around operational clarity, faster routing, and review discipline because those are the safest claims supported by the source context.</p>
            </article>
            <article>
              <h3>
                <Icon name="source" />
                Source context used
              </h3>
              <ul>
                <li>
                  <Icon name="description" />
                  Patient intake dashboard update
                </li>
                <li>
                  <Icon name="forum" />
                  Community privacy and crisis questions
                </li>
              </ul>
            </article>
            <article>
              <h3>
                <Icon name="format_paint" />
                Suggested format
              </h3>
              <p>LinkedIn gets a professional operational post. X gets a compact version with one direct question and no unsupported clinical claims.</p>
            </article>
            <article className="risk-explanation">
              <h3>
                <Icon name="warning" />
                Risk explanation
              </h3>
              <p>Review is required because the input mentions patient safety, privacy, and crisis escalation. Final copy must avoid diagnosis or treatment claims.</p>
              <button type="button">
                <Icon name="edit_note" />
                Open in Drafts
              </button>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}

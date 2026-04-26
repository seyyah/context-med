import { DraftCard } from '../components/DraftCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { drafts } from '../data/mockData.js';

const activePlans = [
  ['Campaign', 'Today', 'Patient intake dashboard update', '2 platforms generated', true],
  ['Feature', 'Yesterday', 'Human review gates', '1 platform generated', false],
  ['Safety', 'Apr 25', 'Crisis escalation workflow', 'Needs moderation', false]
];

export function DraftsPage() {
  return (
    <div className="drafts-page-layout">
      <aside className="plans-panel">
        <div className="panel-heading">
          <h2>Active Plans</h2>
          <button aria-label="Filter plans" type="button">
            <Icon name="filter_list" />
          </button>
        </div>
        <div className="plan-list">
          {activePlans.map(([type, date, title, meta, active]) => (
            <button className={active ? 'plan-card active' : 'plan-card'} key={title} type="button">
              <div className="plan-card-top">
                <span>{type}</span>
                <small>{date}</small>
              </div>
              <h3>{title}</h3>
              <p>
                <Icon name="share" />
                {meta}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="drafts-column">
        <section className="draft-header">
          <div className="draft-title">
            <div className="launch-icon">
              <Icon name="rocket_launch" />
            </div>
            <div>
              <h2>Patient Intake Dashboard</h2>
              <p>2 platform variations ready for review</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="ghost" type="button">
              <Icon name="refresh" />
              Regenerate All
            </button>
            <button type="button">
              <Icon name="download" />
              Export
            </button>
            <button className="primary" type="button">
              <Icon name="send" />
              Send to Review
            </button>
          </div>
        </section>

        <div className="draft-scroll">
          {drafts.map((draft) => (
            <DraftCard draft={draft} key={draft.id} />
          ))}
        </div>
      </section>

      <aside className="quality-panel">
        <section className="score-card">
          <h3>Brand Match Score</h3>
          <div className="score-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" fill="none" r="43" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="50" cy="50" fill="none" r="43" stroke="#007349" strokeDasharray="270" strokeDashoffset="22" strokeWidth="8" />
            </svg>
            <strong>92</strong>
          </div>
          <p>Excellent Alignment</p>
        </section>

        <section className="context-card">
          <div className="context-title">
            <Icon name="psychology" />
            <h3>Generation Context</h3>
          </div>
          <p>The following institutional knowledge was applied to these drafts:</p>
          <ul>
            <li>
              <Icon name="menu_book" />
              <div>
                <strong>Source Boundary Rules</strong>
                <span>No diagnosis, treatment, or replacement claims.</span>
              </div>
            </li>
            <li>
              <Icon name="description" />
              <div>
                <strong>Product Narrative</strong>
                <span>Operational visibility, faster routing, and privacy-safe review.</span>
              </div>
            </li>
            <li>
              <Icon name="group" />
              <div>
                <strong>Audience Persona</strong>
                <span>Care coordination leaders and operations managers.</span>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

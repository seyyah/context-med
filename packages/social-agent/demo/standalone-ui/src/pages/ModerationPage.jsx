import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { moderationReports } from '../data/mockData.js';

const summaryCards = [
  ['check_circle', 'Low Risk', '2', '+12%', 'success'],
  ['warning', 'Medium Risk', '1', '-3%', 'warning'],
  ['dangerous', 'High Risk', '2', '+2%', 'danger'],
  ['rule', 'Requires Review', '4', 'Queue 14m', 'primary']
];

const selectedReport = moderationReports[0];

export function ModerationPage() {
  return (
    <div className="page moderation-page original-moderation-page">
      <header className="section-title-row">
        <div>
          <h1>Moderation Output</h1>
          <p>Real-time content risk analysis and policy enforcement.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Icon name="filter_list" />
            Filter
          </button>
          <button className="primary" type="button">
            <Icon name="download" />
            Export Report
          </button>
        </div>
      </header>

      <section className="moderation-summary-grid">
        {summaryCards.map(([icon, title, value, delta, tone]) => (
          <article className={`moderation-summary-card ${tone}`} key={title}>
            <div>
              <span className="summary-icon">
                <Icon name={icon} filled />
              </span>
              <small>{delta}</small>
            </div>
            <h3>{title}</h3>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <div className="moderation-workspace-grid">
        <section className="artifact-table-card">
          <header>
            <h2>Recent Artifacts</h2>
            <div>
              <button type="button">
                <Icon name="refresh" />
              </button>
              <button type="button">
                <Icon name="more_vert" />
              </button>
            </div>
          </header>
          <div className="table-wrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Artifact ID</th>
                  <th>Platform</th>
                  <th>Risk Level</th>
                  <th>Policy</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {moderationReports.map((report, index) => (
                  <tr className={index === 0 ? 'selected-row' : ''} key={report.id}>
                    <td>
                      <span className="artifact-id">
                        <Icon name={report.action === 'Reply' ? 'forum' : 'description'} />
                        ART-89{21 - index}
                      </span>
                    </td>
                    <td>{index % 2 === 0 ? 'Twitter / X' : 'LinkedIn'}</td>
                    <td>
                      <Badge tone={report.risk === 'High' ? 'danger' : report.risk === 'Medium' ? 'warning' : 'success'}>{report.risk}</Badge>
                    </td>
                    <td>{report.classification}</td>
                    <td>
                      <button className="text-action" type="button">
                        {report.action === 'Ignore' ? 'Details' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>Showing 1-5 of 5 moderation artifacts</span>
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

        <aside className="moderation-detail-panel">
          <header>
            <div>
              <span>ART-8921 Details</span>
              <Badge tone="danger">Block</Badge>
            </div>
            <h2>Policy Violation Detected</h2>
          </header>

          <div className="detail-scroll">
            <section>
              <h3>
                <Icon name="subject" />
                Drafted Content
              </h3>
              <div className="quoted-content">
                "{selectedReport.source}"
              </div>
            </section>

            <section className="analysis-grid">
              <article>
                <span>Triggered Policy</span>
                <strong>
                  <Icon name="policy" />
                  Clinical Safety
                </strong>
              </article>
              <article>
                <span>Confidence Score</span>
                <strong>98.4%</strong>
              </article>
              <article className="wide">
                <span>Reasoning</span>
                <p>This comment asks whether the dashboard diagnoses symptoms. The response must clearly state that the dashboard supports intake workflow only.</p>
              </article>
            </section>

            <section>
              <h3 className="rewrite-title">
                <Icon name="auto_awesome" />
                Suggested Safer Reply
              </h3>
              <div className="safe-rewrite">
                {selectedReport.reply}
              </div>
            </section>
          </div>

          <footer>
            <button className="danger-button" type="button">
              <Icon name="block" />
              Reject
            </button>
            <button className="primary" type="button">
              <Icon name="edit_note" />
              Apply Rewrite
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

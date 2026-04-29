import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

function riskTone(risk) {
  if (risk === 'High') {
    return 'danger';
  }
  if (risk === 'Low') {
    return 'success';
  }
  return 'warning';
}

export function ModerationPage() {
  const { workflowState } = useWorkflowStore();
  const moderationItems = workflowState.snapshot.reviewQueueItems;
  const selectedReport = moderationItems[0] || {
    id: 'RQ-empty',
    risk: 'Low',
    platform: 'No artifacts',
    owner: 'No active policy check',
    source: 'Review',
    title: 'No moderation artifacts yet',
    preview: 'Generate Workspace output to create review and moderation artifacts.',
    reason: 'No review records are currently stored.',
    checks: []
  };
  const summaryCards = [
    ['check_circle', 'Low Risk', moderationItems.filter((item) => item.risk === 'Low').length, 'Stored', 'success'],
    ['warning', 'Medium Risk', moderationItems.filter((item) => item.risk === 'Medium').length, 'Stored', 'warning'],
    ['dangerous', 'High Risk', moderationItems.filter((item) => item.risk === 'High').length, 'Stored', 'danger'],
    [
      'rule',
      'Requires Review',
      moderationItems.filter((item) => !['Approved', 'Closed'].includes(item.status)).length,
      'Queue',
      'primary'
    ]
  ];

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
                {moderationItems.map((report, index) => (
                  <tr className={index === 0 ? 'selected-row' : ''} key={report.id}>
                    <td>
                      <span className="artifact-id">
                        <Icon name={report.source === 'Drafts' ? 'forum' : 'description'} />
                        {report.id}
                      </span>
                    </td>
                    <td>{report.platform}</td>
                    <td>
                      <Badge tone={riskTone(report.risk)}>{report.risk}</Badge>
                    </td>
                    <td>{report.owner || report.artifactType}</td>
                    <td>
                      <button className="text-action" type="button">
                        {report.status === 'Approved' ? 'Details' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>Showing {moderationItems.length} moderation artifacts from workflow store</span>
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
              <span>{selectedReport.id} Details</span>
              <Badge tone={riskTone(selectedReport.risk)}>{selectedReport.risk}</Badge>
            </div>
            <h2>{selectedReport.owner || 'Policy Check'}</h2>
          </header>

          <div className="detail-scroll">
            <section>
              <h3>
                <Icon name="subject" />
                Drafted Content
              </h3>
              <div className="quoted-content">
                "{selectedReport.preview}"
              </div>
            </section>

            <section className="analysis-grid">
              <article>
                <span>Triggered Policy</span>
                <strong>
                  <Icon name="policy" />
                  {selectedReport.artifactType || selectedReport.source}
                </strong>
              </article>
              <article>
                <span>Confidence Score</span>
                <strong>{selectedReport.risk === 'High' ? '96.0%' : selectedReport.risk === 'Medium' ? '88.0%' : '72.0%'}</strong>
              </article>
              <article className="wide">
                <span>Reasoning</span>
                <p>{selectedReport.reason}</p>
              </article>
            </section>

            <section>
              <h3 className="rewrite-title">
                <Icon name="auto_awesome" />
                Suggested Safer Reply
              </h3>
              <div className="safe-rewrite">
                {(selectedReport.checks || [])
                  .map(([label, detail]) => `${label}: ${detail}`)
                  .join('\n') || 'No rewrite is required yet. Generate or route a draft to review first.'}
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

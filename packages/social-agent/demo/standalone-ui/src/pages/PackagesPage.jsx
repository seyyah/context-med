import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';

const packages = [
  ['PKG-202604-A1', 'Patient intake social package', ['X', 'in'], 'Approved', 'success'],
  ['PKG-202604-A2', 'Privacy and crisis moderation batch', ['All'], 'High Risk', 'danger'],
  ['PKG-202604-B4', 'Review queue handoff', ['in', 'X'], 'Pending', 'neutral'],
  ['PKG-202604-C1', 'Draft copy variants', ['in'], 'Ready', 'success']
];

const manifest = `{
  "packageId": "PKG-202604-A1",
  "version": "0.4.0",
  "taskType": "SOCIAL_AGENT_DEMO",
  "status": "APPROVED_FOR_HANDOFF",
  "riskLevel": "medium",
  "platforms": [
    "LINKEDIN",
    "X"
  ],
  "artifacts": [
    {
      "type": "PLAN",
      "file": "plan.json"
    },
    {
      "type": "DRAFTS",
      "file": "drafts.json"
    },
    {
      "type": "MODERATION",
      "file": "moderation.json"
    },
    {
      "type": "REVIEW_QUEUE",
      "file": "review-queue.json"
    }
  ],
  "directPublishing": false,
  "checksum": "sha256:a8f93d..."
}`;

function PlatformSquare({ label }) {
  return <span className={label === 'in' ? 'package-platform linkedin' : label === 'X' ? 'package-platform x' : 'package-platform'}>{label}</span>;
}

export function PackagesPage() {
  return (
    <div className="page packages-page original-packages-page">
      <header className="section-title-row package-title-row">
        <div>
          <h1>Exported Packages</h1>
          <p>Manage portable social-agent artifacts ready for CLI handoff or external integration.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Icon name="filter_list" />
            Filter
          </button>
          <button className="primary" type="button">
            <Icon name="add" />
            New Package
          </button>
        </div>
      </header>

      <div className="packages-workspace-grid">
        <section className="artifact-directory-card">
          <header>
            <h2>Artifact Directory</h2>
            <span>Total: 4 Items</span>
          </header>
          <div className="table-wrap">
            <table className="dense-table package-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Package ID</th>
                  <th>Task Type</th>
                  <th>Platforms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(([id, task, platforms, status, tone], index) => (
                  <tr className={index === 0 ? 'selected-row' : ''} key={id}>
                    <td>
                      <Icon name="folder_zip" filled={index === 0} />
                    </td>
                    <td>
                      <strong>{id}</strong>
                    </td>
                    <td>{task}</td>
                    <td>
                      <div className="package-platforms">
                        {platforms.map((platform) => (
                          <PlatformSquare key={`${id}-${platform}`} label={platform} />
                        ))}
                      </div>
                    </td>
                    <td>
                      <Badge tone={tone}>{status}</Badge>
                    </td>
                    <td>
                      <button type="button">
                        <Icon name="more_vert" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="package-inspector">
          <header>
            <div>
              <Icon name="inventory" filled />
              <h2>PKG-202604-A1</h2>
            </div>
            <Badge tone="neutral">v0.4.0</Badge>
            <p>Patient intake dashboard package for LinkedIn and X. Ready for manual review handoff.</p>
          </header>

          <div className="manifest-panel">
            <div className="manifest-heading">
              <strong>Metadata Schema</strong>
              <span>manifest.json</span>
            </div>
            <pre>{manifest}</pre>

            <div className="package-stat-grid">
              <article>
                <span>Total Size</span>
                <strong>42 KB</strong>
              </article>
              <article>
                <span>Exported By</span>
                <strong>CLI System</strong>
              </article>
            </div>
          </div>

          <footer>
            <button className="primary" type="button">
              <Icon name="download" />
              Export Package
            </button>
            <div>
              <button type="button">
                <Icon name="content_copy" />
                Copy JSON
              </button>
              <button type="button">
                <Icon name="folder_open" />
                Open Folder
              </button>
            </div>
          </footer>
        </aside>
      </div>
    </div>
  );
}

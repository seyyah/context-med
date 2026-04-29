import { useMemo, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

function PlatformSquare({ label }) {
  return <span className={label === 'in' ? 'package-platform linkedin' : label === 'X' ? 'package-platform x' : 'package-platform'}>{label}</span>;
}

export function PackagesPage() {
  const { workflowState } = useWorkflowStore();
  const packages = workflowState.snapshot.packages;
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id);
  const filteredPackages = packages.filter((item) => {
    if (activeFilter === 'all') {
      return true;
    }
    return item.manifest?.exportType === activeFilter;
  });
  const selectedPackage = filteredPackages.find((item) => item.id === selectedPackageId) || filteredPackages[0] || null;
  const manifest = useMemo(() => JSON.stringify(selectedPackage?.manifest || {}, null, 2), [selectedPackage]);
  const packageCounts = {
    approved: packages.filter((item) => item.manifest?.exportType === 'approved').length,
    review: packages.filter((item) => item.manifest?.exportType === 'review_required').length,
    blocked: packages.filter((item) => item.manifest?.exportType === 'blocked').length
  };

  function exportPackage() {
    if (!selectedPackage) {
      return;
    }

    const blob = new Blob([`${manifest}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedPackage.id}.${selectedPackage.manifest?.exportType || 'manifest'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyPackageJson() {
    await navigator.clipboard?.writeText(manifest);
  }

  const filters = [
    ['all', 'All', packages.length],
    ['approved', 'Approved exports', packageCounts.approved],
    ['review_required', 'Needs review', packageCounts.review],
    ['blocked', 'Blocked', packageCounts.blocked]
  ];

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
            <span>
              Total: {packages.length} Items / Approved: {packageCounts.approved} / Review: {packageCounts.review} / Blocked: {packageCounts.blocked}
            </span>
          </header>
          <nav className="package-filter-tabs" aria-label="Package export filters">
            {filters.map(([id, label, count]) => (
              <button
                className={activeFilter === id ? 'active' : ''}
                key={id}
                onClick={() => {
                  setActiveFilter(id);
                  setSelectedPackageId('');
                }}
                type="button"
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </nav>
          <div className="table-wrap">
            {filteredPackages.length ? (
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
                  {filteredPackages.map((item, index) => (
                    <tr className={item.id === selectedPackage?.id ? 'selected-row' : ''} key={item.id} onClick={() => setSelectedPackageId(item.id)}>
                      <td>
                        <Icon name="folder_zip" filled={index === 0} />
                      </td>
                      <td>
                        <strong>{item.id}</strong>
                      </td>
                      <td>{item.task}</td>
                      <td>
                        <div className="package-platforms">
                          {item.platforms.map((platform) => (
                            <PlatformSquare key={`${item.id}-${platform}`} label={platform} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <Badge tone={item.tone}>{item.status}</Badge>
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
            ) : (
              <section className="empty-workflow-state compact">
                <Icon name="inventory_2" />
                <h2>No packages in this export state</h2>
                <p>Approved, review-required, and blocked package manifests appear here after Workspace generation and Review Queue decisions.</p>
              </section>
            )}
          </div>
        </section>

        <aside className="package-inspector">
          <header>
            <div>
              <Icon name="inventory" filled />
              <h2>{selectedPackage?.id || 'No package selected'}</h2>
            </div>
            <Badge tone={selectedPackage?.tone || 'neutral'}>{selectedPackage?.status || 'Pending'}</Badge>
            <p>{selectedPackage?.task || 'No package manifest available yet.'}</p>
          </header>

          <div className="manifest-panel">
            <div className="manifest-heading">
              <strong>Metadata Schema</strong>
              <span>{selectedPackage?.manifest?.status || 'manifest.json'}</span>
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
            <button className="primary" disabled={!selectedPackage} onClick={exportPackage} type="button">
              <Icon name="download" />
              Export Package
            </button>
            <div>
              <button disabled={!selectedPackage} onClick={copyPackageJson} type="button">
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

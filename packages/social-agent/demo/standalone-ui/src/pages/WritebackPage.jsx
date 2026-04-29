import { useMemo, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

function exportBucket(item) {
  const type = item.manifest?.exportType;

  if (type === 'approved') {
    return 'Approved handoff';
  }

  if (type === 'blocked') {
    return 'Blocked';
  }

  return 'Needs review';
}

export function WritebackPage() {
  const { workflowState } = useWorkflowStore();
  const packages = workflowState.snapshot.packages;
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || '');
  const selectedPackage = packages.find((item) => item.id === selectedPackageId) || packages[0] || null;
  const manifest = useMemo(() => JSON.stringify(selectedPackage?.manifest || {}, null, 2), [selectedPackage]);
  const approved = packages.filter((item) => item.manifest?.exportType === 'approved');
  const reviewRequired = packages.filter((item) => item.manifest?.exportType === 'review_required');
  const blocked = packages.filter((item) => item.manifest?.exportType === 'blocked');

  return (
    <div className="page writeback-page original-writeback-page">
      <header className="section-title-row writeback-title-row">
        <div>
          <h1>Manual Writeback</h1>
          <p>Direct publishing is disabled. Approved packages can be handed off manually after review decisions are saved.</p>
        </div>
        <Badge tone="neutral">Direct publishing disabled</Badge>
      </header>

      <section className="writeback-summary-grid">
        <article>
          <div>
            <span>Approved Handoffs</span>
            <Icon name="check_circle" />
          </div>
          <p>
            <strong>{approved.length}</strong>
            <span>ready to export</span>
          </p>
        </article>
        <article>
          <div>
            <span>Needs Review</span>
            <Icon name="hourglass_empty" />
          </div>
          <p>
            <strong>{reviewRequired.length}</strong>
            <span>waiting for decision</span>
          </p>
        </article>
        <article>
          <div>
            <span>Blocked</span>
            <Icon name="cancel" />
          </div>
          <p>
            <strong>{blocked.length}</strong>
            <span>changes or rejection</span>
          </p>
        </article>
      </section>

      {!packages.length ? (
        <section className="empty-workflow-state">
          <Icon name="sync_alt" />
          <h2>No writeback candidates</h2>
          <p>Generate Workspace output, approve review items, then return here to see manual handoff candidates.</p>
        </section>
      ) : (
        <div className="writeback-workspace-grid">
          <section className="writeback-queue-card">
            <header>
              <h2>Package Handoff Queue</h2>
              <label>
                <Icon name="search" />
                <input readOnly value={`${packages.length} stored package manifests`} />
              </label>
            </header>

            <div className="table-wrap">
              <table className="dense-table writeback-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Workflow Item</th>
                    <th>Platforms</th>
                    <th>Export State</th>
                    <th>Review Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((item) => (
                    <tr className={item.id === selectedPackage?.id ? 'selected-row' : ''} key={item.id} onClick={() => setSelectedPackageId(item.id)}>
                      <td>{item.id}</td>
                      <td>{item.task}</td>
                      <td>
                        <span className="writeback-platform">
                          <Icon name="share" />
                          {item.platforms.join(' + ')}
                        </span>
                      </td>
                      <td>
                        <Badge tone={item.tone}>{exportBucket(item)}</Badge>
                      </td>
                      <td>
                        {item.manifest?.reviewSummary
                          ? `${item.manifest.reviewSummary.approved} approved / ${item.manifest.reviewSummary.pending} pending / ${item.manifest.reviewSummary.blocked} blocked`
                          : 'No review summary'}
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
                <Icon name="inventory_2" />
                <h2>Handoff Context</h2>
              </div>
              <span>{selectedPackage?.id || 'None'}</span>
            </header>

            <div className="writeback-context-body">
              <section>
                <label>Current Boundary</label>
                <p>
                  {selectedPackage?.manifest?.exportType === 'approved'
                    ? 'This package is approved for manual export. The UI still does not publish directly.'
                    : selectedPackage?.manifest?.exportType === 'blocked'
                      ? 'This package is blocked until rejected or change-requested review items are resolved.'
                      : 'This package should stay in review before manual handoff.'}
                </p>
              </section>

              <section>
                <label>Manifest Preview</label>
                <pre className="writeback-manifest-preview">{manifest}</pre>
              </section>

              <section>
                <label>Suggested Destination</label>
                <div className="destination-card">
                  <Icon name="folder_special" />
                  <div>
                    <strong>Manual review folder</strong>
                    <span>Export the package JSON after its review state allows handoff.</span>
                  </div>
                </div>
              </section>
            </div>

            <footer>
              <button className="primary" disabled={selectedPackage?.manifest?.exportType !== 'approved'} type="button">
                <Icon name="done_all" />
                Ready for Handoff
              </button>
              <button disabled type="button">
                <Icon name="publish" />
                Direct Publish Disabled
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}

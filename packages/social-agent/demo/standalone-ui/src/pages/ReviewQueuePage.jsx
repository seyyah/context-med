import { useEffect, useMemo, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

const tabs = ['All', 'Pending', 'Approved', 'Changes Requested', 'Escalated', 'Rejected'];

const riskTone = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger'
};

const statusTone = {
  'Needs Review': 'warning',
  'In Review': 'warning',
  Approved: 'success',
  'Changes Requested': 'warning',
  Escalated: 'danger',
  Rejected: 'danger'
};

function PlatformChip({ channel }) {
  const normalized = channel.toLowerCase();
  const label = normalized.includes('linkedin') ? 'LinkedIn' : normalized === 'x' ? 'X' : channel;
  const mark = normalized.includes('linkedin') ? 'in' : normalized === 'x' ? 'X' : 'C';

  return (
    <span className="platform-chip">
      <span className={mark === 'in' ? 'platform-dot linkedin-dot' : mark === 'X' ? 'platform-dot x-dot' : 'platform-dot community-dot'}>
        {mark}
      </span>
      {label}
    </span>
  );
}

function isPending(status) {
  return status === 'Needs Review' || status === 'In Review';
}

export function ReviewQueuePage() {
  const { persistWorkflowItem, updateDrafts, workflowState } = useWorkflowStore();
  const queueItems = workflowState.snapshot.reviewQueueItems;
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedItemId, setSelectedItemId] = useState(queueItems[0]?.id || '');
  const [decisionsByItem, setDecisionsByItem] = useState({});
  const [notesByItem, setNotesByItem] = useState({});
  const [feedback, setFeedback] = useState('Select an item, inspect the draft package context, then approve or request changes.');

  const itemsWithDecision = useMemo(
    () =>
      queueItems.map((item) => ({
        ...item,
        status: decisionsByItem[item.id]?.status ?? item.status,
        decision: decisionsByItem[item.id]?.decision ?? null
      })),
    [decisionsByItem]
  );

  const filteredItems = useMemo(() => {
    if (activeTab === 'All') {
      return itemsWithDecision;
    }

    if (activeTab === 'Pending') {
      return itemsWithDecision.filter((item) => isPending(item.status));
    }

    return itemsWithDecision.filter((item) => item.status === activeTab);
  }, [activeTab, itemsWithDecision]);

  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selected = itemsWithDecision.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? itemsWithDecision[0];
  const selectedNote = selected ? notesByItem[selected.id] ?? '' : '';

  const tabCounts = {
    All: itemsWithDecision.length,
    Pending: itemsWithDecision.filter((item) => isPending(item.status)).length,
    Approved: itemsWithDecision.filter((item) => item.status === 'Approved').length,
    'Changes Requested': itemsWithDecision.filter((item) => item.status === 'Changes Requested').length,
    Escalated: itemsWithDecision.filter((item) => item.status === 'Escalated').length,
    Rejected: itemsWithDecision.filter((item) => item.status === 'Rejected').length
  };

  const summary = [
    ['Pending', tabCounts.Pending, 'Needs a human decision'],
    ['High risk', itemsWithDecision.filter((item) => item.risk === 'High').length, 'Clinical or safety sensitive'],
    ['Changes', tabCounts['Changes Requested'], 'Blocked until edited'],
    ['Approved', tabCounts.Approved, 'Ready for package handoff']
  ];

  async function recordDecision(status, decision) {
    const reviewerNote = notesByItem[selected.id] ?? '';
    const matchingDraft = workflowState.snapshot.drafts.find((draft) =>
      draft.id === selected.draftId || draft.slotId === selected.slotId || draft.packageTarget === selected.packageTarget
    );
    const matchingPlan = workflowState.snapshot.contentPlans.find((plan) =>
      plan.id === selected.planId || plan.runId === selected.runId
    );
    const updatedItem = {
      ...selected,
      status,
      decision,
      reviewerNote,
      decidedAt: new Date().toISOString()
    };

    setDecisionsByItem((current) => ({
      ...current,
      [selected.id]: {
        status,
        decision
      }
    }));
    await persistWorkflowItem({
      id: selected.id,
      type: 'review_item',
      title: selected.title,
      status,
      payload: updatedItem
    });

    if (matchingDraft) {
      await persistWorkflowItem({
        id: matchingDraft.id,
        type: 'draft',
        title: matchingDraft.title,
        status,
        payload: {
          ...matchingDraft,
          status,
          reviewDecision: decision,
          reviewItemId: selected.id,
          decidedAt: updatedItem.decidedAt
        }
      });
      updateDrafts((currentDrafts) => ({
        ...currentDrafts,
        statusBySlot: {
          ...currentDrafts.statusBySlot,
          [matchingDraft.slotId]: status
        }
      }));
    }

    if (matchingPlan && selected.slotId) {
      await persistWorkflowItem({
        id: matchingPlan.id,
        type: 'content_plan',
        title: matchingPlan.title,
        status: 'active',
        payload: {
          ...matchingPlan,
          slots: matchingPlan.slots.map((slot) =>
            slot.id === selected.slotId
              ? {
                ...slot,
                status,
                reviewDecision: decision,
                reviewItemId: selected.id
              }
              : slot
          )
        }
      });
    }

    setFeedback(`${selected.id} marked as ${status}. Matching draft and plan slot were synchronized for package export.`);
  }

  function updateNote(value) {
    if (!selected) {
      return;
    }

    setNotesByItem((current) => ({
      ...current,
      [selected.id]: value
    }));
  }

  if (!itemsWithDecision.length || !selected) {
    return (
      <div className="review-queue-page">
        <header className="review-workspace-header">
          <div>
            <span className="kicker">Review Queue</span>
            <h1>Human review before package handoff</h1>
            <p>Generate Workspace output or route a Draft to Review to create stored review records.</p>
          </div>
        </header>
        <section className="empty-workflow-state">
          <Icon name="fact_check" />
          <h2>No review items</h2>
          <p>Items that need approval, changes, escalation, or rejection will appear here after generation or Drafts routing.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="review-queue-page">
      <header className="review-workspace-header">
        <div>
          <span className="kicker">Review Queue</span>
          <h1>Human review before package handoff</h1>
          <p>Inspect draft packages, verify source boundaries, and decide whether each item can move forward.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Icon name="filter_list" />
            Queue Filters
          </button>
          <button type="button">
            <Icon name="sort" />
            Priority First
          </button>
        </div>
      </header>

      <section className="queue-health review-queue-summary">
        {summary.map(([label, value, detail]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </section>

      <p className="review-feedback">{feedback}</p>

      <div className="review-split-layout">
        <section className="review-table-shell">
          <nav className="review-tabs" aria-label="Review status filters">
            {tabs.map((tab) => (
              <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)} type="button">
                {tab}
                <span>{tabCounts[tab]}</span>
              </button>
            ))}
          </nav>

          <div className="review-table-scroll">
            <table className="dense-table review-table">
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>Artifact</th>
                  <th>Channel</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    className={item.id === selected.id ? 'selected-row' : ''}
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    tabIndex={0}
                  >
                    <td>{item.id}</td>
                    <td>
                      <strong>{item.title}</strong>
                      <span>
                        {item.artifactType} from {item.source} / {item.priority}
                      </span>
                    </td>
                    <td>
                      <PlatformChip channel={item.platform} />
                    </td>
                    <td>
                      <Badge tone={riskTone[item.risk]}>{item.risk} Risk</Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone[item.status] ?? 'neutral'}>{item.status}</Badge>
                    </td>
                    <td>
                      <button aria-label={`Open ${item.id}`} type="button">
                        <Icon name={item.id === selected.id ? 'chevron_right' : 'open_in_new'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="review-drawer">
          <header>
            <div>
              <div className="drawer-title-row">
                <h2>{selected.id}</h2>
                <Badge tone={riskTone[selected.risk]}>{selected.risk} Risk</Badge>
              </div>
              <p>
                {selected.artifactType} / {selected.source} / {selected.owner}
              </p>
            </div>
            <button type="button">
              <Icon name="more_horiz" />
            </button>
          </header>

          <div className="drawer-meta-grid">
            <article>
              <span>Target Channel</span>
              <strong>{selected.platform}</strong>
            </article>
            <article>
              <span>Package Target</span>
              <strong>{selected.packageTarget}</strong>
            </article>
          </div>

          <div className="drawer-scroll">
            <section className={selected.risk === 'High' ? 'policy-alert' : 'policy-alert review-info-alert'}>
              <Icon name={selected.risk === 'High' ? 'warning' : 'fact_check'} />
              <div>
                <h3>{selected.risk === 'High' ? 'Healthcare Review Flag' : 'Review Requirement'}</h3>
                <p>{selected.reason}</p>
              </div>
            </section>

            <section>
              <h3 className="drawer-section-title">
                Draft Package Preview
                <button type="button">
                  <Icon name="edit" />
                  Open in Drafts
                </button>
              </h3>
              <div className="review-preview-card">
                <div className="fake-post-header">
                  <div className="fake-avatar" />
                  <div>
                    <strong>Context-Med</strong>
                    <span>
                      {selected.platform} / {selected.status}
                    </span>
                  </div>
                </div>
                {selected.preview.split('\n\n').map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section>
              <h3 className="drawer-section-title">Review Checks</h3>
              <ul className="review-check-list">
                {selected.checks.map(([title, detail]) => (
                  <li key={title}>
                    <Icon name="check_circle" />
                    <div>
                      <strong>{title}</strong>
                      <span>{detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="drawer-section-title">Reviewer Notes</h3>
              <textarea
                onChange={(event) => updateNote(event.target.value)}
                placeholder="Add approval reason, requested changes, or rejection notes..."
                value={selectedNote}
              />
            </section>

            {selected.decision ? (
              <section className="decision-summary">
                <Icon name="history" />
                <div>
                  <strong>{selected.status}</strong>
                  <span>{selected.decision}</span>
                </div>
              </section>
            ) : null}
          </div>

          <footer>
            <button className="danger-button" onClick={() => recordDecision('Rejected', 'Reviewer rejected the item before package handoff.')} type="button">
              Reject
            </button>
            <button onClick={() => recordDecision('Changes Requested', 'Reviewer requested edits before this item can move forward.')} type="button">
              Request Changes
            </button>
            <button onClick={() => recordDecision('Escalated', 'Reviewer escalated this item for clinical or policy review.')} type="button">
              Escalate
            </button>
            <button className="primary" onClick={() => recordDecision('Approved', 'Reviewer approved this item for package handoff.')} type="button">
              <Icon name="check_circle" />
              Approve
            </button>
          </footer>
        </aside>
      </div>
    </div>
  );
}

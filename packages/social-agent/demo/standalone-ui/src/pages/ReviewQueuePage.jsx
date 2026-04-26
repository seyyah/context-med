import { useEffect, useMemo, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';

const queueItems = [
  {
    id: 'RQ-8422',
    artifactType: 'Draft',
    source: 'Drafts',
    title: 'Patient intake dashboard update',
    platform: 'LinkedIn',
    risk: 'Low',
    status: 'Needs Review',
    owner: 'Marketing review',
    priority: 'Today',
    packageTarget: 'patient-intake_linkedin_1.json',
    reason: 'Long-form healthcare copy needs source boundary and claim review before package handoff.',
    preview:
      'Patient intake work moves faster when routing is clear and review stays visible.\n\nContext-Med is releasing a patient intake dashboard update for care coordination teams. The update helps teams review incoming intake messages, identify incomplete information, and route cases to the right internal workflow faster.\n\nThe important boundary is clear: this dashboard supports intake operations. It does not diagnose patients, recommend treatment, or replace clinical judgment.',
    checks: [
      ['Source aligned', 'Uses the same patient intake dashboard source as Workspace.'],
      ['Clinical boundary', 'States that the dashboard does not diagnose or recommend treatment.'],
      ['Review route', 'Needs approval before export to Packages.']
    ]
  },
  {
    id: 'RQ-8423',
    artifactType: 'Draft',
    source: 'Drafts',
    title: 'Privacy-safe intake review',
    platform: 'X',
    risk: 'Low',
    status: 'Needs Review',
    owner: 'Social review',
    priority: 'Today',
    packageTarget: 'patient-intake_x_2.json',
    reason: 'Short-form copy mentions intake automation and must keep the human-review boundary visible.',
    preview:
      'Patient intake updates need speed and guardrails.\n\nContext-Med helps care teams review intake messages, spot missing info, and route cases faster. No diagnosis. No treatment recommendations. Sensitive or unclear cases stay under human review.\n\nWhere should intake automation stop? #HealthTech #CareOps',
    checks: [
      ['Character budget', 'The post is short enough for X.'],
      ['CTA clarity', 'Uses one direct question.'],
      ['Review route', 'Needs approval before export to Packages.']
    ]
  },
  {
    id: 'RQ-8424',
    artifactType: 'Draft',
    source: 'Drafts',
    title: 'Human review guardrails',
    platform: 'LinkedIn',
    risk: 'Medium',
    status: 'Needs Review',
    owner: 'Clinical policy review',
    priority: 'Next',
    packageTarget: 'human-review_linkedin_3.json',
    reason: 'The draft explains sensitive case handling and should be checked for unsupported operational claims.',
    preview:
      'Automation works best when the human review boundary is obvious.\n\nFor intake operations, speed matters. So does knowing when an automated workflow should pause. Context-Med keeps sensitive cases, crisis signals, and unclear medical questions under human review.',
    checks: [
      ['Sensitive language', 'Mentions crisis signals and unclear medical questions.'],
      ['Audience fit', 'Written for operations managers.'],
      ['Review route', 'Requires clinical policy review before handoff.']
    ]
  },
  {
    id: 'RQ-8425',
    artifactType: 'Plan Slot',
    source: 'Plan',
    title: 'Thursday X slot',
    platform: 'X',
    risk: 'Medium',
    status: 'Changes Requested',
    owner: 'Content lead',
    priority: 'Next',
    packageTarget: 'patient-intake_x_4.json',
    reason: 'The scheduled slot needs a clearer CTA before its draft is promoted.',
    preview:
      'Faster intake routing should not blur clinical boundaries. A patient intake dashboard can help teams spot missing info and route cases faster. What should stay human-reviewed?',
    checks: [
      ['Plan fit', 'The row is aligned to Thursday short-form awareness.'],
      ['CTA gap', 'Reviewer requested a sharper question.'],
      ['Package impact', 'Blocked from package export until changes are made.']
    ]
  },
  {
    id: 'RQ-8426',
    artifactType: 'Moderation',
    source: 'Moderation',
    title: 'Clinical claim question',
    platform: 'Community',
    risk: 'High',
    status: 'Needs Review',
    owner: 'Safety review',
    priority: 'Urgent',
    packageTarget: 'moderation-clinical-claim.json',
    reason: 'Community reply asks whether the dashboard diagnoses symptoms and must not produce a clinical answer.',
    preview:
      'User question: Can this dashboard diagnose symptoms from intake messages?\n\nSuggested reply: The dashboard supports intake review and routing. It does not diagnose symptoms or recommend treatment.',
    checks: [
      ['Clinical risk', 'Direct diagnosis question.'],
      ['Safe reply', 'Reply must stay general and non-clinical.'],
      ['Escalation', 'Route to safety review before response package handoff.']
    ]
  }
];

const tabs = ['All', 'Pending', 'Approved', 'Changes Requested', 'Rejected'];

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
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedItemId, setSelectedItemId] = useState(queueItems[0].id);
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
  const selectedNote = notesByItem[selected.id] ?? '';

  const tabCounts = {
    All: itemsWithDecision.length,
    Pending: itemsWithDecision.filter((item) => isPending(item.status)).length,
    Approved: itemsWithDecision.filter((item) => item.status === 'Approved').length,
    'Changes Requested': itemsWithDecision.filter((item) => item.status === 'Changes Requested').length,
    Rejected: itemsWithDecision.filter((item) => item.status === 'Rejected').length
  };

  const summary = [
    ['Pending', tabCounts.Pending, 'Needs a human decision'],
    ['High risk', itemsWithDecision.filter((item) => item.risk === 'High').length, 'Clinical or safety sensitive'],
    ['Changes', tabCounts['Changes Requested'], 'Blocked until edited'],
    ['Approved', tabCounts.Approved, 'Ready for package handoff']
  ];

  function recordDecision(status, decision) {
    setDecisionsByItem((current) => ({
      ...current,
      [selected.id]: {
        status,
        decision
      }
    }));
    setFeedback(`${selected.id} marked as ${status}. Decision context stays attached to the review item.`);
  }

  function updateNote(value) {
    setNotesByItem((current) => ({
      ...current,
      [selected.id]: value
    }));
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

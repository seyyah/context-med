import { useMemo, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';

const draftSlots = [
  {
    id: 'draft-slot-linkedin-01',
    category: 'Campaign',
    day: 'Monday',
    platform: 'LinkedIn',
    platformLabel: 'LinkedIn Professional',
    tone: 'linkedin',
    icon: 'in',
    title: 'Patient intake dashboard update',
    focus: 'Operational visibility',
    meta: '184 words - narrative draft',
    risk: 'Low Risk',
    status: 'Needs Review',
    score: 92,
    hook: 'Patient intake work moves faster when routing is clear and review stays visible.',
    body: [
      'Context-Med is releasing a patient intake dashboard update for care coordination teams.',
      'The update helps teams review incoming intake messages, identify incomplete information, and route cases to the right internal workflow faster.',
      'The important boundary is clear: this dashboard supports intake operations. It does not diagnose patients, recommend treatment, or replace clinical judgment.',
      'Sensitive cases, crisis signals, and unclear medical questions remain under human review before any public response or workflow action moves forward.'
    ],
    cta: 'Which review step creates the most friction for care coordination teams?',
    hashtags: '#CareOperations #HealthTech #PatientSafety',
    assetBrief: 'A clean dashboard-style visual showing review gates, intake routing, and a human approval checkpoint.',
    context: [
      ['menu_book', 'Source Boundary Rules', 'No diagnosis, treatment, or replacement claims.'],
      ['calendar_month', 'Plan Slot', 'Monday slot for a high-priority Workspace source.'],
      ['group', 'Audience Persona', 'Care coordination leaders and operations managers.'],
      ['approval', 'Review Gate', 'Needs human review before package export.']
    ]
  },
  {
    id: 'draft-slot-x-01',
    category: 'Short Form',
    day: 'Tuesday',
    platform: 'X',
    platformLabel: 'X Short Form',
    tone: 'x',
    icon: 'x',
    title: 'Privacy-safe intake review',
    focus: 'Escalation paths',
    meta: '236/280 chars - compact draft',
    risk: 'Low Risk',
    status: 'Needs Review',
    score: 88,
    hook: 'Patient intake updates need speed and guardrails.',
    body: [
      'Context-Med helps care teams review intake messages, spot missing info, and route cases faster.',
      'No diagnosis. No treatment recommendations. Sensitive or unclear cases stay under human review.'
    ],
    cta: 'Where should intake automation stop?',
    hashtags: '#HealthTech #CareOps',
    assetBrief: '',
    context: [
      ['short_text', 'Platform Constraint', 'Short form copy should stay under 280 characters.'],
      ['calendar_month', 'Plan Slot', 'Tuesday slot for a concise follow-up angle.'],
      ['rule', 'Claim Control', 'Keep the post focused on routing and review, not clinical decisions.'],
      ['approval', 'Review Gate', 'Needs review because healthcare boundaries are mentioned.']
    ]
  },
  {
    id: 'draft-slot-linkedin-02',
    category: 'Trust',
    day: 'Wednesday',
    platform: 'LinkedIn',
    platformLabel: 'LinkedIn Professional',
    tone: 'linkedin',
    icon: 'in',
    title: 'Human review guardrails',
    focus: 'Human review',
    meta: '156 words - trust draft',
    risk: 'Medium Risk',
    status: 'Draft',
    score: 86,
    hook: 'Automation works best when the human review boundary is obvious.',
    body: [
      'For intake operations, speed matters. So does knowing when an automated workflow should pause.',
      'Context-Med keeps sensitive cases, crisis signals, and unclear medical questions under human review so teams can route intake messages without turning operational support into clinical judgment.',
      'The useful improvement is visibility: teams can see where a message is, what is missing, and which escalation path should handle it.'
    ],
    cta: 'How do you keep operational automation under human oversight?',
    hashtags: '#PatientSafety #CareOperations',
    assetBrief: 'A review-gate diagram showing intake message, missing information check, escalation route, and reviewer approval.',
    context: [
      ['verified_user', 'Safety Boundary', 'Sensitive or unclear cases remain under human review.'],
      ['calendar_month', 'Plan Slot', 'Wednesday trust-building slot.'],
      ['group', 'Audience Persona', 'Operations managers evaluating AI workflow risk.'],
      ['edit_note', 'Draft Need', 'Strengthen clarity before this moves to review queue.']
    ]
  },
  {
    id: 'draft-slot-x-02',
    category: 'Awareness',
    day: 'Thursday',
    platform: 'X',
    platformLabel: 'X Short Form',
    tone: 'x',
    icon: 'x',
    title: 'Faster routing for care teams',
    focus: 'Care operations',
    meta: '219/280 chars - compact draft',
    risk: 'Medium Risk',
    status: 'Draft',
    score: 84,
    hook: 'Faster intake routing should not blur clinical boundaries.',
    body: [
      'A patient intake dashboard can help teams spot missing info and route cases faster.',
      'The line stays clear: no diagnosis, no treatment recommendations, and human review for sensitive signals.'
    ],
    cta: 'What should stay human-reviewed?',
    hashtags: '#CareOps #HealthTech',
    assetBrief: '',
    context: [
      ['short_text', 'Platform Constraint', 'Direct language with one focused question.'],
      ['calendar_month', 'Plan Slot', 'Thursday slot for a compact operational reminder.'],
      ['rule', 'Claim Control', 'Avoid implying the dashboard decides medical outcomes.'],
      ['edit_note', 'Draft Need', 'Ready for copy tightening before review.']
    ]
  }
];

const riskTone = {
  'Low Risk': 'success',
  'Medium Risk': 'warning',
  'High Risk': 'danger'
};

const statusTone = {
  Draft: 'success',
  'Needs Review': 'warning',
  'In Review': 'warning',
  Approved: 'success'
};

function createInitialEdits() {
  return Object.fromEntries(
    draftSlots.map((slot) => [
      slot.id,
      {
        hook: slot.hook,
        body: slot.body.join('\n\n'),
        cta: slot.cta,
        hashtags: slot.hashtags
      }
    ])
  );
}

export function DraftsPage() {
  const [selectedSlotId, setSelectedSlotId] = useState(draftSlots[0].id);
  const [draftEdits, setDraftEdits] = useState(createInitialEdits);
  const [statusBySlot, setStatusBySlot] = useState({});
  const [feedback, setFeedback] = useState('Select a scheduled plan slot, refine its platform draft, then route it to review.');

  const selectedSlot = useMemo(
    () => draftSlots.find((slot) => slot.id === selectedSlotId) ?? draftSlots[0],
    [selectedSlotId]
  );
  const selectedDraft = draftEdits[selectedSlot.id];
  const selectedStatus = statusBySlot[selectedSlot.id] ?? selectedSlot.status;
  const isLinkedIn = selectedSlot.platform === 'LinkedIn';

  function updateDraft(field, value) {
    setDraftEdits((current) => ({
      ...current,
      [selectedSlot.id]: {
        ...current[selectedSlot.id],
        [field]: value
      }
    }));
  }

  function regenerateDraft() {
    setDraftEdits((current) => ({
      ...current,
      [selectedSlot.id]: {
        hook: selectedSlot.hook,
        body: selectedSlot.body.join('\n\n'),
        cta: selectedSlot.cta,
        hashtags: selectedSlot.hashtags
      }
    }));
    setStatusBySlot((current) => ({ ...current, [selectedSlot.id]: 'Draft' }));
    setFeedback(`${selectedSlot.platform} draft reset to the latest mock output from the selected plan slot.`);
  }

  function exportDraft() {
    setFeedback(`${selectedSlot.platform} draft package is ready for JSON export in the package handoff step.`);
  }

  function sendToReview() {
    setStatusBySlot((current) => ({ ...current, [selectedSlot.id]: 'In Review' }));
    setFeedback(`${selectedSlot.platform} draft routed to Review Queue with source, plan slot, and risk context attached.`);
  }

  return (
    <div className="drafts-page-layout">
      <aside className="plans-panel">
        <div className="panel-heading">
          <div>
            <span className="kicker">Draft slots</span>
            <h2>From weekly plan</h2>
          </div>
          <button aria-label="Filter draft slots" type="button">
            <Icon name="filter_list" />
          </button>
        </div>
        <div className="plan-list">
          {draftSlots.map((slot) => {
            const slotStatus = statusBySlot[slot.id] ?? slot.status;

            return (
              <button
                className={slot.id === selectedSlot.id ? 'plan-card active' : 'plan-card'}
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                type="button"
              >
                <div className="plan-card-top">
                  <span>{slot.day}</span>
                  <small>{slot.platform}</small>
                </div>
                <h3>{slot.title}</h3>
                <p>
                  <Icon name="route" />
                  {slot.focus}
                </p>
                <p>
                  <Icon name="approval" />
                  {slotStatus}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="drafts-column">
        <section className="draft-header">
          <div className="draft-title">
            <div className="launch-icon">
              <Icon name="edit_note" />
            </div>
            <div>
              <h2>{selectedSlot.title}</h2>
              <p>
                {selectedSlot.day} / {selectedSlot.platform} / {selectedSlot.focus}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="ghost" onClick={regenerateDraft} type="button">
              <Icon name="refresh" />
              Regenerate Draft
            </button>
            <button onClick={exportDraft} type="button">
              <Icon name="download" />
              Export
            </button>
            <button className="primary" onClick={sendToReview} type="button">
              <Icon name="send" />
              Send to Review
            </button>
          </div>
        </section>

        <p className="draft-feedback">{feedback}</p>

        <div className="draft-scroll">
          <article className={`draft-card ${selectedSlot.tone} selected-draft-editor`}>
            <div className="draft-card-accent" />
            <div className="draft-card-body">
              <header className="draft-card-head">
                <div className="platform-title">
                  <div className={isLinkedIn ? 'linkedin-mark' : 'x-mark'}>{selectedSlot.icon}</div>
                  <div>
                    <h3>{selectedSlot.platformLabel}</h3>
                    <p>{selectedSlot.meta}</p>
                  </div>
                </div>
                <div className="badges">
                  <Badge tone={riskTone[selectedSlot.risk]}>{selectedSlot.risk}</Badge>
                  <Badge tone={statusTone[selectedStatus]}>{selectedStatus}</Badge>
                </div>
              </header>

              <div className="draft-layout">
                <div className="copy-stack">
                  <label className="copy-block hook editable-copy-block">
                    <span>Hook</span>
                    <textarea
                      aria-label={`${selectedSlot.platform} hook`}
                      onChange={(event) => updateDraft('hook', event.target.value)}
                      rows={2}
                      value={selectedDraft.hook}
                    />
                  </label>

                  <label className="copy-block editable-copy-block">
                    <span>Body</span>
                    <textarea
                      aria-label={`${selectedSlot.platform} body`}
                      onChange={(event) => updateDraft('body', event.target.value)}
                      rows={isLinkedIn ? 9 : 5}
                      value={selectedDraft.body}
                    />
                  </label>

                  <label className="copy-block cta editable-copy-block">
                    <span>Call to Action</span>
                    <textarea
                      aria-label={`${selectedSlot.platform} call to action`}
                      onChange={(event) => updateDraft('cta', event.target.value)}
                      rows={2}
                      value={selectedDraft.cta}
                    />
                  </label>

                  <label className="copy-block editable-copy-block">
                    <span>Hashtags</span>
                    <input
                      aria-label={`${selectedSlot.platform} hashtags`}
                      onChange={(event) => updateDraft('hashtags', event.target.value)}
                      value={selectedDraft.hashtags}
                    />
                  </label>
                </div>

                <aside className="draft-review-brief">
                  <div className="asset-head">
                    <span>{isLinkedIn ? 'Asset Brief' : 'Post Checks'}</span>
                    <Icon name={isLinkedIn ? 'edit' : 'rule'} />
                  </div>

                  {isLinkedIn ? (
                    <>
                      <div className="asset-preview">
                        <Icon name="image" />
                        <span>Visual brief from plan</span>
                      </div>
                      <p>{selectedSlot.assetBrief}</p>
                    </>
                  ) : (
                    <ul className="slot-detail-list">
                      <li>
                        <strong>Character Budget</strong>
                        <span>Keep final copy below 280 characters.</span>
                      </li>
                      <li>
                        <strong>Question</strong>
                        <span>Use one direct engagement question.</span>
                      </li>
                      <li>
                        <strong>Boundary</strong>
                        <span>No diagnosis or treatment claims.</span>
                      </li>
                    </ul>
                  )}
                </aside>
              </div>
            </div>
          </article>
        </div>
      </section>

      <aside className="quality-panel">
        <section className="score-card">
          <h3>Brand Match Score</h3>
          <div className="score-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" fill="none" r="43" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="43"
                stroke="#007349"
                strokeDasharray="270"
                strokeDashoffset={270 - (selectedSlot.score / 100) * 270}
                strokeWidth="8"
              />
            </svg>
            <strong>{selectedSlot.score}</strong>
          </div>
          <p>{selectedSlot.score >= 90 ? 'Excellent Alignment' : 'Good Alignment'}</p>
        </section>

        <section className="context-card">
          <div className="context-title">
            <Icon name="psychology" />
            <h3>Generation Context</h3>
          </div>
          <p>This draft keeps the selected weekly plan slot, source boundary, platform constraint, and review requirement together.</p>
          <ul>
            {selectedSlot.context.map(([icon, title, detail]) => (
              <li key={title}>
                <Icon name={icon} />
                <div>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="context-card review-routing-card">
          <div className="context-title">
            <Icon name="fact_check" />
            <h3>Review Routing</h3>
          </div>
          <p>
            Current state: <strong>{selectedStatus}</strong>. Sending this draft to review should carry its edited copy, source summary,
            plan slot, and risk labels forward.
          </p>
          <button className="primary" onClick={sendToReview} type="button">
            <Icon name="send" />
            Route Selected Draft
          </button>
        </section>
      </aside>
    </div>
  );
}

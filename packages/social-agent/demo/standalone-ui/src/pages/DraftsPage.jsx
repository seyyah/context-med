import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '../components/Badge.jsx';
import { Icon } from '../components/Icon.jsx';
import { useWorkflowStore } from '../state/WorkflowStoreContext.jsx';

const riskTone = {
  'Low Risk': 'success',
  'Medium Risk': 'warning',
  'High Risk': 'danger'
};

const statusTone = {
  Draft: 'success',
  'Needs Review': 'warning',
  'In Review': 'warning',
  Approved: 'success',
  'Changes Requested': 'warning',
  Escalated: 'danger',
  Rejected: 'danger'
};

function platformMeta(platform) {
  const isLinkedIn = platform === 'LinkedIn';

  return {
    icon: isLinkedIn ? 'in' : 'x',
    label: isLinkedIn ? 'LinkedIn Professional' : 'X Short Form',
    meta: isLinkedIn ? 'Narrative draft from selected plan slot' : 'Compact draft from selected plan slot',
    tone: isLinkedIn ? 'linkedin' : 'x'
  };
}

function scoreForRisk(risk) {
  if (risk === 'High') {
    return 84;
  }

  if (risk === 'Medium') {
    return 88;
  }

  return 92;
}

function buildHook(content, slot) {
  if (slot.platform === 'LinkedIn') {
    return `${content.title} should stay source-backed and review-ready.`;
  }

  return `${content.title} needs a clear short-form boundary.`;
}

function buildBody(content, slot) {
  if (slot.platform === 'LinkedIn') {
    return [
      content.summary,
      `The useful story for this slot is: ${slot.focus}`,
      `The copy should keep the planned CTA visible: ${slot.cta}`,
      'The final draft should avoid diagnosis, treatment, or replacement claims and keep sensitive cases under human review.'
    ];
  }

  return [
    `${slot.focus}`,
    'Keep the boundary visible: no diagnosis, no treatment recommendations, and human review for sensitive or unclear cases.'
  ];
}

function buildHashtags(slot) {
  if (slot.platform === 'LinkedIn') {
    return slot.risk === 'High' ? '#PatientSafety #CareOperations #HealthTech' : '#CareOperations #HealthTech';
  }

  return '#CareOps #HealthTech';
}

function buildContext(content, slot) {
  return [
    ['description', 'Source Content', content.title],
    ['calendar_month', 'Plan Slot', `${slot.day} / ${slot.pillar} / ${slot.objective}`],
    ['hub', 'Platform Adaptation', `${slot.platform} draft generated from the selected weekly plan slot.`],
    ['approval', 'Review Gate', slot.status === 'Draft' ? 'Draft can be refined before review routing.' : 'Needs human review before package export.']
  ];
}

function createDraftPlans(contentPlans, storedDrafts = []) {
  const draftBySlot = new Map(storedDrafts.map((draft) => [draft.slotId, draft]));

  return contentPlans.map((content) => ({
    ...content,
    slots: content.slots.map((slot) => {
      const platform = platformMeta(slot.platform);
      const storedDraft = draftBySlot.get(slot.id);
      const body = storedDraft?.body
        ? String(storedDraft.body).split(/\n{2,}/)
        : buildBody(content, slot);

      return {
        ...slot,
        planId: content.id,
        draftRecordId: storedDraft?.id || `draft-manual-${content.id}-${slot.id}`,
        planTitle: content.title,
        planSummary: content.summary,
        platformLabel: storedDraft?.platformLabel || platform.label,
        tone: storedDraft?.tone || platform.tone,
        icon: storedDraft?.icon || platform.icon,
        title: storedDraft?.title || content.title,
        meta: storedDraft?.meta || platform.meta,
        risk: storedDraft?.risk || `${slot.risk} Risk`,
        status: storedDraft?.status || slot.status,
        score: storedDraft?.score || scoreForRisk(slot.risk),
        hook: storedDraft?.hook || buildHook(content, slot),
        body,
        hashtags: storedDraft?.hashtags || buildHashtags(slot),
        assetBrief: storedDraft?.assetBrief || `Visual brief for ${content.title}: show ${slot.pillar.toLowerCase()} with a clear human review checkpoint.`,
        packageTarget: storedDraft?.packageTarget || `${content.id}_${slot.platform.toLowerCase()}_${slot.id}.json`,
        context: storedDraft?.context || buildContext(content, slot)
      };
    })
  }));
}

function createInitialEdits(draftPlans) {
  const allDraftSlots = draftPlans.flatMap((plan) => plan.slots);

  return Object.fromEntries(
    allDraftSlots.map((slot) => [
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

function normalizeDraftStatus(status) {
  return status || 'Draft';
}

function buildDraftWorkflowItem(selectedPlan, selectedSlot, selectedDraft, selectedStatus) {
  const payload = {
    ...selectedSlot,
    id: selectedSlot.draftRecordId,
    runId: selectedPlan.runId,
    planId: selectedPlan.id,
    slotId: selectedSlot.id,
    title: selectedPlan.title,
    status: normalizeDraftStatus(selectedStatus),
    hook: selectedDraft.hook,
    body: selectedDraft.body,
    cta: selectedDraft.cta,
    hashtags: selectedDraft.hashtags,
    updatedFrom: 'drafts-page'
  };

  return {
    id: selectedSlot.draftRecordId,
    type: 'draft',
    title: selectedPlan.title,
    status: payload.status,
    payload
  };
}

function buildDraftVersionWorkflowItem(selectedPlan, selectedSlot, selectedDraft, selectedStatus, reason = 'manual_edit') {
  const createdAt = new Date().toISOString();
  const id = `draft-version-${selectedSlot.draftRecordId}-${Date.now()}`;

  return {
    id,
    type: 'draft_version',
    title: `${selectedPlan.title} draft version`,
    status: selectedStatus,
    payload: {
      id,
      draftId: selectedSlot.draftRecordId,
      runId: selectedPlan.runId,
      planId: selectedPlan.id,
      slotId: selectedSlot.id,
      platform: selectedSlot.platform,
      status: selectedStatus,
      hook: selectedDraft.hook,
      body: selectedDraft.body,
      cta: selectedDraft.cta,
      hashtags: selectedDraft.hashtags,
      reason,
      createdAt
    },
    createdAt
  };
}

export function DraftsPage() {
  const { persistWorkflowItem, updateDrafts, workflowState } = useWorkflowStore();
  const {
    selectedPlanId,
    selectedSlotId,
    draftEdits: savedDraftEdits,
    statusBySlot
  } = workflowState.drafts;
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [feedback, setFeedback] = useState('Select a content plan from the same Plan queue, then refine one of its draft slots.');
  const [draftSaveStatus, setDraftSaveStatus] = useState('idle');
  const draftPersistTimeoutsRef = useRef({});
  const draftPlans = useMemo(
    () => createDraftPlans(workflowState.snapshot.contentPlans, workflowState.snapshot.drafts),
    [workflowState.snapshot.contentPlans, workflowState.snapshot.drafts]
  );
  const draftEdits = useMemo(() => ({ ...createInitialEdits(draftPlans), ...savedDraftEdits }), [draftPlans, savedDraftEdits]);

  const selectedPlan = useMemo(
    () => draftPlans.find((plan) => plan.id === selectedPlanId) ?? draftPlans[0],
    [draftPlans, selectedPlanId]
  );
  const selectedSlot = useMemo(
    () => selectedPlan?.slots.find((slot) => slot.id === selectedSlotId) ?? selectedPlan?.slots[0],
    [selectedPlan, selectedSlotId]
  );
  const selectedDraft = selectedSlot ? draftEdits[selectedSlot.id] : null;
  const selectedStatus = selectedSlot ? statusBySlot[selectedSlot.id] ?? selectedSlot.status : 'Draft';
  const selectedDraftVersions = useMemo(
    () =>
      (workflowState.snapshot.draftVersions || [])
        .filter((version) => version.draftId === selectedSlot?.draftRecordId || version.slotId === selectedSlot?.id)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, 5),
    [selectedSlot, workflowState.snapshot.draftVersions]
  );
  const isLinkedIn = selectedSlot?.platform === 'LinkedIn';
  const filteredDraftPlans = useMemo(() => {
    const query = planSearch.trim().toLowerCase();

    if (!query) {
      return draftPlans;
    }

    return draftPlans.filter((plan) =>
      [plan.title, plan.summary, plan.priority, plan.platforms.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [planSearch]);

  if (!draftPlans.length || !selectedPlan || !selectedSlot || !selectedDraft) {
    return (
      <div className="page drafts-empty-page">
        <section className="empty-workflow-state">
          <Icon name="edit_note" />
          <h1>No draft slots yet</h1>
          <p>Generate Workspace output first. Drafts will appear after the pipeline creates plan slots and platform-specific draft records.</p>
        </section>
      </div>
    );
  }

  function selectPlan(planId) {
    const nextPlan = draftPlans.find((plan) => plan.id === planId) ?? draftPlans[0];

    updateDrafts({
      selectedPlanId: nextPlan.id,
      selectedSlotId: nextPlan.slots[0].id
    });
    setPlanPickerOpen(false);
    setPlanSearch('');
    setFeedback(`${nextPlan.title} selected from the Plan content queue.`);
  }

  function scheduleDraftPersist(plan, slot, draft, status) {
    window.clearTimeout(draftPersistTimeoutsRef.current[slot.id]);
    setDraftSaveStatus('saving');
    draftPersistTimeoutsRef.current[slot.id] = window.setTimeout(async () => {
      const saved = await persistWorkflowItem(buildDraftWorkflowItem(plan, slot, draft, status));
      if (saved) {
        await persistWorkflowItem(buildDraftVersionWorkflowItem(plan, slot, draft, status));
      }
      setDraftSaveStatus(saved ? 'saved' : 'failed');
      delete draftPersistTimeoutsRef.current[slot.id];
    }, 650);
  }

  function updateDraft(field, value) {
    const nextDraft = {
      ...draftEdits[selectedSlot.id],
      [field]: value
    };

    scheduleDraftPersist(selectedPlan, selectedSlot, nextDraft, selectedStatus);
    updateDrafts((currentDrafts) => ({
      ...currentDrafts,
      draftEdits: {
        ...currentDrafts.draftEdits,
        [selectedSlot.id]: nextDraft
      }
    }));
  }

  useEffect(() => {
    const timeouts = draftPersistTimeoutsRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  function regenerateDraft() {
    const nextDraft = {
      hook: selectedSlot.hook,
      body: selectedSlot.body.join('\n\n'),
      cta: selectedSlot.cta,
      hashtags: selectedSlot.hashtags
    };

    scheduleDraftPersist(selectedPlan, selectedSlot, nextDraft, 'Draft');
    updateDrafts((currentDrafts) => ({
      ...currentDrafts,
      draftEdits: {
        ...currentDrafts.draftEdits,
        [selectedSlot.id]: nextDraft
      },
      statusBySlot: {
        ...currentDrafts.statusBySlot,
        [selectedSlot.id]: 'Draft'
      }
    }));
    setFeedback(`${selectedSlot.platform} draft reset from the selected Plan queue slot.`);
  }

  async function restoreDraftVersion(version) {
    const restoredDraft = {
      hook: version.hook,
      body: version.body,
      cta: version.cta,
      hashtags: version.hashtags
    };

    updateDrafts((currentDrafts) => ({
      ...currentDrafts,
      draftEdits: {
        ...currentDrafts.draftEdits,
        [selectedSlot.id]: restoredDraft
      },
      statusBySlot: {
        ...currentDrafts.statusBySlot,
        [selectedSlot.id]: version.status || selectedStatus
      }
    }));

    const saved = await persistWorkflowItem(buildDraftWorkflowItem(selectedPlan, selectedSlot, restoredDraft, version.status || selectedStatus));
    if (saved) {
      await persistWorkflowItem(buildDraftVersionWorkflowItem(selectedPlan, selectedSlot, restoredDraft, version.status || selectedStatus, 'restored_version'));
    }
    setDraftSaveStatus(saved ? 'saved' : 'failed');
    setFeedback(`Restored ${selectedSlot.platform} draft from version ${version.createdAt || version.id}.`);
  }

  function exportDraft() {
    setFeedback(`${selectedSlot.platform} draft package is ready for JSON export in the package handoff step.`);
  }

  async function sendToReview() {
    const draftItem = buildDraftWorkflowItem(selectedPlan, selectedSlot, selectedDraft, 'In Review');
    window.clearTimeout(draftPersistTimeoutsRef.current[selectedSlot.id]);
    delete draftPersistTimeoutsRef.current[selectedSlot.id];

    updateDrafts((currentDrafts) => ({
      ...currentDrafts,
      statusBySlot: {
        ...currentDrafts.statusBySlot,
        [selectedSlot.id]: 'In Review'
      }
    }));
    await persistWorkflowItem(draftItem);
    await persistWorkflowItem({
      id: `review-manual-${selectedSlot.id}`,
      type: 'review_item',
      title: selectedPlan.title,
      status: 'Needs Review',
      payload: {
        id: `review-manual-${selectedSlot.id}`,
        runId: selectedPlan.runId,
        planId: selectedPlan.id,
        slotId: selectedSlot.id,
        draftId: selectedSlot.draftRecordId,
        artifactType: 'Draft',
        source: 'Drafts',
        title: selectedPlan.title,
        platform: selectedSlot.platform,
        risk: selectedSlot.risk.replace(/\s*Risk$/i, ''),
        status: 'Needs Review',
        owner: 'Content review',
        priority: selectedSlot.risk.includes('High') ? 'Urgent' : 'Today',
        packageTarget: `${selectedPlan.id}_${selectedSlot.platform.toLowerCase()}_manual.json`,
        reason: 'Draft was manually routed from Drafts to Review Queue.',
        preview: `${selectedDraft.hook}\n\n${selectedDraft.body}\n\n${selectedDraft.cta}`,
        checks: [
          ['Edited copy', 'Uses the latest editable draft fields from Drafts.'],
          ['Plan slot', `${selectedSlot.day} / ${selectedSlot.platform} / ${selectedSlot.pillar}.`],
          ['Review route', 'Needs approval before package export.']
        ]
      }
    });
    setDraftSaveStatus('saved');
    setFeedback(`${selectedSlot.platform} draft routed to Review Queue with source, plan slot, and risk context attached.`);
  }

  return (
    <div className="drafts-page-layout">
      <aside className="plans-panel">
        <div className="panel-heading">
          <div>
            <span className="kicker">Draft slots</span>
            <h2>Choose plan</h2>
          </div>
          <button aria-label="Filter draft slots" type="button">
            <Icon name="filter_list" />
          </button>
        </div>

        <section className="draft-plan-summary">
          <header>
            <span>{selectedPlan.source}</span>
            <button onClick={() => setPlanPickerOpen(true)} type="button">
              Change plan
            </button>
          </header>
          <h3>{selectedPlan.title}</h3>
          <p>{selectedPlan.summary}</p>
          <footer>
            <strong>{selectedPlan.slots.length} draft slots</strong>
            <span>{selectedPlan.platforms.join(' + ')}</span>
          </footer>
        </section>

        {planPickerOpen ? (
          <section className="draft-plan-popover" aria-label="Change content plan">
            <header>
              <div>
                <span>Plan content queue</span>
                <h3>Change plan</h3>
              </div>
              <button aria-label="Close plan picker" onClick={() => setPlanPickerOpen(false)} type="button">
                <Icon name="close" />
              </button>
            </header>

            <label className="draft-plan-search">
              <Icon name="search" />
              <input
                autoFocus
                onChange={(event) => setPlanSearch(event.target.value)}
                placeholder="Search plans..."
                value={planSearch}
              />
            </label>

            <div className="draft-plan-option-list">
              {filteredDraftPlans.map((plan) => (
                <button
                  className={plan.id === selectedPlan.id ? 'draft-plan-option selected' : 'draft-plan-option'}
                  key={plan.id}
                  onClick={() => selectPlan(plan.id)}
                  type="button"
                >
                  <div>
                    <span>{plan.source}</span>
                    <Badge tone={plan.risk === 'High' ? 'danger' : plan.risk === 'Medium' ? 'warning' : 'success'}>
                      {plan.risk} Risk
                    </Badge>
                  </div>
                  <h4>{plan.title}</h4>
                  <p>{plan.summary}</p>
                  <footer>
                    <strong>{plan.slots.length} draft slots</strong>
                    <span>{plan.platforms.join(' + ')}</span>
                  </footer>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="slot-list-heading">
          <span>Scheduled slots</span>
        </div>

        <div className="plan-list">
          {selectedPlan.slots.map((slot) => {
            const slotStatus = statusBySlot[slot.id] ?? slot.status;

            return (
              <button
                className={slot.id === selectedSlot.id ? 'plan-card active' : 'plan-card'}
                key={slot.id}
                onClick={() => updateDrafts({ selectedSlotId: slot.id })}
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
              <h2>{selectedPlan.title}</h2>
              <p>
                {selectedSlot.day} / {selectedSlot.platform} / {selectedSlot.pillar}
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

        <p className="draft-feedback">
          {feedback}
          {draftSaveStatus !== 'idle' ? (
            <strong>
              {draftSaveStatus === 'saving' ? 'Saving...' : draftSaveStatus === 'saved' ? 'Saved' : 'Save failed'}
            </strong>
          ) : null}
        </p>

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
          <p>
            This draft belongs to <strong>{selectedPlan.title}</strong> and uses the same content queue item shown on the Plan page.
          </p>
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

        <section className="context-card draft-version-card">
          <div className="context-title">
            <Icon name="history" />
            <h3>Draft Versions</h3>
          </div>
          {selectedDraftVersions.length ? (
            <ul className="draft-version-list">
              {selectedDraftVersions.map((version) => (
                <li key={version.id}>
                  <div>
                    <strong>{version.reason === 'restored_version' ? 'Restored version' : 'Saved edit'}</strong>
                    <span>{version.createdAt ? new Date(version.createdAt).toLocaleString() : version.id}</span>
                  </div>
                  <button onClick={() => restoreDraftVersion(version)} type="button">
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved draft versions yet. Edit a field and wait for the Saved state to create the first version.</p>
          )}
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

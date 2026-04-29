'use strict';

function stripRiskLabel(risk) {
  const normalized = String(risk || 'Medium').replace(/\s*risk$/i, '').trim();

  if (/high/i.test(normalized)) {
    return 'High';
  }

  if (/low/i.test(normalized)) {
    return 'Low';
  }

  return 'Medium';
}

function riskTone(risk) {
  const normalized = stripRiskLabel(risk);
  if (normalized === 'High') {
    return 'danger';
  }
  if (normalized === 'Low') {
    return 'success';
  }
  return 'warning';
}

function priorityForRisk(risk) {
  const normalized = stripRiskLabel(risk);
  if (normalized === 'High') {
    return 'High priority';
  }
  if (normalized === 'Low') {
    return 'Backlog';
  }
  return 'Medium priority';
}

function packageTargetForSlot(contentPlan, slot, index) {
  return `${contentPlan.id}_${slot.platform.toLowerCase()}_${index + 1}.json`;
}

function scoreForRisk(risk) {
  const normalized = stripRiskLabel(risk);
  if (normalized === 'High') {
    return 84;
  }
  if (normalized === 'Medium') {
    return 88;
  }
  return 92;
}

function platformKey(platform) {
  return String(platform || '').toLowerCase().includes('linkedin') ? 'linkedin' : 'x';
}

function createContentPlanFromRun(run) {
  const platforms = [...new Set(run.planSeeds.map((seed) => seed.platform))];
  const risk = stripRiskLabel(run.planSeeds.find((seed) => stripRiskLabel(seed.risk) === 'High')?.risk || run.planSeeds[0]?.risk);
  const id = `content-${run.id}`;

  return {
    id,
    runId: run.id,
    title: run.topic || run.sourcePreview || 'Workspace generated content',
    source: 'Workspace output',
    summary: run.sourcePreview || 'Generated from the latest Workspace source input.',
    priority: priorityForRisk(risk),
    risk,
    platforms,
    slots: run.planSeeds.map((seed) => ({
      id: seed.id,
      platform: seed.platform,
      day: seed.day,
      pillar: seed.contentPillar,
      objective: seed.platform === 'LinkedIn' ? 'Engagement' : 'Awareness',
      focus: seed.messageFocus,
      cta: seed.cta,
      risk: stripRiskLabel(seed.risk),
      status: seed.status
    }))
  };
}

function createDraftsFromRun(run, contentPlan) {
  return run.planSeeds.map((seed, index) => {
    const adaptation = run.adaptations.find((item) => item.tone === platformKey(seed.platform)) || run.adaptations[0] || {};
    const body = Array.isArray(adaptation.body) ? adaptation.body.join('\n\n') : String(adaptation.body || seed.messageFocus || '');

    return {
      id: `draft-${run.id}-${seed.id}`,
      runId: run.id,
      planId: contentPlan.id,
      slotId: seed.id,
      platform: seed.platform,
      platformLabel: seed.platform === 'LinkedIn' ? 'LinkedIn Professional' : 'X Short Form',
      tone: platformKey(seed.platform),
      icon: seed.platform === 'LinkedIn' ? 'in' : 'x',
      title: contentPlan.title,
      meta: seed.platform === 'LinkedIn' ? 'Narrative draft from selected plan slot' : 'Compact draft from selected plan slot',
      risk: `${stripRiskLabel(seed.risk)} Risk`,
      status: seed.status,
      score: scoreForRisk(seed.risk),
      hook: adaptation.hook || seed.messageFocus,
      body,
      cta: adaptation.cta || seed.cta,
      hashtags: adaptation.hashtags || '',
      assetBrief: `Visual brief for ${contentPlan.title}: show ${seed.contentPillar.toLowerCase()} with a clear human review checkpoint.`,
      context: [
        ['description', 'Source Content', contentPlan.title],
        ['calendar_month', 'Plan Slot', `${seed.day} / ${seed.contentPillar} / ${seed.platform}`],
        ['hub', 'Platform Adaptation', `${seed.platform} draft generated from the selected weekly plan slot.`],
        ['approval', 'Review Gate', seed.status === 'Draft' ? 'Draft can be refined before review routing.' : 'Needs human review before package export.']
      ],
      packageTarget: packageTargetForSlot(contentPlan, seed, index)
    };
  });
}

function createReviewItemsFromRun(run, contentPlan, drafts) {
  const draftBySlot = new Map(drafts.map((draft) => [draft.slotId, draft]));

  return run.reviewItems.map((item, index) => {
    const planSeed = run.planSeeds.find((seed) => item.id.includes(seed.id)) || run.planSeeds[index % run.planSeeds.length] || {};
    const draft = draftBySlot.get(planSeed.id);
    const source = item.source === 'draft' ? 'Drafts' : 'Plan';
    const artifactType = item.source === 'draft' ? 'Draft' : 'Plan Slot';
    const risk = stripRiskLabel(item.risk || planSeed.risk);

    return {
      id: `RQ-${run.id.slice(-6)}-${String(index + 1).padStart(2, '0')}`,
      runId: run.id,
      planId: contentPlan.id,
      slotId: planSeed.id || '',
      draftId: draft?.id || '',
      artifactType,
      source,
      title: contentPlan.title,
      platform: item.platform || planSeed.platform || 'Community',
      risk,
      status: item.status || 'Needs Review',
      owner: risk === 'High' ? 'Clinical policy review' : 'Content review',
      priority: risk === 'High' ? 'Urgent' : 'Today',
      packageTarget: draft?.packageTarget || `${contentPlan.id}_review_${index + 1}.json`,
      reason: `${item.label || planSeed.messageFocus || contentPlan.summary} This item needs review context before package handoff.`,
      preview: `${contentPlan.title}\n\n${draft?.body || planSeed.messageFocus || item.label || ''}\n\nSource boundary: ${contentPlan.summary}`,
      checks: [
        ['Source aligned', `Uses the Workspace-derived content item: ${contentPlan.title}.`],
        ['Artifact source', `${artifactType} from ${source}.`],
        ['Review route', 'Needs approval before export to Packages.']
      ]
    };
  });
}

function createPackagesFromSnapshot(contentPlans, drafts, reviewItems) {
  return contentPlans.map((contentPlan, index) => {
    const planDrafts = drafts.filter((draft) => draft.planId === contentPlan.id);
    const planReviews = reviewItems.filter((item) => item.runId === contentPlan.runId);
    const reviewStatuses = planReviews.map((item) => item.status);
    const hasBlockedReview = reviewStatuses.some((status) => ['Rejected', 'Changes Requested'].includes(status));
    const hasEscalatedReview = reviewStatuses.includes('Escalated');
    const hasPendingReview = reviewStatuses.some((status) => ['Needs Review', 'In Review'].includes(status));
    const allReviewsApproved = planReviews.length > 0 && reviewStatuses.every((status) => status === 'Approved');
    const highRisk = planReviews.some((item) => stripRiskLabel(item.risk) === 'High') || stripRiskLabel(contentPlan.risk) === 'High';
    const exportState = hasBlockedReview
      ? {
        label: 'Changes Required',
        manifestStatus: 'BLOCKED',
        exportType: 'blocked',
        tone: 'danger'
      }
      : allReviewsApproved
        ? {
          label: 'Approved Export',
          manifestStatus: 'APPROVED_EXPORT',
          exportType: 'approved',
          tone: 'success'
        }
        : hasPendingReview || hasEscalatedReview || highRisk
          ? {
            label: 'Needs Review',
            manifestStatus: 'REVIEW_REQUIRED',
            exportType: 'review_required',
            tone: hasEscalatedReview || highRisk ? 'danger' : 'warning'
          }
          : {
            label: 'Ready',
            manifestStatus: 'READY_FOR_HANDOFF',
            exportType: 'ready',
            tone: 'success'
          };
    const id = `PKG-${String(index + 1).padStart(4, '0')}-${contentPlan.id.slice(0, 8).toUpperCase()}`;

    return {
      id,
      task: `${contentPlan.title} package`,
      platforms: contentPlan.platforms.map((platform) => (platform === 'LinkedIn' ? 'in' : platform)),
      status: exportState.label,
      tone: exportState.tone,
      manifest: {
        packageId: id,
        taskType: 'SOCIAL_AGENT_WORKFLOW',
        status: exportState.manifestStatus,
        exportType: exportState.exportType,
        riskLevel: stripRiskLabel(contentPlan.risk).toLowerCase(),
        platforms: contentPlan.platforms.map((platform) => platform.toUpperCase()),
        reviewSummary: {
          total: planReviews.length,
          approved: reviewStatuses.filter((status) => status === 'Approved').length,
          pending: reviewStatuses.filter((status) => ['Needs Review', 'In Review'].includes(status)).length,
          escalated: reviewStatuses.filter((status) => status === 'Escalated').length,
          blocked: reviewStatuses.filter((status) => ['Rejected', 'Changes Requested'].includes(status)).length
        },
        artifacts: [
          { type: 'WORKSPACE_RUN', id: contentPlan.runId },
          { type: 'CONTENT_PLAN', id: contentPlan.id },
          ...planDrafts.map((draft) => ({ type: 'DRAFT', id: draft.id })),
          ...planReviews.map((review) => ({ type: 'REVIEW_ITEM', id: review.id }))
        ],
        directPublishing: false
      }
    };
  });
}

function createWorkflowRecordsFromRun(run) {
  const contentPlan = createContentPlanFromRun(run);
  const drafts = createDraftsFromRun(run, contentPlan);
  const reviewItems = createReviewItemsFromRun(run, contentPlan, drafts);

  return [
    {
      id: run.id,
      type: 'workspace_run',
      title: run.topic || run.sourcePreview || 'Workspace run',
      status: reviewItems.length ? 'needs_review' : 'draft',
      payload: run
    },
    {
      id: contentPlan.id,
      type: 'content_plan',
      title: contentPlan.title,
      status: 'active',
      payload: contentPlan
    },
    ...drafts.map((draft) => ({
      id: draft.id,
      type: 'draft',
      title: draft.title,
      status: draft.status,
      payload: draft
    })),
    ...reviewItems.map((reviewItem) => ({
      id: reviewItem.id,
      type: 'review_item',
      title: reviewItem.title,
      status: reviewItem.status,
      payload: reviewItem
    }))
  ];
}

async function saveWorkflowRecords(store, records) {
  const saved = [];
  for (const record of records) {
    saved.push(await store.saveItem(record));
  }
  return saved;
}

function createSnapshotFromItems(items) {
  const byType = (type) => items.filter((item) => item.type === type).map((item) => item.payload);
  const contentPlans = byType('content_plan');
  const drafts = byType('draft');
  const draftVersions = byType('draft_version');
  const reviewQueueItems = byType('review_item');
  const workspaceRuns = byType('workspace_run');
  const packages = createPackagesFromSnapshot(contentPlans, drafts, reviewQueueItems);

  return {
    workspaceRuns,
    latestRun: workspaceRuns[0] || null,
    contentPlans,
    drafts,
    draftVersions,
    reviewQueueItems,
    packages,
    metrics: {
      contentPlans: contentPlans.length,
      draftSlots: drafts.length,
      draftVersions: draftVersions.length,
      reviewItems: reviewQueueItems.length,
      packages: packages.length
    }
  };
}

module.exports = {
  createSnapshotFromItems,
  createWorkflowRecordsFromRun,
  riskTone,
  saveWorkflowRecords,
  stripRiskLabel
};

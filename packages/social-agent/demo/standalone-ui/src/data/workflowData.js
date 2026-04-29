export const contentPlans = [
  {
    id: 'patient-intake',
    title: 'Patient intake dashboard update',
    source: 'Workspace output',
    summary: 'Operational visibility, faster routing, privacy-safe review, and human escalation boundaries.',
    priority: 'High priority',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'patient-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Operational Visibility',
        objective: 'Engagement',
        focus: 'Frame the dashboard as workflow support for care coordination teams.',
        cta: 'Which review step creates the most friction for care coordination teams?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'patient-x-01',
        platform: 'X',
        day: 'Tuesday',
        pillar: 'Escalation Paths',
        objective: 'Awareness',
        focus: 'Condense privacy-safe intake review into a short guardrail-first post.',
        cta: 'What should teams check before posting intake workflow updates?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'patient-linkedin-02',
        platform: 'LinkedIn',
        day: 'Wednesday',
        pillar: 'Human Review',
        objective: 'Trust',
        focus: 'Explain why sensitive cases and unclear medical questions stay under human review.',
        cta: 'How do you keep operational automation under human oversight?',
        risk: 'High',
        status: 'Draft'
      },
      {
        id: 'patient-x-02',
        platform: 'X',
        day: 'Thursday',
        pillar: 'Care Operations',
        objective: 'Awareness',
        focus: 'Summarize faster routing without making clinical claims.',
        cta: 'Where should automation stop and review begin?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  },
  {
    id: 'review-queue',
    title: 'Human review guardrails',
    source: 'Workspace output',
    summary: 'A follow-up angle from the same source focused on what stays under human review before publishing.',
    priority: 'Medium priority',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'review-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Human Review',
        objective: 'Education',
        focus: 'Explain why sensitive cases, unclear medical questions, and crisis signals need visible human review.',
        cta: 'Which intake signals should never skip review?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'review-x-01',
        platform: 'X',
        day: 'Wednesday',
        pillar: 'Approval Workflow',
        objective: 'Engagement',
        focus: 'Turn human review into a short boundary-setting takeaway.',
        cta: 'What should always stay under human review?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'community-recap',
    title: 'Privacy-safe intake review',
    source: 'Workspace output',
    summary: 'A second Workspace-derived content angle focused on private patient details and safe public communication.',
    priority: 'Later this week',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'community-linkedin-01',
        platform: 'LinkedIn',
        day: 'Friday',
        pillar: 'Privacy-Safe Review',
        objective: 'Trust',
        focus: 'Explain how private patient details stay out of public replies while teams still move faster.',
        cta: 'What privacy check should happen before an intake update is posted?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'community-x-01',
        platform: 'X',
        day: 'Friday',
        pillar: 'Privacy Boundaries',
        objective: 'Engagement',
        focus: 'Ask a short question about keeping private details out of public social replies.',
        cta: 'What should never appear in a public reply?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'care-team-tip',
    title: 'Faster routing for care teams',
    source: 'Workspace output',
    summary: 'A practical Workspace-derived post about reducing manual sorting while preserving escalation paths.',
    priority: 'Next week candidate',
    risk: 'Low',
    platforms: ['LinkedIn'],
    slots: [
      {
        id: 'care-tip-linkedin-01',
        platform: 'LinkedIn',
        day: 'Thursday',
        pillar: 'Care Operations',
        objective: 'Education',
        focus: 'Share one operational tip for routing intake messages without over-automating review.',
        cta: 'Where does manual review still matter most in intake work?',
        risk: 'Low',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'escalation-paths',
    title: 'Clear escalation paths',
    source: 'Workspace output',
    summary: 'A Workspace-derived angle about routing sensitive or unclear intake cases to the right internal workflow.',
    priority: 'Next week candidate',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'escalation-linkedin-01',
        platform: 'LinkedIn',
        day: 'Tuesday',
        pillar: 'Escalation Paths',
        objective: 'Trust',
        focus: 'Explain how clear escalation paths help teams respond without over-claiming automation capability.',
        cta: 'Where should escalation be visible in an intake workflow?',
        risk: 'High',
        status: 'Needs Review'
      },
      {
        id: 'escalation-x-01',
        platform: 'X',
        day: 'Wednesday',
        pillar: 'Safety Workflow',
        objective: 'Awareness',
        focus: 'Summarize the need for escalation paths when intake messages include sensitive signals.',
        cta: 'What should trigger human escalation?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  },
  {
    id: 'manual-sorting',
    title: 'Reduced manual sorting',
    source: 'Workspace output',
    summary: 'A practical content angle about reducing repetitive intake sorting while keeping review accountability intact.',
    priority: 'Backlog',
    risk: 'Low',
    platforms: ['LinkedIn'],
    slots: [
      {
        id: 'sorting-linkedin-01',
        platform: 'LinkedIn',
        day: 'Monday',
        pillar: 'Operational Efficiency',
        objective: 'Education',
        focus: 'Position reduced manual sorting as an operations improvement rather than a clinical decision system.',
        cta: 'Which intake sorting task creates the most repeated work?',
        risk: 'Low',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'privacy-checklist',
    title: 'Privacy review checklist',
    source: 'Workspace output',
    summary: 'A checklist-style content idea for keeping private patient details out of public social replies.',
    priority: 'Backlog',
    risk: 'Medium',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'privacy-checklist-linkedin-01',
        platform: 'LinkedIn',
        day: 'Thursday',
        pillar: 'Privacy-Safe Review',
        objective: 'Education',
        focus: 'Turn the source boundary into a short checklist for public social content review.',
        cta: 'What privacy check belongs in every social approval flow?',
        risk: 'Medium',
        status: 'Needs Review'
      },
      {
        id: 'privacy-checklist-x-01',
        platform: 'X',
        day: 'Friday',
        pillar: 'Privacy Boundaries',
        objective: 'Engagement',
        focus: 'Ask one direct question about privacy checks before posting public replies.',
        cta: 'What should be removed before a public reply goes live?',
        risk: 'Medium',
        status: 'Draft'
      }
    ]
  },
  {
    id: 'not-a-diagnosis',
    title: 'Not a diagnosis message',
    source: 'Workspace output',
    summary: 'A boundary-setting content angle that makes clear the dashboard supports intake operations, not clinical judgment.',
    priority: 'Backlog',
    risk: 'High',
    platforms: ['LinkedIn', 'X'],
    slots: [
      {
        id: 'diagnosis-linkedin-01',
        platform: 'LinkedIn',
        day: 'Tuesday',
        pillar: 'Clinical Boundaries',
        objective: 'Trust',
        focus: 'Clarify the difference between operational intake support and clinical diagnosis.',
        cta: 'How do you communicate automation boundaries clearly?',
        risk: 'High',
        status: 'Needs Review'
      },
      {
        id: 'diagnosis-x-01',
        platform: 'X',
        day: 'Thursday',
        pillar: 'Clinical Boundaries',
        objective: 'Awareness',
        focus: 'State the no-diagnosis boundary in a short post with a human-review reminder.',
        cta: 'What should automation never claim?',
        risk: 'High',
        status: 'Needs Review'
      }
    ]
  }
];

export const sourceContext = `# Patient intake dashboard update

Context-Med is releasing a patient intake dashboard update for care coordination teams.

The update helps teams review incoming intake messages, identify incomplete information, and route cases to the right internal workflow faster.

The communication should focus on operational visibility, reduced manual sorting, privacy-safe review, and clearer escalation paths.

Do not claim that the dashboard diagnoses patients, recommends treatment, or replaces clinical judgment. Emphasize that sensitive cases, crisis signals, and unclear medical questions remain under human review.`;

export const moderationReports = [
  {
    id: 'mod-01',
    classification: 'Clinical claim question',
    source: 'Can this dashboard diagnose symptoms from intake messages?',
    risk: 'High',
    action: 'Escalate',
    status: 'Escalated',
    reply: 'Thanks for asking. The dashboard supports intake review and routing. It does not diagnose symptoms or recommend treatment.'
  },
  {
    id: 'mod-02',
    classification: 'Privacy concern',
    source: 'How do you stop private patient details from being used in public replies?',
    risk: 'High',
    action: 'Escalate',
    status: 'Needs Review',
    reply: 'Private patient details should stay out of public replies. Sensitive questions are routed for internal human review.'
  },
  {
    id: 'mod-03',
    classification: 'Positive feedback',
    source: 'This would help our intake team avoid missing urgent messages.',
    risk: 'Low',
    action: 'Reply',
    status: 'Ready',
    reply: 'That is the goal: clearer visibility, faster routing, and review paths for urgent intake signals.'
  },
  {
    id: 'mod-04',
    classification: 'Safety crisis',
    source: 'What happens if someone mentions self-harm or a safety crisis?',
    risk: 'High',
    action: 'Escalate',
    status: 'Escalated',
    reply: 'Safety crisis signals require immediate human review and escalation through the appropriate internal workflow.'
  },
  {
    id: 'mod-05',
    classification: 'Spam',
    source: 'Buy cheap followers now crypto promo',
    risk: 'Low',
    action: 'Ignore',
    status: 'Closed',
    reply: ''
  }
];

export function getAllPlanSlots() {
  return contentPlans.flatMap((content) =>
    content.slots.map((slot) => ({
      ...slot,
      contentId: content.id,
      contentTitle: content.title,
      contentSummary: content.summary
    }))
  );
}

export function getWorkflowPlatforms() {
  return [...new Set(contentPlans.flatMap((content) => content.platforms))];
}

export const reviewItems = [
  ...getAllPlanSlots()
    .filter((slot) => slot.status !== 'Draft' || slot.risk === 'High')
    .map((slot) => ({
      id: `review-${slot.id}`,
      source: 'Plan',
      channel: slot.platform,
      label: slot.contentTitle,
      risk: slot.risk,
      action: 'Review',
      status: slot.status,
      quote: slot.cta
    })),
  ...moderationReports
    .filter((item) => item.status !== 'Closed')
    .map((item) => ({
      id: `review-${item.id}`,
      source: 'Moderation',
      channel: 'Community',
      label: item.classification,
      risk: item.risk,
      action: item.action,
      status: item.status,
      quote: item.source
    }))
];

function packageTargetForSlot(slot, index) {
  return `${slot.contentId}_${slot.platform.toLowerCase()}_${index + 1}.json`;
}

function reviewOwnerForSlot(slot) {
  if (slot.risk === 'High') {
    return 'Clinical policy review';
  }

  return slot.platform === 'LinkedIn' ? 'Marketing review' : 'Social review';
}

function priorityForRisk(risk) {
  if (risk === 'High') {
    return 'Urgent';
  }

  if (risk === 'Medium') {
    return 'Today';
  }

  return 'Next';
}

export const reviewQueueItems = [
  ...getAllPlanSlots()
    .filter((slot) => slot.status !== 'Draft' || slot.risk !== 'Low')
    .slice(0, 6)
    .map((slot, index) => ({
      id: `RQ-${8422 + index}`,
      artifactType: slot.status === 'Draft' ? 'Plan Slot' : 'Draft',
      source: slot.status === 'Draft' ? 'Plan' : 'Drafts',
      title: slot.contentTitle,
      platform: slot.platform,
      risk: slot.risk,
      status: slot.status === 'Draft' ? 'Changes Requested' : slot.status,
      owner: reviewOwnerForSlot(slot),
      priority: priorityForRisk(slot.risk),
      packageTarget: packageTargetForSlot(slot, index),
      reason: `${slot.focus} This item needs review context before package handoff.`,
      preview: `${slot.contentTitle}\n\n${slot.focus} ${slot.cta}\n\nSource boundary: ${slot.contentSummary}`,
      checks: [
        ['Source aligned', `Uses the shared Workspace-derived content item: ${slot.contentTitle}.`],
        ['Plan slot', `${slot.day} / ${slot.platform} / ${slot.pillar}.`],
        ['Review route', slot.status === 'Draft' ? 'Reviewer requested edits before handoff.' : 'Needs approval before export to Packages.']
      ]
    })),
  ...moderationReports
    .filter((report) => report.status !== 'Closed')
    .slice(0, 4)
    .map((report, index) => ({
      id: `RQ-${8520 + index}`,
      artifactType: 'Moderation',
      source: 'Moderation',
      title: report.classification,
      platform: 'Community',
      risk: report.risk,
      status: report.status,
      owner: report.risk === 'High' ? 'Safety review' : 'Community review',
      priority: priorityForRisk(report.risk),
      packageTarget: `moderation-${report.id}.json`,
      reason: `Community signal requires ${report.action.toLowerCase()} handling before any public response is packaged.`,
      preview: `User signal: ${report.source}\n\nSuggested reply: ${report.reply || 'No reply recommended.'}`,
      checks: [
        ['Classification', report.classification],
        ['Recommended action', report.action],
        ['Response boundary', report.reply ? 'Suggested reply remains non-clinical and source-bounded.' : 'No public reply should be generated for this item.']
      ]
    }))
];

export function riskTone(risk) {
  if (risk === 'High' || risk === 'High Risk') {
    return 'danger';
  }

  if (risk === 'Medium' || risk === 'Medium Risk') {
    return 'warning';
  }

  return 'success';
}

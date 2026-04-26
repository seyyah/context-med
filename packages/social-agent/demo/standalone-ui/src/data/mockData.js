export const sourceContext = `# Patient intake dashboard update

Context-Med is releasing a patient intake dashboard update for care coordination teams.

The update helps teams review incoming intake messages, identify incomplete information, and route cases to the right internal workflow faster.

The communication should focus on operational visibility, reduced manual sorting, privacy-safe review, and clearer escalation paths.

Do not claim that the dashboard diagnoses patients, recommends treatment, or replaces clinical judgment. Emphasize that sensitive cases, crisis signals, and unclear medical questions remain under human review.`;

export const communityComments = [
  'Can this dashboard diagnose symptoms from intake messages?',
  'How do you stop private patient details from being used in public replies?',
  'This would help our intake team avoid missing urgent messages.',
  'What happens if someone mentions self-harm or a safety crisis?',
  'Does this replace the care coordinator?',
  'Great idea, the escalation workflow is what we need.',
  'Buy cheap followers now crypto promo'
].join('\n');

export const planItems = [
  {
    id: 'plan-linkedin-01',
    platform: 'LinkedIn',
    day: 'Monday',
    pillar: 'Operational Visibility',
    topic: 'Patient intake dashboard update',
    cta: 'Which review step creates the most friction for care coordination teams?',
    risk: 'Medium',
    status: 'Needs Review'
  },
  {
    id: 'plan-x-01',
    platform: 'X',
    day: 'Tuesday',
    pillar: 'Escalation Paths',
    topic: 'Privacy-safe intake review',
    cta: 'What should teams check before posting intake workflow updates?',
    risk: 'Medium',
    status: 'Needs Review'
  },
  {
    id: 'plan-linkedin-02',
    platform: 'LinkedIn',
    day: 'Wednesday',
    pillar: 'Human Review',
    topic: 'Sensitive case routing',
    cta: 'How do you keep operational automation under human oversight?',
    risk: 'High',
    status: 'Draft'
  },
  {
    id: 'plan-x-02',
    platform: 'X',
    day: 'Thursday',
    pillar: 'Care Operations',
    topic: 'Faster routing without clinical claims',
    cta: 'Where should automation stop and review begin?',
    risk: 'High',
    status: 'Needs Review'
  }
];

export const drafts = [
  {
    id: 'draft-linkedin-01',
    platform: 'LinkedIn Professional',
    icon: 'in',
    tone: 'linkedin',
    wordCount: '184 words',
    readingTime: '45s',
    risk: 'Low Risk',
    status: 'Needs Review',
    hook: 'Patient intake work moves faster when routing is clear and review stays visible.',
    body: [
      'Context-Med is releasing a patient intake dashboard update for care coordination teams.',
      'The update helps teams review incoming intake messages, identify incomplete information, and route cases to the right internal workflow faster.',
      'The important boundary is clear: this dashboard supports intake operations. It does not diagnose patients, recommend treatment, or replace clinical judgment.',
      'Sensitive cases, crisis signals, and unclear medical questions remain under human review before any public response or workflow action moves forward.'
    ],
    cta: 'Which review step creates the most friction for care coordination teams?',
    hashtags: '#CareOperations #HealthTech #PatientSafety'
  },
  {
    id: 'draft-x-01',
    platform: 'X Short Form',
    icon: 'x',
    tone: 'x',
    wordCount: '236/280 chars',
    readingTime: 'Short form',
    risk: 'Low Risk',
    status: 'Needs Review',
    hook: 'Patient intake updates need speed and guardrails.',
    body: [
      'Context-Med helps care teams review intake messages, spot missing info, and route cases faster.',
      'No diagnosis. No treatment recommendations. Sensitive or unclear cases stay under human review.'
    ],
    cta: 'Where should intake automation stop?',
    hashtags: '#HealthTech #CareOps'
  }
];

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

export const reviewItems = [
  ...planItems.slice(0, 3).map((item) => ({
    id: `review-${item.id}`,
    source: 'Plan',
    channel: item.platform,
    label: item.topic,
    risk: item.risk,
    action: 'Review',
    status: item.status,
    quote: item.cta
  })),
  ...drafts.map((item) => ({
    id: `review-${item.id}`,
    source: 'Draft',
    channel: item.platform.includes('LinkedIn') ? 'LinkedIn' : 'X',
    label: item.hook,
    risk: 'Medium',
    action: 'Review',
    status: item.status,
    quote: item.body[0]
  })),
  ...moderationReports.slice(0, 4).map((item) => ({
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

export const metrics = [
  { label: 'Generated platforms', value: '2', detail: 'LinkedIn and X outputs' },
  { label: 'Needs review', value: '7', detail: 'Plans, drafts, and comments' },
  { label: 'High risk items', value: '4', detail: 'Clinical, privacy, and safety' },
  { label: 'Package status', value: 'Ready', detail: 'JSON export prepared' }
];

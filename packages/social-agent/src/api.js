'use strict';

const pkg = require('../package.json');
const { buildDraftPayload } = require('./commands/draft');
const { buildModerationPayload } = require('./commands/moderate');
const { buildPlanPayload } = require('./commands/plan');
const {
  SCHEMA_VERSION,
  approvalRequired,
  assertLanguage,
  contentPillar,
  riskLevel,
  sourceQuote
} = require('./index');

const DEFAULT_DEMO_SOURCE = [
  '# Context-Med social launch briefing',
  '',
  'Context-Med is preparing a source-backed AI triage workspace update for clinical operations teams.',
  'The message should focus on review discipline, escalation paths, and workflow clarity rather than unsupported clinical claims.',
  'The audience includes product leaders, care operations managers, and technical stakeholders who need concise, review-ready social content.'
].join('\n');

const DEFAULT_DEMO_COMMENTS = [
  'How does this workflow keep sensitive patient information out of public replies?',
  'This looks unsafe if a crisis or privacy breach happens. Who reviews the response?',
  'Great breakdown. The review queue idea is helpful for our operations team.',
  'spam buy now crypto offer'
];

function normalizeDemoComment(comment) {
  if (typeof comment === 'string') {
    return comment;
  }

  if (comment && typeof comment === 'object') {
    return String(comment.text || comment.body || comment.comment || '');
  }

  return '';
}

function createReviewQueue(plan, draftPackage, moderationReports) {
  const planItems = plan.items
    .filter((item) => item.approval_required || item.status === 'needs_review')
    .map((item) => ({
      id: `review-${item.id}`,
      source: 'plan',
      label: item.topic,
      platform: item.platform,
      risk_level: item.risk_level,
      recommended_action: 'review',
      status: 'needs_review',
      source_quote: item.source_quote
    }));

  const draftItems = draftPackage.drafts
    .filter((draft) => draft.approval_required)
    .map((draft) => ({
      id: `review-${draft.id}`,
      source: 'draft',
      label: draft.hook,
      platform: draft.platform,
      risk_level: draft.risk_level,
      recommended_action: 'review',
      status: 'needs_review',
      source_quote: draft.source_quote
    }));

  const moderationItems = moderationReports
    .filter((report) => report.approval_required || report.recommended_action === 'escalate')
    .map((report, index) => ({
      id: `review-moderation-${String(index + 1).padStart(2, '0')}`,
      source: 'moderation',
      label: report.classification,
      platform: 'community',
      risk_level: report.risk_level,
      recommended_action: report.recommended_action,
      status: report.recommended_action === 'escalate' ? 'escalated' : 'needs_review',
      source_quote: report.source_quote
    }));

  return [...planItems, ...draftItems, ...moderationItems];
}

function createDemoSummary(source, plan, draftPackage, moderationReports, reviewQueue) {
  const highRiskCount = [
    plan,
    draftPackage,
    ...moderationReports
  ].filter((item) => item.risk_level === 'high').length;

  return {
    topic: plan.topic,
    source_quote: sourceQuote(source),
    content_pillar: contentPillar(source),
    risk_level: riskLevel(source),
    approval_required: approvalRequired(riskLevel(source)),
    planned_posts: plan.items.length,
    drafts: draftPackage.drafts.length,
    moderation_reports: moderationReports.length,
    review_queue_items: reviewQueue.length,
    high_risk_reports: highRiskCount
  };
}

function createSocialAgentDemo(options = {}) {
  const language = assertLanguage(options.language || 'en');
  const inputPath = options.inputPath || 'demo/social-agent-source.md';
  const source = options.source || DEFAULT_DEMO_SOURCE;
  const comments = (options.comments || DEFAULT_DEMO_COMMENTS).map(normalizeDemoComment).filter(Boolean);
  const commandOptions = { language };

  const plan = buildPlanPayload(inputPath, source, commandOptions);
  const draftPackage = buildDraftPayload(inputPath, source, commandOptions);
  const moderationReports = comments.map((comment, index) => buildModerationPayload(
    `${inputPath}#comment-${index + 1}`,
    comment,
    commandOptions
  ));
  const reviewQueue = createReviewQueue(plan, draftPackage, moderationReports);

  return {
    type: 'social_agent_demo',
    schema_version: SCHEMA_VERSION,
    package: {
      name: pkg.name,
      version: pkg.version
    },
    language,
    source: {
      input: inputPath,
      preview: sourceQuote(source),
      text: source,
      comments
    },
    summary: createDemoSummary(source, plan, draftPackage, moderationReports, reviewQueue),
    plan,
    drafts: draftPackage,
    moderation: {
      type: 'moderation_batch',
      schema_version: SCHEMA_VERSION,
      reports: moderationReports
    },
    review_queue: reviewQueue,
    packages: [
      {
        id: 'package-demo-json',
        format: 'json',
        status: 'ready',
        includes: ['plan', 'drafts', 'moderation', 'review_queue'],
        approval_required: reviewQueue.length > 0
      }
    ],
    writeback: {
      status: 'disabled',
      mode: 'local_demo',
      message: 'Direct publishing and analytics writeback are outside the MVP boundary.'
    },
    settings: {
      platforms: plan.platforms,
      deterministic_mode: true,
      llm_api_calls: false,
      direct_publishing: false
    }
  };
}

module.exports = {
  DEFAULT_DEMO_COMMENTS,
  DEFAULT_DEMO_SOURCE,
  buildDraftPayload,
  buildModerationPayload,
  buildPlanPayload,
  createSocialAgentDemo
};

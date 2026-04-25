'use strict';

const pkg = require('../package.json');
const {
  appendHashtags,
  buildDraftPayload,
  hashtagPolicyFor,
  hashtagsFor
} = require('./commands/draft');
const { buildModerationPayload } = require('./commands/moderate');
const { buildPlanPayload } = require('./commands/plan');
const {
  PLATFORMS,
  SCHEMA_VERSION,
  approvalRequired,
  assertLanguage,
  cleanText,
  contentPillar,
  riskLevel,
  sourceQuote
} = require('./index');
const {
  cleanGeminiError,
  generateWorkspaceWithGemini,
  getGeminiApiKey,
  getGeminiModel
} = require('./gemini');

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
const PLAN_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

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
      source_quote: draft.source_quote,
      current_copy: draft.body
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

function createLocalGeneration(message, fallbackReason) {
  const generation = {
    mode: 'deterministic',
    provider: 'local',
    model: 'none',
    status: 'fallback',
    llm_api_calls: false,
    message: message || 'Local deterministic output is being used.'
  };

  if (fallbackReason) {
    generation.fallback_reason = fallbackReason;
  }

  return generation;
}

function createGeminiGeneration(model) {
  return {
    mode: 'gemini',
    provider: 'google-gemini',
    model,
    status: 'live',
    llm_api_calls: true,
    message: 'Workspace output was generated with Gemini from the current source and comments.'
  };
}

function withGenerationMetadata(payload, generation) {
  return {
    ...payload,
    generation,
    settings: {
      ...payload.settings,
      deterministic_mode: generation.mode !== 'gemini',
      llm_api_calls: generation.llm_api_calls,
      generation_provider: generation.provider,
      generation_model: generation.model,
      generation_status: generation.status
    }
  };
}

function shouldUseGemini(options) {
  const requestedMode = String(options.mode || options.generationMode || '').toLowerCase();
  const environmentMode = String(process.env.SOCIAL_AGENT_LLM_MODE || '').toLowerCase();

  if (options.llm === false || requestedMode === 'deterministic' || environmentMode === 'deterministic') {
    return false;
  }

  return Boolean(getGeminiApiKey());
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePlatform(value, fallback) {
  const normalized = String(value || '').toLowerCase().trim();
  return PLATFORMS.includes(normalized) ? normalized : fallback;
}

function normalizeRisk(value, fallback) {
  const normalized = String(value || '').toLowerCase().trim();
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }
  return fallback || 'medium';
}

function normalizeStatus(value, fallback) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, '')
    .replace(/\s+/g, '_');

  if (['draft', 'ready', 'needs_review', 'approved', 'escalated'].includes(normalized)) {
    return normalized;
  }

  return fallback || 'draft';
}

function normalizeAction(value, fallback) {
  const normalized = String(value || '').toLowerCase().trim();
  if (['reply', 'ignore', 'escalate', 'review'].includes(normalized)) {
    return normalized === 'review' ? 'reply' : normalized;
  }
  return fallback || 'reply';
}

function needsDraftRepair(platform, hook, body) {
  const combined = `${hook || ''}\n${body || ''}`.toLowerCase();
  const genericLaunchPatterns = [
    'revolutionizing',
    'big news',
    'excited to announce',
    'designed to empower',
    'unparalleled',
    'game-changing',
    'faster than ever',
    'at context-med, we understand',
    'our new dashboard is here',
    'new patient intake dashboard alert'
  ];

  if (genericLaunchPatterns.some((pattern) => combined.includes(pattern))) {
    return true;
  }

  if (platform === 'linkedin') {
    const hasStructure = body.includes('\n\n') || body.includes('- ');
    const hasReviewBoundary = /review|approval|escalation|human/i.test(body);
    return !hasStructure || !hasReviewBoundary;
  }

  if (platform === 'x') {
    return body.length > 260 || !body.includes('?') || /paragraph|linkedin version/i.test(combined);
  }

  return false;
}

function createRepairedDraft(platform, topic, fallback, source) {
  const title = cleanText(topic || fallback.hook || fallback.topic || 'Social workflow update', 90);
  const hashtags = hashtagsFor(`${source || ''}\n${title}`, platform);

  if (platform === 'x') {
    return {
      hook: cleanText(title, 100),
      body: appendHashtags(
        cleanText(`${title}: source-backed copy, visible review gates, human escalation. What should be checked before posting?`, 230),
        hashtags,
        'x'
      ),
      cta: 'What should be checked before posting?',
      hashtags,
      hashtag_policy: hashtagPolicyFor('x')
    };
  }

  return {
    hook: `${title}: safer social operations, not louder launch copy`,
    body: appendHashtags([
      `${title} should not read like another product announcement.`,
      `For care operations teams, the useful story is the workflow change: source context stays attached, sensitive replies stay out of public automation, and review status is visible before anything is published.`,
      `What this helps teams do:`,
      `- turn source material into platform-ready copy`,
      `- keep review gates close to the draft`,
      `- route crisis, privacy, or unclear medical questions to a human`,
      `- avoid unsupported clinical claims in public content`,
      `The goal is not more posts. It is safer social operations with a clearer approval path.`,
      `Which review step creates the most friction for your team today?`
    ].join('\n\n'), hashtags, 'linkedin'),
    cta: 'Which review step creates the most friction for your team today?',
    hashtags,
    hashtag_policy: hashtagPolicyFor('linkedin')
  };
}

function normalizeStringArray(value, fallback) {
  const items = asArray(value)
    .map((item) => cleanText(item, 120))
    .filter(Boolean);

  return items.length ? items : fallback;
}

function normalizeHashtags(value, fallback, source, platform) {
  const provided = normalizeStringArray(value, []);
  const normalized = provided
    .map((tag) => {
      const compact = tag.replace(/\s+/g, '');
      return compact.startsWith('#') ? compact : `#${compact}`;
    })
    .filter((tag) => /^#[A-Za-z][A-Za-z0-9]*$/.test(tag));
  const selected = normalized.length
    ? normalized
    : (fallback && fallback.length ? fallback : hashtagsFor(source, platform));
  return Array.from(new Set(selected)).slice(0, platform === 'x' ? 2 : 3);
}

function normalizeHashtagPolicy(platform, generatedPolicy, fallbackPolicy) {
  const generated = generatedPolicy && typeof generatedPolicy === 'object' ? generatedPolicy : {};
  const fallback = fallbackPolicy && typeof fallbackPolicy === 'object'
    ? fallbackPolicy
    : hashtagPolicyFor(platform);
  const max = Number.parseInt(generated.max || generated.max_count || fallback.max, 10);

  return {
    required: Boolean(generated.required || fallback.required),
    max: Number.isInteger(max) && max >= 0 ? Math.min(max, platform === 'x' ? 2 : 3) : fallback.max,
    placement: textOrFallback(generated.placement, fallback.placement, 40),
    reason: textOrFallback(generated.reason || generated.rationale, fallback.reason, 220)
  };
}

function bodyWithHashtags(body, hashtags, platform) {
  if (!hashtags || !hashtags.length || hashtags.some((tag) => body.includes(tag))) {
    return body;
  }

  return appendHashtags(body, hashtags, platform);
}

function normalizeAdaptation(platform, generatedAdaptation, fallbackAdaptation = {}) {
  const generated = generatedAdaptation && typeof generatedAdaptation === 'object'
    ? generatedAdaptation
    : {};

  const defaultAdaptation = fallbackAdaptation.strategy
    ? fallbackAdaptation
    : {
      strategy: platform === 'x' ? 'concise_conversation_starter' : 'professional_narrative',
      tone: platform === 'x' ? 'direct, specific, low-jargon' : 'clear, accountable, operational',
      length_target: platform === 'x' ? 'single post under 240 characters' : '2-3 short paragraphs',
      rewrite_reason: platform === 'x'
        ? 'X needs a compressed point of view and one focused prompt.'
        : 'LinkedIn needs context, credibility, and practical implications.',
      platform_constraints: platform === 'x'
        ? ['one idea only', 'short enough to scan quickly', 'end with a concrete question or review cue']
        : ['open with a professional takeaway', 'explain the operational implication', 'name the review or approval boundary']
    };

  return {
    strategy: textOrFallback(generated.strategy, defaultAdaptation.strategy, 80),
    tone: textOrFallback(generated.tone, defaultAdaptation.tone, 120),
    length_target: textOrFallback(generated.length_target, defaultAdaptation.length_target, 120),
    rewrite_reason: textOrFallback(generated.rewrite_reason, defaultAdaptation.rewrite_reason, 240),
    platform_constraints: normalizeStringArray(generated.platform_constraints, defaultAdaptation.platform_constraints)
  };
}

function textOrFallback(value, fallback, maxLength) {
  return cleanText(value, maxLength) || fallback;
}

function ensureMinimumItems(generatedItems, fallbackItems, minimum) {
  if (!generatedItems.length) {
    return fallbackItems;
  }

  const items = [...generatedItems];
  fallbackItems.forEach((item) => {
    if (items.length < minimum) {
      items.push(item);
    }
  });

  return items;
}

function assignPlanDay(platform, requestedDay, usedDaysByPlatform, index) {
  const normalizedDay = String(requestedDay || '').toLowerCase();
  const fallbackDay = PLAN_DAYS[index % PLAN_DAYS.length];
  const day = PLAN_DAYS.includes(normalizedDay) ? normalizedDay : fallbackDay;
  const usedDays = usedDaysByPlatform.get(platform) || new Set();

  if (!usedDays.has(day)) {
    usedDays.add(day);
    usedDaysByPlatform.set(platform, usedDays);
    return day;
  }

  const startIndex = PLAN_DAYS.indexOf(day);
  for (let offset = 1; offset < PLAN_DAYS.length; offset += 1) {
    const candidate = PLAN_DAYS[(startIndex + offset) % PLAN_DAYS.length];
    if (!usedDays.has(candidate)) {
      usedDays.add(candidate);
      usedDaysByPlatform.set(platform, usedDays);
      return candidate;
    }
  }

  return day;
}

function createGeneratedPlan(fallbackPlan, generated, source) {
  const topic = textOrFallback(generated.topic, fallbackPlan.topic, 100);
  const generatedItems = ensureMinimumItems(asArray(generated.plan_items), fallbackPlan.items, 4);
  const usedDaysByPlatform = new Map();
  const items = generatedItems.slice(0, 6).map((item, index) => {
    const fallback = fallbackPlan.items[index % fallbackPlan.items.length];
    const platform = normalizePlatform(item.platform, fallback.platform);
    const level = normalizeRisk(item.risk_level, fallback.risk_level);
    const itemStatus = normalizeStatus(item.status, approvalRequired(level) ? 'needs_review' : 'draft');
    const requestedDay = textOrFallback(item.suggested_day, fallback.suggested_day, 30).toLowerCase();

    return {
      id: `plan-${platform}-${String(index + 1).padStart(2, '0')}`,
      platform,
      suggested_day: assignPlanDay(platform, requestedDay, usedDaysByPlatform, index),
      content_pillar: textOrFallback(item.content_pillar, fallback.content_pillar || contentPillar(source), 40),
      topic: textOrFallback(item.topic, fallback.topic || topic, 120),
      format: textOrFallback(item.format, fallback.format || 'social post', 50),
      cta: textOrFallback(item.cta, fallback.cta || 'Route through review before publishing.', 180),
      risk_level: level,
      approval_required: approvalRequired(level) || itemStatus === 'needs_review',
      source_quote: textOrFallback(item.source_quote, fallback.source_quote || sourceQuote(source), 240),
      status: itemStatus
    };
  });

  return {
    ...fallbackPlan,
    topic,
    items,
    risk_level: normalizeRisk(generated.risk_level, fallbackPlan.risk_level),
    approval_required: items.some((item) => item.approval_required),
    provenance: {
      ...fallbackPlan.provenance,
      mode: 'gemini',
      generated_by: 'social-agent-gemini'
    }
  };
}

function createGeneratedDraftPackage(fallbackDraftPackage, generated, source) {
  const generatedDrafts = ensureMinimumItems(asArray(generated.drafts), fallbackDraftPackage.drafts, 2);
  const drafts = generatedDrafts.slice(0, 4).map((draft, index) => {
    const fallback = fallbackDraftPackage.drafts[index % fallbackDraftPackage.drafts.length];
    const platform = normalizePlatform(draft.platform, fallback.platform);
    const level = normalizeRisk(draft.risk_level, fallback.risk_level);
    const draftStatus = normalizeStatus(draft.status, approvalRequired(level) ? 'needs_review' : 'draft');
    const generatedHook = textOrFallback(draft.hook, fallback.hook, 120);
    const generatedBody = textOrFallback(draft.body, fallback.body, 1200);
    const repaired = needsDraftRepair(platform, generatedHook, generatedBody)
      ? createRepairedDraft(platform, generated.topic || fallbackDraftPackage.topic, fallback, source)
      : null;
    const hashtags = repaired
      ? repaired.hashtags
      : normalizeHashtags(draft.hashtags, fallback.hashtags, source, platform);
    const hashtagPolicy = repaired
      ? repaired.hashtag_policy
      : normalizeHashtagPolicy(platform, draft.hashtag_policy, fallback.hashtag_policy);

    return {
      id: `draft-${platform}-${String(index + 1).padStart(2, '0')}`,
      platform,
      hook: repaired ? repaired.hook : generatedHook,
      body: repaired ? repaired.body : bodyWithHashtags(generatedBody, hashtags, platform),
      cta: repaired ? repaired.cta : textOrFallback(draft.cta, fallback.cta, 180),
      risk_level: level,
      approval_required: approvalRequired(level) || draftStatus === 'needs_review',
      source_quote: textOrFallback(draft.source_quote, fallback.source_quote || sourceQuote(source), 240),
      status: draftStatus,
      adaptation: normalizeAdaptation(platform, draft.adaptation, fallback.adaptation),
      hashtags,
      hashtag_policy: hashtagPolicy,
      quality_flags: repaired ? ['generic_launch_language_repaired'] : []
    };
  });

  return {
    ...fallbackDraftPackage,
    topic: textOrFallback(generated.topic, fallbackDraftPackage.topic, 100),
    drafts,
    provenance: {
      ...fallbackDraftPackage.provenance,
      mode: 'gemini',
      generated_by: 'social-agent-gemini'
    }
  };
}

function createGeneratedModerationReports(fallbackReports, generated) {
  const generatedReports = ensureMinimumItems(asArray(generated.moderation_reports), fallbackReports, fallbackReports.length);
  const fallbackReport = {
    type: 'moderation_report',
    schema_version: SCHEMA_VERSION,
    language: 'en',
    classification: 'question',
    risk_level: 'medium',
    recommended_action: 'reply',
    approval_required: true,
    reply_draft: 'Thanks for the question. This needs a reviewed response before it is published.',
    source_quote: 'Community comment provided in the workspace.',
    provenance: {
      input: 'demo/social-agent-source.md#comment',
      command: 'moderate',
      mode: 'deterministic',
      generated_by: 'social-agent'
    }
  };

  return generatedReports.slice(0, Math.max(1, fallbackReports.length)).map((report, index) => {
    const fallback = fallbackReports[index % fallbackReports.length] || fallbackReport;
    const level = normalizeRisk(report.risk_level, fallback.risk_level);
    const action = normalizeAction(report.recommended_action, fallback.recommended_action);

    return {
      ...fallback,
      classification: textOrFallback(report.classification, fallback.classification, 50).toLowerCase(),
      risk_level: level,
      recommended_action: action,
      approval_required: approvalRequired(level) || action !== 'ignore',
      reply_draft: action === 'ignore' ? '' : textOrFallback(report.reply_draft, fallback.reply_draft, 320),
      source_quote: textOrFallback(report.source_quote, fallback.source_quote, 240),
      provenance: {
        ...fallback.provenance,
        mode: 'gemini',
        generated_by: 'social-agent-gemini'
      }
    };
  });
}

function createGeminiDemoPayload(fallbackPayload, generated, model) {
  const source = fallbackPayload.source.text;
  const plan = createGeneratedPlan(fallbackPayload.plan, generated, source);
  const draftPackage = createGeneratedDraftPackage(fallbackPayload.drafts, generated, source);
  const moderationReports = createGeneratedModerationReports(fallbackPayload.moderation.reports, generated);
  const reviewQueue = createReviewQueue(plan, draftPackage, moderationReports);
  const summary = {
    ...createDemoSummary(source, plan, draftPackage, moderationReports, reviewQueue),
    content_pillar: textOrFallback(generated.content_pillar, contentPillar(source), 40),
    risk_level: plan.risk_level,
    approval_required: plan.approval_required || draftPackage.drafts.some((draft) => draft.approval_required),
    generated_summary: textOrFallback(generated.summary, 'Gemini generated a review-ready social operations package.', 320)
  };

  return withGenerationMetadata({
    ...fallbackPayload,
    summary,
    plan,
    drafts: draftPackage,
    moderation: {
      ...fallbackPayload.moderation,
      reports: moderationReports
    },
    review_queue: reviewQueue,
    packages: fallbackPayload.packages.map((item) => ({
      ...item,
      approval_required: reviewQueue.length > 0
    }))
  }, createGeminiGeneration(model));
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

  return withGenerationMetadata({
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
  }, createLocalGeneration());
}

async function createSocialAgentDemoPayload(options = {}) {
  const fallbackPayload = createSocialAgentDemo(options);

  if (!shouldUseGemini(options)) {
    return fallbackPayload;
  }

  const model = getGeminiModel();
  try {
    const generated = await generateWorkspaceWithGemini({
      apiKey: getGeminiApiKey(),
      model,
      source: fallbackPayload.source.text,
      comments: fallbackPayload.source.comments,
      language: fallbackPayload.language
    });
    return createGeminiDemoPayload(fallbackPayload, generated, model);
  } catch (error) {
    return withGenerationMetadata(
      fallbackPayload,
      createLocalGeneration('Gemini request failed. Local deterministic output is being used.', cleanGeminiError(error))
    );
  }
}

module.exports = {
  DEFAULT_DEMO_COMMENTS,
  DEFAULT_DEMO_SOURCE,
  buildDraftPayload,
  buildModerationPayload,
  buildPlanPayload,
  createSocialAgentDemo,
  createSocialAgentDemoPayload
};

'use strict';

const {
  SCHEMA_VERSION,
  approvalRequired,
  assertJsonFormat,
  assertLanguage,
  buildProvenance,
  cleanText,
  extractTitle,
  readInputFile,
  riskLevel,
  sourceQuote,
  writeJsonOutput
} = require('../index');

const PLATFORM_ADAPTATION_RULES = {
  linkedin: {
    strategy: 'professional_narrative',
    tone: 'clear, accountable, operational',
    length_target: '2-3 short paragraphs',
    rewrite_reason: 'LinkedIn needs context, credibility, and practical implications rather than a compressed caption.',
    platform_constraints: [
      'open with a professional takeaway',
      'explain the operational implication',
      'name the review or approval boundary',
      'use 2-3 relevant hashtags only when they add discovery context'
    ]
  },
  x: {
    strategy: 'concise_conversation_starter',
    tone: 'direct, specific, low-jargon',
    length_target: 'single post under 280 characters',
    rewrite_reason: 'X needs a compressed point of view and one focused prompt, not the LinkedIn narrative copied shorter.',
    platform_constraints: [
      'one idea only',
      'short enough to scan quickly',
      'end with a concrete question or review cue',
      'use at most 2 hashtags'
    ]
  }
};

function platformAdaptation(platform) {
  return PLATFORM_ADAPTATION_RULES[platform];
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function hashtagsFor(content, platform) {
  const lower = String(content || '').toLowerCase();
  const tags = [];

  if (/patient|clinical|care|intake|triage|coordination|operations/.test(lower)) {
    tags.push(platform === 'x' ? '#CareOps' : '#CareOperations');
  }

  if (/ai|dashboard|workflow|automation|assistant|technology|tech/.test(lower)) {
    tags.push('#HealthTech');
  }

  if (/privacy|review|approval|escalation|crisis|safety|sensitive/.test(lower)) {
    tags.push('#PatientSafety');
  }

  if (!tags.length) {
    tags.push(platform === 'x' ? '#SocialOps' : '#SocialOperations', '#ContentOps');
  }

  return unique(tags).slice(0, platform === 'x' ? 2 : 3);
}

function hashtagPolicyFor(platform) {
  if (platform === 'x') {
    return {
      required: false,
      max: 2,
      placement: 'inline_end',
      reason: 'Use hashtags only when they add discovery context and keep the post within X length constraints.'
    };
  }

  return {
    required: false,
    max: 3,
    placement: 'final_line',
    reason: 'Use a small set of relevant hashtags after the post body; hashtags should not carry unsupported claims.'
  };
}

function appendHashtags(body, hashtags, platform) {
  if (!hashtags || !hashtags.length) {
    return body;
  }

  const tagLine = hashtags.join(' ');
  if (platform === 'x') {
    const candidate = `${body} ${tagLine}`;
    return candidate.length <= 280 ? candidate : body;
  }

  return `${body}\n\n${tagLine}`;
}

function buildDraftPayload(inputPath, content, options = {}) {
  const title = extractTitle(content);
  const quote = sourceQuote(content);
  const level = riskLevel(content);
  const needsApproval = approvalRequired(level);
  const linkedInHashtags = hashtagsFor(content, 'linkedin');
  const xHashtags = hashtagsFor(content, 'x');

  const linkedInBody = appendHashtags([
    `${title} should not read like another product announcement.`,
    `For care operations teams, the useful story is the workflow change: source context stays attached, sensitive replies stay out of public automation, and review status is visible before anything is published.`,
    `What this helps teams do:`,
    `- turn source material into platform-ready copy`,
    `- keep review gates close to the draft`,
    `- route crisis, privacy, or unclear medical questions to a human`,
    `- avoid unsupported clinical claims in public content`,
    `The goal is not more posts. It is safer social operations with a clearer approval path.`,
    `Which review step creates the most friction for your team today?`
  ].join('\n\n'), linkedInHashtags, 'linkedin');

  const xTopic = cleanText(title, 72);
  const xBody = appendHashtags(
    cleanText(`${xTopic}: source-backed copy, visible review gates, human escalation. What should be checked before posting?`, 230),
    xHashtags,
    'x'
  );

  return {
    type: 'social_draft_package',
    schema_version: SCHEMA_VERSION,
    language: options.language || 'en',
    topic: title,
    drafts: [
      {
        id: 'draft-linkedin-01',
        platform: 'linkedin',
        hook: `A practical takeaway from ${title}`,
        body: linkedInBody,
        cta: 'What would your team need to review before publishing this?',
        risk_level: level,
        approval_required: needsApproval,
        source_quote: quote,
        status: needsApproval ? 'needs_review' : 'draft',
        adaptation: platformAdaptation('linkedin'),
        hashtags: linkedInHashtags,
        hashtag_policy: hashtagPolicyFor('linkedin')
      },
      {
        id: 'draft-x-01',
        platform: 'x',
        hook: cleanText(title, 100),
        body: xBody,
        cta: 'Review before posting.',
        risk_level: level,
        approval_required: needsApproval,
        source_quote: quote,
        status: needsApproval ? 'needs_review' : 'draft',
        adaptation: platformAdaptation('x'),
        hashtags: xHashtags,
        hashtag_policy: hashtagPolicyFor('x')
      }
    ],
    provenance: buildProvenance(inputPath, 'draft')
  };
}

async function runDraft(options) {
  assertJsonFormat(options.format);
  options.language = assertLanguage(options.language);
  const input = readInputFile(options.input);
  const payload = buildDraftPayload(input.path, input.content, options);
  writeJsonOutput(options.output, payload, options);
}

module.exports = {
  appendHashtags,
  buildDraftPayload,
  hashtagPolicyFor,
  hashtagsFor,
  PLATFORM_ADAPTATION_RULES,
  runDraft
};

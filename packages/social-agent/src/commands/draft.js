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
      'name the review or approval boundary'
    ]
  },
  x: {
    strategy: 'concise_conversation_starter',
    tone: 'direct, specific, low-jargon',
    length_target: 'single post under 240 characters',
    rewrite_reason: 'X needs a compressed point of view and one focused prompt, not the LinkedIn narrative copied shorter.',
    platform_constraints: [
      'one idea only',
      'short enough to scan quickly',
      'end with a concrete question or review cue'
    ]
  }
};

function platformAdaptation(platform) {
  return PLATFORM_ADAPTATION_RULES[platform];
}

function buildDraftPayload(inputPath, content, options = {}) {
  const title = extractTitle(content);
  const quote = sourceQuote(content);
  const level = riskLevel(content);
  const needsApproval = approvalRequired(level);

  const linkedInBody = [
    `${title} should not read like another product announcement.`,
    `For care operations teams, the useful story is the workflow change: source context stays attached, sensitive replies stay out of public automation, and review status is visible before anything is published.`,
    `What this helps teams do:`,
    `- turn source material into platform-ready copy`,
    `- keep review gates close to the draft`,
    `- route crisis, privacy, or unclear medical questions to a human`,
    `- avoid unsupported clinical claims in public content`,
    `The goal is not more posts. It is safer social operations with a clearer approval path.`,
    `Which review step creates the most friction for your team today?`
  ].join('\n\n');

  const xTopic = cleanText(title, 72);
  const xBody = cleanText(`${xTopic}: source-backed copy, visible review gates, and human escalation for sensitive replies. What should be checked before posting?`, 240);

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
        adaptation: platformAdaptation('linkedin')
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
        adaptation: platformAdaptation('x')
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
  buildDraftPayload,
  PLATFORM_ADAPTATION_RULES,
  runDraft
};

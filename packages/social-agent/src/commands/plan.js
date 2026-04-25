'use strict';

const {
  PLATFORMS,
  approvalRequired,
  assertJsonFormat,
  buildProvenance,
  contentPillar,
  extractTitle,
  readInputFile,
  riskLevel,
  sourceQuote,
  writeJsonOutput
} = require('../index');

function buildPlanPayload(inputPath, content, options = {}) {
  const title = extractTitle(content);
  const quote = sourceQuote(content);
  const level = riskLevel(content);
  const pillar = contentPillar(content);

  const items = [
    {
      id: 'plan-linkedin-01',
      platform: 'linkedin',
      suggested_day: 'monday',
      content_pillar: pillar,
      topic: title,
      format: 'professional post',
      cta: 'Invite readers to discuss the operational implication.',
      risk_level: level,
      approval_required: approvalRequired(level),
      source_quote: quote,
      status: 'draft'
    },
    {
      id: 'plan-x-01',
      platform: 'x',
      suggested_day: 'tuesday',
      content_pillar: pillar,
      topic: title,
      format: 'short post',
      cta: 'Ask one focused question.',
      risk_level: level,
      approval_required: approvalRequired(level),
      source_quote: quote,
      status: 'draft'
    },
    {
      id: 'plan-linkedin-02',
      platform: 'linkedin',
      suggested_day: 'thursday',
      content_pillar: 'proof',
      topic: `What teams should remember about ${title}`,
      format: 'insight post',
      cta: 'Direct readers to the source-backed summary.',
      risk_level: level,
      approval_required: true,
      source_quote: quote,
      status: 'needs_review'
    },
    {
      id: 'plan-x-02',
      platform: 'x',
      suggested_day: 'friday',
      content_pillar: 'community',
      topic: `Community prompt for ${title}`,
      format: 'conversation starter',
      cta: 'Ask for practical examples from the audience.',
      risk_level: level,
      approval_required: approvalRequired(level),
      source_quote: quote,
      status: 'draft'
    }
  ];

  return {
    type: 'social_calendar',
    language: options.language || 'en',
    platforms: PLATFORMS,
    topic: title,
    items,
    risk_level: level,
    approval_required: items.some((item) => item.approval_required),
    provenance: buildProvenance(inputPath, 'plan')
  };
}

async function runPlan(options) {
  assertJsonFormat(options.format);
  const input = readInputFile(options.input);
  const payload = buildPlanPayload(input.path, input.content, options);
  writeJsonOutput(options.output, payload, options);
}

module.exports = {
  buildPlanPayload,
  runPlan
};

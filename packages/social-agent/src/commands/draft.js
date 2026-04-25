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

function buildDraftPayload(inputPath, content, options = {}) {
  const title = extractTitle(content);
  const quote = sourceQuote(content);
  const level = riskLevel(content);
  const needsApproval = approvalRequired(level);

  const linkedInBody = [
    `A useful social post should not flatten the source context into a generic claim.`,
    `For "${title}", the safer approach is to explain the practical takeaway, name the review requirement, and keep the source close to the draft.`,
    `Source basis: "${quote}"`
  ].join('\n\n');

  const xBody = cleanText(`${title}: keep the message specific, source-backed, and review-ready before it becomes a public post.`, 240);

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
        status: needsApproval ? 'needs_review' : 'draft'
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
        status: needsApproval ? 'needs_review' : 'draft'
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
  runDraft
};

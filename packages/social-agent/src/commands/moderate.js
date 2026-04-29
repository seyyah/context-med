'use strict';

const {
  SCHEMA_VERSION,
  approvalRequired,
  assertJsonFormat,
  assertLanguage,
  buildProvenance,
  cleanText,
  readInputFile,
  riskLevel,
  sourceQuote,
  writeJsonOutput
} = require('../index');

function classifyContent(content) {
  const lower = content.toLowerCase();

  if (lower.includes('lawsuit') || lower.includes('breach') || lower.includes('unsafe') || lower.includes('crisis')) {
    return 'crisis';
  }

  if (lower.includes('spam') || lower.includes('buy now') || lower.includes('crypto')) {
    return 'spam';
  }

  if (lower.includes('angry') || lower.includes('complaint') || lower.includes('refund') || lower.includes('broken')) {
    return 'complaint';
  }

  if (lower.includes('thanks') || lower.includes('great') || lower.includes('love') || lower.includes('helpful')) {
    return 'praise';
  }

  if (content.includes('?') || /^(what|why|how|when|where|can|does|is)\b/i.test(content.trim())) {
    return 'question';
  }

  return 'risk';
}

function actionFor(classification, level) {
  if (classification === 'spam') {
    return 'ignore';
  }

  if (classification === 'crisis' || level === 'high') {
    return 'escalate';
  }

  return 'reply';
}

function replyDraftFor(classification, action, quote) {
  if (action === 'ignore') {
    return '';
  }

  if (action === 'escalate') {
    return 'Thanks for raising this. We are routing it to the right team for review before responding publicly.';
  }

  if (classification === 'praise') {
    return 'Thanks for the note. We appreciate you taking the time to share it.';
  }

  if (classification === 'complaint') {
    return 'Thanks for flagging this. We would like to understand the details and route it to the right team.';
  }

  return cleanText(`Thanks for the question. Based on the available source context, the safest next step is to answer with a reviewed, source-backed response. Source: "${quote}"`, 280);
}

function buildModerationPayload(inputPath, content, options = {}) {
  const quote = sourceQuote(content);
  const level = riskLevel(content);
  const classification = classifyContent(content);
  const recommendedAction = actionFor(classification, level);

  return {
    type: 'moderation_report',
    schema_version: SCHEMA_VERSION,
    language: options.language || 'en',
    classification,
    risk_level: level,
    recommended_action: recommendedAction,
    approval_required: approvalRequired(level) || recommendedAction !== 'ignore',
    reply_draft: replyDraftFor(classification, recommendedAction, quote),
    source_quote: quote,
    provenance: buildProvenance(inputPath, 'moderate')
  };
}

async function runModerate(options) {
  assertJsonFormat(options.format);
  options.language = assertLanguage(options.language);
  const input = readInputFile(options.input);
  const payload = buildModerationPayload(input.path, input.content, options);
  writeJsonOutput(options.output, payload, options);
}

module.exports = {
  buildModerationPayload,
  classifyContent,
  runModerate
};

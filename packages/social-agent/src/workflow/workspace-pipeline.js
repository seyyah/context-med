'use strict';

const crypto = require('node:crypto');
const { createLlmProvider, providerMetadata } = require('../llm');

const PLATFORM_METADATA = {
  linkedin: {
    platform: 'LinkedIn adaptation draft',
    tone: 'linkedin',
    lengthTarget: 'Medium post',
    strategy: 'Expand the source into a professional narrative with operational value and visible review boundaries.',
    toneLabel: 'Measured, practical, and review-aware',
    audience: 'Care operations, product, and healthcare technology stakeholders',
    cta: 'Which review step should stay visible before this goes live?',
    hashtags: ['#CareOperations', '#HealthTech', '#PatientSafety']
  },
  x: {
    platform: 'X adaptation draft',
    tone: 'x',
    lengthTarget: 'Under 280 characters',
    strategy: 'Compress the source into a direct short-form takeaway with one clear boundary and one question.',
    toneLabel: 'Direct, concise, and practical',
    audience: 'Fast-scanning social and healthtech operators',
    cta: 'Where should intake automation stop?',
    hashtags: ['#HealthTech', '#CareOps']
  }
};

const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_METADATA);

function normalizeText(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
}

function compactLine(text) {
  return normalizeText(text).replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim();
}

function ensureSentence(text) {
  const sentence = compactLine(text);
  if (!sentence) {
    return '';
  }
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function truncateWords(text, maxWords) {
  const words = compactLine(text).split(' ').filter(Boolean);
  if (words.length <= maxWords) {
    return compactLine(text);
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function trimToCharacters(text, maxLength) {
  const value = compactLine(text);
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3).replace(/\s+\S*$/, '')}...`;
}

function extractSourceParts(sourceText) {
  const normalized = normalizeText(sourceText);
  const lines = normalized.split('\n').map(compactLine).filter(Boolean);
  const titleLine = lines.find((line) => line.startsWith('#')) || lines[0] || 'Social content update';
  const title = compactLine(titleLine);
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(compactLine)
    .filter(Boolean)
    .filter((paragraph) => paragraph !== title);

  const opener = paragraphs[0] || title;
  const benefit = paragraphs.find((paragraph) => /help|enable|improve|review|identify|route|reduce|faster|visibility/i.test(paragraph)) || paragraphs[1] || opener;
  const focus = paragraphs.find((paragraph) => /focus|visibility|manual|privacy|escalation|workflow|guardrail|review/i.test(paragraph)) || benefit;
  const boundary = paragraphs.find((paragraph) => /do not|does not|avoid|diagnos|treatment|replace|clinical|sensitive|crisis|human review|private|privacy/i.test(paragraph)) || 'Keep the message source-backed and avoid claims the source does not support.';

  return {
    title,
    opener: ensureSentence(opener),
    benefit: ensureSentence(benefit),
    focus: ensureSentence(focus),
    boundary: ensureSentence(boundary)
  };
}

function detectRisk(sourceText) {
  if (/self-harm|crisis|diagnos|treatment|clinical|patient|private|privacy|sensitive|medical/i.test(sourceText)) {
    return 'High Risk';
  }

  if (/review|approval|compliance|safety|security|legal/i.test(sourceText)) {
    return 'Medium Risk';
  }

  return 'Low Risk';
}

function statusForRisk(risk) {
  return risk === 'Low Risk' ? 'Draft' : 'Needs Review';
}

function hashtagsForSource(platformId, sourceText) {
  const defaults = PLATFORM_METADATA[platformId].hashtags;

  if (/patient|clinical|health|care|medical/i.test(sourceText)) {
    return defaults;
  }

  if (/ai|automation|workflow|agent/i.test(sourceText)) {
    return platformId === 'linkedin' ? ['#SocialOps', '#AIWorkflow', '#ContentReview'] : ['#AI', '#SocialOps'];
  }

  return platformId === 'linkedin' ? ['#SocialOps', '#ContentStrategy', '#ReviewWorkflow'] : ['#SocialOps', '#Content'];
}

function buildAdaptationDetails(platformId, parts, sourceText, risk, hashtags, generationMode) {
  const metadata = PLATFORM_METADATA[platformId];

  return [
    ['Platform role', `${metadata.platform} output for ${metadata.audience}.`],
    ['Rewrite strategy', metadata.strategy],
    ['Tone', metadata.toneLabel],
    ['Length target', metadata.lengthTarget],
    ['Source topic', parts.title],
    ['Preserved source claim', truncateWords(parts.benefit, 22)],
    ['Preserved boundary', truncateWords(parts.boundary, 24)],
    ['Risk classification', `${risk}; generated copy should stay in review until approved.`],
    ['Hashtag policy', hashtags.length ? `Use ${hashtags.join(', ')} as supporting discovery tags, not as claims.` : 'No hashtags required for this draft.'],
    ['Generator mode', generationMode]
  ];
}

function buildLinkedInDraft(parts, sourceText, risk, generationMode) {
  const hashtags = hashtagsForSource('linkedin', sourceText);

  return {
    id: 'draft-linkedin-generated',
    platform: PLATFORM_METADATA.linkedin.platform,
    tone: 'linkedin',
    risk,
    status: statusForRisk(risk),
    hook: `${parts.title} should move faster without losing review discipline.`,
    body: [
      parts.opener,
      `The useful story is operational: ${trimToCharacters(parts.benefit, 180)}`,
      `The message should stay anchored in the source: ${trimToCharacters(parts.focus, 180)}`,
      `The boundary stays visible before publishing: ${trimToCharacters(parts.boundary, 180)}`
    ],
    cta: PLATFORM_METADATA.linkedin.cta,
    hashtags: hashtags.join(' '),
    adaptationDetails: buildAdaptationDetails('linkedin', parts, sourceText, risk, hashtags, generationMode)
  };
}

function buildXDraft(parts, sourceText, risk, generationMode) {
  const hashtags = hashtagsForSource('x', sourceText);
  const benefit = trimToCharacters(parts.benefit, 94);
  const boundary = trimToCharacters(parts.boundary, 78);
  const hashtagLine = hashtags.join(' ');
  const body = trimToCharacters(`${benefit} ${boundary} ${PLATFORM_METADATA.x.cta} ${hashtagLine}`, 280);

  return {
    id: 'draft-x-generated',
    platform: PLATFORM_METADATA.x.platform,
    tone: 'x',
    risk,
    status: statusForRisk(risk),
    hook: `${parts.title} needs speed and guardrails.`,
    body: [body],
    cta: '',
    hashtags: '',
    adaptationDetails: buildAdaptationDetails('x', parts, sourceText, risk, hashtags, generationMode)
  };
}

function buildPlanSeeds(adaptations, parts, risk) {
  const dayByPlatform = {
    linkedin: ['Monday', 'Wednesday'],
    x: ['Tuesday', 'Thursday']
  };

  return adaptations.flatMap((adaptation) => {
    const platformId = adaptation.tone;
    const days = dayByPlatform[platformId] || ['Monday'];

    return days.map((day, index) => ({
      id: `plan-${platformId}-${index + 1}`,
      day,
      platform: platformId === 'linkedin' ? 'LinkedIn' : 'X',
      contentPillar: index === 0 ? 'Operational Visibility' : 'Human Review',
      messageFocus:
        index === 0
          ? `Adapt "${parts.title}" into a ${platformId === 'linkedin' ? 'professional narrative' : 'short-form update'}.`
          : `Keep the review boundary visible before this ${platformId === 'linkedin' ? 'LinkedIn' : 'X'} post moves forward.`,
      cta: adaptation.cta || PLATFORM_METADATA[platformId].cta,
      risk,
      status: statusForRisk(risk)
    }));
  });
}

function buildDraftSeeds(adaptations, planSeeds) {
  return planSeeds.map((planSeed, index) => {
    const adaptation = adaptations.find((item) => item.tone === planSeed.platform.toLowerCase()) || adaptations[0];

    return {
      id: `draft-seed-${index + 1}`,
      planId: planSeed.id,
      platform: planSeed.platform,
      title: adaptation.hook,
      copyPreview: adaptation.body.slice(0, 2).join(' '),
      cta: planSeed.cta,
      risk: planSeed.risk,
      status: planSeed.status
    };
  });
}

function buildReviewItems(planSeeds, draftSeeds) {
  const planReviewItems = planSeeds
    .filter((planSeed) => planSeed.status !== 'Draft')
    .map((planSeed) => ({
      id: `review-${planSeed.id}`,
      source: 'plan',
      label: planSeed.messageFocus,
      platform: planSeed.platform,
      risk: planSeed.risk,
      action: 'Review',
      status: 'Needs Review'
    }));
  const draftReviewItems = draftSeeds
    .filter((draftSeed) => draftSeed.status !== 'Draft')
    .map((draftSeed) => ({
      id: `review-${draftSeed.id}`,
      source: 'draft',
      label: draftSeed.title,
      platform: draftSeed.platform,
      risk: draftSeed.risk,
      action: 'Review',
      status: 'Needs Review'
    }));

  return [...planReviewItems, ...draftReviewItems];
}

function normalizePlatforms(platforms) {
  const selected = Array.isArray(platforms) ? platforms : ['linkedin', 'x'];
  const normalized = selected.map((platform) => String(platform).toLowerCase().trim());
  return normalized.filter((platform) => SUPPORTED_PLATFORMS.includes(platform));
}

function createRunId(sourceText, platforms) {
  const hash = crypto
    .createHash('sha1')
    .update(`${sourceText}\n${platforms.join(',')}\n${Date.now()}`)
    .digest('hex')
    .slice(0, 12);

  return `workspace-run-${hash}`;
}

function createEmptyRun(sourceText, platforms, provider) {
  return {
    id: createRunId(sourceText, platforms),
    type: 'workspace_run',
    schema_version: 'social-agent.workspace.v1',
    sourcePreview: trimToCharacters(sourceText, 140),
    source: {
      text: sourceText,
      platforms
    },
    generation: provider,
    adaptations: [],
    planSeeds: [],
    draftSeeds: [],
    reviewItems: []
  };
}

async function runWorkspacePipeline(options = {}) {
  const sourceText = normalizeText(options.sourceText || options.source || '');
  const platforms = normalizePlatforms(options.platforms);
  const provider = createLlmProvider(options.provider ? { provider: options.provider, model: options.model } : {});
  const metadata = providerMetadata(provider);
  const generationMode = metadata.live_api_calls_enabled
    ? `${metadata.provider} provider selected; live structured pipeline calls are pending. Deterministic pipeline fallback used.`
    : `${metadata.provider} provider; deterministic pipeline used.`;

  if (!sourceText || platforms.length === 0) {
    return createEmptyRun(sourceText, platforms, metadata);
  }

  const parts = extractSourceParts(sourceText);
  const risk = detectRisk(sourceText);
  const adaptations = platforms.map((platform) =>
    platform === 'linkedin'
      ? buildLinkedInDraft(parts, sourceText, risk, generationMode)
      : buildXDraft(parts, sourceText, risk, generationMode)
  );
  const planSeeds = buildPlanSeeds(adaptations, parts, risk);
  const draftSeeds = buildDraftSeeds(adaptations, planSeeds);
  const reviewItems = buildReviewItems(planSeeds, draftSeeds);

  return {
    id: createRunId(sourceText, platforms),
    type: 'workspace_run',
    schema_version: 'social-agent.workspace.v1',
    topic: parts.title,
    sourcePreview: trimToCharacters(parts.opener || sourceText, 140),
    source: {
      text: sourceText,
      platforms
    },
    generation: metadata,
    adaptations,
    planSeeds,
    draftSeeds,
    reviewItems
  };
}

module.exports = {
  runWorkspacePipeline
};

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

function createGenerationMetadata(metadata, status, extra = {}) {
  return {
    ...metadata,
    status,
    ...extra
  };
}

function buildDeterministicRun(sourceText, platforms, metadata, extraGeneration = {}) {
  const generationMode = metadata.live_api_calls_enabled
    ? `${metadata.provider} provider selected; deterministic fallback used because live output was unavailable.`
    : `${metadata.provider} provider; deterministic pipeline used.`;
  const parts = extractSourceParts(sourceText);
  const risk = detectRisk(sourceText);
  const generation = createGenerationMetadata(
    metadata,
    extraGeneration.status || metadata.status || 'ready',
    extraGeneration
  );
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
    generation,
    adaptations,
    planSeeds,
    draftSeeds,
    reviewItems
  };
}

function createWorkspacePrompt(sourceText, platforms) {
  const platformList = platforms.map((platform) => (platform === 'linkedin' ? 'LinkedIn' : 'X')).join(', ');

  return [
    'Generate a source-backed social-agent workflow run as strict JSON.',
    '',
    'Return only one JSON object with this exact shape:',
    JSON.stringify(
      {
        topic: 'short source topic',
        sourcePreview: 'one sentence source summary',
        adaptations: [
          {
            tone: 'linkedin',
            risk: 'Low Risk | Medium Risk | High Risk',
            status: 'Draft | Needs Review',
            hook: 'platform hook',
            body: ['paragraph 1', 'paragraph 2'],
            cta: 'question or call to action',
            hashtags: '#TagOne #TagTwo',
            adaptationDetails: [['Label', 'Value']]
          }
        ],
        planSeeds: [
          {
            id: 'plan-linkedin-1',
            day: 'Monday',
            platform: 'LinkedIn',
            contentPillar: 'Operational Visibility',
            messageFocus: 'why this slot exists',
            cta: 'slot CTA',
            risk: 'Medium Risk',
            status: 'Needs Review'
          }
        ],
        draftSeeds: [
          {
            id: 'draft-seed-1',
            planId: 'plan-linkedin-1',
            platform: 'LinkedIn',
            title: 'draft hook',
            copyPreview: 'short preview',
            cta: 'draft CTA',
            risk: 'Medium Risk',
            status: 'Needs Review'
          }
        ],
        reviewItems: [
          {
            id: 'review-plan-linkedin-1',
            source: 'plan',
            label: 'what needs review',
            platform: 'LinkedIn',
            risk: 'Medium Risk',
            action: 'Review',
            status: 'Needs Review'
          }
        ]
      },
      null,
      2
    ),
    '',
    'Rules:',
    '- Use only the provided source. Do not invent clinical, diagnosis, treatment, publishing, analytics, or integration claims.',
    '- Generate outputs only for these platforms: ' + platformList + '.',
    '- LinkedIn should be narrative and operational. X should stay under 280 characters.',
    '- If healthcare, privacy, crisis, patient, or clinical boundaries appear, risk must be High Risk or Medium Risk and status must be Needs Review.',
    '- Include reviewItems for every risky plan or draft.',
    '',
    'Source:',
    sourceText
  ].join('\n');
}

function parseProviderJson(rawText) {
  if (!rawText) {
    return null;
  }

  const text = String(rawText).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (_error) {
    return null;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRiskLabel(value, fallback = 'Medium Risk') {
  if (/high/i.test(String(value))) {
    return 'High Risk';
  }
  if (/low/i.test(String(value))) {
    return 'Low Risk';
  }
  return /medium/i.test(String(value)) ? 'Medium Risk' : fallback;
}

function normalizeStatus(value, risk) {
  if (/approved/i.test(String(value))) {
    return 'Approved';
  }
  if (/draft/i.test(String(value)) && normalizeRiskLabel(risk) === 'Low Risk') {
    return 'Draft';
  }
  return 'Needs Review';
}

function normalizePlatformName(value) {
  return String(value || '').toLowerCase().includes('linkedin') ? 'LinkedIn' : 'X';
}

function normalizeTone(value, platform) {
  const normalized = String(value || platform || '').toLowerCase();
  return normalized.includes('linkedin') ? 'linkedin' : 'x';
}

function normalizeAdaptations(candidate, fallback, platforms) {
  const candidateItems = asArray(candidate.adaptations);

  return platforms.map((platform) => {
    const tone = platform === 'linkedin' ? 'linkedin' : 'x';
    const fallbackItem = fallback.adaptations.find((item) => item.tone === tone) || fallback.adaptations[0] || {};
    const item = candidateItems.find((entry) => normalizeTone(entry?.tone || entry?.platform, platform) === tone) || {};
    const risk = normalizeRiskLabel(item.risk, fallbackItem.risk);
    const body = asArray(item.body).length > 0
      ? item.body.map(compactLine).filter(Boolean)
      : String(item.body || '')
        .split(/\n{2,}/)
        .map(compactLine)
        .filter(Boolean);

    return {
      ...fallbackItem,
      risk,
      status: normalizeStatus(item.status, risk),
      hook: compactLine(item.hook || fallbackItem.hook),
      body: body.length > 0 ? body : fallbackItem.body,
      cta: compactLine(item.cta || fallbackItem.cta),
      hashtags: compactLine(item.hashtags || fallbackItem.hashtags),
      adaptationDetails: asArray(item.adaptationDetails).length > 0 ? item.adaptationDetails : fallbackItem.adaptationDetails
    };
  });
}

function normalizePlanSeeds(candidate, fallback, adaptations, platforms) {
  const allowedPlatforms = new Set(platforms.map((platform) => (platform === 'linkedin' ? 'LinkedIn' : 'X')));
  const candidateSeeds = asArray(candidate.planSeeds || candidate.plan_seeds).filter((seed) =>
    allowedPlatforms.has(normalizePlatformName(seed.platform))
  );
  const seeds = candidateSeeds.length >= platforms.length ? candidateSeeds : fallback.planSeeds;

  return seeds
    .map((seed, index) => {
      const platform = normalizePlatformName(seed.platform);
      const adaptation = adaptations.find((item) => item.tone === platform.toLowerCase()) || adaptations[0] || {};
      const risk = normalizeRiskLabel(seed.risk, adaptation.risk || fallback.planSeeds[index]?.risk);

      return {
        id: compactLine(seed.id || `plan-${platform.toLowerCase()}-${index + 1}`).replace(/\s+/g, '-').toLowerCase(),
        day: compactLine(seed.day || fallback.planSeeds[index]?.day || 'Monday'),
        platform,
        contentPillar: compactLine(seed.contentPillar || seed.content_pillar || fallback.planSeeds[index]?.contentPillar || 'Platform Adaptation'),
        messageFocus: compactLine(seed.messageFocus || seed.message_focus || fallback.planSeeds[index]?.messageFocus || adaptation.hook),
        cta: compactLine(seed.cta || adaptation.cta || fallback.planSeeds[index]?.cta),
        risk,
        status: normalizeStatus(seed.status, risk)
      };
    })
    .filter((seed) => allowedPlatforms.has(seed.platform))
    .filter((seed) => seed.messageFocus);
}

function normalizeDraftSeeds(candidate, fallback, planSeeds, adaptations) {
  const candidateSeeds = asArray(candidate.draftSeeds || candidate.draft_seeds);
  const seeds = candidateSeeds.length > 0 ? candidateSeeds : fallback.draftSeeds;

  return seeds.map((seed, index) => {
    const planSeed = planSeeds.find((item) => item.id === seed.planId || item.id === seed.plan_id) || planSeeds[index % planSeeds.length] || {};
    const adaptation = adaptations.find((item) => item.tone === String(planSeed.platform || seed.platform).toLowerCase()) || adaptations[0] || {};
    const risk = normalizeRiskLabel(seed.risk, planSeed.risk || adaptation.risk);

    return {
      id: compactLine(seed.id || `draft-seed-${index + 1}`).replace(/\s+/g, '-').toLowerCase(),
      planId: planSeed.id || compactLine(seed.planId || seed.plan_id || ''),
      platform: normalizePlatformName(seed.platform || planSeed.platform),
      title: compactLine(seed.title || adaptation.hook || planSeed.messageFocus),
      copyPreview: compactLine(seed.copyPreview || seed.copy_preview || asArray(adaptation.body).slice(0, 2).join(' ')),
      cta: compactLine(seed.cta || planSeed.cta || adaptation.cta),
      risk,
      status: normalizeStatus(seed.status, risk)
    };
  });
}

function normalizeReviewItems(candidate, fallback, planSeeds, draftSeeds) {
  const candidateItems = asArray(candidate.reviewItems || candidate.review_items);
  const items = candidateItems.length > 0 ? candidateItems : fallback.reviewItems;

  return items.map((item, index) => {
    const source = String(item.source || '').toLowerCase().includes('draft') ? 'draft' : 'plan';
    const related = source === 'draft'
      ? draftSeeds[index % draftSeeds.length] || {}
      : planSeeds[index % planSeeds.length] || {};
    const risk = normalizeRiskLabel(item.risk, related.risk);

    return {
      id: compactLine(item.id || `review-${source}-${index + 1}`).replace(/\s+/g, '-').toLowerCase(),
      source,
      label: compactLine(item.label || related.title || related.messageFocus || 'Review source-backed social output.'),
      platform: normalizePlatformName(item.platform || related.platform),
      risk,
      action: compactLine(item.action || 'Review'),
      status: normalizeStatus(item.status, risk)
    };
  });
}

function normalizeProviderRun(candidate, fallback, sourceText, platforms, metadata) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const adaptations = normalizeAdaptations(candidate, fallback, platforms);
  const planSeeds = normalizePlanSeeds(candidate, fallback, adaptations, platforms);
  const draftSeeds = normalizeDraftSeeds(candidate, fallback, planSeeds, adaptations);
  const reviewItems = normalizeReviewItems(candidate, fallback, planSeeds, draftSeeds);

  if (adaptations.length === 0 || planSeeds.length === 0 || draftSeeds.length === 0) {
    return null;
  }

  return {
    id: createRunId(sourceText, platforms),
    type: 'workspace_run',
    schema_version: 'social-agent.workspace.v1',
    topic: compactLine(candidate.topic || fallback.topic),
    sourcePreview: trimToCharacters(candidate.sourcePreview || candidate.source_preview || fallback.sourcePreview, 140),
    source: {
      text: sourceText,
      platforms
    },
    generation: createGenerationMetadata(metadata, 'live', {
      validation: 'schema_normalized',
      fallback_used: false
    }),
    adaptations,
    planSeeds,
    draftSeeds,
    reviewItems
  };
}

async function runWorkspacePipeline(options = {}) {
  const sourceText = normalizeText(options.sourceText || options.source || '');
  const platforms = normalizePlatforms(options.platforms);
  const provider = createLlmProvider(options.provider ? { provider: options.provider, model: options.model } : {});
  const metadata = providerMetadata(provider);

  if (!sourceText || platforms.length === 0) {
    return createEmptyRun(sourceText, platforms, metadata);
  }

  const fallbackRun = buildDeterministicRun(sourceText, platforms, metadata, {
    fallback_used: true,
    fallback_reason: metadata.fallback_reason || 'mock_or_local_generation'
  });

  if (!metadata.live_api_calls_enabled || typeof provider.generateWorkspaceJson !== 'function') {
    return fallbackRun;
  }

  try {
    const rawProviderOutput = await provider.generateWorkspaceJson({
      prompt: createWorkspacePrompt(sourceText, platforms),
      sourceText,
      platforms
    });
    const candidate = parseProviderJson(rawProviderOutput);
    const normalizedRun = normalizeProviderRun(candidate, fallbackRun, sourceText, platforms, metadata);

    if (normalizedRun) {
      return normalizedRun;
    }

    return {
      ...fallbackRun,
      generation: createGenerationMetadata(metadata, 'fallback_validation_error', {
        fallback_used: true,
        fallback_reason: 'provider_json_failed_schema_validation'
      })
    };
  } catch (error) {
    return {
      ...fallbackRun,
      generation: createGenerationMetadata(metadata, 'fallback_provider_error', {
        fallback_used: true,
        fallback_reason: error.message
      })
    };
  }
}

module.exports = {
  runWorkspacePipeline,
  _test: {
    buildDeterministicRun,
    normalizeProviderRun,
    parseProviderJson
  }
};

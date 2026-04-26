const platformMetadata = {
  linkedin: {
    platform: 'LinkedIn adaptation draft',
    tone: 'linkedin',
    riskLabel: 'LinkedIn',
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
    riskLabel: 'X',
    lengthTarget: 'Under 280 characters',
    strategy: 'Compress the source into a direct short-form takeaway with one clear boundary and one question.',
    toneLabel: 'Direct, concise, and practical',
    audience: 'Fast-scanning social and healthtech operators',
    cta: 'Where should intake automation stop?',
    hashtags: ['#HealthTech', '#CareOps']
  }
};

const supportedPlatforms = Object.keys(platformMetadata);

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

  const bodyText = paragraphs.join(' ');
  const opener = paragraphs[0] || title;
  const benefit = paragraphs.find((paragraph) => /help|enable|improve|review|identify|route|reduce|faster|visibility/i.test(paragraph)) || paragraphs[1] || opener;
  const focus = paragraphs.find((paragraph) => /focus|visibility|manual|privacy|escalation|workflow|guardrail|review/i.test(paragraph)) || benefit;
  const boundary = paragraphs.find((paragraph) => /do not|does not|avoid|diagnos|treatment|replace|clinical|sensitive|crisis|human review|private|privacy/i.test(paragraph)) || 'Keep the message source-backed and avoid claims the source does not support.';

  return {
    title,
    opener: ensureSentence(opener),
    benefit: ensureSentence(benefit),
    focus: ensureSentence(focus),
    boundary: ensureSentence(boundary),
    bodyText
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
  const defaults = platformMetadata[platformId].hashtags;

  if (/patient|clinical|health|care|medical/i.test(sourceText)) {
    return defaults;
  }

  if (/ai|automation|workflow|agent/i.test(sourceText)) {
    return platformId === 'linkedin' ? ['#SocialOps', '#AIWorkflow', '#ContentReview'] : ['#AI', '#SocialOps'];
  }

  return platformId === 'linkedin' ? ['#SocialOps', '#ContentStrategy', '#ReviewWorkflow'] : ['#SocialOps', '#Content'];
}

function buildLinkedInDraft(parts, sourceText, risk) {
  const hashtags = hashtagsForSource('linkedin', sourceText);

  return {
    id: 'draft-linkedin-generated',
    platform: platformMetadata.linkedin.platform,
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
    cta: platformMetadata.linkedin.cta,
    hashtags: hashtags.join(' '),
    adaptationDetails: buildAdaptationDetails('linkedin', parts, sourceText, risk, hashtags)
  };
}

function buildXDraft(parts, sourceText, risk) {
  const hashtags = hashtagsForSource('x', sourceText);
  const benefit = trimToCharacters(parts.benefit, 94);
  const boundary = trimToCharacters(parts.boundary, 78);
  const hashtagLine = hashtags.join(' ');
  const body = trimToCharacters(`${benefit} ${boundary} ${platformMetadata.x.cta} ${hashtagLine}`, 280);

  return {
    id: 'draft-x-generated',
    platform: platformMetadata.x.platform,
    tone: 'x',
    risk,
    status: statusForRisk(risk),
    hook: `${parts.title} needs speed and guardrails.`,
    body: [body],
    cta: '',
    hashtags: '',
    adaptationDetails: buildAdaptationDetails('x', parts, sourceText, risk, hashtags)
  };
}

function buildAdaptationDetails(platformId, parts, sourceText, risk, hashtags) {
  const metadata = platformMetadata[platformId];

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
    ['Generator mode', 'Deterministic mock generator; replace this layer with an AI provider adapter later.']
  ];
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
      cta: adaptation.cta || platformMetadata[platformId].cta,
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

function emptyWorkspaceRun(sourceText = '') {
  return {
    sourcePreview: trimToCharacters(sourceText, 140),
    adaptations: [],
    planSeeds: [],
    draftSeeds: [],
    reviewItems: []
  };
}

export function generateWorkspaceRun({ sourceText, platforms }) {
  const normalized = normalizeText(sourceText);

  if (!normalized) {
    return emptyWorkspaceRun(sourceText);
  }

  const selectedPlatforms = platforms.filter((platform) => supportedPlatforms.includes(platform));
  const parts = extractSourceParts(normalized);
  const risk = detectRisk(normalized);
  const adaptations = selectedPlatforms.map((platform) => {
    if (platform === 'linkedin') {
      return buildLinkedInDraft(parts, normalized, risk);
    }

    return buildXDraft(parts, normalized, risk);
  });
  const planSeeds = buildPlanSeeds(adaptations, parts, risk);
  const draftSeeds = buildDraftSeeds(adaptations, planSeeds);
  const reviewItems = buildReviewItems(planSeeds, draftSeeds);

  return {
    sourcePreview: trimToCharacters(parts.opener || normalized, 140),
    adaptations,
    planSeeds,
    draftSeeds,
    reviewItems
  };
}

export function generateWorkspaceDrafts({ sourceText, platforms }) {
  return generateWorkspaceRun({ sourceText, platforms }).adaptations;
}

const encoder = new TextEncoder();

export const clinicalCuratorTheme = {
  colors: {
    background: '#0b1326',
    surface: '#171f33',
    surfaceHigh: '#222a3d',
    surfaceHighest: '#2d3449',
    surfaceLow: '#131b2e',
    surfaceLowest: '#060e20',
    primary: '#6aebe7',
    primaryStrong: '#48cfcb',
    secondary: '#70d6d8',
    tertiary: '#ffceaa',
    tertiaryStrong: '#fea961',
    success: '#4ade80',
    outline: '#869392',
    outlineVariant: '#3c4948',
    text: '#dae2fd',
    textMuted: '#bbc9c8',
  },
  fonts: {
    heading: 'Manrope',
    body: 'Inter',
    mono: 'JetBrains Mono',
  },
  radius: {
    card: 30,
    pill: 999,
    input: 20,
  },
};

export const acceptedFormats = ['PDF', 'TXT', 'MD', 'HL7', 'EMR Export'];
export const recommendedDomains = ['Oncology', 'Cardiovascular', 'Emergency', 'Radiology'];

export const pipelineBlueprint = [
  { id: 'upload', label: 'Upload', description: 'Capture and classify the source document.' },
  { id: 'analyzing', label: 'Analyze', description: 'Run quality control, hashing, and structuring.' },
  { id: 'hitl', label: 'HITL Review', description: 'Confirm the package before raw delivery.' },
  { id: 'success', label: 'Success', description: 'Store the approved profile and manifest.' },
];

function inferWordCount(file, textContent) {
  if (textContent) {
    return textContent.trim().split(/\s+/).filter(Boolean).length;
  }
  return Math.max(96, Math.round(file.size / 6));
}

async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function loadTextIfPossible(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const isTextLike =
    file.type.startsWith('text/') ||
    extension === 'txt' ||
    extension === 'md' ||
    extension === 'json';

  if (!isTextLike) {
    return '';
  }

  try {
    return await file.text();
  } catch {
    return '';
  }
}

function buildPreview(textContent, fileName, domain) {
  if (textContent) {
    return textContent.replace(/\s+/g, ' ').trim().slice(0, 240);
  }
  return `Browser demo intake for ${fileName} in the ${domain} domain. Provenance and quality control are simulated from real package semantics.`;
}

function buildRiskLevel(wordCount) {
  if (wordCount > 1800) return 'low-risk';
  if (wordCount > 500) return 'middle-risk';
  return 'elevated';
}

export async function buildGateDemoArtifact(file, options = {}) {
  const domain = options.domain ?? 'Oncology';
  const notebook = options.notebook ?? 'node-alpha-02';
  const textContent = await loadTextIfPossible(file);
  const wordCount = inferWordCount(file, textContent);
  const riskLevel = buildRiskLevel(wordCount);
  const sha256 = await sha256Hex(file);
  const preview = buildPreview(textContent, file.name, domain);
  const detectedType = file.type || 'application/octet-stream';
  const approved = wordCount > 50;
  const ingestedAt = new Date().toISOString();

  const qualityControl = {
    word_count: wordCount,
    status: approved ? 'approved' : 'rejected',
    feedback: approved
      ? 'Content length is sufficient for Context Gate intake.'
      : 'Content is too short for reliable ingestion.',
    risk_level: riskLevel,
    swot: {
      strengths: 'Browser demo mirrors the CLI quality-control contract.',
      weaknesses: 'Deep document parsing is mocked for non-text formats.',
    },
  };

  const provenance = {
    source_file: file.name,
    source_path: `browser://${encodeURIComponent(file.name)}`,
    notebook,
    domain,
    ingested_at: ingestedAt,
    sha256_hash: sha256,
    metrics: {
      word_count: wordCount,
      quality_status: riskLevel,
    },
  };

  return {
    file: {
      name: file.name,
      size: file.size,
      type: detectedType,
      extension: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
    },
    input: {
      path: provenance.source_path,
      file_name: file.name,
      domain,
      notebook,
      preview,
    },
    quality_control: qualityControl,
    provenance,
    recommendation: approved ? 'approve' : 'reject',
    raw_delivery_path: `packages/context-gate/raw/${file.name.replace(/\.[^.]+$/, '')}_${sha256.slice(0, 8)}.${file.name.split('.').pop() ?? 'bin'}`,
    manifest_path: `packages/context-gate/raw/${file.name.replace(/\.[^.]+$/, '')}_${sha256.slice(0, 8)}_provenance.yaml`,
    completed_steps: [
      'Text extraction',
      'Quality control',
      'SHA-256 provenance',
      'Structured profile',
      'Raw delivery receipt',
    ],
    live_metrics: [
      { label: 'Word Count', value: wordCount.toLocaleString('en-US') },
      { label: 'Risk Tier', value: riskLevel },
      { label: 'Notebook', value: notebook },
      { label: 'Domain', value: domain },
    ],
  };
}

export async function createVirtualFile(name, content, type = 'text/plain') {
  const bytes = encoder.encode(content);
  return new File([bytes], name, { type });
}

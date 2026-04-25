'use strict';

const fs = require('fs');
const path = require('path');

const SUPPORTED_FORMATS = new Set(['json']);
const PLATFORMS = ['linkedin', 'x'];

function createCliError(message, exitCode = 1) {
  const error = new Error(message);
  error.exitCode = exitCode;
  return error;
}

function assertJsonFormat(format) {
  const normalized = String(format || 'json').toLowerCase();
  if (!SUPPORTED_FORMATS.has(normalized)) {
    throw createCliError(`Unsupported format: ${format}. Only json is supported in the MVP.`, 1);
  }
  return normalized;
}

function readInputFile(inputPath) {
  if (!inputPath) {
    throw createCliError('Missing required --input path.', 1);
  }

  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    throw createCliError(`Input file not found: ${inputPath}`, 1);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    throw createCliError(`Input path is not a file: ${inputPath}`, 1);
  }

  const content = fs.readFileSync(resolved, 'utf8');
  if (!content.trim()) {
    throw createCliError(`Input file is empty: ${inputPath}`, 2);
  }

  return { path: resolved, content };
}

function ensureOutputPath(outputPath) {
  if (!outputPath) {
    throw createCliError('Missing required --output path.', 1);
  }

  const resolved = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}

function writeJsonOutput(outputPath, payload, options = {}) {
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;

  if (options.dryRun) {
    if (!options.quiet) {
      console.log(serialized.trimEnd());
    }
    return { wrote: false, outputPath: null };
  }

  const resolved = ensureOutputPath(outputPath);
  fs.writeFileSync(resolved, serialized, 'utf8');

  if (options.verbose && !options.quiet) {
    console.error(`Wrote ${resolved}`);
  }

  return { wrote: true, outputPath: resolved };
}

function firstMeaningfulLine(content) {
  const jsonValue = firstJsonStringValue(content);
  if (jsonValue) {
    return jsonValue;
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const stringValue = line.match(/:\s*"([^"]+)"/);
      return stringValue ? stringValue[1] : line;
    })
    .find((line) => line && !line.startsWith('---') && !/^[{}\[\],]+$/.test(line)) || '';
}

function firstJsonStringValue(content) {
  try {
    const parsed = JSON.parse(content);
    return findPreferredString(parsed);
  } catch (_error) {
    return '';
  }
}

function findPreferredString(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPreferredString(item);
      if (found) {
        return found;
      }
    }
    return '';
  }

  if (value && typeof value === 'object') {
    const preferredKeys = ['title', 'background', 'objective', 'main_finding', 'summary', 'name'];
    for (const key of preferredKeys) {
      const found = findPreferredString(value[key]);
      if (found) {
        return found;
      }
    }

    for (const item of Object.values(value)) {
      const found = findPreferredString(item);
      if (found) {
        return found;
      }
    }
  }

  return '';
}

function extractTitle(content) {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) {
    return cleanText(heading[1], 90);
  }

  return cleanText(firstMeaningfulLine(content), 90) || 'Source context';
}

function sourceQuote(content) {
  const line = firstMeaningfulLine(content);
  return cleanText(line, 240) || 'Source content provided by the user.';
}

function cleanText(value, maxLength) {
  const normalized = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^#+\s*/, '')
    .trim();

  if (!maxLength || normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function riskLevel(content) {
  const lower = content.toLowerCase();

  const highRiskTerms = [
    'crisis',
    'lawsuit',
    'legal',
    'patient',
    'diagnosis',
    'treatment',
    'mortality',
    'adverse event',
    'confidential',
    'privacy',
    'pii',
    'breach'
  ];

  if (highRiskTerms.some((term) => lower.includes(term))) {
    return 'high';
  }

  const mediumRiskTerms = [
    'study',
    'trial',
    'clinical',
    'medical',
    'evidence',
    'performance',
    'claim',
    'launch',
    'pricing',
    'compliance'
  ];

  if (mediumRiskTerms.some((term) => lower.includes(term)) || /\d/.test(content)) {
    return 'medium';
  }

  return 'low';
}

function approvalRequired(level) {
  return level !== 'low';
}

function contentPillar(content) {
  const lower = content.toLowerCase();
  if (lower.includes('launch') || lower.includes('release') || lower.includes('feature')) {
    return 'product';
  }
  if (lower.includes('result') || lower.includes('evidence') || lower.includes('study')) {
    return 'proof';
  }
  if (lower.includes('community') || lower.includes('comment') || lower.includes('question')) {
    return 'community';
  }
  return 'education';
}

function buildProvenance(inputPath, command) {
  return {
    input: path.resolve(inputPath),
    command,
    mode: 'deterministic',
    generated_by: 'social-agent'
  };
}

module.exports = {
  PLATFORMS,
  approvalRequired,
  assertJsonFormat,
  buildProvenance,
  cleanText,
  contentPillar,
  createCliError,
  extractTitle,
  readInputFile,
  riskLevel,
  sourceQuote,
  writeJsonOutput
};

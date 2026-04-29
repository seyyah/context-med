'use strict';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const WORKSPACE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    summary: { type: 'string' },
    content_pillar: { type: 'string' },
    risk_level: { type: 'string' },
    plan_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          suggested_day: { type: 'string' },
          topic: { type: 'string' },
          format: { type: 'string' },
          cta: { type: 'string' },
          content_pillar: { type: 'string' },
          risk_level: { type: 'string' },
          status: { type: 'string' },
          source_quote: { type: 'string' }
        },
        required: ['platform', 'suggested_day', 'topic', 'cta', 'risk_level', 'status', 'source_quote']
      }
    },
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          platform: { type: 'string' },
          hook: { type: 'string' },
          body: { type: 'string' },
          cta: { type: 'string' },
          risk_level: { type: 'string' },
          status: { type: 'string' },
          source_quote: { type: 'string' },
          hashtags: {
            type: 'array',
            items: { type: 'string' }
          },
          hashtag_policy: {
            type: 'object',
            properties: {
              required: { type: 'boolean' },
              max: { type: 'integer' },
              placement: { type: 'string' },
              reason: { type: 'string' }
            },
            required: ['required', 'max', 'placement', 'reason']
          },
          adaptation: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              tone: { type: 'string' },
              length_target: { type: 'string' },
              rewrite_reason: { type: 'string' },
              platform_constraints: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['strategy', 'tone', 'length_target', 'rewrite_reason', 'platform_constraints']
          }
        },
        required: ['platform', 'hook', 'body', 'cta', 'risk_level', 'status', 'source_quote', 'hashtags', 'hashtag_policy', 'adaptation']
      }
    },
    moderation_reports: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          classification: { type: 'string' },
          risk_level: { type: 'string' },
          recommended_action: { type: 'string' },
          reply_draft: { type: 'string' },
          source_quote: { type: 'string' }
        },
        required: ['classification', 'risk_level', 'recommended_action', 'source_quote']
      }
    }
  },
  required: ['topic', 'summary', 'plan_items', 'drafts', 'moderation_reports']
};

function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function buildWorkspacePrompt({ source, comments, language }) {
  return [
    'You are Social-Agent, a cautious social operations agent for Context-Med.',
    'Generate review-ready social planning output from the supplied source context and community comments.',
    '',
    'Rules:',
    '- Use LinkedIn and X as the first supported platforms.',
    '- Platform adaptation is mandatory: rewrite the same core idea for each platform; do not copy one platform draft and shorten it.',
    '- LinkedIn draft: write a polished platform-ready post, not a paragraph summary. Use a strong first-line hook, short paragraphs, optional bullets, a clear operational implication, a human-review boundary, and a concrete CTA question.',
    '- X draft: one concise platform-ready post, direct point of view, one focused question or review cue, and at most two relevant hashtags only if useful.',
    '- Hashtags are optional but expected when they help discovery: LinkedIn may use 2-3 relevant hashtags as the final line; X may use at most 2 and must stay under 280 characters.',
    '- draft.body must be the final platform-ready social post text, not instructions about how to write one.',
    '- Include hashtags and hashtag_policy for every draft. If hashtags are used, they must also appear in draft.body.',
    '- Do not put meta phrases like "LinkedIn version", "X version", "should explain", "designed to empower", "excited to announce", or "Source basis" inside draft.body.',
    '- Avoid generic launch language. Make the post feel like a real social post a social/media operator would approve.',
    '- For every draft, include adaptation.strategy, adaptation.tone, adaptation.length_target, adaptation.rewrite_reason, and adaptation.platform_constraints.',
    '- Do not invent clinical, product, safety, or compliance claims beyond the source context.',
    '- Keep patient privacy, crisis handling, and human approval visible in high-risk outputs.',
    '- No direct publishing. Anything risky must be review-ready or escalated.',
    '- Return concise but specific content that can be displayed directly in an operations dashboard.',
    `- Language metadata: ${language}. Write generated public-facing copy in ${language === 'tr' ? 'Turkish' : 'English'}.`,
    '',
    'Source context:',
    source,
    '',
    'Community comments:',
    comments.length ? comments.map((comment, index) => `${index + 1}. ${comment}`).join('\n') : 'No comments provided.',
    '',
    'Return only JSON matching the configured schema.'
  ].join('\n');
}

function candidateText(responseJson) {
  const parts = responseJson &&
    responseJson.candidates &&
    responseJson.candidates[0] &&
    responseJson.candidates[0].content &&
    responseJson.candidates[0].content.parts;

  if (!Array.isArray(parts)) {
    return '';
  }

  return parts.map((part) => part && part.text).filter(Boolean).join('\n').trim();
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    const fenced = String(text || '').match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1]);
    }
    throw _error;
  }
}

function cleanGeminiError(error) {
  const message = error && error.message ? error.message : String(error);
  return message.replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]').slice(0, 220);
}

async function generateWorkspaceWithGemini(options) {
  const apiKey = options.apiKey || getGeminiApiKey();
  const model = options.model || getGeminiModel();

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('Node.js fetch is unavailable. Use Node.js 18 or newer.');
  }

  const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: buildWorkspacePrompt(options)
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseJsonSchema: WORKSPACE_RESPONSE_SCHEMA
      }
    })
  });

  const responseText = await response.text();
  let responseJson;
  try {
    responseJson = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    responseJson = {};
  }

  if (!response.ok) {
    const apiMessage = responseJson.error && responseJson.error.message
      ? responseJson.error.message
      : responseText;
    throw new Error(`Gemini API ${response.status}: ${apiMessage || response.statusText}`);
  }

  const text = candidateText(responseJson);
  if (!text) {
    throw new Error('Gemini response did not include generated text.');
  }

  return parseJsonText(text);
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  cleanGeminiError,
  generateWorkspaceWithGemini,
  getGeminiApiKey,
  getGeminiModel
};

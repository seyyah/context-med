'use strict';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function createGeminiProvider(config = {}) {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const model = config.model || process.env.LLM_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  return {
    id: 'gemini',
    label: 'Google Gemini',
    model,
    status: apiKey ? 'configured' : 'missing_api_key',
    requiresApiKey: true,
    apiKeyConfigured: Boolean(apiKey),
    async generateDraft() {
      throw new Error('Gemini provider API calls are not wired into the CLI yet.');
    }
  };
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  createGeminiProvider
};

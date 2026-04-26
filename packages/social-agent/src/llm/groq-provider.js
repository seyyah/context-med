'use strict';

const DEFAULT_GROQ_MODEL = 'llama-3.1-70b-versatile';

function createGroqProvider(config = {}) {
  const apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
  const model = config.model || process.env.LLM_MODEL || process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  return {
    id: 'groq',
    label: 'Groq',
    model,
    status: apiKey ? 'configured' : 'missing_api_key',
    requiresApiKey: true,
    apiKeyConfigured: Boolean(apiKey),
    async generateDraft() {
      throw new Error('Groq provider API calls are not wired into the CLI yet.');
    }
  };
}

module.exports = {
  DEFAULT_GROQ_MODEL,
  createGroqProvider
};

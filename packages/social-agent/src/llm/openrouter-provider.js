'use strict';

const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.1-70b-instruct';

function createOpenRouterProvider(config = {}) {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
  const model = config.model || process.env.LLM_MODEL || process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

  return {
    id: 'openrouter',
    label: 'OpenRouter',
    model,
    status: apiKey ? 'configured' : 'missing_api_key',
    requiresApiKey: true,
    apiKeyConfigured: Boolean(apiKey),
    async generateDraft() {
      throw new Error('OpenRouter provider API calls are not wired into the CLI yet.');
    }
  };
}

module.exports = {
  DEFAULT_OPENROUTER_MODEL,
  createOpenRouterProvider
};

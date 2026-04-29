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
    },
    async generateWorkspaceJson(request = {}) {
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is required for OpenRouter generation.');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'x-title': 'Context-Med Social Agent'
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You return only valid JSON for a source-backed social-agent workflow pipeline.'
            },
            {
              role: 'user',
              content: request.prompt || ''
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter request failed with ${response.status}.`);
      }

      const payload = await response.json();
      return payload.choices?.[0]?.message?.content || '';
    }
  };
}

module.exports = {
  DEFAULT_OPENROUTER_MODEL,
  createOpenRouterProvider
};

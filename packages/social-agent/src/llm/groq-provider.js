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
    },
    async generateWorkspaceJson(request = {}) {
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is required for Groq generation.');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json'
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
        throw new Error(`Groq request failed with ${response.status}.`);
      }

      const payload = await response.json();
      return payload.choices?.[0]?.message?.content || '';
    }
  };
}

module.exports = {
  DEFAULT_GROQ_MODEL,
  createGroqProvider
};

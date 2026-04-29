'use strict';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function createGeminiProvider(config = {}) {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
  const model = config.model || process.env.LLM_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;

  return {
    id: 'gemini',
    label: 'Google Gemini',
    model,
    status: apiKey ? 'configured' : 'missing_api_key',
    requiresApiKey: true,
    apiKeyConfigured: Boolean(apiKey),
    async generateDraft() {
      throw new Error('Gemini provider API calls are not wired into the CLI yet.');
    },
    async generateWorkspaceJson(request = {}) {
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required for Gemini generation.');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: request.prompt || '' }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}.`);
      }

      const payload = await response.json();
      return payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
    }
  };
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  createGeminiProvider
};

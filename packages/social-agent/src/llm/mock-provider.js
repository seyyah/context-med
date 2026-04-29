'use strict';

const DEFAULT_MOCK_MODEL = 'mock-deterministic-social-agent';

function createMockProvider(config = {}) {
  const model = config.model || DEFAULT_MOCK_MODEL;

  return {
    id: 'mock',
    label: 'Mock Provider',
    model,
    status: config.status || 'ready',
    requiresApiKey: false,
    apiKeyConfigured: true,
    requestedProvider: config.requestedProvider || 'mock',
    fallbackReason: config.fallbackReason || '',
    async generateDraft(request = {}) {
      return {
        provider: 'mock',
        model,
        platform: request.platform || 'linkedin',
        text: 'Mock provider output. Deterministic CLI builders remain the source of truth until a live provider is wired.',
        risk_level: 'low'
      };
    },
    async generateWorkspaceJson() {
      return null;
    }
  };
}

module.exports = {
  DEFAULT_MOCK_MODEL,
  createMockProvider
};

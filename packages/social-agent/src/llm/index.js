'use strict';

const { loadPackageEnv } = require('../env');
const { createGeminiProvider } = require('./gemini-provider');
const { createGroqProvider } = require('./groq-provider');
const { createMockProvider } = require('./mock-provider');
const { createOpenRouterProvider } = require('./openrouter-provider');

const SUPPORTED_PROVIDERS = ['mock', 'gemini', 'groq', 'openrouter'];

function normalizeProviderName(value) {
  const provider = String(value || 'mock').toLowerCase().trim();
  return SUPPORTED_PROVIDERS.includes(provider) ? provider : 'mock';
}

function getLlmConfig(env = process.env) {
  const provider = normalizeProviderName(env.LLM_PROVIDER || env.SOCIAL_AGENT_LLM_PROVIDER || 'mock');
  const model = env.LLM_MODEL || '';

  return {
    provider,
    model,
    geminiApiKeyConfigured: Boolean(env.GEMINI_API_KEY || env.GOOGLE_API_KEY),
    groqApiKeyConfigured: Boolean(env.GROQ_API_KEY),
    openRouterApiKeyConfigured: Boolean(env.OPENROUTER_API_KEY)
  };
}

function createLlmProvider(options = {}) {
  loadPackageEnv();

  const provider = normalizeProviderName(options.provider || process.env.LLM_PROVIDER || process.env.SOCIAL_AGENT_LLM_PROVIDER);
  const model = options.model || process.env.LLM_MODEL || '';
  const config = { ...options, model };
  let selectedProvider;

  if (provider === 'gemini') {
    selectedProvider = createGeminiProvider(config);
  } else if (provider === 'groq') {
    selectedProvider = createGroqProvider(config);
  } else if (provider === 'openrouter') {
    selectedProvider = createOpenRouterProvider(config);
  } else {
    selectedProvider = createMockProvider(config);
  }

  if (selectedProvider.requiresApiKey && !selectedProvider.apiKeyConfigured) {
    return createMockProvider({
      model: '',
      requestedProvider: selectedProvider.id,
      fallbackReason: 'missing_api_key',
      status: 'fallback_missing_api_key'
    });
  }

  return selectedProvider;
}

function providerMetadata(provider) {
  return {
    provider: provider.id,
    requested_provider: provider.requestedProvider || provider.id,
    label: provider.label,
    model: provider.model,
    status: provider.status,
    fallback_reason: provider.fallbackReason || '',
    requires_api_key: provider.requiresApiKey,
    api_key_configured: provider.apiKeyConfigured,
    live_api_calls_enabled: provider.id !== 'mock' && provider.apiKeyConfigured
  };
}

module.exports = {
  SUPPORTED_PROVIDERS,
  createLlmProvider,
  getLlmConfig,
  normalizeProviderName,
  providerMetadata
};

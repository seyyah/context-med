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

  if (provider === 'gemini') {
    return createGeminiProvider(config);
  }

  if (provider === 'groq') {
    return createGroqProvider(config);
  }

  if (provider === 'openrouter') {
    return createOpenRouterProvider(config);
  }

  return createMockProvider(config);
}

function providerMetadata(provider) {
  return {
    provider: provider.id,
    label: provider.label,
    model: provider.model,
    status: provider.status,
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

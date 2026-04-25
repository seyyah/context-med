'use strict';

/**
 * LLM Client — Unified interface for multiple LLM providers.
 * Node.js equivalent of Python's LiteLLM.
 *
 * Supports: Groq, Gemini, OpenAI, Ollama (all via OpenAI-compatible API format).
 */

const { OpenAI } = require('openai');

// Provider configurations
const PROVIDERS = {
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
  },
  gemini: {
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envKey: 'GEMINI_API_KEY',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
  },
  ollama: {
    baseURL: 'http://localhost:11434/v1',
    envKey: null, // No API key needed for local Ollama
  },
};

// Client cache to reuse connections
const clientCache = new Map();

/**
 * Parse a model string like "groq/llama3-8b-8192" into provider + model.
 */
function parseModel(modelString) {
  const slashIdx = modelString.indexOf('/');
  if (slashIdx === -1) {
    return { provider: 'openai', model: modelString };
  }
  return {
    provider: modelString.slice(0, slashIdx),
    model: modelString.slice(slashIdx + 1),
  };
}

/**
 * Get or create an OpenAI-compatible client for the given provider.
 */
function getClient(provider) {
  if (clientCache.has(provider)) {
    return clientCache.get(provider);
  }

  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown LLM provider: ${provider}. Supported: ${Object.keys(PROVIDERS).join(', ')}`);
  }

  const apiKey = config.envKey ? process.env[config.envKey] : 'ollama';
  if (config.envKey && !apiKey) {
    const err = new Error(
      `Missing API key: ${config.envKey}. Set it in your .env file or environment.`
    );
    err.code = 'EXTERNAL_DEPENDENCY';
    throw err;
  }

  const client = new OpenAI({
    apiKey: apiKey || 'ollama',
    baseURL: config.baseURL,
  });

  clientCache.set(provider, client);
  return client;
}

/**
 * Send a chat completion request to any supported LLM provider.
 *
 * @param {string} modelString - e.g. "groq/llama3-8b-8192", "gemini/gemini-1.5-flash"
 * @param {Array} messages - OpenAI-format messages [{role, content}]
 * @param {object} options - temperature, max_tokens, etc.
 * @returns {string} The assistant's response text.
 */
async function chatCompletion(modelString, messages, options = {}) {
  const { provider, model } = parseModel(modelString);
  const client = getClient(provider);

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 150,
  });

  return response.choices[0].message.content.trim();
}

/**
 * Retry wrapper with exponential backoff (equivalent to Python's Tenacity).
 *
 * @param {Function} fn - Async function to retry
 * @param {object} options - maxAttempts, minDelay, maxDelay
 * @returns {*} Result of fn
 */
async function withRetry(fn, options = {}) {
  const maxAttempts = options.maxAttempts || 3;
  const minDelay = options.minDelay || 2000;
  const maxDelay = options.maxDelay || 30000;

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) break;

      // Exponential backoff with jitter
      const delay = Math.min(minDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
  throw lastError;
}

module.exports = { chatCompletion, withRetry, parseModel };

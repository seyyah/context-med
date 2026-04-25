import { claudeCall, claudeStream, DEFAULT_MODEL as CLAUDE_DEFAULT } from "./providers/claude.js";
import { openaiCall, openaiStream, DEFAULT_MODEL as OPENAI_DEFAULT } from "./providers/openai.js";

export { CLAUDE_DEFAULT as DEFAULT_MODEL };

async function fetchWithRetry(url, init, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.status === 429 || response.status === 529) {
        const retryAfter = response.headers?.get?.("retry-after");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        lastError = new Error(`API error ${response.status}: rate limited`);
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }
  throw lastError;
}

function resolveApiKey(apiKey, provider) {
  if (apiKey) return apiKey;
  if (typeof process === "undefined") return undefined;
  return provider === "openai"
    ? process.env?.OPENAI_API_KEY
    : process.env?.ANTHROPIC_API_KEY;
}

/**
 * Provider-agnostic LLM çağrısı.
 *
 * @param {object} opts
 * @param {string} opts.apiKey
 * @param {"claude"|"openai"} [opts.provider="claude"]
 * @param {string} [opts.model]
 * @param {string} opts.systemPrompt
 * @param {string} opts.userMessage
 * @param {number} [opts.maxTokens=2000]
 */
export async function callLLM({ apiKey, provider = "claude", model, systemPrompt, userMessage, maxTokens = 2000 }) {
  const key = resolveApiKey(apiKey, provider);
  if (!key) {
    throw new Error(
      provider === "openai"
        ? "apiKey is required. Pass it via options.apiKey or OPENAI_API_KEY env variable."
        : "apiKey is required. Pass it via options.apiKey or ANTHROPIC_API_KEY env variable."
    );
  }

  const fetchFn = (url, init) => fetchWithRetry(url, init);
  const args = { apiKey: key, model, systemPrompt, userMessage, maxTokens, fetchFn };

  return provider === "openai"
    ? openaiCall(args)
    : claudeCall(args);
}

/**
 * Provider-agnostic streaming LLM çağrısı.
 */
export async function callLLMStream({ apiKey, provider = "claude", model, systemPrompt, userMessage, maxTokens = 2000, onChunk }) {
  const key = resolveApiKey(apiKey, provider);
  if (!key) {
    throw new Error(
      provider === "openai"
        ? "apiKey is required. Pass it via options.apiKey or OPENAI_API_KEY env variable."
        : "apiKey is required. Pass it via options.apiKey or ANTHROPIC_API_KEY env variable."
    );
  }

  const fetchFn = (url, init) => fetchWithRetry(url, init);
  const args = { apiKey: key, model, systemPrompt, userMessage, maxTokens, onChunk, fetchFn };

  return provider === "openai"
    ? openaiStream(args)
    : claudeStream(args);
}

// Backward compat — eski isimler hâlâ çalışır
export const callClaude = (opts) => callLLM({ ...opts, provider: "claude" });
export const callClaudeStream = (opts) => callLLMStream({ ...opts, provider: "claude" });

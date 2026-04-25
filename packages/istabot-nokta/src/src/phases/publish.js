import { callLLM, callLLMStream } from "../client.js";
import { buildPublishPrompt } from "../prompts/publish.js";

function parsePublishResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * PUBLISH phase: araştırma bağlamı → IMRAD taslağı + dergi önerisi
 *
 * @param {string} input
 * @param {object} options
 * @param {string} [options.apiKey]
 * @param {"claude"|"openai"} [options.provider="claude"]
 * @param {string} [options.model]
 * @param {string} [options.language="tr"]
 * @param {number} [options.maxTokens=4000]
 * @param {boolean} [options.stream=false]
 * @param {Function} [options.onChunk]
 *
 * @returns {Promise<{ text, manuscript, titleAlternatives, journalRecommendations }>}
 */
export async function publish(input, options = {}) {
  const { apiKey, provider = "claude", ...rest } = options;

  const systemPrompt = buildPublishPrompt({ language: rest.language || "tr" });

  const callArgs = { apiKey, provider, model: rest.model, maxTokens: rest.maxTokens || 4000, systemPrompt, userMessage: input };
  const text = rest.stream
    ? await callLLMStream({ ...callArgs, onChunk: rest.onChunk })
    : await callLLM(callArgs);

  const parsed = parsePublishResponse(text);

  return {
    text,
    manuscript: parsed?.manuscript ?? null,
    titleAlternatives: parsed?.titleAlternatives ?? null,
    journalRecommendations: parsed?.journalRecommendations ?? null,
  };
}

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

function countWords(manuscript) {
  if (!manuscript) return 0;
  const sections = ["introduction", "methods", "results", "discussion"];
  const combined = sections.map(s => manuscript[s] || "").join(" ");
  return combined.trim() ? combined.trim().split(/\s+/).length : 0;
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
 * @param {{ discover?: object, design?: object, execute?: object }} [options.context]
 *   Önceki faz sonuçları. Verilirse her IMRAD bölümü ilgili fazın çıktısından beslenir.
 *
 * @returns {Promise<{ text, manuscript, wordCount, titleAlternatives, journalRecommendations }>}
 */
export async function publish(input, options = {}) {
  const { apiKey, provider = "claude", ...rest } = options;

  const systemPrompt = buildPublishPrompt({ language: rest.language || "tr", context: rest.context ?? null });

  const callArgs = { apiKey, provider, model: rest.model, maxTokens: rest.maxTokens || 4000, systemPrompt, userMessage: input };
  const text = rest.stream
    ? await callLLMStream({ ...callArgs, onChunk: rest.onChunk })
    : await callLLM(callArgs);

  const parsed = parsePublishResponse(text);

  const manuscript = parsed?.manuscript ?? null;

  return {
    text,
    manuscript,
    wordCount: countWords(manuscript),
    references: parsed?.references ?? null,
    titleAlternatives: parsed?.titleAlternatives ?? null,
    journalRecommendations: parsed?.journalRecommendations ?? null,
  };
}

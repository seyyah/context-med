import { callLLM, callLLMStream } from "../client.js";
import { buildDesignPrompt } from "../prompts/design.js";

function parseDesignResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * DESIGN phase: research question / DISCOVER çıktısı → örneklem, ölçek, çalışma tasarımı
 *
 * @param {string} input
 * @param {object} options
 * @param {string} [options.apiKey]
 * @param {"claude"|"openai"} [options.provider="claude"]
 * @param {string} [options.model]
 * @param {string} [options.language="tr"]
 * @param {number} [options.maxTokens=2000]
 * @param {boolean} [options.stream=false]
 * @param {Function} [options.onChunk]
 *
 * @returns {Promise<{ text, powerAnalysis, scales, dataCollection, studyDesign }>}
 */
export async function design(input, options = {}) {
  const { apiKey, provider = "claude", ...rest } = options;

  const systemPrompt = buildDesignPrompt({ language: rest.language || "tr" });

  const callArgs = { apiKey, provider, model: rest.model, maxTokens: rest.maxTokens, systemPrompt, userMessage: input };
  const text = rest.stream
    ? await callLLMStream({ ...callArgs, onChunk: rest.onChunk })
    : await callLLM(callArgs);

  const parsed = parseDesignResponse(text);

  return {
    text,
    powerAnalysis: parsed?.powerAnalysis ?? null,
    scales: parsed?.scales ?? null,
    dataCollection: parsed?.dataCollection ?? null,
    studyDesign: parsed?.studyDesign ?? null,
  };
}

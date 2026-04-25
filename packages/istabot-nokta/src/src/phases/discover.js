import { callLLM, callLLMStream } from "../client.js";
import { buildDiscoverPrompt } from "../prompts/discover.js";

function parseDiscoverResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * DISCOVER phase: anahtar kelime / fikir kırıntısı → PICO + research question + literatür boşluğu
 *
 * @param {string} input
 * @param {object} options
 * @param {string} [options.apiKey] - API key (ANTHROPIC_API_KEY veya OPENAI_API_KEY env'den de okunur)
 * @param {"claude"|"openai"} [options.provider="claude"]
 * @param {string} [options.model]
 * @param {string} [options.domain]
 * @param {string} [options.language="tr"]
 * @param {number} [options.maxTokens=2000]
 * @param {boolean} [options.stream=false]
 * @param {Function} [options.onChunk]
 *
 * @returns {Promise<{ text, pico, researchQuestion, literatureGap, methodology, timeline }>}
 */
export async function discover(input, options = {}) {
  const { apiKey, provider = "claude", ...rest } = options;

  const systemPrompt = buildDiscoverPrompt({
    domain: rest.domain,
    language: rest.language || "tr",
  });

  const callArgs = { apiKey, provider, model: rest.model, maxTokens: rest.maxTokens, systemPrompt, userMessage: input };
  const text = rest.stream
    ? await callLLMStream({ ...callArgs, onChunk: rest.onChunk })
    : await callLLM(callArgs);

  const parsed = parseDiscoverResponse(text);

  return {
    text,
    pico: parsed?.pico ?? null,
    researchQuestion: parsed?.researchQuestion ?? null,
    literatureGap: parsed?.literatureGap ?? null,
    methodology: parsed?.methodology ?? null,
    timeline: parsed?.timeline ?? null,
  };
}

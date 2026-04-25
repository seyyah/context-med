import { callLLM, callLLMStream } from "../client.js";
import { buildExecutePrompt } from "../prompts/execute.js";

function parseExecuteResponse(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * EXECUTE phase: araştırma sorusu + veri özeti → test seçimi + analiz planı
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
 * @returns {Promise<{ text, dataDiagnostics, testSelection, analysisplan, interpretationGuide }>}
 */
export async function execute(input, options = {}) {
  const { apiKey, provider = "claude", ...rest } = options;

  const systemPrompt = buildExecutePrompt({ language: rest.language || "tr" });

  const callArgs = { apiKey, provider, model: rest.model, maxTokens: rest.maxTokens, systemPrompt, userMessage: input };
  const text = rest.stream
    ? await callLLMStream({ ...callArgs, onChunk: rest.onChunk })
    : await callLLM(callArgs);

  const parsed = parseExecuteResponse(text);

  return {
    text,
    dataDiagnostics: parsed?.dataDiagnostics ?? null,
    testSelection: parsed?.testSelection ?? null,
    analysisplan: parsed?.analysisplan ?? null,
    interpretationGuide: parsed?.interpretationGuide ?? null,
  };
}

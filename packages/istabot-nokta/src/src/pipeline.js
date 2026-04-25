import { discover } from "./phases/discover.js";
import { design } from "./phases/design.js";
import { execute } from "./phases/execute.js";
import { publish } from "./phases/publish.js";

/**
 * Full MRLC pipeline: DISCOVER → DESIGN → EXECUTE → PUBLISH
 *
 * Her faz bir öncekinin `text` çıktısını input olarak alır.
 * İstersen `onProgress` callback'i ile her faz tamamlandığında bildirim alabilirsin.
 *
 * @param {string} input - Başlangıç fikri veya anahtar kelimeler
 * @param {object} options
 * @param {string} options.apiKey - Anthropic API key (zorunlu)
 * @param {string} [options.model]
 * @param {string} [options.domain]
 * @param {string} [options.language="tr"]
 * @param {Function} [options.onProgress] - (phase: string, result: object) => void
 *
 * @returns {Promise<{
 *   discover: object,
 *   design: object,
 *   execute: object,
 *   publish: object
 * }>}
 */
export async function pipeline(input, options = {}) {
  const { onProgress, ...phaseOptions } = options;

  const discoverResult = await discover(input, phaseOptions);
  onProgress?.("discover", discoverResult);

  const designResult = await design(discoverResult.text, phaseOptions);
  onProgress?.("design", designResult);

  const executeInput = `${discoverResult.text}\n\n${designResult.text}`;
  const executeResult = await execute(executeInput, phaseOptions);
  onProgress?.("execute", executeResult);

  const publishInput = `${discoverResult.text}\n\n${designResult.text}\n\n${executeResult.text}`;
  const publishResult = await publish(publishInput, {
    ...phaseOptions,
    context: {
      discover: discoverResult,
      design: designResult,
      execute: executeResult,
    },
  });
  onProgress?.("publish", publishResult);

  return {
    discover: discoverResult,
    design: designResult,
    execute: executeResult,
    publish: publishResult,
  };
}

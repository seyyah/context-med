'use strict';

/**
 * Agent A: Open Coder
 * Extracts 3-5 key themes/codes from raw qualitative text.
 * Python equivalent: AgentA_OpenCoder (Groq/Llama-3)
 */

const { chatCompletion, withRetry } = require('../llm-client');

const SYSTEM_PROMPT = `You are a qualitative data analyst specializing in open coding.
Analyze the given text and extract 3-5 key themes or codes that represent the main concepts.
Return ONLY a comma-separated list of codes/themes.
Be concise and specific.`;

const MODEL = 'groq/llama3-8b-8192';

/**
 * Extract open codes from a single text entry.
 *
 * @param {string} text - Raw qualitative text to analyze
 * @param {number} rowNum - Row number for logging
 * @param {object} logger - Logger instance
 * @returns {string} Comma-separated open codes
 */
async function extractCodes(text, rowNum, logger) {
  return withRetry(
    async () => {
      logger.info(`Row ${rowNum} - Agent A (Open Coder) processing...`);

      const codes = await chatCompletion(MODEL, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Text to analyze: ${text}` },
      ], { temperature: 0.3, maxTokens: 150 });

      logger.info(`Row ${rowNum} - Agent A completed: ${codes}`);
      return codes;
    },
    { maxAttempts: 5, minDelay: 4000, maxDelay: 60000 }
  );
}

module.exports = { extractCodes, MODEL, SYSTEM_PROMPT };

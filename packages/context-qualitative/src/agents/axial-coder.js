'use strict';

/**
 * Agent B: Axial Coder
 * Groups open codes into 2-3 broader parent categories.
 * Python equivalent: AgentB_AxialCoder (Gemini 1.5 Flash)
 */

const { chatCompletion, withRetry } = require('../llm-client');

const SYSTEM_PROMPT = `You are a qualitative data analyst specializing in axial coding.
Given a list of open codes, group them into 2-3 broader parent categories.
Return ONLY a comma-separated list of parent categories.
Focus on thematic relationships and hierarchical organization.`;

const MODEL = 'gemini/gemini-1.5-flash';

/**
 * Synthesize open codes into broader axial categories.
 *
 * @param {string} codes - Comma-separated open codes from Agent A
 * @param {number} rowNum - Row number for logging
 * @param {object} logger - Logger instance
 * @returns {string} Comma-separated axial categories
 */
async function synthesizeCategories(codes, rowNum, logger) {
  return withRetry(
    async () => {
      logger.info(`Row ${rowNum} - Agent B (Axial Coder) processing...`);

      const categories = await chatCompletion(MODEL, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Open codes to synthesize: ${codes}` },
      ], { temperature: 0.2, maxTokens: 100 });

      logger.info(`Row ${rowNum} - Agent B completed: ${categories}`);
      return categories;
    },
    { maxAttempts: 3, minDelay: 2000, maxDelay: 30000 }
  );
}

module.exports = { synthesizeCategories, MODEL, SYSTEM_PROMPT };

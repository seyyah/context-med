'use strict';

/**
 * Agent C: Cross-Validator
 * Validates that axial categories accurately reflect the original text.
 * Python equivalent: AgentC_CrossValidator (Ollama/Qwen3 local)
 */

const { chatCompletion, withRetry } = require('../llm-client');

const SYSTEM_PROMPT = `You are a validation assistant. Check if the category accurately reflects the text.
Reply with: YES/NO and one sentence reason.
Keep response under 50 words.`;

const MODEL = 'ollama/qwen3:4b';

/**
 * Validate whether axial categories correctly represent the original text.
 *
 * @param {string} text - Original qualitative text
 * @param {string} categories - Axial categories from Agent B
 * @param {number} rowNum - Row number for logging
 * @param {object} logger - Logger instance
 * @returns {{ result: string, reason: string }}
 */
async function validateCategorization(text, categories, rowNum, logger) {
  try {
    const validation = await withRetry(
      async () => {
        logger.info(`Row ${rowNum} - Agent C (Cross-Validator) processing...`);

        const response = await chatCompletion(MODEL, [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Text: ${text}\nCategories: ${categories}` },
        ], { temperature: 0.1, maxTokens: 80 });

        logger.info(`Row ${rowNum} - Agent C completed: ${response}`);
        return response;
      },
      { maxAttempts: 2, minDelay: 1000, maxDelay: 10000 }
    );

    // Parse validation result (same logic as Python version)
    const upper = validation.toUpperCase();
    if (upper.startsWith('YES')) {
      return { result: 'YES', reason: validation.slice(3).trim() };
    } else if (upper.startsWith('NO')) {
      return { result: 'NO', reason: validation.slice(2).trim() };
    } else {
      const parts = validation.split('.', 2);
      return {
        result: (parts[0] || 'UNCLEAR').trim(),
        reason: (parts[1] || validation).trim(),
      };
    }
  } catch (err) {
    logger.warn(`Row ${rowNum} - Agent C error: ${err.message}`);
    return { result: 'ERROR', reason: err.message };
  }
}

module.exports = { validateCategorization, MODEL, SYSTEM_PROMPT };

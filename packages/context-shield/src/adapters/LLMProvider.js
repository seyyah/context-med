'use strict';

/**
 * @abstract
 * Base class for all AI providers.
 */
class LLMProvider {
  constructor() {
    if (this.constructor === LLMProvider) {
      throw new Error("Abstract class 'LLMProvider' cannot be instantiated directly.");
    }
  }

  /**
   * @abstract
   * @param {string} prompt - The prompt to send to the AI
   * @returns {Promise<string>} - The AI response
   */
  async generateResponse(prompt) {
    throw new Error("Method 'generateResponse()' must be implemented.");
  }

  /**
   * Provider name for debugging/logging
   */
  get name() {
    return this.constructor.name;
  }
}

module.exports = { LLMProvider };

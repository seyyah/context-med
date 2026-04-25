const { LLMProvider } = require('./LLMProvider');

class BrowserAIAdapter extends LLMProvider {
  constructor() {
    super();
  }

  async generateResponse(prompt) {
    // Chrome window.ai or Transformers.js implementation
    if (typeof window !== 'undefined' && window.ai) {
      try {
        const session = await window.ai.createTextSession();
        return await session.prompt(prompt);
      } catch (err) {
        return `Browser AI Error: ${err.message}`;
      }
    }
    return "Browser AI not supported in this environment.";
  }
}

module.exports = { BrowserAIAdapter };

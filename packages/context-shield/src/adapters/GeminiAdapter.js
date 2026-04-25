const { LLMProvider } = require('./LLMProvider');

class GeminiAdapter extends LLMProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  async generateResponse(prompt) {
    // This is where actual Google Gemini API calls would happen
    return `Gemini Mock Response for: ${prompt.substring(0, 30)}...`;
  }
}

module.exports = { GeminiAdapter };

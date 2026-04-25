const { LLMProvider } = require('./LLMProvider');

class OpenSourceAdapter extends LLMProvider {
  constructor(endpoint = 'http://localhost:11434') {
    super();
    this.endpoint = endpoint;
  }

  async generateResponse(prompt) {
    // Logic for Ollama or other local models via REST
    return `OpenSource (Local) Mock Response for: ${prompt.substring(0, 30)}...`;
  }
}

module.exports = { OpenSourceAdapter };

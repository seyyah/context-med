const { scan } = require('./scanner');
const { mask } = require('./masker');

/**
 * Context-Shield Orchestrator
 * Uses Dependency Injection for LLM Providers
 */
class ContextShield {
  /**
   * @param {LLMProvider} llmProvider - The AI adapter to use
   */
  constructor(llmProvider) {
    if (!llmProvider) {
      throw new Error("llmProvider is required for ContextShield.");
    }
    this.llmProvider = llmProvider;
  }

  /**
   * Main pipeline: Scan -> Mask -> AI Request
   * @param {string} text - Raw medical text
   */
  async process(text) {
    // 1. Local PII Scanning
    const { entities, map } = scan(text);
    
    // 2. Local Masking
    const maskedText = this.applyMasking(text, map);

    // 3. AI Interaction via Adapter
    const aiResponse = await this.llmProvider.generateResponse(maskedText);

    return {
        original: text,
        masked: maskedText,
        aiResponse: aiResponse,
        entities: entities,
        map: map,
        provider: this.llmProvider.name
    };
  }

  // Helper to call masker
  applyMasking(text, map) {
    // Relying on the global masker logic (importing mask function)
    return mask(text, map);
  }
}

module.exports = { ContextShield };

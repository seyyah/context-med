const fs = require('fs');
const path = require('path');
const { ContextShield } = require('../../src/core/ContextShield');
const { LLMProvider } = require('../../src/adapters/LLMProvider');

// Mock adapter for testing the pipeline without external API calls
class TestMockAdapter extends LLMProvider {
  async generateResponse(p) { return "Mock Response"; }
}

describe('Comprehensive Oncology Stress Test', () => {
    const datasetPath = path.join(__dirname, '../fixtures/comprehensive-oncology-dataset.json');
    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
    const shield = new ContextShield(new TestMockAdapter());

    dataset.forEach((scenario) => {
      test(`Scenario ${scenario.id}: ${scenario.type}`, async () => {
        const result = await shield.process(scenario.original_text);
        
        // Rule 1: Masked text must exist
        expect(result.masked).toBeDefined();
        
        // Rule 2: Masked text must NOT contain any of the original expected PII data
        scenario.expected_entities.forEach(pii => {
          // Some PIIs (like TC) might be spaced, we clean both for robust comparison
          const cleanPii = pii.replace(/\s/g, '');
          const cleanMasked = result.masked.replace(/\s/g, '');
          
          expect(cleanMasked.toLowerCase()).not.toContain(cleanPii.toLowerCase());
        });

        // Rule 3: Entities mapping must be consistent
        expect(Object.keys(result.map).length).toBeGreaterThan(0);
        
        // Rule 4: Synthetic tokens must be used (Regex check for [LABEL_1])
        expect(result.masked).toMatch(/\[[A-Z]+_[0-9]+\]/);
      });
    });
});

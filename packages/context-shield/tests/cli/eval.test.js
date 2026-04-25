'use strict';

const fs = require('fs');
const path = require('path');
const { scan } = require('../../src/core/scanner');
const { mask } = require('../../src/core/masker');
const { demask } = require('../../src/core/demasker');

const FIXTURES_DIR = path.resolve(__dirname, '../../../../fixtures/shield');

describe('context-shield | Ratchet Evaluation (Levenshtein Stress Test)', () => {
  const testFiles = [
    'test-01.txt', 'test-02.txt', 'test-03.txt',
    'test-04.txt', 'test-05.txt', 'test-06.txt',
    'test-07.txt', 'test-08.txt', 'test-09.txt',
    'test-10.txt'
  ];

  testFiles.forEach((filename) => {
    test(`Evaluation for ${filename}`, () => {
      const filePath = path.join(FIXTURES_DIR, filename);
      const originalText = fs.readFileSync(filePath, 'utf8');

      // 1. Scan and Mask
      const scanResults = scan(originalText);
      const maskedText = mask(originalText, scanResults.map);

      // 2. LLM Mutation Simulation
      // We take the masked text and apply mutations to tokens
      let mutatedText = maskedText;
      const tokens = Object.values(scanResults.map);

      tokens.forEach((token) => {
        // Mutation types:
        // - To lowercase and add suffix: [KİŞİ_1] -> [kişi_1]'in
        // - Remove brackets and change case: [KİŞİ_1] -> KISI_1-e
        // - Prefix/Suffix addition: [KİŞİ_1] -> token-[KİŞİ_1]-token
        
        const suffixMutations = [
          (t) => `${t}'ın`,
          (t) => `${t}'in`,
          (t) => `${t}ye`,
          (t) => `${t}ya`,
          (t) => t.toUpperCase(),
          (t) => t.toLowerCase(),
        ];

        const mutation = suffixMutations[Math.floor(Math.random() * suffixMutations.length)];
        const mutatedToken = mutation(token);
        mutatedText = mutatedText.split(token).join(mutatedToken);
      });

      // 3. Fuzzy De-masking
      const demaskedText = demask(mutatedText, scanResults.map);


      // 4. Verification
      // For files with PII, check if original names are recovered
      // Actually, since demask replaces mutations with original values,
      // the demaskedText should be very similar to originalText.
      
      // Note: If a word like "Ahmet'in" was in original, scanner might pick "Ahmet".
      // Masker turns it into "[KİŞİ_1]'in".
      // Demasker should turn "[KİŞİ_1]'in" -> "Ahmet'in" (if it replaces the whole word cluster).
      
      // Let's check for the presence of original values.
      Object.keys(scanResults.map).forEach((originalValue) => {
        const originalCount = (originalText.split(originalValue).length - 1);
        const demaskedCount = (demaskedText.split(originalValue).length - 1);
        
        if (demaskedCount < originalCount) {
          fs.appendFileSync('recall_fail.txt', `FAIL: ${filename} | Value: ${originalValue} | Expected >= ${originalCount} | Got ${demaskedCount}\n`);
          fs.appendFileSync('recall_fail.txt', `Demasked Text: ${demaskedText}\n---\n`);
        }
        
        expect(demaskedCount).toBeGreaterThanOrEqual(originalCount);
      });

      // For control files (09, 10), ensure no pii was hallucinated and text is preserved
      if (filename === 'test-09.txt' || filename === 'test-10.txt') {
        expect(scanResults.entities.length).toBe(0);
        expect(demaskedText).toBe(originalText);
      }
    });
  });
});

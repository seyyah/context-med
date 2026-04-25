'use strict';

/**
 * PII De-masker (Fuzzy De-Masking)
 * Restores original data from (potentially mutated) tokens.
 */

/**
 * Normalizes text for comparison, especially Turkish characters
 */
function normalize(str) {
  if (!str) return '';
  // NFD decomposition + stripping combining marks + NFC recomposition
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .normalize('NFC')
    .replace(/[^A-ZÇĞİÖŞÜa-zçğıöşü0-9[\]_]/gu, '')
    .toUpperCase()
    .replace(/İ/g, 'I') 
    .replace(/ı/g, 'i')
    .toLowerCase();
}






/**
 * Calculates Levenshtein distance between two strings
 */
function getLevenshteinDistance(a, b) {
  const s1 = normalize(a);
  const s2 = normalize(b);
  const aLen = s1.length;
  const bLen = s2.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  let v0 = new Array(bLen + 1);
  let v1 = new Array(bLen + 1);

  for (let i = 0; i <= bLen; i++) v0[i] = i;

  for (let i = 0; i < aLen; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < bLen; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= bLen; j++) v0[j] = v1[j];
  }

  return v1[bLen];
}


/**
 * Replaces tokens in masked text with original values using fuzzy matching
 */
function demask(maskedText, originalMap) {
  if (!originalMap || Object.keys(originalMap).length === 0) return maskedText;

  // Create reverse map: { "[KİŞİ_1]": "Ahmet Yılmaz" }
  const tokenToValue = {};
  for (const [value, token] of Object.entries(originalMap)) {
    tokenToValue[token.toUpperCase()] = value;
  }

  const tokens = Object.keys(tokenToValue);
  let resultText = maskedText;

  // Split text into candidate words/chunks
  const words = maskedText.match(/[^\s]+/g) || [];
  
  // Filter for words that look like they might contain a token (mutated or not)
  // This prevents accidentally replacing normal words like "Hasta".
  const uniqueWords = [...new Set(words)].filter(word => {
    const normalized = word.toUpperCase();
    return normalized.includes('[') || 
           normalized.includes(']') || 
           /\d/.test(normalized) ||
           tokens.some(t => normalized.includes(t.replace(/[^A-Z]/g, '')));
  });

  // Sort unique words by length descending to replace longer matches first
  uniqueWords.sort((a, b) => b.length - a.length);

  for (const word of uniqueWords) {
    // Clean word from common surrounding characters to improve token matching
    const cleanWord = word.replace(/^[([<{]+|[)\]>},.!?;:]+$/g, '');
    if (cleanWord.length < 3) continue;

    for (const token of tokens) {
      // Fuzzy match against the clean word
      const distance = getLevenshteinDistance(cleanWord, token);
      const normWord = normalize(cleanWord);
      const normToken = normalize(token);
      
      const denominator = Math.max(normWord.length, normToken.length);
      const ratio = denominator === 0 ? 0 : distance / denominator;

      if (ratio <= 0.6) { 
        // Strict Check: Ensure token IDs (digits) match exactly to avoid cross-contamination
        const wordDigits = cleanWord.match(/\d+/g)?.join('');
        const tokenDigits = token.match(/\d+/g)?.join('');
        
        if (wordDigits && tokenDigits && wordDigits !== tokenDigits) {
          // If both have digits but they don't match, it's likely a different token instance
          continue;
        }

        // Use split/join for safe replacement of the specific word found
        resultText = resultText.split(word).join(tokenToValue[token]);
        break; 
      }
    }

  }



  return resultText;
}


module.exports = { demask, getLevenshteinDistance };

'use strict';

/**
 * PII Masker (Tokenization)
 * Replaces original PII values with synthetic tokens.
 */

function mask(text, map) {
  if (!map || Object.keys(map).length === 0) return text;

  let maskedText = text;
  
  // Sort keys by length descending to prevent partial replacement errors
  // (e.g., replacing "Ahmet" before "Ahmet Yılmaz")
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    const token = map[key];
    
    // Escape special regex characters in the key for safe global replacement
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    
    maskedText = maskedText.replace(regex, token);
  }
  
  return maskedText;
}

module.exports = { mask };

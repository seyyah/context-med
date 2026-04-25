const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Parses the Deck configuration YAML file.
 * @param {string} configPath - The path to the YAML file.
 * @returns {Object} Parsed configuration object.
 */
function loadDeckConfig(configPath) {
  try {
    const absolutePath = path.resolve(configPath);
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    const config = yaml.parse(fileContents);
    
    // Validate required fields
    if (!config.duration_min) {
      console.warn('Warning: duration_min not found in config, defaulting to 10');
      config.duration_min = 10;
    }
    
    return config;
  } catch (error) {
    console.error(`Error loading config file at ${configPath}:`, error.message);
    throw error;
  }
}

/**
 * Parses the input JSON data (e.g. from context-med extractor).
 * @param {string} jsonPath - The path to the JSON file.
 * @returns {Object} Parsed JSON data.
 */
function loadInputData(jsonPath) {
  try {
    const absolutePath = path.resolve(jsonPath);
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error loading input JSON at ${jsonPath}:`, error.message);
    throw error;
  }
}

module.exports = {
  loadDeckConfig,
  loadInputData
};

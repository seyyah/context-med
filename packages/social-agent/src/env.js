'use strict';

const fs = require('fs');
const path = require('path');

function unquote(value) {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadPackageEnv(envPath = path.resolve(__dirname, '..', '.env')) {
  if (!fs.existsSync(envPath)) {
    return false;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      return;
    }

    const separator = line.indexOf('=');
    if (separator === -1) {
      return;
    }

    const key = line.slice(0, separator).trim();
    const value = unquote(line.slice(separator + 1));

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  });

  return true;
}

module.exports = {
  loadPackageEnv
};

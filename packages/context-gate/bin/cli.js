#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const srcPath = path.join(packageRoot, 'src');
const args = process.argv.slice(2);

const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []]]
  : [['python3', []], ['python', []]];

let lastError = null;

for (const [command, baseArgs] of candidates) {
  const result = spawnSync(
    command,
    [...baseArgs, '-m', 'context_gate.cli', ...args],
    {
      cwd: packageRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        PYTHONPATH: process.env.PYTHONPATH
          ? `${srcPath}${path.delimiter}${process.env.PYTHONPATH}`
          : srcPath,
      },
    },
  );

  if (!result.error) {
    process.exit(result.status ?? 0);
  }

  lastError = result.error;
}

console.error(`Unable to launch context-gate CLI via Python: ${lastError?.message ?? 'unknown error'}`);
process.exit(1);

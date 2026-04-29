#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const socialAgent = require('@context-med/social-agent');

const DEFAULT_OUTPUT = path.resolve(__dirname, '..', 'out', 'demo', 'social-agent-demo.json');

function parseArgs(argv) {
  const options = {
    output: DEFAULT_OUTPUT,
    language: 'en'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--output' || arg === '-o') {
      options.output = path.resolve(argv[index + 1]);
      index += 1;
    } else if (arg === '--language' || arg === '-l') {
      options.language = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printHelp() {
  console.log([
    'Usage: node demo/comprehensive-demo.js [options]',
    '',
    'Options:',
    '  -o, --output <path>     Output JSON path',
    '  -l, --language <lang>   Demo language metadata',
    '  -h, --help              Show help'
  ].join('\n'));
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const payload = socialAgent.createSocialAgentDemo({ language: options.language });
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Built ${payload.package.name} demo payload at ${options.output}`);
  console.log(`Plan items: ${payload.plan.items.length}`);
  console.log(`Drafts: ${payload.drafts.drafts.length}`);
  console.log(`Moderation reports: ${payload.moderation.reports.length}`);
  console.log(`Review queue items: ${payload.review_queue.length}`);
}

main();

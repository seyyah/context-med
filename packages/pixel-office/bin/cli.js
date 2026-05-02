#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');
const { spawn } = require('child_process');
const path = require('path');

program
  .name('pixel-office')
  .description('3D Object-Centric Interaction Surface for Context-Med')
  .version(pkg.version);

program
  .command('serve')
  .description('Start local dev/preview server')
  .option('-p, --port <number>', 'Port to run on', '3000')
  .action((options) => {
    console.log(`Starting pixel-office server on port ${options.port}...`);
    const nextPath = path.resolve(__dirname, '../node_modules/.bin/next');
    // We use shell: true on Windows to ensure .cmd resolves properly
    const child = spawn(nextPath, ['dev', '-p', options.port], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    
    child.on('error', (err) => {
      console.error('Failed to start Next.js dev server:', err);
      process.exit(1);
    });
  });

program
  .command('build')
  .description('Build for production')
  .action(() => {
    console.log('Building pixel-office...');
    const nextPath = path.resolve(__dirname, '../node_modules/.bin/next');
    const child = spawn(nextPath, ['build'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });
    
    child.on('error', (err) => {
      console.error('Failed to build Next.js app:', err);
      process.exit(1);
    });
  });

program.parse(process.argv);

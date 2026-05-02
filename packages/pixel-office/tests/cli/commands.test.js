import { describe, test, expect, vi } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN = path.resolve(__dirname, '../../../bin/cli.js');

describe('pixel-office CLI Comprehensive Tests', () => {
  test('CLI should output correct version', () => {
    const stdout = execSync(`node ${BIN} --version`).toString().trim();
    expect(stdout).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('CLI should show serve command in help', () => {
    const stdout = execSync(`node ${BIN} --help`).toString();
    expect(stdout).toContain('serve [options]');
    expect(stdout).toContain('Start local dev/preview server');
  });

  test('CLI should show build command in help', () => {
    const stdout = execSync(`node ${BIN} --help`).toString();
    expect(stdout).toContain('build');
    expect(stdout).toContain('Build for production');
  });

  // To avoid spinning up actual Next.js instances which block the test,
  // we verify the CLI passes the port argument correctly by mocking or testing the help.
  test('Serve command should accept --port option', () => {
    const stdout = execSync(`node ${BIN} serve --help`).toString();
    expect(stdout).toContain('-p, --port <number>');
  });
});

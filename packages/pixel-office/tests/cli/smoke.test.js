import { describe, test, expect } from 'vitest';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN = path.resolve(__dirname, '../../../bin/cli.js');

describe('pixel-office CLI Smoke Tests', () => {
  test('--help displays usage information', () => {
    const stdout = execSync(`node ${BIN} --help`).toString();
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('serve');
    expect(stdout).toContain('build');
  });

  test('--version displays semver', () => {
    const stdout = execSync(`node ${BIN} --version`).toString();
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});

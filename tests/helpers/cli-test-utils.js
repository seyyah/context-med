/**
 * Shared CLI Test Utilities
 *
 * Usage in any package test:
 *   const { execCli, FIXTURES, setupOutputDir, teardownOutputDir } = require('../../../tests/helpers/cli-test-utils');
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Root paths
const ROOT_DIR = path.resolve(__dirname, '../../');
const FIXTURES = path.join(ROOT_DIR, 'fixtures');

/**
 * Execute a CLI command and return { stdout, stderr, exitCode }.
 * Never throws — captures exit code for assertion.
 */
function execCli(binPath, args = [], opts = {}) {
  const cwd = opts.cwd || ROOT_DIR;
  const timeout = opts.timeout || 30000;

  try {
    const stdout = execFileSync('node', [binPath, ...args], {
      cwd,
      timeout,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...opts.env },
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status || 1,
    };
  }
}

/**
 * Create a temporary output directory scoped to a test suite.
 * Returns the absolute path.
 */
function setupOutputDir(packageName, testName) {
  const dir = path.join(ROOT_DIR, 'tmp-test-output', packageName, testName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Remove the temporary output directory after tests.
 */
function teardownOutputDir(packageName) {
  const dir = path.join(ROOT_DIR, 'tmp-test-output', packageName);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Assert that a file exists at the given path.
 */
function expectFileExists(filePath) {
  expect(fs.existsSync(filePath)).toBe(true);
}

/**
 * Assert that a file exists and is valid JSON.
 * Returns parsed JSON for further assertions.
 */
function expectValidJson(filePath) {
  expectFileExists(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let parsed;
  expect(() => { parsed = JSON.parse(content); }).not.toThrow();
  return parsed;
}

/**
 * Assert that a file exists and is non-empty.
 */
function expectNonEmptyFile(filePath) {
  expectFileExists(filePath);
  const stat = fs.statSync(filePath);
  expect(stat.size).toBeGreaterThan(0);
}

/**
 * Get the bin path for a package CLI.
 */
function getBinPath(packageName) {
  return path.join(ROOT_DIR, 'packages', packageName, 'bin', 'cli.js');
}

/**
 * Assert CLI --help works (exit 0, prints usage text).
 */
function expectHelpWorks(binPath) {
  const result = execCli(binPath, ['--help']);
  expect(result.exitCode).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
  return result;
}

module.exports = {
  ROOT_DIR,
  FIXTURES,
  execCli,
  setupOutputDir,
  teardownOutputDir,
  expectFileExists,
  expectValidJson,
  expectNonEmptyFile,
  getBinPath,
  expectHelpWorks,
};

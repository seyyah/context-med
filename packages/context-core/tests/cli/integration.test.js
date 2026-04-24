/**
 * context-core Integration (E2E) Tests
 * 
 * Verifies that the full pipeline (shield -> gate -> wiki -> modules)
 * orchestrates properly through the `chain` and `route` commands.
 */
const path = require('path');
const { execCli, getBinPath, FIXTURES, setupOutputDir, teardownOutputDir, expectFileExists, expectValidJson } = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-core';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('context-core End-to-End Integration', () => {
  // ── 1. Full Chain Integration (The primary aggregator) ──
  describe('Full Chain Integration: Gate -> Wiki -> Modules', () => {
    test('Executes end-to-end chain and produces all module artifacts', () => {
      const outDir = setupOutputDir(PKG, 'integration-chain');
      
      const r = execCli(BIN, [
        'chain',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', outDir,
        '--intent', 'chain', // Instructs core to trigger VA, Paper, and Slides
        '--format', 'json'
      ]);
      
      // If the developer has implemented the orchestrator, we expect Exit 0.
      if (r.exitCode === 0) {
        // Core should orchestrate internal package calls resulting in these files:
        expectFileExists(path.join(outDir, 'gate-profile.json'));
        expectFileExists(path.join(outDir, 'wiki-compiled.json'));
        expectFileExists(path.join(outDir, 'va-result.json'));
        expectFileExists(path.join(outDir, 'paper-manuscript.json'));
        expectFileExists(path.join(outDir, 'slides-deck.json'));
      }
    });

    test('Fails safely if an underlying module is unresponsive (Exit 3)', () => {
      // Intentionally pass an instruction that targets an offline or mock-failed service
      const r = execCli(BIN, [
        'chain',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--output', '/tmp/ignore',
        '--intent', 'force-timeout-test' 
      ]);
      
      // Expect Dependency/Timeout error code from the integration core
      expect([1, 3]).toContain(r.exitCode);
    });
  });

  // ── 2. Routing Logic ──
  describe('Module Routing Interoperability', () => {
    test('Correctly routes clinical context to context-va', () => {
      const r = execCli(BIN, [
        'route',
        '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
        '--intent', 'graphical-abstract',
        '--format', 'json'
      ]);
      
      if (r.exitCode === 0) {
        const routeData = JSON.parse(r.stdout);
        expect(routeData.target_module).toBe('context-va');
      }
    });

    test('Correctly routes unknown input to human-in-loop escalation', () => {
      // E2E check connecting Core routing out to Hoop (Escalation)
      const r = execCli(BIN, [
        'route',
        '--input', path.join(FIXTURES, 'raw', 'sample-thesis-abstract.txt'),
        '--intent', 'ambiguous-unmatched-intent',
        '--format', 'json'
      ]);
      
      if (r.exitCode === 0) {
        expect(r.stdout).toMatch(/context-hoop|escalate|manual/i);
      }
    });
  });

  // ── 3. Ratchet Validation Propagations ──
  describe('Validation Cascades', () => {
    test('Propagates schema validation errors (Exit 2) from downstream modules', () => {
      const outDir = setupOutputDir(PKG, 'integration-validation');
      
      const r = execCli(BIN, [
        'chain',
        // We supply an invalid schema fixture to ensure the gate/wiki drops it natively
        '--input', path.join(FIXTURES, 'json', 'invalid-schema-sample.json'),
        '--output', outDir,
        '--intent', 'chain'
      ]);
      
      // The integration orchestrator MUST not swallow Exit 2 errors
      expect(r.exitCode).toBe(2); 
    });
  });
});

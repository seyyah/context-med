/**
 * jest.config.js for context-cert
 *
 * rootDir = monorepo root (../../ from packages/context-cert)
 * This allows the smoke tests to resolve '../../../tests/helpers/cli-test-utils'
 * correctly:
 *   packages/context-cert/tests/cli/smoke.test.js
 *     → __dirname = <rootDir>/packages/context-cert/tests/cli
 *     → ../../../  = <rootDir>/packages/
 *
 * We use moduleNameMapper to redirect the helper require to its real location.
 */
'use strict';

const path = require('path');

// Monorepo root is two levels up from packages/context-cert/
const MONO_ROOT = path.resolve(__dirname, '../..');

module.exports = {
  rootDir: MONO_ROOT,

  // Only run context-cert tests
  testMatch: ['**/packages/context-cert/tests/**/*.test.js'],

  // Map the relative helper path that smoke.test.js uses.
  // From packages/context-cert/tests/cli/smoke.test.js:
  //   require('../../../tests/helpers/cli-test-utils')
  // resolves (CJS __dirname) to:
  //   <MONO_ROOT>/packages/tests/helpers/cli-test-utils  ← doesn't exist
  // We redirect it to:
  //   <MONO_ROOT>/tests/helpers/cli-test-utils            ← correct location
  moduleNameMapper: {
    [String.raw`^\.\.[\\/]\.\.[\\/]\.\.[\\/]tests[\\/]helpers[\\/]cli-test-utils$`]:
      path.join(MONO_ROOT, 'tests', 'helpers', 'cli-test-utils'),
  },
};

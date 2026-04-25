const path = require('path');
const fs = require('fs');
const {
  execCli,
  getBinPath,
  setupOutputDir,
  teardownOutputDir,
} = require('../../../tests/helpers/cli-test-utils');

const PKG = 'context-wiki';
const BIN = getBinPath(PKG);

afterAll(() => teardownOutputDir(PKG));

describe('autoresearch — fixture', () => {
  test('sample-experiment.json exists and is valid JSON', () => {
    const fixturePath = path.join(__dirname, '../../../../fixtures/experiments/sample-experiment.json');
    expect(fs.existsSync(fixturePath)).toBe(true);
    const raw = fs.readFileSync(fixturePath, 'utf8');
    let parsed;
    expect(() => { parsed = JSON.parse(raw); }).not.toThrow();
    expect(parsed).toHaveProperty('id');
    expect(parsed).toHaveProperty('description');
    expect(parsed).toHaveProperty('query');
    expect(parsed).toHaveProperty('expected_keywords');
    expect(Array.isArray(parsed.expected_keywords)).toBe(true);
  });
});

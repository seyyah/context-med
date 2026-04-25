const { execSync } = require('child_process');
const path = require('path');

const CLI_PATH = path.resolve('./bin/cli.js');
const SAMPLE_JSON = path.resolve('./fixtures/json/manuscript-imrad-sample.json');

describe('Context-Slides CLI (Demo Tests)', () => {
  it('should display help and available commands', () => {
    try {
      execSync(`node ${CLI_PATH}`, { stdio: 'pipe' });
    } catch (error) {
      const output = error.stdout.toString() + error.stderr.toString();
      expect(output).toContain('Usage: context-slides');
      expect(output).toContain('generate');
      expect(output).toContain('convert');
    }
  });

  it('should run generate with dry-run on a valid file', () => {
    const output = execSync(`node ${CLI_PATH} generate -i ${SAMPLE_JSON} -o out.json --dry-run`).toString();
    expect(output).toContain('[Dry Run] Plan:');
    expect(output).toContain('manuscript-imrad-sample.json');
  });

  it('should fail with exit code 1 if input file is missing', () => {
    try {
      execSync(`node ${CLI_PATH} generate -i missing.json -o out.json`, { stdio: 'pipe' });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.status).toBe(1);
      expect(error.stderr.toString()).toContain('Error: Input file not found');
    }
  });
});

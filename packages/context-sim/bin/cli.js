#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const program = new Command();

program
  .name('context-sim')
  .description('CLI to compile and manage context-sim scenarios')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile a YAML scenario into a JSON contract')
  .requiredOption('-i, --input <path>', 'input YAML file')
  .requiredOption('-o, --output <path>', 'output JSON file')
  .option('-f, --format <type>', 'output format', 'json')
  .option('--dry-run', 'validate without writing output file')
  .action((options) => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error(`Error: Input file does not exist: ${options.input}`);
        process.exit(1);
      }

      const fileContents = fs.readFileSync(options.input, 'utf8');
      const data = yaml.load(fileContents);
      validateScenario(data);

      if (!options.dryRun) {
        // Create directory if it doesn't exist
        const outDir = path.dirname(options.output);
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(options.output, JSON.stringify(data, null, 2));
        console.log(`Compiled scenario saved to ${options.output}`);
      } else {
        console.log(`[DRY RUN] Would compile scenario to ${options.output}`);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Batch compile all YAML scenarios in a directory')
  .requiredOption('-i, --input <dir>', 'input directory containing YAML files')
  .requiredOption('-o, --output <dir>', 'output directory for JSON files')
  .action((options) => {
    try {
      if (!fs.existsSync(options.input)) {
        console.error(`Error: Input directory does not exist: ${options.input}`);
        process.exit(1);
      }

      const files = fs.readdirSync(options.input);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }

      for (const file of yamlFiles) {
        const inputPath = path.join(options.input, file);
        // Replace extension with .json
        const outputFilename = file.replace(/\.yaml$|\.yml$/, '.json');
        const outputPath = path.join(options.output, outputFilename);

        const fileContents = fs.readFileSync(inputPath, 'utf8');
        const data = yaml.load(fileContents);
        validateScenario(data);

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Compiled ${file} to ${outputPath}`);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });

const scenarioCmd = program.command('scenario')
  .description('Manage scenarios');

scenarioCmd.command('compile')
  .description('Compile a scenario from micro-wiki using an agent (Stub)')
  .requiredOption('--topic <name>', 'Clinical topic')
  .requiredOption('--wiki-path <dir>', 'Path to micro-wiki')
  .option('--difficulty <level>', 'Difficulty level (easy, intermediate, hard)', 'intermediate')
  .option('--language <lang>', 'Language', 'tr')
  .requiredOption('--output <path>', 'Output YAML file')
  .action((options) => {
    console.log(`[STUB] Compiling scenario for topic: ${options.topic}`);
    console.log(`[STUB] Reading from wiki: ${options.wikiPath}`);
    console.log(`[STUB] AI Scenario generation would run here...`);
    console.log(`[STUB] Draft scenario saved to: ${options.output}`);
  });

function validateScenario(data) {
  // Basic Schema Validation for IDEA.md compatibility
  const requiredKeys = ['scenario_id', 'diagnosis', 'patient_persona', 'presenting_complaint', 'hidden_clinical_data', 'disclosure_rules'];
  for (const key of requiredKeys) {
    if (!data[key]) {
      console.warn(`[Warning] Validation: Missing required key '${key}' in scenario contract.`);
    }
  }
}

const sessionCmd = program.command('session')
  .description('Manage runtime sessions');

sessionCmd.command('start')
  .description('Start an interactive simulation session')
  .requiredOption('--scenario <path>', 'Path to compiled scenario JSON')
  .option('--mode <mode>', 'Interaction mode (text, voice)', 'text')
  .option('--student-id <id>', 'Student identifier', 'demo-user')
  .action(async (options) => {
    try {
      if (!fs.existsSync(options.scenario)) {
        console.error(`Error: Scenario file not found: ${options.scenario}`);
        process.exit(1);
      }
      
      const fileContents = fs.readFileSync(options.scenario, 'utf8');
      const scenario = JSON.parse(fileContents);
      
      const { startTextSession } = require('../src/engine/session');
      await startTextSession(scenario, options.studentId);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

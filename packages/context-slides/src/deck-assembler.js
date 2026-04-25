/**
 * Mocks the behavior of the Agent Pipeline for the MVP Demo.
 * In a real scenario, these would be separate classes calling LLMs.
 */

class TitleSlideAgent {
  generate(inputData, config) {
    console.log('🤖 TitleSlideAgent: Synthesizing academic title and metadata...');
    return {
      type: 'title',
      content: {
        title: inputData.title || 'Clinical Research Presentation',
        authors: inputData.authors || ['Research Team'],
        date: new Date().toISOString().split('T')[0]
      }
    };
  }
}

class ResultsSlideAgent {
  generate(inputData, config) {
    console.log('🤖 ResultsSlideAgent: Extracting P-values and generating chart contexts...');
    
    // Use the instructor's IMRAD schema if it exists
    let keyFindings = ['Significant improvement observed'];
    if (inputData.imrad && inputData.imrad.results && inputData.imrad.results.primary_outcome) {
      const outcome = inputData.imrad.results.primary_outcome;
      keyFindings = outcome.by_group.map(g => `${g.group}: ${g.rate_pct}% event rate`);
    }

    return {
      type: 'results',
      content: {
        heading: 'Key Findings',
        points: keyFindings,
        chartType: 'bar'
      }
    };
  }
}

class SpeakerNotesAgent {
  generate(slidePlan, config) {
    console.log('🤖 SpeakerNotesAgent: Compiling narrative script based on slide plan...');
    return slidePlan.map((slide, index) => ({
      slideIndex: index + 1,
      notes: `(Pause for 2 seconds) This slide discusses ${slide.type}. Ensure to mention the key metric...`
    }));
  }
}

/**
 * Deck Assembler orchestrates the agents and builds the final JSON plan.
 */
class DeckAssembler {
  constructor() {
    this.titleAgent = new TitleSlideAgent();
    this.resultsAgent = new ResultsSlideAgent();
    this.speakerNotesAgent = new SpeakerNotesAgent();
  }

  compile(inputData, config) {
    console.log(`\n--- Starting Compilation ---`);
    console.log(`Config: ${config.duration_min} minutes, Target Audience: ${config.target_audience}`);
    
    const slidePlan = [];
    
    // Step 1: Run Agents
    slidePlan.push(this.titleAgent.generate(inputData, config));
    slidePlan.push(this.resultsAgent.generate(inputData, config));
    
    // Step 2: Generate Speaker Notes based on the generated slides
    const speakerNotes = this.speakerNotesAgent.generate(slidePlan, config);

    console.log(`--- Compilation Complete ---\n`);

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        configUsed: config
      },
      slides: slidePlan,
      speakerNotes: speakerNotes
    };
  }
}

module.exports = { DeckAssembler };

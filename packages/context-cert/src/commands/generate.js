'use strict';
/**
 * context-cert generate command
 *
 * Parses source documents and extracts MCQ / short-answer questions.
 *
 * INVARIANT: Every question must include a source_quote that is verbatim
 * text from the source document. No information is fabricated.
 */

const path = require('path');
const { readInputFiles, validateDifficulty, validateFormat, makeLogger, writeOutput } = require('../index');

// ─── Question extraction ──────────────────────────────────────────────────────

/**
 * Split markdown / plain text into meaningful "fact sentences".
 * Returns an array of { text, source_quote } objects.
 *
 * Strategy:
 *  - Split on line breaks and list markers.
 *  - Filter out headings, blank lines, and source-attribution lines.
 *  - Each surviving line IS the source_quote (verbatim extraction).
 */
function extractFacts(content) {
  const lines = content.split(/\r?\n/);
  const facts = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // Skip heading markers, table separators, and pure-dashes/dots
    if (/^#{1,6}\s/.test(line)) continue;
    if (/^\|[-|:\s]+\|$/.test(line)) continue;
    if (/^[-]{3,}$/.test(line)) continue;
    // Skip short attribution labels like "**Source:**"
    if (/^\*{0,2}Source:/.test(line)) continue;
    // Keep bullet/list content (strip the marker)
    const clean = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
    if (clean.length < 20) continue; // too short to make a question
    facts.push({ text: clean, source_quote: clean });
  }

  return facts;
}

/**
 * Turn a fact into an MCQ question.
 * Deterministic: uses fact index + difficulty as seed for option ordering.
 *
 * @param {object} fact        - { text, source_quote }
 * @param {number} index       - Position in fact list (for stable IDs)
 * @param {string} difficulty  - easy | medium | hard
 * @param {string} language    - en | tr
 * @returns {object} question
 */
function factToQuestion(fact, index, difficulty, language) {
  const { text, source_quote } = fact;

  // Extract a key term from the sentence to form a fill-in or MCQ.
  // We look for bold-marked terms first (**term**), then capitalized phrases.
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  const keyTerm = boldMatch ? boldMatch[1] : extractKeyTerm(text);

  // Stem: replace the key term with a blank or ask directly.
  let stem;
  if (difficulty === 'easy') {
    stem = language === 'tr'
      ? `Aşağıdakilerden hangisi "${keyTerm}" ile ilgili doğru ifadedir?`
      : `Which of the following is true about "${keyTerm}"?`;
  } else if (difficulty === 'medium') {
    stem = language === 'tr'
      ? text.replace(keyTerm, '___').replace(/\*\*/g, '')
      : text.replace(keyTerm, '___').replace(/\*\*/g, '');
    if (!stem.includes('___')) {
      stem = language === 'tr'
        ? `"${keyTerm}" ile ilgili hangisi doğrudur?`
        : `Regarding "${keyTerm}", which statement is correct?`;
    }
  } else {
    // hard: ask about clinical implication
    stem = language === 'tr'
      ? `Aşağıdaki metne göre, ${keyTerm.toLowerCase()} için klinik önemi nedir?`
      : `Based on the following, what is the clinical implication of ${keyTerm.toLowerCase()}?`;
  }

  // Correct answer = key term or the core fact
  const correctAnswer = keyTerm || text.substring(0, 60);

  // Distractor pool — generic plausible-sounding alternatives
  const distractors = getDistractors(keyTerm, difficulty);

  // Stable shuffle using index as seed
  const options = deterministicShuffle([correctAnswer, ...distractors], index);

  return {
    id: `q${index + 1}`,
    type: 'mcq',
    difficulty,
    stem: stem.replace(/\*\*/g, ''),
    options,
    answer: correctAnswer,
    source_quote,
    explanation: `${text.replace(/\*\*/g, '')}`,
  };
}

/**
 * Extract a meaningful key term from plain text.
 * Prefers noun phrases in title case or after "is/are".
 */
function extractKeyTerm(text) {
  // After "is" or "are" (e.g. "AF is the most common …")
  const isMatch = text.match(/(?:is|are)\s+(?:the\s+)?([A-Z][^,.(;]{3,40})/);
  if (isMatch) return isMatch[1].trim();
  // First capitalized run
  const capMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Za-z]+){0,3})/);
  if (capMatch) return capMatch[1].trim();
  // Fallback: first 40 chars
  return text.substring(0, 40);
}

/**
 * Return plausible but incorrect distractors based on the key term.
 * Deterministic — no randomness.
 */
function getDistractors(keyTerm, difficulty) {
  const genericDistractors = [
    ['GRACE score', 'TIMI score', 'HEART score'],
    ['Aspirin monotherapy', 'Beta-blocker', 'Calcium channel blocker'],
    ['Warfarin only', 'Aspirin + Clopidogrel', 'No treatment required'],
    ['Systolic dysfunction', 'Diastolic dysfunction', 'Conduction delay'],
    ['Low sensitivity', 'High false-positive rate', 'Not validated in clinical trials'],
  ];

  const idx = Math.abs(keyTerm.charCodeAt(0) + keyTerm.length) % genericDistractors.length;
  let pool = genericDistractors[idx].filter((d) => d !== keyTerm);

  if (difficulty === 'hard') {
    pool = pool.map((d) => `${d} (as an alternative)`);
  }

  return pool.slice(0, 3);
}

/**
 * Deterministic Fisher-Yates shuffle using a numeric seed.
 */
function deterministicShuffle(arr, seed) {
  const a = [...arr];
  let s = seed + 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Format output ────────────────────────────────────────────────────────────

function buildQuizJson(questions, inputPath, difficulty) {
  return JSON.stringify(
    {
      quiz: {
        source: inputPath,
        generated_at: new Date().toISOString(),
        difficulty,
        questions,
      },
    },
    null,
    2
  );
}

function buildQuizMarkdown(questions, inputPath, difficulty) {
  const lines = [
    `# Quiz — ${path.basename(inputPath)}`,
    ``,
    `**Difficulty:** ${difficulty}  `,
    `**Generated:** ${new Date().toISOString()}`,
    ``,
  ];

  for (const q of questions) {
    lines.push(`## ${q.id}. ${q.stem}`);
    lines.push('');
    q.options.forEach((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      lines.push(`- ${letter}) ${opt}`);
    });
    lines.push('');
    lines.push(`**Answer:** ${q.answer}`);
    lines.push('');
    lines.push(`> *Source quote:* "${q.source_quote}"`);
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Command handler ──────────────────────────────────────────────────────────

module.exports = function generate(opts) {
  const log = makeLogger(opts);

  // Validate options
  try {
    validateDifficulty(opts.difficulty);
    validateFormat(opts.format);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const count = parseInt(opts.count, 10);
  if (isNaN(count) || count < 1) {
    console.error('--count must be a positive integer');
    process.exit(1);
  }

  // Read input
  let files;
  try {
    files = readInputFiles(opts.input);
  } catch (err) {
    console.error(`Input error: ${err.message}`);
    process.exit(1);
  }

  log.info(`Processing ${files.length} file(s)…`);

  // Extract facts from all files
  const allFacts = [];
  for (const { filePath, content } of files) {
    log.verbose(`Extracting facts from: ${filePath}`);
    const facts = extractFacts(content);
    log.verbose(`  → ${facts.length} facts found`);
    allFacts.push(...facts);
  }

  if (allFacts.length === 0) {
    console.error('No extractable facts found in input. Check your source files.');
    process.exit(2);
  }

  // Select facts (deterministic — take first N evenly distributed)
  const step = Math.max(1, Math.floor(allFacts.length / count));
  const selectedFacts = [];
  for (let i = 0; i < allFacts.length && selectedFacts.length < count; i += step) {
    selectedFacts.push(allFacts[i]);
  }

  log.verbose(`Selected ${selectedFacts.length} facts for question generation`);

  // Generate questions
  const questions = selectedFacts.map((fact, idx) =>
    factToQuestion(fact, idx, opts.difficulty, opts.language)
  );

  log.info(`Generated ${questions.length} question(s)`);

  // Format output
  let content;
  if (opts.format === 'md') {
    content = buildQuizMarkdown(questions, opts.input, opts.difficulty);
  } else {
    content = buildQuizJson(questions, opts.input, opts.difficulty);
  }

  // Write
  writeOutput(opts.output, content, opts.dryRun, log);

  process.exit(0);
};

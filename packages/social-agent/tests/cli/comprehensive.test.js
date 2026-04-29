/**
 * social-agent CLI Comprehensive Tests
 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
const CLI = path.join(PKG_ROOT, 'bin', 'cli.js');
const DEMO_SCRIPT = path.join(PKG_ROOT, 'demo', 'comprehensive-demo.js');
const FIXTURES = path.join(REPO_ROOT, 'fixtures');
const { runWorkspacePipeline, _test: workspacePipelineTest } = require('../../src/workflow/workspace-pipeline');

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd: PKG_ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    timeout: options.timeout || 30000
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'social-agent-cli-'));
}

function writeTempFile(dir, name, content) {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function requestText(url, options = 'GET') {
  const requestOptions = typeof options === 'string' ? { method: options } : options;
  return new Promise((resolve, reject) => {
    const request = http.request(url, {
      method: requestOptions.method || 'GET',
      headers: requestOptions.headers || {}
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({ statusCode: response.statusCode, body });
      });
    });

    request.on('error', reject);
    if (requestOptions.body) {
      request.write(requestOptions.body);
    }
    request.end();
  });
}

async function waitForServer(url) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await requestText(url);
      if (response.statusCode === 200) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw lastError || new Error(`Server did not respond at ${url}`);
}

describe('social-agent CLI comprehensive behavior', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('plan writes a stable social calendar schema', () => {
    const output = path.join(tempDir, 'plan.json');
    const result = runCli([
      'plan',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'social_calendar',
      schema_version: 'social-agent.v1',
      platforms: ['linkedin', 'x'],
      approval_required: true
    });
    expect(payload.items.length).toBeGreaterThanOrEqual(4);
    expect(payload.items.map((item) => item.platform)).toEqual(expect.arrayContaining(['linkedin', 'x']));
    payload.items.forEach((item) => {
      expect(item.source_quote).toEqual(expect.any(String));
      expect(item.source_quote.length).toBeGreaterThan(10);
      expect(typeof item.approval_required).toBe('boolean');
    });
  });

  test('plan --dry-run prints JSON and does not write output', () => {
    const output = path.join(tempDir, 'dry-plan.json');
    const result = runCli([
      'plan',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output,
      '--dry-run'
    ]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(output)).toBe(false);
    const payload = JSON.parse(result.stdout);
    expect(payload.type).toBe('social_calendar');
  });

  test('draft creates platform-specific variants', () => {
    const output = path.join(tempDir, 'draft.json');
    const result = runCli([
      'draft',
      '--input', path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md'),
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'social_draft_package',
      schema_version: 'social-agent.v1'
    });

    const linkedIn = payload.drafts.find((draft) => draft.platform === 'linkedin');
    const x = payload.drafts.find((draft) => draft.platform === 'x');
    expect(linkedIn).toBeTruthy();
    expect(x).toBeTruthy();
    expect(linkedIn.body).not.toBe(x.body);
    expect(linkedIn.body.length).toBeGreaterThan(x.body.length);
    expect(linkedIn.body).toMatch(/should not read like another product announcement/i);
    expect(linkedIn.body).toMatch(/review/i);
    expect(linkedIn.body).toMatch(/- turn source material into platform-ready copy/);
    expect(linkedIn.body).toMatch(/Which review step creates the most friction/i);
    expect(linkedIn.body).toMatch(/#\w+/);
    expect(linkedIn.body).not.toMatch(/LinkedIn version|Source basis|should explain|generic announcement|excited to announce/i);
    expect(x.body).toMatch(/\?/);
    expect(x.body).toMatch(/#\w+/);
    expect(x.body).not.toMatch(/LinkedIn|Source basis|paragraph/i);
    expect(linkedIn.hashtags.length).toBeGreaterThan(0);
    expect(linkedIn.hashtag_policy).toMatchObject({
      required: false,
      max: 3,
      placement: 'final_line'
    });
    expect(x.hashtags.length).toBeGreaterThan(0);
    expect(x.hashtag_policy).toMatchObject({
      required: false,
      max: 2,
      placement: 'inline_end'
    });
    expect(linkedIn.adaptation).toMatchObject({
      strategy: 'professional_narrative'
    });
    expect(x.adaptation).toMatchObject({
      strategy: 'concise_conversation_starter',
      length_target: 'single post under 280 characters'
    });
    expect(linkedIn.adaptation.rewrite_reason).toMatch(/LinkedIn/i);
    expect(x.adaptation.rewrite_reason).toMatch(/X/i);
    expect(linkedIn.adaptation.strategy).not.toBe(x.adaptation.strategy);
    expect(x.body.length).toBeLessThanOrEqual(280);
    expect(linkedIn.source_quote.length).toBeGreaterThan(10);
    expect(x.source_quote.length).toBeGreaterThan(10);
  });

  test('moderate escalates high-risk comments', () => {
    const input = writeTempFile(tempDir, 'crisis.txt', 'This looks like a crisis involving patient privacy and a breach. Can you respond publicly?');
    const output = path.join(tempDir, 'moderation.json');
    const result = runCli([
      'moderate',
      '--input', input,
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      type: 'moderation_report',
      schema_version: 'social-agent.v1',
      risk_level: 'high',
      recommended_action: 'escalate',
      approval_required: true
    });
    expect(payload.reply_draft).toMatch(/routing/i);
  });

  test('moderate ignores clear spam without a reply draft', () => {
    const input = writeTempFile(tempDir, 'spam.txt', 'spam');
    const output = path.join(tempDir, 'spam-report.json');
    const result = runCli([
      'moderate',
      '--input', input,
      '--output', output
    ]);

    expect(result.status).toBe(0);
    const payload = readJson(output);
    expect(payload).toMatchObject({
      classification: 'spam',
      risk_level: 'low',
      recommended_action: 'ignore',
      approval_required: false,
      reply_draft: ''
    });
  });

  test('rejects unsupported format and language', () => {
    const input = path.join(FIXTURES, 'wiki', 'cardiovascular', 'atrial-fibrillation.md');

    const badFormat = runCli([
      'plan',
      '--input', input,
      '--output', path.join(tempDir, 'bad-format.xml'),
      '--format', 'xml'
    ]);
    expect(badFormat.status).toBe(1);
    expect(badFormat.stderr).toMatch(/unsupported format/i);

    const badLanguage = runCli([
      'plan',
      '--input', input,
      '--output', path.join(tempDir, 'bad-language.json'),
      '--language', 'de'
    ]);
    expect(badLanguage.status).toBe(1);
    expect(badLanguage.stderr).toMatch(/unsupported language/i);
  });

  test('rejects nonexistent and empty input files', () => {
    const missing = runCli([
      'plan',
      '--input', path.join(tempDir, 'missing.md'),
      '--output', path.join(tempDir, 'missing.json')
    ]);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/not found/i);

    const emptyInput = writeTempFile(tempDir, 'empty.md', '   \n');
    const empty = runCli([
      'plan',
      '--input', emptyInput,
      '--output', path.join(tempDir, 'empty.json')
    ]);
    expect(empty.status).toBe(2);
    expect(empty.stderr).toMatch(/empty/i);
  });

  test('package API creates a comprehensive demo payload', () => {
    const socialAgent = require('@context-med/social-agent');
    const payload = socialAgent.createSocialAgentDemo();

    expect(payload).toMatchObject({
      type: 'social_agent_demo',
      schema_version: 'social-agent.v1',
      package: {
        name: '@context-med/social-agent'
      }
    });
    expect(payload.plan.items.length).toBeGreaterThanOrEqual(4);
    expect(payload.drafts.drafts.length).toBeGreaterThanOrEqual(2);
    expect(payload.moderation.reports.length).toBeGreaterThanOrEqual(4);
    expect(payload.review_queue.length).toBeGreaterThan(0);
    expect(payload.review_queue.filter((item) => item.source === 'draft')[0].current_copy).toEqual(expect.any(String));
    expect(payload.settings).toMatchObject({
      deterministic_mode: true,
      llm_api_calls: false,
      generation_provider: 'local',
      direct_publishing: false
    });
    expect(payload.generation).toMatchObject({
      mode: 'deterministic',
      provider: 'local',
      status: 'fallback',
      llm_api_calls: false
    });
    expect(payload.source.text).toMatch(/Context-Med social launch briefing/);
    expect(payload.source.comments.length).toBeGreaterThanOrEqual(4);
  });

  test('package API supports async demo payload generation with deterministic fallback', async () => {
    const socialAgent = require('@context-med/social-agent');
    const payload = await socialAgent.createSocialAgentDemoPayload({
      mode: 'deterministic',
      source: '# Async Demo Brief\n\nReview-gated social workflow for care operations.',
      comments: ['How is this reviewed before posting?']
    });

    expect(payload.summary.topic).toBe('Async Demo Brief');
    expect(payload.generation).toMatchObject({
      mode: 'deterministic',
      status: 'fallback',
      llm_api_calls: false
    });
    expect(payload.settings.llm_api_calls).toBe(false);
    expect(payload.review_queue.length).toBeGreaterThan(0);
  });

  test('package API maps Gemini structured output into the demo payload', async () => {
    const socialAgent = require('@context-med/social-agent');
    const previousKey = process.env.GEMINI_API_KEY;
    const previousMode = process.env.SOCIAL_AGENT_LLM_MODE;
    const previousFetch = global.fetch;

    process.env.GEMINI_API_KEY = 'test-key';
    delete process.env.SOCIAL_AGENT_LLM_MODE;
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    topic: 'Gemini Workspace Launch',
                    summary: 'A Gemini generated social operations package with review gates.',
                    content_pillar: 'product',
                    risk_level: 'medium',
                    plan_items: [
                      {
                        platform: 'linkedin',
                        suggested_day: 'monday',
                        topic: 'Gemini launch workflow',
                        format: 'professional post',
                        cta: 'Invite operations teams to review the workflow.',
                        content_pillar: 'product',
                        risk_level: 'medium',
                        status: 'needs_review',
                        source_quote: 'Review-gated social workflow for care operations.'
                      },
                      {
                        platform: 'x',
                        suggested_day: 'tuesday',
                        topic: 'Review gates before publishing',
                        format: 'short post',
                        cta: 'Ask one operational review question.',
                        content_pillar: 'community',
                        risk_level: 'low',
                        status: 'draft',
                        source_quote: 'Review-gated social workflow for care operations.'
                      }
                    ],
                    drafts: [
                      {
                        platform: 'linkedin',
                        hook: 'Revolutionizing patient intake: Our new dashboard is here to empower care coordination teams.',
                        body: 'At Context-Med, we understand the complexities of patient intake. This new dashboard is designed to empower care coordination teams with unparalleled operational visibility faster than ever.',
                        cta: 'What would your team review first?',
                        risk_level: 'medium',
                        status: 'needs_review',
                        source_quote: 'Review-gated social workflow for care operations.',
                        hashtags: ['#CareOperations', '#HealthTech', '#PatientSafety'],
                        hashtag_policy: {
                          required: false,
                          max: 3,
                          placement: 'final_line',
                          reason: 'Use a focused set of discovery hashtags after the post body.'
                        },
                        adaptation: {
                          strategy: 'professional_narrative',
                          tone: 'clear, accountable, operational',
                          length_target: '2-3 short paragraphs',
                          rewrite_reason: 'LinkedIn needs the operational implication and review boundary.',
                          platform_constraints: ['professional takeaway', 'review boundary']
                        }
                      },
                      {
                        platform: 'x',
                        hook: 'Big news for care teams!',
                        body: 'Big news for care teams! Context-Med has launched a revolutionary dashboard designed to empower everyone with faster routing.',
                        cta: 'Review first.',
                        risk_level: 'low',
                        status: 'draft',
                        source_quote: 'Review-gated social workflow for care operations.',
                        hashtags: ['#CareOps', '#PatientSafety'],
                        hashtag_policy: {
                          required: false,
                          max: 2,
                          placement: 'inline_end',
                          reason: 'Use at most two hashtags while staying under X length constraints.'
                        },
                        adaptation: {
                          strategy: 'concise_conversation_starter',
                          tone: 'direct, specific, low-jargon',
                          length_target: 'single post under 240 characters',
                          rewrite_reason: 'X needs a compressed prompt instead of a LinkedIn-style explanation.',
                          platform_constraints: ['one idea only', 'focused question']
                        }
                      }
                    ],
                    moderation_reports: [
                      {
                        classification: 'question',
                        risk_level: 'medium',
                        recommended_action: 'reply',
                        reply_draft: 'Thanks for the question. We would route this through review before posting.',
                        source_quote: 'How is this reviewed before posting?'
                      }
                    ]
                  })
                }
              ]
            }
          }
        ]
      }))
    }));

    try {
      const payload = await socialAgent.createSocialAgentDemoPayload({
        source: '# Gemini Demo Brief\n\nReview-gated social workflow for care operations.',
        comments: ['How is this reviewed before posting?']
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch.mock.calls[0][1].headers['x-goog-api-key']).toBe('test-key');
      expect(payload.generation).toMatchObject({
        mode: 'gemini',
        provider: 'google-gemini',
        status: 'live',
        llm_api_calls: true
      });
      expect(payload.settings.llm_api_calls).toBe(true);
      expect(payload.summary.topic).toBe('Gemini Workspace Launch');
      expect(payload.summary.generated_summary).toMatch(/Gemini generated/);
      expect(payload.plan.items[0].topic).toBe('Gemini launch workflow');
      const planSlots = new Set();
      payload.plan.items.forEach((item) => {
        const slot = `${item.platform}:${item.suggested_day}`;
        expect(planSlots.has(slot)).toBe(false);
        planSlots.add(slot);
      });
      expect(payload.drafts.drafts[0].body).toMatch(/should not read like another product announcement/);
      expect(payload.drafts.drafts[0].body).not.toMatch(/Revolutionizing|empower|unparalleled|faster than ever/i);
      expect(payload.drafts.drafts[0].quality_flags).toContain('generic_launch_language_repaired');
      expect(payload.drafts.drafts[0].adaptation.strategy).toBe('professional_narrative');
      expect(payload.drafts.drafts[0].hashtags.length).toBeGreaterThan(0);
      expect(payload.drafts.drafts[0].body).toMatch(/#\w+/);
      expect(payload.drafts.drafts[1].body).toMatch(/\?/);
      expect(payload.drafts.drafts[1].body).not.toMatch(/Big news|revolutionary|empower/i);
      expect(payload.drafts.drafts[1].quality_flags).toContain('generic_launch_language_repaired');
      expect(payload.drafts.drafts[1].adaptation.strategy).toBe('concise_conversation_starter');
      expect(payload.drafts.drafts[1].hashtags.length).toBeGreaterThan(0);
      expect(payload.drafts.drafts[1].body).toMatch(/#\w+/);
      expect(payload.drafts.drafts[1].body.length).toBeLessThanOrEqual(280);
      expect(payload.moderation.reports[0].recommended_action).toBe('reply');
      expect(payload.review_queue.length).toBeGreaterThan(0);
    } finally {
      if (previousKey == null) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = previousKey;
      }

      if (previousMode == null) {
        delete process.env.SOCIAL_AGENT_LLM_MODE;
      } else {
        process.env.SOCIAL_AGENT_LLM_MODE = previousMode;
      }

      global.fetch = previousFetch;
    }
  });

  test('demo builder script writes package-generated JSON', () => {
    const output = path.join(tempDir, 'social-agent-demo.json');
    const result = spawnSync(process.execPath, [DEMO_SCRIPT, '--output', output], {
      cwd: PKG_ROOT,
      encoding: 'utf8',
      timeout: 30000
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/@context-med\/social-agent/);
    const payload = readJson(output);
    expect(payload.type).toBe('social_agent_demo');
    expect(payload.packages[0]).toMatchObject({
      format: 'json',
      status: 'ready'
    });
  });

  test('workspace pipeline falls back to mock when a live provider has no API key', async () => {
    const previousGeminiKey = process.env.GEMINI_API_KEY;
    const previousGoogleKey = process.env.GOOGLE_API_KEY;

    process.env.GEMINI_API_KEY = '';
    process.env.GOOGLE_API_KEY = '';

    try {
      const run = await runWorkspacePipeline({
        provider: 'gemini',
        sourceText: '# Provider fallback\n\nCare teams need source-backed social copy with review gates.',
        platforms: ['linkedin', 'x']
      });

      expect(run.generation).toMatchObject({
        provider: 'mock',
        requested_provider: 'gemini',
        fallback_reason: 'missing_api_key',
        live_api_calls_enabled: false
      });
      expect(run.adaptations.length).toBe(2);
      expect(run.planSeeds.length).toBeGreaterThanOrEqual(2);
      expect(run.reviewItems.length).toBeGreaterThanOrEqual(1);
    } finally {
      if (previousGeminiKey == null) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = previousGeminiKey;
      }

      if (previousGoogleKey == null) {
        delete process.env.GOOGLE_API_KEY;
      } else {
        process.env.GOOGLE_API_KEY = previousGoogleKey;
      }
    }
  });

  test('workspace pipeline parser accepts fenced provider JSON', () => {
    const parsed = workspacePipelineTest.parseProviderJson([
      '```json',
      '{"topic":"Parsed Provider Output","adaptations":[]}',
      '```'
    ].join('\n'));

    expect(parsed).toMatchObject({
      topic: 'Parsed Provider Output',
      adaptations: []
    });
    expect(workspacePipelineTest.parseProviderJson('not json')).toBeNull();
  });

  test('workspace pipeline validator normalizes provider output and filters unsupported platforms', () => {
    const source = '# Intake workflow\n\nCare teams need source-backed intake routing with human review.';
    const platforms = ['linkedin'];
    const metadata = {
      provider: 'gemini',
      requested_provider: 'gemini',
      label: 'Gemini',
      model: 'gemini-test',
      status: 'ready',
      fallback_reason: '',
      requires_api_key: true,
      api_key_configured: true,
      live_api_calls_enabled: true
    };
    const fallback = workspacePipelineTest.buildDeterministicRun(source, platforms, metadata);
    const normalized = workspacePipelineTest.normalizeProviderRun({
      topic: 'AI generated intake plan',
      sourcePreview: 'AI output for care coordination.',
      adaptations: [
        {
          tone: 'linkedin',
          risk: 'High Risk',
          status: 'Needs Review',
          hook: 'Care teams need routing clarity.',
          body: ['Keep human review visible.'],
          cta: 'What needs review?',
          hashtags: '#CareOps',
          adaptationDetails: [['Boundary', 'No clinical claims.']]
        }
      ],
      planSeeds: [
        {
          id: 'bad-instagram-slot',
          day: 'Friday',
          platform: 'Instagram',
          contentPillar: 'Visual',
          messageFocus: 'Unsupported platform should be ignored.',
          cta: 'Ignore',
          risk: 'Low Risk',
          status: 'Draft'
        },
        {
          id: 'linkedin-slot',
          day: 'Monday',
          platform: 'LinkedIn',
          contentPillar: 'Human Review',
          messageFocus: 'Explain the human review gate.',
          cta: 'What would you review?',
          risk: 'High Risk',
          status: 'Needs Review'
        }
      ],
      draftSeeds: [
        {
          id: 'draft-linkedin',
          planId: 'linkedin-slot',
          platform: 'LinkedIn',
          title: 'Review-ready LinkedIn draft',
          copyPreview: 'Keep review visible.',
          cta: 'What would you review?',
          risk: 'High Risk',
          status: 'Needs Review'
        }
      ],
      reviewItems: [
        {
          id: 'review-linkedin',
          source: 'draft',
          label: 'Review required.',
          platform: 'LinkedIn',
          risk: 'High Risk',
          action: 'Review',
          status: 'Needs Review'
        }
      ]
    }, fallback, source, platforms, metadata);

    expect(normalized).toMatchObject({
      topic: 'AI generated intake plan',
      generation: {
        provider: 'gemini',
        status: 'live',
        validation: 'schema_normalized',
        fallback_used: false
      }
    });
    expect(normalized.adaptations).toHaveLength(1);
    expect(normalized.planSeeds).toHaveLength(1);
    expect(normalized.planSeeds[0]).toMatchObject({
      platform: 'LinkedIn',
      contentPillar: 'Human Review',
      status: 'Needs Review'
    });
    expect(normalized.draftSeeds[0].planId).toBe('linkedin-slot');
    expect(normalized.reviewItems[0].platform).toBe('LinkedIn');
  });

  test('serve exposes API endpoints and React fallback routes', async () => {
    const port = 3300 + Math.floor(Math.random() * 300);
    const child = spawn(process.execPath, [CLI, 'serve', '--port', String(port), '--quiet'], {
      cwd: PKG_ROOT,
      env: {
        ...process.env,
        GEMINI_API_KEY: '',
        GOOGLE_API_KEY: '',
        SOCIAL_AGENT_LLM_MODE: 'deterministic',
        SOCIAL_AGENT_DB_PATH: path.join(tempDir, 'workflow.sqlite')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    try {
      const overview = await waitForServer(`http://127.0.0.1:${port}/`);
      expect(overview.body).toMatch(/social-agent API server|Social-Agent Standalone UI|<div id="root">/i);

      const emptyWorkflowSnapshot = await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`);
      expect(emptyWorkflowSnapshot.statusCode).toBe(200);
      expect(JSON.parse(emptyWorkflowSnapshot.body).snapshot.contentPlans).toEqual([]);

      const providerStatus = await requestText(`http://127.0.0.1:${port}/api/provider-status`);
      const providerPayload = JSON.parse(providerStatus.body);
      expect(providerStatus.statusCode).toBe(200);
      expect(providerPayload.provider).toMatchObject({
        provider: 'mock',
        live_api_calls_enabled: false
      });
      expect(providerPayload.storage.backend).toBe('sqlite');
      expect(providerPayload.workflow_counts.workspaceRuns).toBe(0);

      const plan = await requestText(`http://127.0.0.1:${port}/plan`);
      expect(plan.statusCode).toBe(200);
      expect(plan.body).toMatch(/social-agent API server|Social-Agent Standalone UI|<div id="root">/i);

      const drafts = await requestText(`http://127.0.0.1:${port}/drafts`);
      expect(drafts.statusCode).toBe(200);
      expect(drafts.body).toMatch(/social-agent API server|Social-Agent Standalone UI|<div id="root">/i);

      const demoApi = await requestText(`http://127.0.0.1:${port}/api/demo`);
      expect(demoApi.statusCode).toBe(200);
      expect(JSON.parse(demoApi.body)).toMatchObject({
        type: 'social_agent_demo',
        package: {
          name: '@context-med/social-agent'
        },
        generation: {
          status: 'fallback',
          llm_api_calls: false
        }
      });

      const customDemo = await requestText(`http://127.0.0.1:${port}/api/demo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          source: '# Custom Social Briefing\n\nA launch update with review gates and community response planning.',
          comments: ['Can this be published?', 'This looks like a privacy breach crisis.'],
          language: 'en'
        })
      });
      const customPayload = JSON.parse(customDemo.body);
      expect(customDemo.statusCode).toBe(200);
      expect(customPayload.summary.topic).toBe('Custom Social Briefing');
      expect(customPayload.moderation.reports.length).toBe(2);

      const persistedCustomDemo = await requestText(`http://127.0.0.1:${port}/api/demo`);
      expect(persistedCustomDemo.statusCode).toBe(200);
      expect(JSON.parse(persistedCustomDemo.body).summary.topic).toBe('Custom Social Briefing');

      const resetDemo = await requestText(`http://127.0.0.1:${port}/api/demo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });
      expect(resetDemo.statusCode).toBe(200);
      expect(JSON.parse(resetDemo.body).summary.topic).toBe('Context-Med social launch briefing');

      const workspaceRun = await requestText(`http://127.0.0.1:${port}/api/workspace-runs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceText: '# Patient intake dashboard update\n\nCare teams need faster intake routing with human review gates.',
          platforms: ['linkedin', 'x']
        })
      });
      const workspacePayload = JSON.parse(workspaceRun.body);
      expect(workspaceRun.statusCode).toBe(200);
      expect(workspacePayload.run).toMatchObject({
        type: 'workspace_run',
        schema_version: 'social-agent.workspace.v1'
      });
      expect(workspacePayload.run.adaptations.length).toBe(2);
      expect(workspacePayload.run.planSeeds.length).toBeGreaterThanOrEqual(2);
      expect(workspacePayload.run.draftSeeds.length).toBeGreaterThanOrEqual(2);
      expect(workspacePayload.run.reviewItems.length).toBeGreaterThanOrEqual(1);
      expect(workspacePayload.run.generation.provider).toBe('mock');

      const latestWorkspaceRun = await requestText(`http://127.0.0.1:${port}/api/workspace-runs/latest`);
      expect(latestWorkspaceRun.statusCode).toBe(200);
      expect(JSON.parse(latestWorkspaceRun.body).item.payload.id).toBe(workspacePayload.run.id);

      const workflowSnapshot = await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`);
      const snapshotPayload = JSON.parse(workflowSnapshot.body);
      expect(workflowSnapshot.statusCode).toBe(200);
      expect(snapshotPayload.snapshot.contentPlans.length).toBeGreaterThanOrEqual(1);
      expect(snapshotPayload.snapshot.drafts.length).toBeGreaterThanOrEqual(2);
      expect(snapshotPayload.snapshot.reviewQueueItems.length).toBeGreaterThanOrEqual(1);
      expect(snapshotPayload.snapshot.packages.length).toBeGreaterThanOrEqual(1);
      expect(snapshotPayload.snapshot.contentPlans[0].slots.length).toBeGreaterThanOrEqual(2);

      const firstDraft = snapshotPayload.snapshot.drafts[0];
      const editedDraft = {
        ...firstDraft,
        hook: 'Edited persistent hook',
        body: 'Edited persistent body',
        status: 'In Review'
      };
      const savedDraft = await requestText(`http://127.0.0.1:${port}/api/workflow-items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: firstDraft.id,
          type: 'draft',
          title: firstDraft.title,
          status: 'In Review',
          payload: editedDraft
        })
      });
      expect(savedDraft.statusCode).toBe(200);

      const afterDraftEdit = JSON.parse((await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`)).body).snapshot;
      expect(afterDraftEdit.drafts.find((draft) => draft.id === firstDraft.id)).toMatchObject({
        hook: 'Edited persistent hook',
        body: 'Edited persistent body',
        status: 'In Review'
      });

      const planRunId = afterDraftEdit.contentPlans[0].runId;
      const planReviewItems = afterDraftEdit.reviewQueueItems.filter((item) => item.runId === planRunId);
      for (const reviewItem of planReviewItems) {
        const approvedReview = {
          ...reviewItem,
          status: 'Approved',
          decision: 'Approved in test'
        };
        const savedReview = await requestText(`http://127.0.0.1:${port}/api/workflow-items`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: reviewItem.id,
            type: 'review_item',
            title: reviewItem.title,
            status: 'Approved',
            payload: approvedReview
          })
        });
        expect(savedReview.statusCode).toBe(200);
      }

      const approvedSnapshot = JSON.parse((await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`)).body).snapshot;
      const approvedPackage = approvedSnapshot.packages.find((item) =>
        item.manifest.artifacts.some((artifact) => artifact.type === 'CONTENT_PLAN' && artifact.id === approvedSnapshot.contentPlans[0].id)
      );
      expect(approvedPackage.manifest.status).toBe('APPROVED_EXPORT');
      expect(approvedPackage.manifest.exportType).toBe('approved');

      const rejectedReview = {
        ...planReviewItems[0],
        status: 'Rejected',
        decision: 'Rejected in test'
      };
      const savedRejectedReview = await requestText(`http://127.0.0.1:${port}/api/workflow-items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: planReviewItems[0].id,
          type: 'review_item',
          title: planReviewItems[0].title,
          status: 'Rejected',
          payload: rejectedReview
        })
      });
      expect(savedRejectedReview.statusCode).toBe(200);

      const blockedSnapshot = JSON.parse((await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`)).body).snapshot;
      const blockedPackage = blockedSnapshot.packages.find((item) =>
        item.manifest.artifacts.some((artifact) => artifact.type === 'CONTENT_PLAN' && artifact.id === blockedSnapshot.contentPlans[0].id)
      );
      expect(blockedPackage.manifest.status).toBe('BLOCKED');
      expect(blockedPackage.manifest.exportType).toBe('blocked');

      const resetWorkflow = await requestText(`http://127.0.0.1:${port}/api/workflow-items?scope=workflow`, {
        method: 'DELETE'
      });
      expect(resetWorkflow.statusCode).toBe(200);
      const resetSnapshot = JSON.parse((await requestText(`http://127.0.0.1:${port}/api/workflow-snapshot`)).body).snapshot;
      expect(resetSnapshot.contentPlans).toEqual([]);
      expect(resetSnapshot.drafts).toEqual([]);
      expect(resetSnapshot.reviewQueueItems).toEqual([]);
      expect(resetSnapshot.packages).toEqual([]);

      const post = await requestText(`http://127.0.0.1:${port}/plan`, 'POST');
      expect(post.statusCode).toBe(405);
    } finally {
      child.kill();
    }
  });
});

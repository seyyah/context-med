/**
 * social-agent CLI Comprehensive Tests
 */
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawn, spawnSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '../..');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
const CLI = path.join(PKG_ROOT, 'bin', 'cli.js');
const DEMO_SCRIPT = path.join(PKG_ROOT, 'demo', 'comprehensive-demo.js');
const DEMO_ASSET = path.join(PKG_ROOT, 'demo', 'assets', 'social-agent-demo.js');
const FIXTURES = path.join(REPO_ROOT, 'fixtures');

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

  test('browser demo asset replaces placeholder main content from package data', async () => {
    const socialAgent = require('@context-med/social-agent');
    const asset = fs.readFileSync(DEMO_ASSET, 'utf8');
    const main = { innerHTML: '' };
    const context = {
      window: { location: { pathname: '/plan' } },
      document: {
        querySelector(selector) {
          return selector === 'main' ? main : null;
        },
        querySelectorAll() {
          return [];
        }
      },
      fetch() {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(socialAgent.createSocialAgentDemo())
        });
      }
    };

    vm.createContext(context);
    vm.runInContext(asset, context);
    await new Promise((resolve) => setImmediate(resolve));

    expect(main.innerHTML).toMatch(/data-social-agent-app/);
    expect(main.innerHTML).toMatch(/Generated Weekly Plan/);
    expect(main.innerHTML).toMatch(/Planning board/);
    expect(main.innerHTML).toMatch(/Plan items/);
    expect(main.innerHTML).toMatch(/node bin\/cli\.js plan/);
  });

  test('browser demo asset renders workspace controls for custom input', async () => {
    const socialAgent = require('@context-med/social-agent');
    const asset = fs.readFileSync(DEMO_ASSET, 'utf8');
    const main = { innerHTML: '' };
    const context = {
      window: {
        location: { pathname: '/workspace' },
        addEventListener() {},
        localStorage: {
          getItem() { return null; },
          setItem() {},
          removeItem() {}
        }
      },
      document: {
        body: {
          classList: {
            classes: [],
            add(name) {
              this.classes.push(name);
            }
          }
        },
        querySelector(selector) {
          return selector === 'main' ? main : null;
        },
        querySelectorAll() {
          return [];
        }
      },
      fetch() {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(socialAgent.createSocialAgentDemo())
        });
      }
    };

    vm.createContext(context);
    vm.runInContext(asset, context);
    await new Promise((resolve) => setImmediate(resolve));

    expect(main.innerHTML).toMatch(/data-workspace-form/);
    expect(main.innerHTML).toMatch(/Generate Demo Output/);
    expect(main.innerHTML).toMatch(/Source context/);
    expect(main.innerHTML).toMatch(/Community comments/);
    expect(main.innerHTML).toMatch(/Generated output/);
    expect(main.innerHTML).toMatch(/Run complete/);
    expect(main.innerHTML).toMatch(/Local fallback/);
    expect(main.innerHTML).toMatch(/Final platform outputs/);
    expect(main.innerHTML).toMatch(/Final LINKEDIN output/);
    expect(main.innerHTML).toMatch(/Final X output/);
    expect(main.innerHTML).toMatch(/Adaptation details/);
    expect(main.innerHTML).toMatch(/sa-adaptation-details/);
    expect(main.innerHTML).toMatch(/Hashtags/);
    expect(main.innerHTML).toMatch(/Copy final copy/);
    expect(main.innerHTML).toMatch(/Adaptation/);
    expect(main.innerHTML).toMatch(/professional_narrative/);
    expect(main.innerHTML).toMatch(/Plan created/);
    expect(main.innerHTML).toMatch(/Drafts created/);
    expect(main.innerHTML).toMatch(/Plan output/);
    expect(main.innerHTML).toMatch(/Draft output/);
    expect(main.innerHTML).toMatch(/Moderation output/);
    expect(main.innerHTML).toMatch(/Review queue output/);
    expect(context.document.body.classList.classes).toContain('sa-demo-shell');
  });

  test('browser demo asset wires sidebar routes despite icon labels', async () => {
    const socialAgent = require('@context-med/social-agent');
    const asset = fs.readFileSync(DEMO_ASSET, 'utf8');
    const main = { innerHTML: '' };
    const listeners = {};
    const navLink = {
      textContent: 'event_note Plan',
      dataset: {},
      href: '',
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      getAttribute(name) {
        return name === 'href' ? this.href : this.attributes[name];
      },
      addEventListener(name, handler) {
        listeners[name] = handler;
      }
    };
    const context = {
      window: {
        location: { pathname: '/workspace' },
        history: {
          pushState(_state, _title, url) {
            context.window.location.pathname = url;
          }
        },
        localStorage: {
          getItem() { return null; },
          setItem() {},
          removeItem() {}
        },
        addEventListener() {}
      },
      document: {
        querySelector(selector) {
          return selector === 'main' ? main : null;
        },
        querySelectorAll(selector) {
          if (selector === 'nav a' || selector === 'a[href^="/"]') {
            return [navLink];
          }
          return [];
        }
      },
      fetch() {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(socialAgent.createSocialAgentDemo())
        });
      }
    };

    vm.createContext(context);
    vm.runInContext(asset, context);
    await new Promise((resolve) => setImmediate(resolve));

    expect(navLink.href).toBe('/plan');
    expect(navLink.dataset.route).toBe('plan');
    expect(navLink.attributes['aria-current']).toBe('false');
    expect(typeof listeners.click).toBe('function');

    listeners.click({ preventDefault() {} });
    expect(context.window.location.pathname).toBe('/plan');
    expect(main.innerHTML).toMatch(/Generated Weekly Plan/);
  });

  test('browser demo asset renders review queue as an approval workspace', async () => {
    const socialAgent = require('@context-med/social-agent');
    const asset = fs.readFileSync(DEMO_ASSET, 'utf8');
    const main = { innerHTML: '' };
    const context = {
      window: {
        location: { pathname: '/review-queue' },
        addEventListener() {},
        localStorage: {
          getItem() { return null; },
          setItem() {},
          removeItem() {}
        }
      },
      document: {
        body: {
          classList: {
            add() {}
          }
        },
        querySelector(selector) {
          return selector === 'main' ? main : null;
        },
        querySelectorAll() {
          return [];
        }
      },
      fetch() {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(socialAgent.createSocialAgentDemo())
        });
      }
    };

    vm.createContext(context);
    vm.runInContext(asset, context);
    await new Promise((resolve) => setImmediate(resolve));

    expect(main.innerHTML).toMatch(/Human approval gate/);
    expect(main.innerHTML).toMatch(/Decision board/);
    expect(main.innerHTML).toMatch(/approve-review/);
    expect(main.innerHTML).toMatch(/request-review-changes/);
    expect(main.innerHTML).toMatch(/escalate-review/);
    expect(main.innerHTML).toMatch(/Review items/);
  });

  test('serve exposes accepted demo screens with extensionless routes', async () => {
    const port = 3300 + Math.floor(Math.random() * 300);
    const child = spawn(process.execPath, [CLI, 'serve', '--port', String(port), '--quiet'], {
      cwd: PKG_ROOT,
      env: {
        ...process.env,
        GEMINI_API_KEY: '',
        GOOGLE_API_KEY: '',
        SOCIAL_AGENT_LLM_MODE: 'deterministic'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    try {
      const overview = await waitForServer(`http://127.0.0.1:${port}/`);
      expect(overview.body).toMatch(/Social-Agent/);
      expect(overview.body).toMatch(/assets\/social-agent-demo\.js/);

      const plan = await requestText(`http://127.0.0.1:${port}/plan`);
      expect(plan.statusCode).toBe(200);
      expect(plan.body).toMatch(/Generated Weekly Plan/);

      const drafts = await requestText(`http://127.0.0.1:${port}/drafts`);
      expect(drafts.statusCode).toBe(200);
      expect(drafts.body).toMatch(/Drafts/);

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

      const demoAsset = await requestText(`http://127.0.0.1:${port}/assets/social-agent-demo.js`);
      expect(demoAsset.statusCode).toBe(200);
      expect(demoAsset.body).toMatch(/api\/demo/);
      expect(demoAsset.body).toMatch(/data-social-agent-app/);
      expect(demoAsset.body).toMatch(/main\.innerHTML = renderRoute/);
      expect(demoAsset.body).toMatch(/data-workspace-form/);
      expect(demoAsset.body).toMatch(/copy-json/);
      expect(demoAsset.body).toMatch(/download-json/);
      expect(demoAsset.body).toMatch(/navigateTo/);
      expect(demoAsset.body).toMatch(/pushState/);
      expect(demoAsset.body).toMatch(/aria-current/);
      expect(demoAsset.body).toMatch(/sa-demo-shell/);
      expect(demoAsset.body).toMatch(/Generated Weekly Plan/);
      expect(demoAsset.body).toMatch(/Generated output/);
      expect(demoAsset.body).toMatch(/Run complete/);
      expect(demoAsset.body).toMatch(/Gemini live/);
      expect(demoAsset.body).toMatch(/Local fallback/);
      expect(demoAsset.body).toMatch(/finalPostCard/);
      expect(demoAsset.body).toMatch(/Adaptation details/);
      expect(demoAsset.body).toMatch(/sa-adaptation-details/);
      expect(demoAsset.body).toMatch(/Hashtags/);
      expect(demoAsset.body).toMatch(/Planning board/);
      expect(demoAsset.body).toMatch(/Publish handoff/);
      expect(demoAsset.body).toMatch(/Moderation triage/);
      expect(demoAsset.body).toMatch(/copy-draft/);
      expect(demoAsset.body).toMatch(/edit-draft/);
      expect(demoAsset.body).toMatch(/save-draft-edit/);
      expect(demoAsset.body).toMatch(/data-draft-editor/);
      expect(demoAsset.body).toMatch(/Final platform outputs/);
      expect(demoAsset.body).toMatch(/Plan created/);
      expect(demoAsset.body).toMatch(/Review Queue/);
      expect(demoAsset.body).toMatch(/Human approval gate/);
      expect(demoAsset.body).toMatch(/approve-review/);
      expect(demoAsset.body).toMatch(/request-review-changes/);
      expect(demoAsset.body).toMatch(/escalate-review/);

      const demoStyles = await requestText(`http://127.0.0.1:${port}/assets/social-agent-demo.css`);
      expect(demoStyles.statusCode).toBe(200);
      expect(demoStyles.body).toMatch(/nav a\[aria-current="false"\]/);
      expect(demoStyles.body).toMatch(/body\.sa-demo-shell main/);
      expect(demoStyles.body).toMatch(/overflow-y: auto/);
      expect(demoStyles.body).toMatch(/sa-adaptation-details/);
      expect(demoStyles.body).toMatch(/sa-run-summary/);
      expect(demoStyles.body).toMatch(/sa-run-card--live/);
      expect(demoStyles.body).toMatch(/sa-output-card/);
      expect(demoStyles.body).toMatch(/sa-plan-board/);
      expect(demoStyles.body).toMatch(/sa-triage-grid/);
      expect(demoStyles.body).toMatch(/sa-icon-action/);
      expect(demoStyles.body).toMatch(/sa-review-board/);
      expect(demoStyles.body).toMatch(/sa-callout/);
      expect(demoStyles.body).toMatch(/sa-draft-editor/);

      const directScreen = await requestText(`http://127.0.0.1:${port}/screens/overview.html`);
      expect(directScreen.statusCode).toBe(200);
      expect(directScreen.body).toMatch(/Social-Agent/);

      const post = await requestText(`http://127.0.0.1:${port}/plan`, 'POST');
      expect(post.statusCode).toBe(405);
    } finally {
      child.kill();
    }
  });
});

(function () {
  'use strict';

  const DEMO_STORAGE_KEY = 'social-agent-demo-request-v1';

  const ROUTES = {
    overview: '/',
    workspace: '/workspace',
    plan: '/plan',
    drafts: '/drafts',
    moderation: '/moderation',
    'review-queue': '/review-queue',
    packages: '/packages',
    writeback: '/writeback',
    settings: '/settings'
  };

  const NAV_LABELS = {
    overview: 'Overview',
    workspace: 'Workspace',
    plan: 'Plan',
    drafts: 'Drafts',
    moderation: 'Moderation',
    'review-queue': 'Review Queue',
    packages: 'Packages',
    writeback: 'Writeback',
    settings: 'Settings'
  };

  let currentData = null;
  let planFilter = {
    platform: 'all',
    status: 'all'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function routeFromPathname(pathname) {
    const parts = pathname
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/\.html$/, '')
      .split('/')
      .filter(Boolean);

    if (parts[0] === 'screens') {
      return parts[1] || 'overview';
    }

    return parts[0] || 'overview';
  }

  function routeName() {
    return routeFromPathname(window.location.pathname);
  }

  function normalizeStatus(value) {
    return String(value || 'ready')
      .replace(/[^a-z0-9_ -]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  function status(value) {
    const text = String(value == null ? 'ready' : value);
    return `<span class="sa-status sa-status--${escapeHtml(normalizeStatus(text))}">${escapeHtml(text.replace(/_/g, ' '))}</span>`;
  }

  function icon(name) {
    return `<span class="material-symbols-outlined text-[18px]">${escapeHtml(name)}</span>`;
  }

  function command(text) {
    return `<code>${escapeHtml(text)}</code>`;
  }

  function button(href, label, iconName, variant) {
    const className = variant === 'primary' ? 'sa-button' : 'sa-link-button';
    return `<a class="${className}" href="${escapeHtml(href)}">${iconName ? icon(iconName) : ''}${escapeHtml(label)}</a>`;
  }

  function actionButton(action, label, iconName, variant) {
    const className = variant === 'primary' ? 'sa-button' : 'sa-link-button';
    return `<button class="${className}" type="button" data-action="${escapeHtml(action)}">${iconName ? icon(iconName) : ''}${escapeHtml(label)}</button>`;
  }

  function hero(title, subtitle, actions) {
    return [
      '<section class="sa-hero">',
      '<div>',
      '<p class="sa-eyebrow">Social-Agent Standalone Demo</p>',
      `<h2 class="sa-title">${escapeHtml(title)}</h2>`,
      `<p class="sa-subtitle">${escapeHtml(subtitle)}</p>`,
      '</div>',
      `<div class="sa-actions">${actions || ''}</div>`,
      '</section>'
    ].join('');
  }

  function card(label, value, body, accent) {
    return [
      `<article class="sa-card${accent ? ' sa-card--accent' : ''}">`,
      `<p class="sa-label">${escapeHtml(label)}</p>`,
      `<p class="sa-value">${value}</p>`,
      body ? `<p class="sa-body">${escapeHtml(body)}</p>` : '',
      '</article>'
    ].join('');
  }

  function panel(title, body) {
    return [
      '<section class="sa-panel">',
      `<p class="sa-label">${escapeHtml(title)}</p>`,
      body,
      '</section>'
    ].join('');
  }

  function table(headers, rows) {
    if (!rows.length) {
      return '<div class="sa-empty">No package output available for this view.</div>';
    }

    return [
      '<div class="sa-table-wrap">',
      '<table class="sa-table">',
      '<thead><tr>',
      headers.map((header) => `<th>${escapeHtml(header)}</th>`).join(''),
      '</tr></thead>',
      '<tbody>',
      rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join(''),
      '</tbody>',
      '</table>',
      '</div>'
    ].join('');
  }

  function messageSlot() {
    return '<p class="sa-message" data-demo-message aria-live="polite"></p>';
  }

  function commandBar(commands) {
    return [
      '<section class="sa-command-bar">',
      '<div>',
      '<p class="sa-label">Reproducible commands</p>',
      '<div class="flex flex-wrap gap-2">',
      commands.map(command).join(''),
      '</div>',
      '</div>',
      '<div class="sa-actions">',
      actionButton('copy-json', 'Copy JSON', 'content_copy', 'secondary'),
      actionButton('download-json', 'Download JSON', 'download', 'secondary'),
      button('/api/demo', 'Open JSON', 'data_object', 'secondary'),
      '</div>',
      '</section>'
    ].join('');
  }

  function layout(title, subtitle, actions, body) {
    return [
      '<div class="sa-view" data-social-agent-app="true">',
      hero(title, subtitle, actions),
      messageSlot(),
      body,
      '</div>'
    ].join('');
  }

  function storageGet() {
    try {
      if (!window.localStorage) {
        return null;
      }

      const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function storageSet(value) {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(value));
    } catch (_error) {
      // Local storage can be disabled in private or embedded browser contexts.
    }
  }

  function storageClear() {
    try {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (_error) {
      // Local storage can be disabled in private or embedded browser contexts.
    }
  }

  function currentRequestFromData(data) {
    return {
      source: data.source && data.source.text ? data.source.text : data.source.preview,
      comments: data.source && Array.isArray(data.source.comments)
        ? data.source.comments
        : data.moderation.reports.map((report) => report.source_quote),
      language: data.language || 'en'
    };
  }

  function commentsFromTextarea(value) {
    return String(value || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function requestFromWorkspaceForm(form) {
    return {
      source: form.elements.source.value.trim(),
      comments: commentsFromTextarea(form.elements.comments.value),
      language: form.elements.language.value || 'en'
    };
  }

  async function fetchDemoData(options) {
    if (!options) {
      const stored = storageGet();
      if (stored && stored.source) {
        return fetchDemoData(stored);
      }

      const response = await fetch('/api/demo', { headers: { accept: 'application/json' } });
      if (!response.ok) {
        throw new Error(`Demo API returned ${response.status}`);
      }
      return response.json();
    }

    const response = await fetch('/api/demo', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`Demo API returned ${response.status}`);
    }

    return response.json();
  }

  function payloadForRoute(route, data) {
    if (route === 'workspace') {
      return data;
    }
    if (route === 'plan') {
      return data.plan;
    }
    if (route === 'drafts') {
      return data.drafts;
    }
    if (route === 'moderation') {
      return data.moderation;
    }
    if (route === 'review-queue') {
      return data.review_queue;
    }
    if (route === 'packages') {
      return data.packages;
    }
    if (route === 'writeback') {
      return data.writeback;
    }
    if (route === 'settings') {
      return data.settings;
    }
    return {
      summary: data.summary,
      package: data.package
    };
  }

  function renderOverview(data) {
    const summary = data.summary;
    const generation = generationInfo(data);
    const queueRows = data.review_queue.slice(0, 5).map((item) => [
      `<strong>${escapeHtml(item.id)}</strong>`,
      escapeHtml(item.source),
      escapeHtml(item.platform),
      status(item.risk_level),
      status(item.status)
    ]);

    return layout(
      'Operational Overview',
      summary.source_quote,
      [
        button('/workspace', 'Edit Source', 'edit_note', 'primary'),
        button('/plan', 'Open Plan', 'event_note', 'secondary'),
        button('/review-queue', 'Review Queue', 'fact_check', 'secondary')
      ].join(''),
      [
        '<section class="sa-grid">',
        card('Planned posts', escapeHtml(summary.planned_posts), 'LinkedIn and X items generated from the same source context.', true),
        card('Drafts', escapeHtml(summary.drafts), 'Platform-specific copy variants ready for review.', false),
        card('Moderation reports', escapeHtml(summary.moderation_reports), 'Community inputs classified by risk and action.', false),
        card('Review queue', escapeHtml(summary.review_queue_items), 'Items requiring approval or escalation.', true),
        card('Generation', escapeHtml(generation.label), generation.body, false),
        '</section>',
        commandBar(['npm run demo:build', 'npm start', 'node bin/cli.js plan --input <file> --output out/plan.json']),
        panel('Current review queue', table(['ID', 'Source', 'Channel', 'Risk', 'Status'], queueRows))
      ].join('')
    );
  }

  function workspaceForm(data) {
    const request = currentRequestFromData(data);
    return [
      '<form class="sa-form" data-workspace-form>',
      '<div class="sa-form__grid">',
      '<label class="sa-field sa-field--wide">',
      '<span>Source context</span>',
      `<textarea class="sa-textarea sa-textarea--source" name="source" rows="6">${escapeHtml(request.source)}</textarea>`,
      '</label>',
      '<label class="sa-field">',
      '<span>Community comments</span>',
      `<textarea class="sa-textarea sa-textarea--comments" name="comments" rows="6">${escapeHtml(request.comments.join('\n'))}</textarea>`,
      '</label>',
      '<label class="sa-field">',
      '<span>Language</span>',
      '<select class="sa-select" name="language">',
      `<option value="en"${request.language === 'en' ? ' selected' : ''}>English</option>`,
      `<option value="tr"${request.language === 'tr' ? ' selected' : ''}>Turkish</option>`,
      '</select>',
      '</label>',
      '</div>',
      '<div class="sa-form__actions">',
      '<button class="sa-button" type="submit">' + icon('refresh') + 'Generate Demo Output</button>',
      '<button class="sa-link-button" type="button" data-action="reset-demo">' + icon('restart_alt') + 'Reset Demo</button>',
      '</div>',
      '</form>'
    ].join('');
  }

  function previewText(value, maxLength) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3).trim()}...`;
  }

  function runCard(label, value, suffix, body, level) {
    const modifier = level ? ` sa-run-card--${level}` : '';
    return [
      `<article class="sa-run-card${modifier}">`,
      `<p class="sa-label">${escapeHtml(label)}</p>`,
      `<p class="sa-run-value">${escapeHtml(value)}${suffix ? `<small>${escapeHtml(suffix)}</small>` : ''}</p>`,
      body ? `<p class="sa-body">${escapeHtml(body)}</p>` : '',
      '</article>'
    ].join('');
  }

  function generationInfo(data) {
    const generation = data.generation || {};
    const live = generation.status === 'live' || generation.mode === 'gemini';

    return {
      label: live ? 'Gemini live' : 'Local fallback',
      suffix: generation.model && generation.model !== 'none' ? generation.model : generation.provider || 'local',
      body: generation.fallback_reason || generation.message || 'Generation metadata is unavailable.',
      level: live ? 'live' : 'warning'
    };
  }

  function adaptationList(draft) {
    const adaptation = draft.adaptation || {};
    const constraints = Array.isArray(adaptation.platform_constraints)
      ? adaptation.platform_constraints.join('; ')
      : '';

    return [
      `<li>${icon('alt_route')}<span><strong>Adaptation:</strong> ${escapeHtml(adaptation.strategy || 'platform rewrite')}</span></li>`,
      `<li>${icon('notes')}<span><strong>Reason:</strong> ${escapeHtml(adaptation.rewrite_reason || 'Platform-specific rewrite.')}</span></li>`,
      `<li>${icon('tune')}<span><strong>Tone:</strong> ${escapeHtml(adaptation.tone || 'platform appropriate')}</span></li>`,
      `<li>${icon('compress')}<span><strong>Length:</strong> ${escapeHtml(adaptation.length_target || 'platform specific')}</span></li>`,
      constraints ? `<li>${icon('rule')}<span><strong>Constraints:</strong> ${escapeHtml(constraints)}</span></li>` : '',
      `<li>${icon('campaign')}<span><strong>CTA:</strong> ${escapeHtml(draft.cta || 'Review before posting.')}</span></li>`,
      `<li>${icon('source')}<span><strong>Source:</strong> ${escapeHtml(draft.source_quote || 'Source quote unavailable.')}</span></li>`
    ].join('');
  }

  function outputCard(title, body, meta, riskLevel) {
    const risky = riskLevel === 'high' || riskLevel === 'medium';
    return [
      `<article class="sa-output-card${risky ? ' sa-output-card--risk' : ''}">`,
      `<h4 class="sa-output-card__title">${escapeHtml(title)}</h4>`,
      `<p class="sa-body">${escapeHtml(body)}</p>`,
      meta && meta.length ? `<div class="sa-output-meta">${meta.join('')}</div>` : '',
      '</article>'
    ].join('');
  }

  function finalPostCard(draft) {
    return [
      '<article class="sa-final-post">',
      '<div class="sa-final-post__head">',
      `<p class="sa-label">Final ${escapeHtml(draft.platform.toUpperCase())} output</p>`,
      `<div class="sa-output-meta">${status(draft.risk_level)}${status(draft.status)}</div>`,
      '</div>',
      `<h4 class="sa-output-card__title">${escapeHtml(draft.hook)}</h4>`,
      `<p class="sa-final-copy">${escapeHtml(draft.body)}</p>`,
      '<details class="sa-adaptation-details">',
      `<summary>${icon('tune')}<span>Adaptation details</span></summary>`,
      `<ul class="sa-list">${adaptationList(draft)}</ul>`,
      '</details>',
      '</article>'
    ].join('');
  }

  function stageCard(title, count, body, route, iconName) {
    return [
      '<article class="sa-stage">',
      '<div class="sa-stage__head">',
      `<h4 class="sa-stage__title">${escapeHtml(title)}</h4>`,
      status(count),
      '</div>',
      `<p class="sa-body">${escapeHtml(body)}</p>`,
      `<div class="sa-actions mt-3">${button(route, 'Open', iconName, 'secondary')}</div>`,
      '</article>'
    ].join('');
  }

  function workspaceResults(data) {
    const generation = generationInfo(data);
    const highRiskReports = data.moderation.reports.filter((report) => report.risk_level === 'high');
    const firstPlan = data.plan.items[0];
    const firstDraft = data.drafts.drafts[0];
    const firstModeration = data.moderation.reports[0];
    const firstReview = data.review_queue[0];
    const resultSummary = data.summary.generated_summary || `The system generated ${data.plan.items.length} plan items, ${data.drafts.drafts.length} platform drafts, ${data.moderation.reports.length} moderation reports, and ${data.review_queue.length} review queue decisions from the current input.`;

    const planCards = data.plan.items.slice(0, 4).map((item) => outputCard(
      `${item.platform.toUpperCase()} / ${item.suggested_day}`,
      `${item.topic}. ${item.cta}`,
      [status(item.risk_level), status(item.status), status(item.approval_required ? 'needs_review' : 'ready')],
      item.risk_level
    )).join('');

    const draftCards = data.drafts.drafts.map((draft) => outputCard(
      `${draft.platform.toUpperCase()} draft`,
      `${draft.hook}: ${previewText(draft.body, 220)}`,
      [status(draft.risk_level), status(draft.status)],
      draft.risk_level
    )).join('');
    const finalDrafts = data.drafts.drafts.map(finalPostCard).join('');

    const moderationCards = data.moderation.reports.map((report) => outputCard(
      `${report.classification} -> ${report.recommended_action}`,
      report.reply_draft || report.source_quote,
      [status(report.risk_level), status(report.recommended_action)],
      report.risk_level
    )).join('');

    const reviewCards = data.review_queue.slice(0, 6).map((item) => outputCard(
      `${item.source} / ${item.platform}`,
      item.source_quote,
      [status(item.risk_level), status(item.status), status(item.recommended_action)],
      item.risk_level
    )).join('');

    return [
      '<section class="sa-results">',
      '<div class="sa-results__header">',
      '<div>',
      '<p class="sa-label">Generated output</p>',
      `<h3 class="sa-section-title">Run complete: ${escapeHtml(data.summary.topic)}</h3>`,
      `<p class="sa-body">${escapeHtml(resultSummary)}</p>`,
      '</div>',
      '<div class="sa-actions">',
      button('/plan', 'Plan', 'event_note', 'secondary'),
      button('/drafts', 'Drafts', 'drafts', 'secondary'),
      button('/moderation', 'Moderation', 'gavel', 'secondary'),
      button('/review-queue', 'Review Queue', 'queue_play_next', 'secondary'),
      '</div>',
      '</div>',
      '<section class="sa-run-summary">',
      runCard('Provider', generation.label, generation.suffix, generation.body, generation.level),
      runCard('Plan', String(data.plan.items.length), 'items', firstPlan ? firstPlan.topic : 'No plan items generated.', ''),
      runCard('Drafts', String(data.drafts.drafts.length), 'drafts', firstDraft ? firstDraft.hook : 'No draft output generated.', ''),
      runCard('Moderation', String(data.moderation.reports.length), 'reports', highRiskReports.length ? `${highRiskReports.length} high-risk report needs escalation.` : 'No high-risk reports in this run.', highRiskReports.length ? 'danger' : ''),
      runCard('Review queue', String(data.review_queue.length), 'items', firstReview ? firstReview.source_quote : 'No review items produced.', data.review_queue.length ? 'warning' : ''),
      '</section>',
      '<section class="sa-final-output">',
      '<div>',
      '<p class="sa-label">Platform adaptation</p>',
      '<h3 class="sa-section-title">Final platform outputs</h3>',
      '<p class="sa-body">The same source input is rewritten into platform-native copy instead of being copied across channels.</p>',
      '</div>',
      `<div class="sa-final-output__grid">${finalDrafts}</div>`,
      '</section>',
      '<section class="sa-stage-list">',
      stageCard('Plan created', `${data.plan.items.length} ready`, firstPlan ? `${firstPlan.platform} ${firstPlan.suggested_day}: ${firstPlan.topic}` : 'No plan output.', '/plan', 'event_note'),
      stageCard('Drafts created', `${data.drafts.drafts.length} ready`, firstDraft ? `${firstDraft.platform}: ${firstDraft.hook}` : 'No draft output.', '/drafts', 'drafts'),
      stageCard('Moderation classified', `${data.moderation.reports.length} checked`, firstModeration ? `${firstModeration.classification} -> ${firstModeration.recommended_action}` : 'No moderation output.', '/moderation', 'gavel'),
      stageCard('Review queue built', `${data.review_queue.length} queued`, firstReview ? `${firstReview.source}: ${firstReview.status}` : 'No review queue output.', '/review-queue', 'queue_play_next'),
      '</section>',
      '<div class="sa-results__grid">',
      panel('Plan output', `<section class="sa-workspace-grid">${planCards}</section>`),
      panel('Draft output', `<section class="sa-workspace-grid">${draftCards}</section>`),
      panel('Moderation output', `<section class="sa-workspace-grid">${moderationCards}</section>`),
      panel('Review queue output', `<section class="sa-workspace-grid">${reviewCards}</section>`),
      '</div>',
      '</section>'
    ].join('');
  }

  function renderWorkspace(data) {
    const commands = [
      'node bin/cli.js plan --input demo/social-agent-source.md --output out/plan.json',
      'node bin/cli.js draft --input demo/social-agent-source.md --output out/drafts.json',
      'node bin/cli.js moderate --input comments.txt --output out/moderation.json'
    ];

    return layout(
      'Workspace',
      'Edit source context and community comments, then regenerate the same package payload used by every screen.',
      [
        actionButton('copy-json', 'Copy JSON', 'content_copy', 'secondary'),
        actionButton('download-json', 'Download JSON', 'download', 'secondary')
      ].join(''),
      [
        panel('Live input', workspaceForm(data)),
        workspaceResults(data),
        '<section class="sa-grid sa-grid--wide">',
        card('Source topic', escapeHtml(data.summary.topic), data.source.preview, true),
        card('Content pillar', escapeHtml(data.summary.content_pillar), 'Derived from the source context by the package domain helpers.', false),
        card('Risk posture', status(data.summary.risk_level), 'The same risk metadata drives plan, drafts, and review queue.', false),
        '</section>',
        commandBar(commands),
        panel('Package contract', `<pre class="sa-code">${escapeHtml(JSON.stringify({
          type: data.type,
          schema_version: data.schema_version,
          package: data.package,
          generation: data.generation,
          settings: data.settings
        }, null, 2))}</pre>`),
        '<div class="sa-page-spacer" aria-hidden="true"></div>'
      ].join('')
    );
  }

  function option(value, label, selectedValue) {
    return `<option value="${escapeHtml(value)}"${value === selectedValue ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }

  function planFilters(data) {
    const statuses = Array.from(new Set(data.plan.items.map((item) => item.status)));
    return [
      '<section class="sa-filter-bar">',
      '<label class="sa-field sa-field--compact"><span>Platform</span>',
      '<select class="sa-select" data-plan-filter="platform">',
      option('all', 'All platforms', planFilter.platform),
      data.plan.platforms.map((platform) => option(platform, platform, planFilter.platform)).join(''),
      '</select></label>',
      '<label class="sa-field sa-field--compact"><span>Status</span>',
      '<select class="sa-select" data-plan-filter="status">',
      option('all', 'All statuses', planFilter.status),
      statuses.map((itemStatus) => option(itemStatus, itemStatus.replace(/_/g, ' '), planFilter.status)).join(''),
      '</select></label>',
      '<div class="sa-actions">',
      actionButton('reset-plan-filters', 'Reset Filters', 'filter_alt_off', 'secondary'),
      '</div>',
      '</section>'
    ].join('');
  }

  function renderPlan(data) {
    const visibleItems = data.plan.items.filter((item) => {
      const platformMatches = planFilter.platform === 'all' || item.platform === planFilter.platform;
      const statusMatches = planFilter.status === 'all' || item.status === planFilter.status;
      return platformMatches && statusMatches;
    });

    const rows = visibleItems.map((item) => [
      escapeHtml(item.suggested_day),
      escapeHtml(item.platform),
      `<strong>${escapeHtml(item.topic)}</strong><p class="sa-body">${escapeHtml(item.cta)}</p>`,
      escapeHtml(item.content_pillar),
      status(item.risk_level),
      status(item.status)
    ]);

    return layout(
      'Generated Weekly Plan',
      `Generated from "${data.plan.topic}" with ${data.plan.platforms.join(' and ')} as the first supported platforms.`,
      [
        button('/workspace', 'Edit Source', 'edit_note', 'secondary'),
        button('/drafts', 'Open Drafts', 'drafts', 'primary')
      ].join(''),
      [
        commandBar(['node bin/cli.js plan --input <path> --output out/plan.json', 'node bin/cli.js plan --input <path> --output out/plan.json --dry-run']),
        planFilters(data),
        panel('Plan items', table(['Day', 'Platform', 'Topic and CTA', 'Pillar', 'Risk', 'Status'], rows))
      ].join('')
    );
  }

  function renderDrafts(data) {
    const drafts = data.drafts.drafts.map(finalPostCard).join('');

    return layout(
      'Drafts',
      'Platform-specific draft variants generated from the same source quote, with review metadata preserved.',
      [
        button('/workspace', 'Edit Source', 'edit_note', 'secondary'),
        button('/review-queue', 'Review Drafts', 'fact_check', 'primary')
      ].join(''),
      [
        commandBar(['node bin/cli.js draft --input <path> --output out/drafts.json']),
        `<section class="sa-final-output__grid">${drafts}</section>`
      ].join('')
    );
  }

  function renderModeration(data) {
    const rows = data.moderation.reports.map((report) => [
      escapeHtml(report.classification),
      status(report.risk_level),
      status(report.recommended_action),
      escapeHtml(report.source_quote),
      report.reply_draft ? escapeHtml(report.reply_draft) : '<span class="sa-body">No public reply</span>'
    ]);

    return layout(
      'Moderation',
      'Community text is classified locally and high-risk cases are escalated instead of auto-published.',
      [
        button('/workspace', 'Edit Comments', 'edit_note', 'secondary'),
        button('/review-queue', 'Open Queue', 'queue_play_next', 'primary')
      ].join(''),
      [
        commandBar(['node bin/cli.js moderate --input comments.txt --output out/moderation.json']),
        panel('Moderation reports', table(['Class', 'Risk', 'Action', 'Source text', 'Reply draft'], rows))
      ].join('')
    );
  }

  function renderReviewQueue(data) {
    const rows = data.review_queue.map((item) => [
      `<strong>${escapeHtml(item.id)}</strong>`,
      escapeHtml(item.source),
      escapeHtml(item.platform),
      status(item.risk_level),
      status(item.recommended_action),
      status(item.status),
      escapeHtml(item.source_quote)
    ]);

    return layout(
      'Review Queue',
      'Approval and escalation work is collected from plans, drafts, and moderation reports.',
      [
        button('/workspace', 'Edit Inputs', 'edit_note', 'secondary'),
        button('/packages', 'Package Approved Work', 'inventory_2', 'primary')
      ].join(''),
      panel('Review items', table(['ID', 'Source', 'Channel', 'Risk', 'Action', 'Status', 'Source quote'], rows))
    );
  }

  function renderPackages(data) {
    const rows = data.packages.map((item) => [
      `<strong>${escapeHtml(item.id)}</strong>`,
      escapeHtml(item.format),
      status(item.status),
      escapeHtml(item.includes.join(', ')),
      status(String(item.approval_required))
    ]);

    return layout(
      'Packages',
      'Export-ready JSON package assembled from the same package API used by the CLI and demo screens.',
      [
        actionButton('download-json', 'Download Package', 'download', 'primary'),
        actionButton('copy-json', 'Copy Package', 'content_copy', 'secondary'),
        button('/writeback', 'Writeback Status', 'save_as', 'secondary')
      ].join(''),
      [
        commandBar(['npm run demo:build', 'node demo/comprehensive-demo.js --output out/demo/social-agent-demo.json']),
        panel('Package exports', table(['ID', 'Format', 'Status', 'Includes', 'Approval required'], rows)),
        panel('Preview', `<pre class="sa-code">${escapeHtml(JSON.stringify({
          package: data.package,
          summary: data.summary,
          packages: data.packages
        }, null, 2))}</pre>`)
      ].join('')
    );
  }

  function renderWriteback(data) {
    return layout(
      'Writeback',
      data.writeback.message,
      button('/settings', 'Open Settings', 'settings', 'primary'),
      [
        '<section class="sa-grid">',
        card('Status', status(data.writeback.status), 'No external publishing side effect is performed in the MVP.', true),
        card('Mode', escapeHtml(data.writeback.mode), 'Local demo output only.', false),
        card('Direct publishing', status(String(data.settings.direct_publishing)), 'Human review remains required before social publishing.', false),
        '</section>',
        panel('Writeback boundary', '<ul class="sa-list"><li>' + icon('block') + '<span>No social platform credentials are required.</span></li><li>' + icon('fact_check') + '<span>Review queue decisions stay local.</span></li><li>' + icon('download') + '<span>Package JSON can be exported for manual handoff.</span></li></ul>')
      ].join('')
    );
  }

  function renderSettings(data) {
    const generation = generationInfo(data);

    return layout(
      'Settings',
      'MVP settings are explicit so the standalone demo cannot be mistaken for an external automation integration.',
      button('/api/demo', 'Inspect Settings JSON', 'data_object', 'primary'),
      [
        '<section class="sa-grid">',
        card('Platforms', escapeHtml(data.settings.platforms.join(', ')), 'First supported social channels.', true),
        card('Generation mode', escapeHtml(generation.label), generation.body, true),
        card('Deterministic mode', status(String(data.settings.deterministic_mode)), data.settings.deterministic_mode ? 'Same input produces the same local output.' : 'Workspace output is generated by the configured Gemini model.', false),
        card('LLM API calls', status(String(data.settings.llm_api_calls)), data.settings.llm_api_calls ? `Provider: ${generation.suffix}` : 'Set GEMINI_API_KEY to enable live workspace generation.', false),
        card('Direct publishing', status(String(data.settings.direct_publishing)), 'Disabled by design in the MVP.', false),
        '</section>',
        panel('Package metadata', `<pre class="sa-code">${escapeHtml(JSON.stringify(data.package, null, 2))}</pre>`)
      ].join('')
    );
  }

  function renderRoute(route, data) {
    const renderers = {
      overview: renderOverview,
      workspace: renderWorkspace,
      plan: renderPlan,
      drafts: renderDrafts,
      moderation: renderModeration,
      'review-queue': renderReviewQueue,
      packages: renderPackages,
      writeback: renderWriteback,
      settings: renderSettings
    };

    return (renderers[route] || renderOverview)(data);
  }

  function setMessage(text, tone) {
    const slot = document.querySelector('[data-demo-message]');
    if (!slot) {
      return;
    }

    slot.textContent = text || '';
    slot.dataset.tone = tone || 'neutral';
  }

  function wireNavigation(activeRoute) {
    document.querySelectorAll('nav a').forEach((link) => {
      const text = link.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      const route = Object.keys(NAV_LABELS).find((name) => text.includes(NAV_LABELS[name].toLowerCase()));
      if (!route) {
        return;
      }

      link.href = ROUTES[route];
      link.dataset.route = route;
      link.setAttribute('aria-current', route === activeRoute ? 'page' : 'false');
    });
  }

  function routeForLink(link) {
    if (link.dataset.route) {
      return link.dataset.route;
    }

    const href = link.getAttribute('href') || '';
    if (!href.startsWith('/') || href.startsWith('/api/')) {
      return '';
    }

    return routeFromPathname(href);
  }

  function navigateTo(route) {
    if (!currentData || !ROUTES[route]) {
      return;
    }

    if (window.history && window.history.pushState && window.location.pathname !== ROUTES[route]) {
      window.history.pushState({ route }, '', ROUTES[route]);
    }

    render(currentData);
  }

  async function copyText(text) {
    if (window.navigator && window.navigator.clipboard) {
      await window.navigator.clipboard.writeText(text);
      return;
    }

    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    document.body.removeChild(field);
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleAction(action) {
    if (!currentData) {
      return;
    }

    const route = routeName();
    const payload = payloadForRoute(route, currentData);
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;

    if (action === 'copy-json') {
      await copyText(serialized);
      setMessage('JSON copied.', 'success');
      return;
    }

    if (action === 'download-json') {
      downloadText(`social-agent-${route}.json`, serialized);
      setMessage('JSON download prepared.', 'success');
      return;
    }

    if (action === 'reset-demo') {
      storageClear();
      currentData = await fetchDemoData(null);
      render(currentData);
      setMessage('Demo inputs reset.', 'success');
      return;
    }

    if (action === 'reset-plan-filters') {
      planFilter = { platform: 'all', status: 'all' };
      render(currentData);
    }
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', async () => {
        try {
          await handleAction(element.dataset.action);
        } catch (error) {
          setMessage(error.message, 'error');
        }
      });
    });
  }

  function bindRouteLinks() {
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      const route = routeForLink(link);
      if (!route || !ROUTES[route]) {
        return;
      }

      link.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo(route);
      });
    });
  }

  function bindWorkspaceForm() {
    const form = document.querySelector('[data-workspace-form]');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const request = requestFromWorkspaceForm(form);
      if (!request.source) {
        setMessage('Source context is required.', 'error');
        return;
      }

      try {
        const nextData = await fetchDemoData(request);
        storageSet(request);
        currentData = nextData;
        render(nextData);
        setMessage(generationInfo(nextData).label === 'Gemini live' ? 'Gemini output regenerated.' : 'Demo output regenerated with local fallback.', 'success');
      } catch (error) {
        setMessage(error.message, 'error');
      }
    });
  }

  function bindPlanFilters() {
    document.querySelectorAll('[data-plan-filter]').forEach((control) => {
      control.addEventListener('change', () => {
        planFilter = {
          ...planFilter,
          [control.dataset.planFilter]: control.value
        };
        render(currentData);
      });
    });
  }

  function bindInteractions(route) {
    bindActions();
    bindRouteLinks();

    if (route === 'workspace') {
      bindWorkspaceForm();
    }

    if (route === 'plan') {
      bindPlanFilters();
    }
  }

  function render(data) {
    const route = routeName();
    const main = document.querySelector('main');
    currentData = data;
    wireNavigation(route);

    if (document.body && document.body.classList) {
      document.body.classList.add('sa-demo-shell');
    }

    if (!main) {
      return;
    }

    main.innerHTML = renderRoute(route, data);
    bindInteractions(route);
  }

  fetchDemoData()
    .then(render)
    .catch((error) => {
      const main = document.querySelector('main');
      if (main) {
        main.innerHTML = layout(
          'Demo Error',
          error.message,
          '',
          '<div class="sa-empty">The demo API could not be loaded.</div>'
        );
      }
    });

  if (window.addEventListener) {
    window.addEventListener('popstate', () => {
      if (currentData) {
        render(currentData);
      }
    });
  }
}());

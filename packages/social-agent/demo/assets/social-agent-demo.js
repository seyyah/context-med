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
  let editingDraftId = '';
  let planFilter = {
    platform: 'all',
    status: 'all',
    risk: 'all',
    approval: 'all'
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

  function reviewButton(action, label, iconName, reviewId, variant) {
    const className = variant === 'primary' ? 'sa-button' : 'sa-link-button';
    return `<button class="${className}" type="button" data-action="${escapeHtml(action)}" data-review-id="${escapeHtml(reviewId)}">${iconName ? icon(iconName) : ''}${escapeHtml(label)}</button>`;
  }

  function draftButton(action, label, iconName, draftId, variant) {
    const className = variant === 'primary' ? 'sa-button' : 'sa-link-button';
    return `<button class="${className}" type="button" data-action="${escapeHtml(action)}" data-draft-id="${escapeHtml(draftId)}">${iconName ? icon(iconName) : ''}${escapeHtml(label)}</button>`;
  }

  function iconActionButton(action, label, iconName, attributes) {
    return `<button class="sa-icon-action" type="button" data-action="${escapeHtml(action)}"${attributes || ''} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${icon(iconName)}</button>`;
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
      language: 'en'
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
      '<label class="sa-field">',
      '<span>Source context</span>',
      `<textarea class="sa-textarea sa-textarea--source" name="source" rows="12">${escapeHtml(request.source)}</textarea>`,
      '</label>',
      '<label class="sa-field">',
      '<span>Community comments</span>',
      `<textarea class="sa-textarea sa-textarea--comments" name="comments" rows="12">${escapeHtml(request.comments.join('\n'))}</textarea>`,
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
    const hashtagPolicy = draft.hashtag_policy || {};
    const hashtags = Array.isArray(draft.hashtags) && draft.hashtags.length
      ? draft.hashtags.join(' ')
      : 'None selected';
    const constraints = Array.isArray(adaptation.platform_constraints)
      ? adaptation.platform_constraints.join('; ')
      : '';

    return [
      `<li>${icon('alt_route')}<span><strong>Adaptation:</strong> ${escapeHtml(adaptation.strategy || 'platform rewrite')}</span></li>`,
      `<li>${icon('notes')}<span><strong>Reason:</strong> ${escapeHtml(adaptation.rewrite_reason || 'Platform-specific rewrite.')}</span></li>`,
      `<li>${icon('tune')}<span><strong>Tone:</strong> ${escapeHtml(adaptation.tone || 'platform appropriate')}</span></li>`,
      `<li>${icon('compress')}<span><strong>Length:</strong> ${escapeHtml(adaptation.length_target || 'platform specific')}</span></li>`,
      constraints ? `<li>${icon('rule')}<span><strong>Constraints:</strong> ${escapeHtml(constraints)}</span></li>` : '',
      `<li>${icon('tag')}<span><strong>Hashtags:</strong> ${escapeHtml(hashtags)}. Max ${escapeHtml(hashtagPolicy.max || 'platform default')}, ${escapeHtml(hashtagPolicy.placement || 'platform placement')}.</span></li>`,
      `<li>${icon('policy')}<span><strong>Hashtag policy:</strong> ${escapeHtml(hashtagPolicy.reason || 'Use only relevant hashtags that do not add unsupported claims.')}</span></li>`,
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
    const isEditing = editingDraftId === draft.id;
    const draftActions = routeName() === 'drafts'
      ? [
        isEditing
          ? draftButton('save-draft-edit', 'Save Draft', 'save', draft.id, 'primary')
          : draftButton('edit-draft', 'Edit', 'edit', draft.id, 'secondary'),
        isEditing ? draftButton('cancel-draft-edit', 'Cancel', 'close', draft.id, 'secondary') : ''
      ].join('')
      : '';

    return [
      '<article class="sa-final-post">',
      '<div class="sa-final-post__head">',
      `<p class="sa-label">Final ${escapeHtml(draft.platform.toUpperCase())} output</p>`,
      `<div class="sa-output-meta">${status(draft.risk_level)}${status(draft.status)}${iconActionButton('copy-draft', 'Copy final copy', 'content_copy', ` data-draft-id="${escapeHtml(draft.id)}"`)}</div>`,
      '</div>',
      `<h4 class="sa-output-card__title">${escapeHtml(draft.hook)}</h4>`,
      isEditing
        ? [
          `<textarea class="sa-textarea sa-draft-editor" data-draft-editor="${escapeHtml(draft.id)}" rows="12">${escapeHtml(draft.body)}</textarea>`,
          '<p class="sa-editor-note">Saved edits update this demo package state and are used by copy/export actions.</p>'
        ].join('')
        : `<p class="sa-final-copy">${escapeHtml(draft.body)}</p>`,
      draftActions ? `<div class="sa-actions sa-draft-actions">${draftActions}</div>` : '',
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

  function approvalState(item) {
    return item.approval_required ? 'needs_review' : 'ready';
  }

  function countBy(items, predicate) {
    return items.filter(predicate).length;
  }

  function planReadinessCards(items) {
    const ready = countBy(items, (item) => !item.approval_required && item.status !== 'needs_review');
    const needsReview = countBy(items, (item) => item.approval_required || item.status === 'needs_review');
    const highRisk = countBy(items, (item) => item.risk_level === 'high');
    const channels = Array.from(new Set(items.map((item) => item.platform))).join(', ');

    return [
      '<section class="sa-run-summary">',
      runCard('Visible plan items', String(items.length), 'items', channels ? `Channels in view: ${channels}.` : 'No items match the current filters.', ''),
      runCard('Ready to draft', String(ready), 'items', 'Items that can move toward draft review.', ''),
      runCard('Needs review', String(needsReview), 'items', 'Approval-required items stay visible before handoff.', needsReview ? 'warning' : ''),
      runCard('High risk', String(highRisk), 'items', 'High-risk topics should route through review queue.', highRisk ? 'danger' : ''),
      '</section>'
    ].join('');
  }

  function planBoard(items) {
    if (!items.length) {
      return '<div class="sa-empty">No plan items match the current filters.</div>';
    }

    return [
      '<section class="sa-plan-board">',
      items.map((item) => [
        '<article class="sa-plan-card">',
        '<div class="sa-plan-card__head">',
        `<p class="sa-label">${escapeHtml(item.platform)} / ${escapeHtml(item.suggested_day)}</p>`,
        `<div class="sa-output-meta">${status(item.risk_level)}${status(approvalState(item))}</div>`,
        '</div>',
        `<h4 class="sa-output-card__title">${escapeHtml(item.topic)}</h4>`,
        `<p class="sa-body">${escapeHtml(item.cta)}</p>`,
        '<ul class="sa-list sa-list--compact">',
        `<li>${icon('category')}<span><strong>Pillar:</strong> ${escapeHtml(item.content_pillar)}</span></li>`,
        `<li>${icon('format_shapes')}<span><strong>Format:</strong> ${escapeHtml(item.format || 'social post')}</span></li>`,
        `<li>${icon('source')}<span><strong>Source:</strong> ${escapeHtml(item.source_quote)}</span></li>`,
        '</ul>',
        '<div class="sa-actions mt-3">',
        button('/drafts', 'Draft', 'drafts', 'secondary'),
        item.approval_required ? button('/review-queue', 'Review', 'fact_check', 'secondary') : '',
        '</div>',
        '</article>'
      ].join('')).join(''),
      '</section>'
    ].join('');
  }

  function planFilters(data) {
    const statuses = Array.from(new Set(data.plan.items.map((item) => item.status)));
    const risks = Array.from(new Set(data.plan.items.map((item) => item.risk_level)));
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
      '<label class="sa-field sa-field--compact"><span>Risk</span>',
      '<select class="sa-select" data-plan-filter="risk">',
      option('all', 'All risks', planFilter.risk),
      risks.map((itemRisk) => option(itemRisk, itemRisk, planFilter.risk)).join(''),
      '</select></label>',
      '<label class="sa-field sa-field--compact"><span>Approval</span>',
      '<select class="sa-select" data-plan-filter="approval">',
      option('all', 'All approval states', planFilter.approval),
      option('needs_review', 'Needs review', planFilter.approval),
      option('ready', 'Ready', planFilter.approval),
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
      const riskMatches = planFilter.risk === 'all' || item.risk_level === planFilter.risk;
      const approvalMatches = planFilter.approval === 'all' || approvalState(item) === planFilter.approval;
      return platformMatches && statusMatches && riskMatches && approvalMatches;
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
        planReadinessCards(visibleItems),
        panel('Planning board', planBoard(visibleItems)),
        panel('Plan items', table(['Day', 'Platform', 'Topic and CTA', 'Pillar', 'Risk', 'Status'], rows))
      ].join('')
    );
  }

  function draftSummaryCards(drafts) {
    const reviewCount = countBy(drafts, (draft) => draft.approval_required || draft.status === 'needs_review');
    const tagCount = drafts.reduce((total, draft) => total + (Array.isArray(draft.hashtags) ? draft.hashtags.length : 0), 0);
    const platforms = drafts.map((draft) => draft.platform.toUpperCase()).join(', ');

    return [
      '<section class="sa-run-summary">',
      runCard('Final copies', String(drafts.length), 'drafts', platforms ? `Platform-ready outputs: ${platforms}.` : 'No drafts generated.', ''),
      runCard('Needs review', String(reviewCount), 'drafts', 'Review-required drafts route to the queue before publishing.', reviewCount ? 'warning' : ''),
      runCard('Hashtags', String(tagCount), 'tags', 'Tags are kept inside final copy and documented in adaptation details.', ''),
      runCard('Publishing mode', 'Manual', 'handoff', 'No direct social publishing is performed in the MVP.', 'warning'),
      '</section>'
    ].join('');
  }

  function draftHandoffTable(drafts) {
    const rows = drafts.map((draft) => [
      escapeHtml(draft.platform),
      status(draft.risk_level),
      status(draft.status),
      escapeHtml(Array.isArray(draft.hashtags) ? draft.hashtags.join(' ') : ''),
      draft.approval_required ? button('/review-queue', 'Queue', 'fact_check', 'secondary') : '<span class="sa-body">Ready for manual copy</span>'
    ]);

    return panel('Publish handoff', table(['Platform', 'Risk', 'Status', 'Hashtags', 'Next step'], rows));
  }

  function renderDrafts(data) {
    const finalDrafts = data.drafts.drafts;
    const drafts = finalDrafts.map(finalPostCard).join('');

    return layout(
      'Drafts',
      'Platform-specific draft variants generated from the same source quote, with review metadata preserved.',
      [
        button('/workspace', 'Edit Source', 'edit_note', 'secondary'),
        button('/review-queue', 'Review Drafts', 'fact_check', 'primary')
      ].join(''),
      [
        commandBar(['node bin/cli.js draft --input <path> --output out/drafts.json']),
        draftSummaryCards(finalDrafts),
        `<section class="sa-final-output__grid">${drafts}</section>`,
        draftHandoffTable(finalDrafts),
        panel('Draft package contract', `<pre class="sa-code">${escapeHtml(JSON.stringify({
          type: data.drafts.type,
          topic: data.drafts.topic,
          drafts: finalDrafts.map((draft) => ({
            id: draft.id,
            platform: draft.platform,
            status: draft.status,
            hashtags: draft.hashtags,
            approval_required: draft.approval_required
          }))
        }, null, 2))}</pre>`)
      ].join('')
    );
  }

  function moderationSummaryCards(reports) {
    const high = countBy(reports, (report) => report.risk_level === 'high');
    const escalations = countBy(reports, (report) => report.recommended_action === 'escalate');
    const replies = countBy(reports, (report) => report.recommended_action === 'reply');
    const ignored = countBy(reports, (report) => report.recommended_action === 'ignore');

    return [
      '<section class="sa-run-summary">',
      runCard('Checked comments', String(reports.length), 'items', 'Every community input receives a risk and action.', ''),
      runCard('Escalations', String(escalations), 'items', 'Privacy, crisis, or sensitive medical signals route to review.', escalations ? 'danger' : ''),
      runCard('Reply drafts', String(replies), 'items', 'Safe questions get a reviewed response draft.', ''),
      runCard('Ignored', String(ignored), 'items', 'Spam and low-value inputs do not create public replies.', ignored ? '' : 'warning'),
      runCard('High risk', String(high), 'items', 'High-risk items should never be auto-published.', high ? 'danger' : ''),
      '</section>'
    ].join('');
  }

  function moderationTriage(reports) {
    const actions = ['escalate', 'reply', 'ignore'];
    return [
      '<section class="sa-triage-grid">',
      actions.map((action) => {
        const items = reports.filter((report) => report.recommended_action === action);
        return [
          '<article class="sa-triage-card">',
          '<div class="sa-plan-card__head">',
          `<p class="sa-label">${escapeHtml(action)} lane</p>`,
          status(`${items.length} items`),
          '</div>',
          items.length ? items.map((report) => [
            '<div class="sa-triage-item">',
            `<div class="sa-output-meta">${status(report.classification)}${status(report.risk_level)}</div>`,
            `<p class="sa-body"><strong>Source:</strong> ${escapeHtml(report.source_quote)}</p>`,
            report.reply_draft ? `<p class="sa-body"><strong>Reply draft:</strong> ${escapeHtml(report.reply_draft)}</p>` : '<p class="sa-body"><strong>Reply draft:</strong> No public reply.</p>',
            '</div>'
          ].join('')).join('') : '<div class="sa-empty">No items in this lane.</div>',
          '</article>'
        ].join('');
      }).join(''),
      '</section>'
    ].join('');
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
        moderationSummaryCards(data.moderation.reports),
        panel('Moderation triage', moderationTriage(data.moderation.reports)),
        panel('Moderation reports', table(['Class', 'Risk', 'Action', 'Source text', 'Reply draft'], rows))
      ].join('')
    );
  }

  function unresolvedReviewItems(items) {
    return items.filter((item) => !['approved', 'escalated'].includes(normalizeStatus(item.status)));
  }

  function updatePackageApprovalState() {
    if (!currentData || !Array.isArray(currentData.packages)) {
      return;
    }

    const hasUnresolvedReview = unresolvedReviewItems(currentData.review_queue).length > 0;
    currentData.packages = currentData.packages.map((item) => ({
      ...item,
      approval_required: hasUnresolvedReview,
      status: hasUnresolvedReview ? item.status : 'approved'
    }));
  }

  function applyReviewDecision(action, reviewId) {
    const item = currentData.review_queue.find((entry) => entry.id === reviewId);
    if (!item) {
      setMessage('Review item not found.', 'error');
      return;
    }

    if (action === 'approve-review') {
      item.status = 'approved';
      item.recommended_action = 'approved';
    }

    if (action === 'request-review-changes') {
      item.status = 'changes_requested';
      item.recommended_action = 'revise';
    }

    if (action === 'escalate-review') {
      item.status = 'escalated';
      item.recommended_action = 'escalate';
    }

    updatePackageApprovalState();
    render(currentData);
    setMessage(`${item.id} updated to ${item.status.replace(/_/g, ' ')}.`, 'success');
  }

  function reviewSummaryCards(items) {
    const pending = countBy(items, (item) => normalizeStatus(item.status) === 'needs_review');
    const approved = countBy(items, (item) => normalizeStatus(item.status) === 'approved');
    const escalated = countBy(items, (item) => normalizeStatus(item.status) === 'escalated');
    const changes = countBy(items, (item) => normalizeStatus(item.status) === 'changes_requested');

    return [
      '<section class="sa-run-summary">',
      runCard('Pending review', String(pending), 'items', 'These block package approval until a decision is made.', pending ? 'warning' : ''),
      runCard('Approved', String(approved), 'items', 'Approved items can move into the export package.', approved ? 'live' : ''),
      runCard('Escalated', String(escalated), 'items', 'Escalated items need human owner follow-up before public use.', escalated ? 'danger' : ''),
      runCard('Changes requested', String(changes), 'items', 'Items sent back for revision should return to Drafts or Plan.', changes ? 'warning' : ''),
      '</section>'
    ].join('');
  }

  function reviewActions(item) {
    const normalized = normalizeStatus(item.status);
    if (normalized === 'approved') {
      return '<span class="sa-body">Approved for package handoff</span>';
    }
    if (normalized === 'escalated') {
      return '<span class="sa-body">Escalated to human owner</span>';
    }

    const highRisk = item.risk_level === 'high' || item.recommended_action === 'escalate';
    return [
      highRisk ? '' : reviewButton('approve-review', 'Approve', 'check_circle', item.id, 'primary'),
      reviewButton('request-review-changes', 'Request Changes', 'edit_note', item.id, 'secondary'),
      reviewButton('escalate-review', 'Escalate', 'priority_high', item.id, highRisk ? 'primary' : 'secondary')
    ].join('');
  }

  function reviewQueueBoard(items) {
    if (!items.length) {
      return '<div class="sa-empty">No review items are currently blocking package handoff.</div>';
    }

    return [
      '<section class="sa-review-board">',
      items.map((item) => [
        `<article class="sa-review-card sa-review-card--${escapeHtml(normalizeStatus(item.status))}">`,
        '<div class="sa-plan-card__head">',
        `<p class="sa-label">${escapeHtml(item.source)} / ${escapeHtml(item.platform)}</p>`,
        `<div class="sa-output-meta">${status(item.risk_level)}${status(item.status)}</div>`,
        '</div>',
        `<h4 class="sa-output-card__title">${escapeHtml(item.label)}</h4>`,
        `<p class="sa-body">${escapeHtml(item.source_quote)}</p>`,
        item.current_copy ? `<p class="sa-body"><strong>Current copy:</strong> ${escapeHtml(previewText(item.current_copy, 260))}</p>` : '',
        '<ul class="sa-list sa-list--compact">',
        `<li>${icon('rule')}<span><strong>Decision needed:</strong> ${escapeHtml(item.recommended_action)}</span></li>`,
        `<li>${icon('inventory_2')}<span><strong>Why queued:</strong> ${escapeHtml(item.source)} output requires approval before package handoff.</span></li>`,
        '</ul>',
        `<div class="sa-actions mt-3">${reviewActions(item)}</div>`,
        '</article>'
      ].join('')).join(''),
      '</section>'
    ].join('');
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
      [
        '<section class="sa-callout">',
        `<h3 class="sa-section-title">${icon('fact_check')} Human approval gate</h3>`,
        '<p class="sa-body">Review Queue is the safety gate between generated social output and package handoff. Plans, drafts, and community replies land here when they need approval, revision, or escalation before they can be exported.</p>',
        '</section>',
        reviewSummaryCards(data.review_queue),
        panel('Decision board', reviewQueueBoard(data.review_queue)),
        panel('Review items', table(['ID', 'Source', 'Channel', 'Risk', 'Action', 'Status', 'Source quote'], rows))
      ].join('')
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

  function draftById(draftId) {
    return currentData && currentData.drafts && currentData.drafts.drafts
      ? currentData.drafts.drafts.find((item) => item.id === draftId)
      : null;
  }

  function draftEditorFor(draftId) {
    return Array.from(document.querySelectorAll('[data-draft-editor]'))
      .find((element) => element.dataset.draftEditor === draftId);
  }

  function syncDraftReviewItem(draft) {
    if (!currentData || !Array.isArray(currentData.review_queue)) {
      return;
    }

    const reviewItem = currentData.review_queue.find((item) => item.source === 'draft' && item.platform === draft.platform);
    if (!reviewItem) {
      return;
    }

    reviewItem.label = draft.hook;
    reviewItem.risk_level = draft.risk_level;
    reviewItem.recommended_action = 'review';
    reviewItem.status = 'needs_review';
    reviewItem.source_quote = draft.source_quote;
    reviewItem.current_copy = draft.body;
  }

  function saveDraftEdit(draftId) {
    const draft = draftById(draftId);
    const editor = draftEditorFor(draftId);
    if (!draft || !editor) {
      setMessage('Draft editor not found.', 'error');
      return;
    }

    const nextBody = editor.value.trim();
    if (!nextBody) {
      setMessage('Draft copy cannot be empty.', 'error');
      return;
    }

    draft.body = nextBody;
    draft.status = 'needs_review';
    draft.approval_required = true;
    syncDraftReviewItem(draft);
    updatePackageApprovalState();
    editingDraftId = '';
    render(currentData);
    setMessage(`${draft.platform.toUpperCase()} draft saved and returned to review.`, 'success');
  }

  async function handleAction(action, element) {
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

    if (action === 'copy-draft') {
      const draftId = element && element.dataset ? element.dataset.draftId : '';
      const draft = draftById(draftId);
      if (!draft) {
        setMessage('Draft not found.', 'error');
        return;
      }
      await copyText(draft.body);
      setMessage(`${draft.platform.toUpperCase()} final copy copied.`, 'success');
      return;
    }

    if (action === 'edit-draft') {
      editingDraftId = element && element.dataset ? element.dataset.draftId : '';
      render(currentData);
      setMessage('Draft is editable. Save returns it to review.', 'neutral');
      return;
    }

    if (action === 'cancel-draft-edit') {
      editingDraftId = '';
      render(currentData);
      setMessage('Draft edit canceled.', 'neutral');
      return;
    }

    if (action === 'save-draft-edit') {
      saveDraftEdit(element && element.dataset ? element.dataset.draftId : '');
      return;
    }

    if (['approve-review', 'request-review-changes', 'escalate-review'].includes(action)) {
      applyReviewDecision(action, element && element.dataset ? element.dataset.reviewId : '');
      return;
    }

    if (action === 'reset-demo') {
      storageClear();
      currentData = await fetchDemoData({ reset: true });
      editingDraftId = '';
      render(currentData);
      setMessage('Demo inputs reset.', 'success');
      return;
    }

    if (action === 'reset-plan-filters') {
      planFilter = { platform: 'all', status: 'all', risk: 'all', approval: 'all' };
      render(currentData);
    }
  }

  function bindActions() {
    document.querySelectorAll('[data-action]').forEach((element) => {
      element.addEventListener('click', async () => {
        try {
          await handleAction(element.dataset.action, element);
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
        editingDraftId = '';
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

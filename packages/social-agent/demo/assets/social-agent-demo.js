(function () {
  'use strict';

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

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function routeName() {
    const parts = window.location.pathname
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

  function commandBar(commands) {
    return [
      '<section class="sa-command-bar">',
      '<div>',
      '<p class="sa-label">Reproducible commands</p>',
      '<div class="flex flex-wrap gap-2">',
      commands.map(command).join(''),
      '</div>',
      '</div>',
      button('/api/demo', 'Open JSON', 'data_object', 'secondary'),
      '</section>'
    ].join('');
  }

  function layout(title, subtitle, actions, body) {
    return [
      '<div class="sa-view" data-social-agent-app="true">',
      hero(title, subtitle, actions),
      body,
      '</div>'
    ].join('');
  }

  function renderOverview(data) {
    const summary = data.summary;
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
        button('/plan', 'Open Plan', 'event_note', 'primary'),
        button('/review-queue', 'Review Queue', 'fact_check', 'secondary')
      ].join(''),
      [
        '<section class="sa-grid">',
        card('Planned posts', escapeHtml(summary.planned_posts), 'LinkedIn and X items generated from the same source context.', true),
        card('Drafts', escapeHtml(summary.drafts), 'Platform-specific copy variants ready for review.', false),
        card('Moderation reports', escapeHtml(summary.moderation_reports), 'Community inputs classified by risk and action.', false),
        card('Review queue', escapeHtml(summary.review_queue_items), 'Items requiring approval or escalation.', true),
        '</section>',
        commandBar(['npm run demo:build', 'npm start', 'node bin/cli.js plan --input <file> --output out/plan.json']),
        panel('Current review queue', table(['ID', 'Source', 'Channel', 'Risk', 'Status'], queueRows))
      ].join('')
    );
  }

  function renderWorkspace(data) {
    const commands = [
      'node bin/cli.js plan --input demo/social-agent-source.md --output out/plan.json',
      'node bin/cli.js draft --input demo/social-agent-source.md --output out/drafts.json',
      'node bin/cli.js moderate --input comments.txt --output out/moderation.json'
    ];

    return layout(
      'Workspace',
      'The workspace shows the source context, CLI commands, and deterministic package outputs used by every screen.',
      button('/api/demo', 'Inspect Payload', 'data_object', 'primary'),
      [
        commandBar(commands),
        '<section class="sa-grid sa-grid--wide">',
        card('Source topic', escapeHtml(data.summary.topic), data.source.preview, true),
        card('Content pillar', escapeHtml(data.summary.content_pillar), 'Derived from the source context by the package domain helpers.', false),
        card('Risk posture', status(data.summary.risk_level), 'The same risk metadata drives plan, drafts, and review queue.', false),
        '</section>',
        panel('Package contract', `<pre class="sa-code">${escapeHtml(JSON.stringify({
          type: data.type,
          schema_version: data.schema_version,
          package: data.package,
          settings: data.settings
        }, null, 2))}</pre>`)
      ].join('')
    );
  }

  function renderPlan(data) {
    const rows = data.plan.items.map((item) => [
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
        button('/drafts', 'Open Drafts', 'drafts', 'primary'),
        button('/api/demo', 'JSON Payload', 'data_object', 'secondary')
      ].join(''),
      [
        commandBar(['node bin/cli.js plan --input <path> --output out/plan.json', 'node bin/cli.js plan --input <path> --output out/plan.json --dry-run']),
        panel('Plan items', table(['Day', 'Platform', 'Topic and CTA', 'Pillar', 'Risk', 'Status'], rows))
      ].join('')
    );
  }

  function renderDrafts(data) {
    const drafts = data.drafts.drafts.map((draft) => [
      '<article class="sa-card sa-card--accent">',
      `<p class="sa-label">${escapeHtml(draft.platform)}</p>`,
      `<h3 class="sa-value">${escapeHtml(draft.hook)}</h3>`,
      `<p class="sa-body">${escapeHtml(draft.body)}</p>`,
      `<ul class="sa-list"><li>${icon('campaign')}<span>${escapeHtml(draft.cta)}</span></li><li>${icon('source')}<span>${escapeHtml(draft.source_quote)}</span></li></ul>`,
      `<div class="sa-actions mt-3">${status(draft.risk_level)}${status(draft.status)}</div>`,
      '</article>'
    ].join('')).join('');

    return layout(
      'Drafts',
      'Platform-specific draft variants generated from the same source quote, with review metadata preserved.',
      button('/review-queue', 'Review Drafts', 'fact_check', 'primary'),
      [
        commandBar(['node bin/cli.js draft --input <path> --output out/drafts.json']),
        `<section class="sa-grid sa-grid--wide">${drafts}</section>`
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
      button('/review-queue', 'Open Queue', 'queue_play_next', 'primary'),
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
      button('/packages', 'Package Approved Work', 'inventory_2', 'primary'),
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
        button('/api/demo', 'Open Package JSON', 'data_object', 'primary'),
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
    return layout(
      'Settings',
      'MVP settings are explicit so the standalone demo cannot be mistaken for an external automation integration.',
      button('/api/demo', 'Inspect Settings JSON', 'data_object', 'primary'),
      [
        '<section class="sa-grid">',
        card('Platforms', escapeHtml(data.settings.platforms.join(', ')), 'First supported social channels.', true),
        card('Deterministic mode', status(String(data.settings.deterministic_mode)), 'Same input produces the same output.', false),
        card('LLM API calls', status(String(data.settings.llm_api_calls)), 'Deferred until explicitly added.', false),
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

  function wireNavigation(activeRoute) {
    document.querySelectorAll('nav a').forEach((link) => {
      const text = link.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
      const route = Object.keys(NAV_LABELS).find((name) => NAV_LABELS[name].toLowerCase() === text);
      if (!route) {
        return;
      }

      link.href = ROUTES[route];
      link.setAttribute('aria-current', route === activeRoute ? 'page' : 'false');
    });
  }

  function render(data) {
    const route = routeName();
    const main = document.querySelector('main');
    wireNavigation(route);

    if (!main) {
      return;
    }

    main.innerHTML = renderRoute(route, data);
  }

  fetch('/api/demo', { headers: { accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Demo API returned ${response.status}`);
      }
      return response.json();
    })
    .then(render)
    .catch(() => {
      // Static file previews can run without the local demo API.
    });
}());

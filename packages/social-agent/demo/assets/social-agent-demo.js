(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function status(value) {
    const normalized = String(value || 'ready').replace(/[^a-z0-9_ -]/gi, '').replace(/\s+/g, '_').toLowerCase();
    return `<span class="sa-package-demo__status sa-package-demo__status--${escapeHtml(normalized)}">${escapeHtml(value)}</span>`;
  }

  function tile(label, value, body) {
    return [
      '<article class="sa-package-demo__tile">',
      `<p class="sa-package-demo__label">${escapeHtml(label)}</p>`,
      `<p class="sa-package-demo__value">${value}</p>`,
      body ? `<p class="sa-package-demo__body">${escapeHtml(body)}</p>` : '',
      '</article>'
    ].join('');
  }

  function routeName() {
    const name = window.location.pathname.replace(/^\/+/, '').replace(/\.html$/, '').replace(/\/+$/, '');
    return name || 'overview';
  }

  function viewTiles(route, data) {
    if (route === 'plan') {
      return data.plan.items.map((item) => tile(
        `${item.platform} / ${item.suggested_day}`,
        escapeHtml(item.topic),
        `${item.content_pillar} - ${item.format} - ${item.status}`
      )).join('');
    }

    if (route === 'drafts') {
      return data.drafts.drafts.map((draft) => tile(
        draft.platform,
        escapeHtml(draft.hook),
        `${draft.status} - ${draft.body.slice(0, 120)}`
      )).join('');
    }

    if (route === 'moderation') {
      return data.moderation.reports.map((report) => tile(
        report.classification,
        status(report.recommended_action),
        `${report.risk_level} risk - ${report.source_quote}`
      )).join('');
    }

    if (route === 'review-queue') {
      return data.review_queue.map((item) => tile(
        item.source,
        status(item.status),
        `${item.platform} - ${item.recommended_action} - ${item.source_quote}`
      )).join('');
    }

    if (route === 'packages') {
      return data.packages.map((item) => tile(
        item.id,
        status(item.status),
        `Includes ${item.includes.join(', ')} as ${item.format}.`
      )).join('');
    }

    if (route === 'writeback') {
      return tile(data.writeback.mode, status(data.writeback.status), data.writeback.message);
    }

    if (route === 'settings') {
      return [
        tile('Platforms', escapeHtml(data.settings.platforms.join(', ')), 'First supported channels.'),
        tile('Deterministic mode', status(String(data.settings.deterministic_mode)), 'No LLM or API dependency in the MVP.'),
        tile('Direct publishing', status(String(data.settings.direct_publishing)), 'Publishing remains review-only.')
      ].join('');
    }

    if (route === 'workspace') {
      return [
        tile('Source', escapeHtml(data.summary.topic), data.summary.source_quote),
        tile('Review queue', escapeHtml(data.summary.review_queue_items), 'Generated from plan, drafts, and moderation reports.'),
        tile('Risk', status(data.summary.risk_level), data.summary.content_pillar)
      ].join('');
    }

    return [
      tile('Planned posts', escapeHtml(data.summary.planned_posts), 'LinkedIn and X calendar items.'),
      tile('Drafts', escapeHtml(data.summary.drafts), 'Platform-specific draft package.'),
      tile('Moderation', escapeHtml(data.summary.moderation_reports), 'Batch comment classification.'),
      tile('Review queue', escapeHtml(data.summary.review_queue_items), 'Items requiring review or escalation.')
    ].join('');
  }

  function render(data) {
    if (document.querySelector('.sa-package-demo')) {
      return;
    }

    const route = routeName();
    const section = document.createElement('section');
    section.className = 'sa-package-demo';
    section.innerHTML = [
      '<div class="sa-package-demo__inner">',
      '<div class="sa-package-demo__header">',
      '<div>',
      '<p class="sa-package-demo__eyebrow">Package output</p>',
      `<h2 class="sa-package-demo__title">${escapeHtml(data.package.name)} ${escapeHtml(data.package.version)}</h2>`,
      `<p class="sa-package-demo__meta">${escapeHtml(data.type)} - ${escapeHtml(data.schema_version)}</p>`,
      '</div>',
      status(data.summary.risk_level),
      '</div>',
      `<div class="sa-package-demo__grid">${viewTiles(route, data)}</div>`,
      '</div>'
    ].join('');

    document.body.appendChild(section);
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

(function () {
  'use strict';

  console.log('Context Narrate UI initialized');

  /* ═══════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════ */
  function $(id) { return document.getElementById(id); }
  function $q(sel) { return document.querySelector(sel); }
  function $qa(sel) { return document.querySelectorAll(sel); }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function badge(text, cls) {
    return '<span class="badge badge-' + (cls||'gray') + '">' + esc(text) + '</span>';
  }

  function roleBadge(role) {
    var r = (role||'').toLowerCase();
    return '<span class="badge badge-' + r + '">' + r.toUpperCase() + '</span>';
  }

  function fmt(sec) {
    var s = Number(sec) || 0;
    return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  }

  function setHTML(id, html) {
    var el = $(id);
    if (el) el.innerHTML = html;
  }

  var EMPTY = 'Demo output not generated yet.<br>Run in your terminal:<br><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">npm run demo:all</code>';

  function setEmpty(id) { setHTML(id, '<div class="empty-state">' + EMPTY + '</div>'); }

  /* ── Toast ───────────────────────────────────── */
  var toast = (function () {
    var el = document.createElement('div');
    el.id = 'cn-toast';
    el.style.cssText = [
      'position:fixed','bottom:24px','right:24px','z-index:9999',
      'background:#18181b','color:#fff','font-family:Inter,sans-serif',
      'font-size:13px','font-weight:500','padding:12px 20px',
      'border-radius:8px','box-shadow:0 4px 16px rgba(0,0,0,.2)',
      'opacity:0','transition:opacity .2s ease','pointer-events:none'
    ].join(';');
    document.body.appendChild(el);

    return function (msg, isError) {
      el.style.background = isError ? '#7f1d1d' : '#18181b';
      el.textContent = msg;
      el.style.opacity = '1';
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.style.opacity = '0'; }, 3000);
    };
  }());

  /* ── Fetch helper ────────────────────────────── */
  function get(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r;
    });
  }

  /* ═══════════════════════════════════════════════════
     NAVIGATION
  ═══════════════════════════════════════════════════ */
  var PANEL_META = {
    wiki:   { title: 'Wiki Repository',       sub: 'Verified academic source manuscripts' },
    source: { title: 'Source Mapping',         sub: 'LLM extraction logic with traceability' },
    script: { title: 'Script & Roles',         sub: 'Voice assignment and segment timeline' },
    audio:  { title: 'Audio Learning Center',  sub: 'Synthesized narration and show notes' }
  };

  function switchPanel(key) {
    if (!PANEL_META[key]) return;
    $qa('.sidebar-item').forEach(function (a) { a.classList.remove('active'); });
    $qa('.panel').forEach(function (p) { p.classList.remove('active'); });

    var link = $q('[data-panel="' + key + '"]');
    if (link) link.classList.add('active');

    var panel = $('panel-' + key);
    if (panel) panel.classList.add('active');

    var meta = PANEL_META[key];
    setHTML('panel-title', esc(meta.title));
    setHTML('panel-sub',   esc(meta.sub));

    toast('Switched to ' + meta.title);
  }

  // Sidebar nav clicks
  $qa('.sidebar-item').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      switchPanel(a.dataset.panel);
    });
  });

  // Reload Data button
  var btnRefresh = $('btn-refresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
      toast('Reloading data…');
      loadAll();
    });
  }

  /* ═══════════════════════════════════════════════════
     WIKI PANEL
  ═══════════════════════════════════════════════════ */
  function metric(label, value, subHtml) {
    return '<div class="metric-card">' +
      '<div class="metric-label">' + esc(label) + '</div>' +
      '<div class="metric-value">' + value + '</div>' +
      '<div class="metric-sub">' + (subHtml||'') + '</div>' +
    '</div>';
  }

  function loadWiki() {
    get('../sample-wiki.json')
      .then(function (r) { return r.json(); })
      .then(function (w) {
        var sections = (w.symptoms  || []).length;
        var refs     = (w.references|| []).length;

        setHTML('wiki-metrics',
          metric('Document',   esc(w.title||'—'), '') +
          metric('Sections',   sections, sections + ' key points') +
          metric('References', refs, badge('Verified','green'))
        );

        var sectionChips = (w.symptoms||[]).map(function(s){ return badge(s,'blue'); }).join(' ');
        var refRows = (w.references||[]).map(function(r){
          return '<span style="display:block;font-size:12px;color:var(--on-surface-variant)">→ ' + esc(r) + '</span>';
        }).join('');

        // Quick-nav shortcut buttons
        var shortcuts =
          '<div style="display:flex;gap:8px;margin-top:var(--space-md)">' +
            '<button class="btn btn-secondary-blue" id="btn-goto-source">View Sources</button>' +
            '<button class="btn btn-secondary-blue" id="btn-goto-script">View Script</button>' +
            '<button class="btn btn-secondary-green" id="btn-goto-audio">Play Audio</button>' +
          '</div>';

        setHTML('wiki-detail',
          '<div class="card-heading">' + esc(w.title||'Document') + badge('Verified Source','green') + '</div>' +
          '<p style="font-size:13px;color:var(--on-surface-variant);margin-bottom:var(--space-md);line-height:1.6">' +
            esc((w.content||'').substring(0,280)) + (w.content && w.content.length>280?'…':'') +
          '</p>' +
          '<hr class="divider">' +
          '<div style="display:flex;gap:var(--space-xl);flex-wrap:wrap">' +
            '<div><div style="font-size:11px;font-weight:500;color:var(--on-surface-variant);margin-bottom:6px">SECTIONS</div>' +
              '<div style="display:flex;gap:6px;flex-wrap:wrap">' + (sectionChips||badge('None','gray')) + '</div>' +
            '</div>' +
            '<div><div style="font-size:11px;font-weight:500;color:var(--on-surface-variant);margin-bottom:6px">SOURCES</div>' +
              '<div style="display:flex;flex-direction:column;gap:3px">' + (refRows||'—') + '</div>' +
            '</div>' +
          '</div>' +
          shortcuts
        );

        // Wire shortcut buttons (they appear after setHTML so bind now)
        bindShortcut('btn-goto-source', 'source');
        bindShortcut('btn-goto-script', 'script');
        bindShortcut('btn-goto-audio',  'audio');
      })
      .catch(function (err) {
        console.error('[Wiki]', err);
        setHTML('wiki-metrics', '');
        setEmpty('wiki-detail');
        toast('Could not load sample-wiki.json', true);
      });
  }

  function bindShortcut(id, panelKey) {
    var btn = $(id);
    if (!btn) return;
    btn.addEventListener('click', function () {
      switchPanel(panelKey);
      // If audio panel: try to play
      if (panelKey === 'audio') {
        setTimeout(function () {
          var audioEl = $q('audio');
          if (audioEl) {
            audioEl.play().catch(function () {
              toast('Click play button to start audio', false);
            });
          }
        }, 200);
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     SOURCE MAPPING PANEL
  ═══════════════════════════════════════════════════ */
  function loadSource() {
    get('../output/segments.json')
      .then(function (r) { return r.json(); })
      .then(function (segs) {
        var total    = segs.length;
        var verified = segs.filter(function(s){ return s.verified; }).length;
        var withSrc  = segs.filter(function(s){ return s.sourceRefs && s.sourceRefs.length; }).length;

        setHTML('source-metrics',
          metric('Total Segments', total, '') +
          metric('Verified', verified + ' / ' + total,
            badge(verified===total ? '100% Verified' : 'Partial', verified===total ? 'green' : 'error')) +
          metric('Sourced', withSrc + ' / ' + total,
            badge(withSrc===total ? 'Fully Traceable' : 'Gaps found', withSrc===total ? 'green' : 'error'))
        );

        var rows = segs.map(function(s) {
          var srcTags = (s.sourceRefs||[]).map(function(r){ return badge(r,'blue'); }).join(' ');
          var verBadge = s.verified ? badge('✓ Verified','green') : badge('Unverified','error');
          return '<tr>' +
            '<td style="white-space:nowrap">' + esc(s.id) + '</td>' +
            '<td style="max-width:280px">' + esc(s.text.substring(0,80)) + (s.text.length>80?'…':'') + '</td>' +
            '<td>' + (srcTags||badge('No source','error')) + '</td>' +
            '<td>' + verBadge + '</td>' +
          '</tr>';
        }).join('');

        setHTML('source-table-wrap',
          '<div class="card-heading">Segment Traceability</div>' +
          '<div style="overflow-x:auto"><table class="data-table">' +
            '<thead><tr><th>ID</th><th>Text</th><th>Sources</th><th>Status</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table></div>'
        );
      })
      .catch(function (err) {
        console.error('[Source]', err);
        setHTML('source-metrics', '');
        setEmpty('source-table-wrap');
        toast('Could not load segments.json', true);
      });
  }

  /* ═══════════════════════════════════════════════════
     SCRIPT & ROLES PANEL
  ═══════════════════════════════════════════════════ */
  function loadScript() {
    get('../output/segments.json')
      .then(function (r) { return r.json(); })
      .then(function (segs) {
        var roles = [];
        segs.forEach(function(s){ if(roles.indexOf(s.role)<0) roles.push(s.role); });
        var roleBadges = roles.map(roleBadge).join(' ');

        var items = segs.map(function(s) {
          return '<div class="script-item">' +
            '<div class="script-item-header">' +
              roleBadge(s.role) +
              '<span style="font-size:11px;color:var(--on-surface-variant)">' +
                esc(s.section.replace(/_/g,' ').toUpperCase()) +
              '</span>' +
              '<span class="script-item-time">' + fmt(s.estimatedStartSec) + ' – ' + fmt(s.estimatedEndSec) + '</span>' +
            '</div>' +
            '<div class="script-item-text">' + esc(s.text) + '</div>' +
          '</div>';
        }).join('');

        setHTML('script-content',
          '<div class="card-heading">Active Roles <span style="display:inline-flex;gap:6px;flex-wrap:wrap">' + roleBadges + '</span></div>' +
          '<hr class="divider">' +
          items
        );
      })
      .catch(function (err) {
        console.error('[Script]', err);
        setEmpty('script-content');
        toast('Could not load segments.json', true);
      });
  }

  /* ═══════════════════════════════════════════════════
     AUDIO LEARNING PANEL
  ═══════════════════════════════════════════════════ */
  function loadAudio() {
    var tProm  = get('../output/transcript.md').then(function(r){ return r.text(); }).catch(function(){ return null; });
    var snProm = get('../output/show-notes.md').then(function(r){ return r.text(); }).catch(function(){ return null; });

    Promise.all([tProm, snProm]).then(function(res) {
      var transcript = res[0];
      var showNotes  = res[1];

      if (!transcript && !showNotes) {
        setEmpty('audio-content');
        setEmpty('shownotes-content');
        return;
      }

      /* Transcript preview */
      var previewLines = transcript
        ? transcript.split('\n')
            .filter(function(l){ return l.trim() && !l.startsWith('#'); })
            .slice(0,8).join('\n')
        : null;

      var transcriptHtml = previewLines
        ? '<div class="transcript-block">' + esc(previewLines) + '</div>'
        : '<div class="empty-state" style="font-size:12px">transcript.md not found</div>';

      setHTML('audio-content',
        '<h3>Narration Output</h3>' +
        '<audio id="main-audio" controls>' +
          '<source src="../output/audio.mp3" type="audio/mpeg">' +
          'Your browser does not support audio.' +
        '</audio>' +
        '<div style="margin-top:var(--space-md)">' +
          '<div class="card-heading">Transcript Preview ' +
            '<button class="btn btn-secondary-blue" id="btn-goto-source-from-audio" style="margin-left:auto">View Sources</button>' +
          '</div>' +
          transcriptHtml +
        '</div>'
      );

      // Wire "View Sources" from audio panel
      bindShortcut('btn-goto-source-from-audio', 'source');

      /* Show notes */
      if (showNotes) {
        var snHtml = showNotes
          .replace(/^### (.*)/gm, '<h3 style="font-size:13px;font-weight:600;color:var(--on-surface);margin:10px 0 4px">$1</h3>')
          .replace(/^## (.*)/gm,  '<h2 style="font-size:14px;font-weight:700;color:var(--on-surface);margin:14px 0 6px">$1</h2>')
          .replace(/^# (.*)/gm,   '<h1 style="font-size:16px;font-weight:700;color:var(--primary);margin:0 0 12px">$1</h1>')
          .replace(/^- (.*)/gm,   '<li>$1</li>')
          .replace(/((<li>.*<\/li>\n?)+)/g, '<ul style="padding-left:16px;margin-bottom:8px">$1</ul>')
          .replace(/\n/g, '');

        setHTML('shownotes-content',
          '<div class="shownotes-title">Show Notes</div>' +
          '<div class="shownotes-body">' + snHtml + '</div>'
        );
      } else {
        setEmpty('shownotes-content');
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     LOAD ALL
  ═══════════════════════════════════════════════════ */
  function loadAll() {
    loadWiki();
    loadSource();
    loadScript();
    loadAudio();
  }

  loadAll();

}());

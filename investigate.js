// Investigate module: SYSTEM HEALTH (#panel-health) and the INVESTIGATE stage (#panel-investigate).
(function () {
  'use strict';
  const BOT = window.BOT;
  if (!BOT) return;
  const F = BOT.facts || window.BOT_FACTS;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : a));
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function add(el, kids) {
    if (kids == null) return el;
    (Array.isArray(kids) ? kids : [kids]).forEach(k => {
      if (k == null || k === false) return;
      el.append(k.nodeType ? k : document.createTextNode(String(k)));
    });
    return el;
  }
  function h(tag, cls, kids, attrs) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) for (const key in attrs) if (attrs[key] != null) el.setAttribute(key, attrs[key]);
    return add(el, kids);
  }
  function icon(markup, cls) { const span = h('span', cls, null, { 'aria-hidden': 'true' }); span.innerHTML = markup; return span; }
  function restartClass(el, cls, ms) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    if (ms) setTimeout(() => el.classList.remove(cls), ms);
  }

  /* ───────────────────────── SYSTEM HEALTH ───────────────────────── */
  const KEYS = ['gateway', 'checkin', 'boarding', 'flightops', 'crew', 'notify'];
  const LABEL = { ok: 'OK', degraded: 'DEGRADED', down: 'DOWN' };
  const HIST = 40;
  const tiles = {};
  const mets = {};
  let healthSummary = null;
  let lastTick = performance.now();
  let tickMs = 250;
  const palette = { ok: '#2ee59d', degraded: '#ffb020', down: '#ff3b52' };

  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    [['ok', '--ok'], ['degraded', '--warn'], ['down', '--crit']].forEach(([k, v]) => {
      const val = cs.getPropertyValue(v).trim();
      if (val) palette[k] = val;
    });
  }

  function buildHealth() {
    const root = document.getElementById('panel-health');
    if (!root) return;
    readPalette();
    const wrap = h('div', 'bh-wrap');
    healthSummary = h('span', 'bh-summary', '6/6 OK', { 'data-level': 'ok' });
    wrap.append(h('div', 'bh-head', [h('h2', 'panel-title', 'System health'), healthSummary]));

    const list = h('div', 'bh-list', null, { role: 'list' });
    const names = F.services;
    KEYS.forEach(key => {
      const dot = h('span', 'bh-dot');
      const name = h('span', 'bh-name', names[key] || key);
      const pill = h('span', 'bh-pill', 'OK');
      const fill = h('i', 'bh-fill');
      const pct = h('span', 'bh-pct', '100%');
      const canvas = h('canvas', 'bh-spark', null, { 'aria-hidden': 'true' });
      const el = h('div', 'bh-tile', [
        h('div', 'bh-left', [
          h('div', 'bh-top', [dot, name, pill]),
          h('div', 'bh-bar', [h('div', 'bh-gauge', fill), pct]),
        ]),
        h('div', 'bh-spark-wrap', canvas),
      ], { role: 'listitem', 'data-status': 'ok' });
      list.append(el);
      tiles[key] = { el, name, pill, fill, pct, canvas, ctx: canvas.getContext('2d'), w: 0, h: 0, status: 'ok', health: 1, shownPct: '', hist: new Array(HIST).fill(0.68), beat: [] };
    });
    wrap.append(list);

    const metricDefs = [
      ['traffic', 'Traffic'], ['latency', 'P95 latency'], ['errors', 'Error rate'],
    ];
    const row = h('div', 'bh-metrics');
    metricDefs.forEach(([id, label]) => {
      const value = h('b', 'bh-mval', '', null);
      const meter = h('i', 'bh-mfill');
      const cell = h('div', 'bh-metric', [h('span', 'bh-mlabel', label), value, h('div', 'bh-meter', meter)], { 'data-level': 'ok' });
      row.append(cell);
      mets[id] = { cell, value, meter, shown: null, text: '', level: '' };
    });
    wrap.append(row);
    root.append(wrap);

    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(entries => entries.forEach(entry => {
        const t = Object.values(tiles).find(x => x.canvas === entry.target);
        if (t) sizeCanvas(t);
      }));
      Object.values(tiles).forEach(t => ro.observe(t.canvas));
    }
    Object.values(tiles).forEach(sizeCanvas);
    updateHealth(false);
    seedHistory();
    requestAnimationFrame(frame);
  }

  function sizeCanvas(t) {
    const rect = t.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width)), hh = Math.max(1, Math.round(rect.height));
    if (w === t.w && hh === t.h) return;
    t.w = w; t.h = hh;
    t.canvas.width = Math.round(w * dpr);
    t.canvas.height = Math.round(hh * dpr);
    t.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Plot values are 0..1 of the canvas height; healthy sits at ~70% so heartbeat blips have headroom.
  function nextSample(t) {
    if (t.beat.length) return t.beat.shift();
    const health = t.health, base = health * 0.68;
    if (health > 0.85 && Math.random() < 0.05) { t.beat = [base - 0.08, base + 0.26, base - 0.03]; return base + 0.02; }
    const amp = 0.04 + (1 - health) * 0.34;
    let v = base + (Math.random() - 0.5) * amp;
    if (health < 0.2 && Math.random() < 0.18) v = Math.random() * 0.1;
    return clamp(v);
  }
  function seedHistory() {
    KEYS.forEach(k => { const t = tiles[k]; t.beat = []; t.hist = Array.from({ length: HIST }, () => nextSample(t)); });
  }

  function levelOf(status) { return status === 'down' ? 'crit' : status === 'degraded' ? 'warn' : 'ok'; }

  function updateHealth(push) {
    const S = BOT.state;
    let okCount = 0, down = 0;
    KEYS.forEach(k => {
      const t = tiles[k];
      const sv = S.services && S.services[k];
      if (!t || !sv) return;
      const health = clamp(sv.health, 0, 1);
      const status = sv.status || 'ok';
      if (status === 'ok') okCount++;
      if (status === 'down') down++;
      if (t.status !== status) {
        t.status = status;
        t.el.dataset.status = status;
        t.pill.textContent = LABEL[status] || status.toUpperCase();
      }
      if (sv.name && t.name.textContent !== sv.name) t.name.textContent = sv.name;
      t.health = health;
      const pct = Math.round(health * 100) + '%';
      if (pct !== t.shownPct) {
        t.shownPct = pct;
        t.pct.textContent = pct;
        t.fill.style.transform = 'scaleX(' + Math.max(0.02, health).toFixed(3) + ')';
      }
      if (push) { t.hist.push(nextSample(t)); if (t.hist.length > HIST) t.hist.shift(); }
    });
    if (healthSummary) {
      const text = okCount + '/' + KEYS.length + ' OK';
      if (healthSummary.textContent !== text) healthSummary.textContent = text;
      healthSummary.dataset.level = down ? 'crit' : okCount < KEYS.length ? 'warn' : 'ok';
    }
  }

  function drawSpark(t, progress) {
    if (!t.w) { sizeCanvas(t); if (!t.w) return; }
    const { ctx, w, h: hh, hist } = t;
    const col = palette[t.status] || palette.ok;
    ctx.clearRect(0, 0, w, hh);
    const pad = 3, n = hist.length;
    const step = w / (HIST - 2);
    const off = reduceMotion() ? 0 : progress * step;
    const xy = i => [w - (n - 1 - i) * step - off, pad + (1 - hist[i]) * (hh - pad * 2)];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < n; i++) { const [x, y] = xy(i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    const [lx, ly] = xy(n - 1);
    ctx.lineTo(w, ly);
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.shadowColor = col; ctx.shadowBlur = t.status === 'ok' ? 3 : 7;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineTo(w, hh); ctx.lineTo(xy(0)[0], hh); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, col + '30'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(w - 1.5, ly, 2, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
  }

  function fmtLatency(ms) { return ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : Math.round(ms) + ' ms'; }
  function updateMetrics() {
    const m = BOT.state.metrics || {};
    const defs = {
      traffic: { target: m.trafficX, fmt: v => v.toFixed(1) + 'x', lvl: v => v < 2.5 ? 'ok' : v < 6 ? 'warn' : 'crit', fill: v => v / 12 },
      latency: { target: m.latencyMs, fmt: fmtLatency, lvl: v => v < 500 ? 'ok' : v < 2000 ? 'warn' : 'crit', fill: v => Math.log10(Math.max(100, v) / 100) / 2 },
      errors: { target: m.errorRate, fmt: v => (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%', lvl: v => v < 0.03 ? 'ok' : v < 0.15 ? 'warn' : 'crit', fill: v => v / 0.5 },
    };
    for (const id in defs) {
      const d = defs[id], o = mets[id];
      if (!o || !Number.isFinite(d.target)) continue;
      if (o.shown == null || reduceMotion()) o.shown = d.target;
      else {
        const diff = d.target - o.shown;
        o.shown = Math.abs(diff) < Math.abs(d.target) * 0.004 + 1e-4 ? d.target : o.shown + diff * 0.16;
      }
      const text = d.fmt(o.shown);
      if (text !== o.text) { o.text = text; o.value.textContent = text; }
      const level = d.lvl(o.shown);
      if (level !== o.level) { o.level = level; o.cell.dataset.level = level; }
      o.meter.style.transform = 'scaleX(' + clamp(d.fill(o.shown)).toFixed(3) + ')';
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const p = clamp((now - lastTick) / tickMs, 0, 1);
    for (const k of KEYS) drawSpark(tiles[k], p);
    updateMetrics();
  }

  function healthTick() {
    const now = performance.now();
    tickMs = clamp(now - lastTick, 100, 1000);
    lastTick = now;
    updateHealth(true);
  }

  /* ───────────────────────── INVESTIGATION ───────────────────────── */
  const ICONS = {
    change: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1.6"/><rect x="3" y="14" width="18" height="6" rx="1.6"/><path d="M7 7h.01M7 17h.01M12 7h5M12 17h5"/></svg>',
    monitoring: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg>',
    github: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
    check: '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
    merge: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="4" cy="3.5" r="1.7"/><circle cx="4" cy="12.5" r="1.7"/><circle cx="12" cy="9" r="1.7"/><path d="M4 5.2v5.6M12 7.3C12 5 9 5 6.5 5 5.4 5 4.6 5 4 5.2"/></svg>',
    chev: '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5l3 3 3-3"/></svg>',
    warn: '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 1.2l7 12.6H1L8 1.2zm-.7 4.8v3.8h1.4V6H7.3zm0 4.9v1.4h1.4v-1.4H7.3z"/></svg>',
    revert: '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5h6a3.5 3.5 0 010 7H6M3 6.5l2.6-2.6M3 6.5l2.6 2.6"/></svg>',
  };

  const chg = F.change, mon = F.monitoring;
  const deploy = (F.deploys || []).find(d => d.commit === chg.commit) || F.deploys[0];
  const prevGood = (F.deploys || [])[1];
  const kfmt = n => (n >= 1000 ? (n / 1000) + 'k' : String(n));
  const lat = ms => (ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : ms + ' ms');
  const pctf = r => Math.round(r * 100) + '%';
  const chip = (text, cls, title) => h('span', 'bi-chip' + (cls ? ' ' + cls : ''), text, title ? { title } : null);
  const shortGap = s => s.split(':')[0].replace(/\s*\(.*\)/, '');

  function buildDiff() {
    const box = h('div', 'bi-diff mono');
    let i = 0;
    chg.diff.forEach(file => {
      box.append(h('div', 'bi-dfile', file.path || file.file));
      file.lines.filter(l => l.t !== 'ctx').forEach(l => {
        const text = l.s.trim().replace(/\s{2,}#/, ' #');
        box.append(h('div', 'bi-dl ' + l.t, [h('i', null, l.t === 'add' ? '+' : '\u2212'), h('span', null, text)], { style: '--i:' + (i++) }));
      });
    });
    return box;
  }

  function timelineStep(time, label, cls) {
    return h('div', 'bi-tl-step' + (cls ? ' ' + cls : ''), [h('i'), h('b', 'mono', time), h('span', null, label)]);
  }

  function buildBars() {
    const heights = [0.08, 0.08, 0.09, 0.08, 0.08, 0.09, 0.3, 0.62, 0.9, 1, 0.97, 1];
    const bars = h('div', 'bi-bars', heights.map((v, i) => h('i', v > 0.2 ? 'hot' : '', null, { style: '--h:' + v + ';--i:' + i })));
    return h('div', 'bi-chart', [
      bars,
      h('div', 'bi-chart-lab', [
        h('span', 'mono', kfmt(mon.requestsPerSecNormal) + ' req/s'),
        h('span', 'bi-arrow', '\u2192'),
        h('b', 'mono hot', kfmt(mon.requestsPerSecPeak) + ' req/s'),
      ]),
    ]);
  }

  function ratioRow(label, normal, peak, fillRatio, peakText) {
    return h('div', 'bi-ratio', [
      h('div', 'bi-ratio-top', [h('span', null, label), h('b', 'mono', [normal ? normal + ' \u2192 ' : '', h('em', null, peakText)])]),
      h('div', 'bi-rbar', h('i', null, null, { style: '--r:' + clamp(fillRatio).toFixed(3) })),
    ]);
  }

  const CARDS = [
    {
      id: 'change', title: 'Infrastructure change', source: 'ops', ac: 'amber',
      toast: 'Clue found: gateway config disabled rate limiting and made retries unlimited',
      clues: [
        {
          title: 'Production deploy at ' + chg.deployedAt,
          build: () => h('div', null, [
            h('p', 'bi-line', ['Deploy ', h('b', 'mono', '#' + deploy.id), ' (', h('span', 'mono', chg.commit), ') hit ', chg.environment, ' just before the first alarms.']),
            h('div', 'bi-tl', [
              timelineStep(chg.mergedAt, 'merged'),
              timelineStep(chg.deployedAt, 'deployed', 'is-key'),
              timelineStep(mon.spikeAt, 'alarms', 'is-bad'),
            ]),
          ]),
        },
        {
          title: 'Gateway config files touched',
          build: () => h('div', null, [
            ...chg.files.map(f => {
              const cut = f.path.lastIndexOf('/') + 1;
              return h('div', 'bi-file', [
                h('span', 'bi-fpath mono', [h('span', null, f.path.slice(0, cut)), h('b', null, f.path.slice(cut))]),
                h('span', 'bi-fstat mono', [h('i', 'add', '+' + f.additions), h('i', 'del', '\u2212' + f.deletions)]),
              ]);
            }),
            h('p', 'bi-line dim', 'Infrastructure config only. No application code changed.'),
          ]),
        },
        {
          title: 'Limits off, retries unlimited',
          build: () => h('div', null, [
            buildDiff(),
            h('div', 'bi-risk', [icon(ICONS.warn), h('b', null, 'RETRY STORM RISK'), h('span', null, 'no rate limit \u00b7 no backoff')]),
          ]),
        },
      ],
    },
    {
      id: 'monitoring', title: 'Monitoring alerts', source: 'monitoring', ac: 'blue',
      toast: 'Monitoring confirms a retry storm: ~' + mon.avgRetriesPerRequest + ' retries per request',
      clues: [
        {
          title: 'Traffic spike at ' + mon.spikeAt,
          build: () => h('div', null, [buildBars()]),
        },
        {
          title: 'Latency ' + lat(mon.p95NormalMs) + ' \u2192 ' + lat(mon.p95PeakMs),
          build: () => h('div', null, [
            ratioRow('p95 latency', lat(mon.p95NormalMs), lat(mon.p95PeakMs), 1, lat(mon.p95PeakMs)),
            ratioRow('Check-in error rate', '', '', mon.checkinErrorRate, pctf(mon.checkinErrorRate)),
          ]),
        },
        {
          title: mon.avgRetriesPerRequest + ' retries per request',
          build: () => h('div', null, [
            h('div', 'bi-storm', [
              h('div', 'bi-storm-n mono', [String(mon.avgRetriesPerRequest), h('small', null, '\u00d7')]),
              h('div', 'bi-dots', Array.from({ length: mon.avgRetriesPerRequest }, (_, i) => h('i', null, null, { style: '--i:' + i }))),
            ]),
            h('p', 'bi-line', ['Avg retries per request from ', mon.source.replace(' retry storm', '') + '.']),
            h('div', 'bi-chips', [chip('RETRY STORM', 'bad')]),
          ]),
        },
      ],
    },
    {
      id: 'github', title: 'GitHub activity', source: 'github', ac: 'purple',
      toast: 'GitHub: PR #' + chg.pr + ' merged with one approval; config was never analysed',
      clues: [
        {
          title: 'PR #' + chg.pr + ' merged at ' + chg.mergedAt,
          build: () => h('div', null, [
            h('div', 'bi-pr', [
              icon(ICONS.merge, 'bi-pr-ico'),
              h('div', null, [
                h('div', 'bi-pr-title', ['#' + chg.pr + ' ', chg.title]),
                h('div', 'bi-pr-meta', ['by ', h('b', null, chg.author), ' \u00b7 merged ', chg.mergedAt]),
              ]),
            ]),
            h('div', 'bi-chips', [chip('1 approval \u00b7 ' + chg.approvedBy, 'ok')]),
          ]),
        },
        {
          title: 'Checks green, config never analysed',
          build: () => {
            const codeql = chg.checks.find(c => c.note);
            return h('div', null, [
              h('div', 'bi-checks', chg.checks.map(c => h('span', 'bi-check', [icon(ICONS.check), c.name.replace(/ \(.*\)/, '')]))),
              codeql ? h('p', 'bi-note', [icon(ICONS.warn), codeql.note]) : null,
              h('div', 'bi-chips', chg.gaps.map(g => chip(shortGap(g), 'warn', g))),
            ]);
          },
        },
        {
          title: 'Deploy #' + deploy.id + ' is the latest change',
          build: () => h('div', null, [
            h('div', 'bi-deploys', (F.deploys || []).map(d => h('div', 'bi-dep' + (d.id === deploy.id ? ' is-bad' : d === prevGood ? ' is-good' : ''), [
              h('b', 'mono', '#' + d.id),
              h('span', 'bi-dep-t', d.title),
              h('span', 'bi-dep-at mono', d.at),
            ]))),
            h('div', 'bi-hint', [icon(ICONS.revert), 'Previous good deploy #' + (prevGood ? prevGood.id : '') + ' \u00b7 one-click revert available']),
          ]),
        },
      ],
    },
  ];

  const cards = {};
  let banner = null, totalEl = null, wrapEl = null, bannerOn = false, epoch = 0, pendingFlash = false;
  const timers = new Set();
  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

  function buildInvestigate() {
    const root = document.getElementById('panel-investigate');
    if (!root) return;
    wrapEl = h('div', 'bi-wrap');
    banner = h('div', 'bi-banner', [
      h('i', 'bi-banner-dot'),
      h('b', null, 'ROOT CAUSE LIKELY:'),
      h('span', null, 'gateway config change (PR #' + chg.pr + ')'),
    ], { role: 'status', hidden: '' });
    totalEl = h('span', 'bi-total mono', '0/9 clues');
    wrapEl.append(h('div', 'bi-head', [
      h('h2', 'bi-title', ['Investigate', h('span', null, '\u00b7 find what changed')]),
      banner,
      totalEl,
    ]));
    const grid = h('div', 'bi-cards');
    CARDS.forEach(def => {
      const count = h('b', 'bi-count mono', '0/3');
      const pips = h('span', 'bi-pips', [h('i'), h('i'), h('i')]);
      const list = h('div', 'bi-clues');
      const button = h('button', 'bi-reveal', [h('span', null, 'Reveal next clue'), icon(ICONS.chev)], { type: 'button', 'aria-label': 'Reveal next clue: ' + def.title });
      const el = h('article', 'bi-card', [
        h('header', 'bi-card-head', [
          icon(ICONS[def.id], 'bi-icon'),
          h('div', 'bi-card-id', [h('h3', 'bi-card-title', def.title), h('div', 'bi-progress', [count, ' clues', pips])]),
        ]),
        list,
        button,
      ], { 'data-evidence': def.id, 'data-ac': def.ac });
      const c = cards[def.id] = { def, el, count: 0, n: count, pips, list, button };
      showPlaceholder(c);
      el.addEventListener('click', () => reveal(def.id));
      grid.append(el);
    });
    wrapEl.append(grid);
    root.append(wrapEl);
  }

  function showPlaceholder(c) {
    c.list.replaceChildren(h('div', 'bi-empty', [h('b', null, '?'), h('span', null, 'Click to reveal clue 1')]));
  }

  function refreshCard(c) {
    c.n.textContent = c.count + '/3';
    [...c.pips.children].forEach((p, i) => p.classList.toggle('on', i < c.count));
    const done = c.count >= 3;
    c.el.classList.toggle('is-done', done);
    c.button.disabled = done;
    c.button.firstChild.textContent = done ? 'All clues revealed' : 'Reveal next clue';
    const total = Object.values(cards).reduce((a, x) => a + x.count, 0);
    totalEl.textContent = total + '/9 clues';
  }

  function toggleClue(node, open) {
    const on = open == null ? node.dataset.open !== 'true' : open;
    node.dataset.open = on ? 'true' : 'false';
    node.firstChild.setAttribute('aria-expanded', String(on));
  }

  function reveal(id, auto) {
    const c = cards[id];
    if (!c || c.count >= 3) return false;
    const index = ++c.count;
    const def = c.def.clues[index - 1];
    if (index === 1) c.list.replaceChildren();
    [...c.list.children].forEach(node => toggleClue(node, false));
    const head = h('button', 'bi-clue-head', [
      h('b', 'bi-n mono', String(index)),
      h('span', 'bi-clue-t', def.title),
      icon(ICONS.chev, 'bi-chev'),
    ], { type: 'button' });
    const body = h('div', 'bi-clue-body', h('div', 'bi-clue-inner', h('div', 'bi-clue-pad', def.build())));
    const node = h('div', 'bi-clue is-new', [head, body], { 'data-n': index });
    head.addEventListener('click', e => { e.stopPropagation(); toggleClue(node); });
    toggleClue(node, true);
    c.list.prepend(node);
    c.list.scrollTop = 0;
    later(() => node.classList.remove('is-new'), 900);
    restartClass(c.el, 'pulse', 800);
    refreshCard(c);

    if (id === 'change' && index === 3) {
      showBanner();
      if (auto) later(flashDiff, 650);
    }
    BOT.emit('clue', { evidence: id, index, title: def.title });
    if (index === 3) BOT.toast(c.def.toast, 'warn', c.def.source);
    return true;
  }

  function flashDiff() {
    const diff = wrapEl && wrapEl.querySelector('.bi-diff');
    if (diff) restartClass(diff, 'flash', 2600);
  }

  function setBanner(on) {
    if (!banner || on === bannerOn) return;
    bannerOn = on;
    banner.hidden = !on;
  }
  function showBanner() { setBanner(true); }

  function autoReveal() {
    const epochAtStart = epoch;
    const order = [];
    for (let round = 0; round < 3; round++) {
      CARDS.forEach(def => { if (cards[def.id].count + order.filter(x => x === def.id).length < 3) order.push(def.id); });
    }
    if (!order.length) { pendingFlash = true; flashDiff(); return; }
    pendingFlash = true;
    order.forEach((id, i) => later(() => {
      if (epoch !== epochAtStart) return;
      reveal(id, true);
    }, 350 + i * 500));
  }

  function enter() {
    if (!wrapEl) return;
    restartClass(wrapEl, 'is-entering', 1500);
    if (pendingFlash && cards.change.count >= 3) { pendingFlash = false; later(flashDiff, 700); }
  }

  function resetInvestigate() {
    epoch++;
    clearTimers();
    pendingFlash = false;
    if (!wrapEl) return;
    wrapEl.classList.remove('is-entering');
    Object.values(cards).forEach(c => {
      c.count = 0;
      c.el.classList.remove('pulse');
      showPlaceholder(c);
      refreshCard(c);
    });
    setBanner(false);
  }

  function investigateTick() {
    if (!banner) return;
    setBanner(!!BOT.state.rootCause || (cards.change && cards.change.count >= 3));
  }

  /* ───────────────────────── wiring ───────────────────────── */
  buildHealth();
  buildInvestigate();

  BOT.on('tick', () => { healthTick(); investigateTick(); });
  BOT.on('stage', d => { if (d && d.stage === 'investigate') enter(); });
  BOT.on('decision', d => { if (d && d.choice === 'investigate') autoReveal(); });
  BOT.on('reset', () => {
    resetInvestigate();
    Object.values(tiles).forEach(t => { t.shownPct = ''; });
    updateHealth(false);
    seedHistory();
  });
})();

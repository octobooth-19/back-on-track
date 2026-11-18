// GitHub panel: simulated pull request workflow, rollback flow, guardrails replay and security cards.
// Everything here is simulated; there is no GitHub API, network or authentication.
(function () {
  'use strict';
  const root = document.getElementById('panel-github');
  if (!root || !window.BOT) return;
  const BOT = window.BOT, F = BOT.facts;
  const CH = F.change, RB = F.rollback, SEC = F.security, GR = F.guardrails;
  const LAST_DEPLOY = F.deploys.find(d => d.id === 1186) || F.deploys[1];
  const NEW_DEPLOY = F.deploys[0];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const MARK = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z';
  const CHIP_ICON = {
    warn: '<path d="M8 2 1.5 13.5h13zM8 6.6v3.2M8 11.9v.1"/>',
    crit: '<path d="M4 4l8 8M12 4l-8 8"/>',
    ok: '<path d="M3 8.5l3.2 3L13 4.5"/>',
    gh: '<path d="M8 1.5 3 3.5v4c0 3 2 5.3 5 7 3-1.7 5-4 5-7v-4z"/>',
  };
  const PR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="5.5" r="2.3"/><circle cx="6" cy="18.5" r="2.3"/><circle cx="18" cy="18.5" r="2.3"/><path d="M6 8v8M18 16V10a3 3 0 00-3-3h-3m2.2-2.6L12 7l2.2 2.6"/></svg>';
  const OK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.5 12.4l3 3 6-6.4"/></svg>';

  const STEPS = [
    ['Developer opens pull request', ''],
    ['Automated tests', ''],
    ['Code scanning (CodeQL)', ''],
    ['Secret scanning', ''],
    ['Dependency review', ''],
    ['Approval gate', `: protected environment '${CH.environment}'`],
    ['Deploy to production', ''],
  ];
  const LABELS = { idle: '', running: 'RUNNING', passed: 'PASSED', failed: 'FAILED', warning: 'WARNING', waiting: 'WAITING' };
  const GATE_MS = 6000;

  const SECURITY = [
    { key: 'code', title: 'Code scanning', icon: '<path d="M7 7l-5 5 5 5M17 7l5 5-5 5M14 4l-4 16"/>', tone: 'warn', st: 'alert',
      sub: `1 alert \u00b7 ${SEC.codeScanning.severity}`,
      detail: `${SEC.codeScanning.tool} ${SEC.codeScanning.alert} (${SEC.codeScanning.where}). ${SEC.codeScanning.autofix}.` },
    { key: 'secret', title: 'Secret scanning', icon: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M13.5 9.5l2 2"/>', tone: 'ok', st: 'check',
      sub: '1 token blocked',
      detail: `${SEC.secretScanning.blocked}. ${SEC.secretScanning.action}.` },
    { key: 'dep', title: 'Dependency review', icon: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5L12 12l8-4.5M12 12v9"/>', tone: 'warn', st: 'alert',
      sub: `${SEC.dependencyReview.pkg.split('@')[0]} \u00b7 ${SEC.dependencyReview.severity}`,
      detail: `${SEC.dependencyReview.pkg} is ${SEC.dependencyReview.severity.toLowerCase()} severity, fixed in ${SEC.dependencyReview.fixedIn}. ${SEC.dependencyReview.note}.` },
    { key: 'env', title: 'Protected environment', icon: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>', tone: 'ok', st: 'check',
      sub: 'Approval required',
      detail: `'${SEC.protectedEnvironment.env}' requires ${SEC.protectedEnvironment.requires}, plus a ${SEC.protectedEnvironment.waitTimer} wait timer, before any production change.` },
  ];

  /* ---------- timers (grouped so reset can cancel everything) ---------- */
  const groups = { rb: new Set(), rp: new Set(), ui: new Set(), ca: new Set() };
  const stop = id => { clearTimeout(id); clearInterval(id); };
  function later(g, fn, ms) { const id = setTimeout(() => { groups[g].delete(id); fn(); }, ms); groups[g].add(id); return id; }
  function every(g, fn, ms) { const id = setInterval(fn, ms); groups[g].add(id); return id; }
  function clearGroup(g) { groups[g].forEach(stop); groups[g].clear(); }
  function clearAll() { Object.keys(groups).forEach(clearGroup); }
  // Plain-language progress for the audience view (core.js / story.js).
  const progress = (step, extra) => BOT.emit('rollback:progress', Object.assign({ step }, extra));

  /* ---------- DOM ---------- */
  root.innerHTML = `
    <header class="gh-head">
      <svg class="gh-mark" viewBox="0 0 16 16" aria-hidden="true"><path d="${MARK}"/></svg>
      <div class="gh-id">
        <span class="gh-repo" title="${esc(F.repo)}">${esc(F.repo)}</span>
        <span class="gh-sub">Actions \u00b7 ${esc(CH.workflow)} workflow</span>
      </div>
    </header>
    <div class="gh-simbar" role="note"><i aria-hidden="true"></i><b>SIMULATED GITHUB EVENTS</b><span>no real GitHub API</span></div>
    <div class="gh-flow" data-view="idle">
      <div class="gh-tabs" role="group" aria-label="Pipeline view">
        <button class="gh-tab" type="button" data-view="happened" aria-pressed="false" disabled>As it happened</button>
        <button class="gh-tab" type="button" data-view="rollback" aria-pressed="false" disabled>Rollback</button>
        <button class="gh-tab" type="button" data-view="replay" aria-pressed="false" disabled>Guardrails</button>
      </div>
      <div class="gh-pr" data-state="healthy">
        <span class="gh-pr-ico"></span>
        <span class="gh-pr-main"><b class="gh-pr-num"></b><span class="gh-pr-title"></span></span>
        <span class="gh-pill"></span>
        <span class="gh-pr-sub mono"></span>
      </div>
      <ol class="gh-steps" aria-label="Deployment pipeline"></ol>
      <div class="gh-foot">
        <div class="gh-cap" aria-live="polite"><b></b><span></span></div>
        <div class="gh-recov" hidden>
          <div class="gh-recov-h"><b>Traceable recovery change</b><span class="gh-chip ok"><svg viewBox="0 0 16 16" aria-hidden="true">${CHIP_ICON.ok}</svg>audit trail</span></div>
          <div class="gh-chain" aria-label="Pull request to deploy to incident">
            <span class="gh-node pr">PR #${RB.pr}</span><i aria-hidden="true"></i>
            <span class="gh-node dp">Deploy #${RB.deploy}</span><i aria-hidden="true"></i>
            <span class="gh-node in">Incident ${esc(F.monitoring.spikeAt)}</span>
          </div>
          <div class="gh-audit mono"></div>
        </div>
        <div class="gh-prevented" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4.5 5.6v5.6c0 4.6 3.1 8.2 7.5 10.3 4.4-2.1 7.5-5.7 7.5-10.3V5.6z"/><path d="M8.3 12.2l2.7 2.7 4.8-5.4"/></svg>
          <div><b>Outage prevented</b><span>0 passengers impacted (simulated)</span></div>
        </div>
        <button class="gh-replay" type="button" disabled title="Available once the incident is resolved">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 108-8M4 4v5h5"/></svg>
          <span>REPLAY WITH GUARDRAILS</span><em>after resolve</em>
        </button>
      </div>
    </div>
    <section class="gh-sec" aria-label="Repository security">
      <div class="gh-sec-head"><span class="panel-title">Repository security</span><span class="gh-sec-note">simulated</span></div>
      <div class="gh-sec-grid"></div>
      <div class="gh-detail" id="gh-detail" role="region" aria-live="polite"><div><p></p></div></div>
    </section>`;

  const $ = sel => root.querySelector(sel);
  const flow = $('.gh-flow'), stepsEl = $('.gh-steps'), prEl = $('.gh-pr'), capEl = $('.gh-cap');
  const recovEl = $('.gh-recov'), prevEl = $('.gh-prevented'), replayBtn = $('.gh-replay');
  const detailEl = $('.gh-detail'), tabs = [...root.querySelectorAll('.gh-tab')];

  const ICONS = `
    <svg class="i-run" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke-opacity=".25"/><path d="M12 4a8 8 0 018 8"/></svg>
    <svg class="i-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.8l4.2 4.2 8.8-9.4"/></svg>
    <svg class="i-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>
    <svg class="i-warn" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v7.5M12 17.6v.1"/></svg>
    <svg class="i-wait" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><path d="M12 8v4.4l3 1.8"/></svg>`;

  const els = STEPS.map(([title, sfx], i) => {
    const li = document.createElement('li');
    li.className = 'gh-step';
    li.dataset.status = 'idle';
    li.dataset.i = i;
    li.style.setProperty('--i', i);
    li.innerHTML = `
      <span class="gh-ico"><span class="gh-num">${i + 1}</span>${ICONS}</span>
      <div class="gh-st-body">
        <div class="gh-st-t"><span class="gh-t"></span></div><span class="gh-lab"></span>
        <div class="gh-st-m"></div>
        <div class="gh-bar"><i></i></div>
        ${i === 5 ? `<div class="gh-gate">
          <span class="gh-gate-who">Reviewer: ${esc(RB.approver)}</span>
          <button class="gh-approve" type="button"><span>APPROVE DEPLOYMENT</span><em class="gh-count"></em></button>
        </div>` : ''}
      </div>`;
    stepsEl.appendChild(li);
    return { li, t: li.querySelector('.gh-t'), lab: li.querySelector('.gh-lab'), m: li.querySelector('.gh-st-m'), sig: '', title, sfx };
  });
  const approveBtn = $('.gh-approve'), countEl = $('.gh-count');

  const secGrid = $('.gh-sec-grid');
  const cardEls = {};
  SECURITY.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gh-card';
    b.dataset.key = c.key;
    b.dataset.tone = c.tone;
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'gh-detail');
    b.innerHTML = `
      <svg class="gh-card-ico" viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg>
      <span class="gh-card-txt"><b>${esc(c.title)}</b><em>${esc(c.sub)}</em></span>
      <svg class="gh-card-st ${c.st}" viewBox="0 0 24 24" aria-hidden="true">${c.st === 'check' ? '<path d="M6 12.5l4 4 8-9"/>' : '<path d="M12 6v7M12 17.4v.1"/>'}</svg>
      <i class="gh-scan" aria-hidden="true"></i>`;
    b.title = `${c.title}: ${c.detail}`;
    secGrid.appendChild(b);
    cardEls[c.key] = b;
  });

  /* ---------- view model ---------- */
  let views = {}, current = 'idle';
  const chip = (k, text, title) => ({ k, text, title: title || text });
  const mkSteps = () => STEPS.map(() => ({ s: 'idle', m: '', chips: [], lab: '', bar: -1, tone: '', t: null }));
  const mkView = () => ({ steps: mkSteps(), pr: null, cap: ['', ''], gate: false, count: '', recov: false, audit: '', prevented: false });
  const adds = CH.files.reduce((n, f) => n + f.additions, 0), dels = CH.files.reduce((n, f) => n + f.deletions, 0);

  function put(v, i, s, m, chips, extra) {
    Object.assign(v.steps[i], { s, m: m || '', chips: chips || [], lab: '', bar: -1, tone: '', t: null }, extra || {});
    if (views[current] === v) paint();
  }

  function buildIdle() {
    const v = mkView();
    v.pr = { state: 'healthy', num: `Last deploy #${LAST_DEPLOY.id} healthy`, title: '', sub: `${LAST_DEPLOY.title} \u00b7 ${LAST_DEPLOY.at}`, label: 'HEALTHY', icon: 'ok' };
    v.cap = [`Start the incident to see PR #${CH.pr}`, 'Pipeline idle \u00b7 production healthy'];
    return v;
  }

  function buildHappened() {
    const v = mkView(), g = CH.gaps;
    v.pr = { state: 'merged', num: `#${CH.pr}`, title: CH.title, sub: `${CH.author} \u00b7 ${CH.commit} \u00b7 merged ${CH.mergedAt} \u00b7 +${adds} \u2212${dels}`, label: 'MERGED' };
    put(v, 0, 'passed', `Approved by ${CH.approvedBy}`, [chip('warn', 'No CODEOWNERS for infra/', g[0])]);
    put(v, 1, 'passed', 'Unit tests passed', [chip('warn', 'No load test / canary', g[2])]);
    put(v, 2, 'passed', 'Config not analysed', [chip('warn', 'No config policy check', g[1])]);
    put(v, 3, 'passed', 'No secrets detected');
    put(v, 4, 'passed', 'No vulnerable packages');
    put(v, 5, 'failed', '', [chip('crit', 'bypassed: expedite label', g[3])], { lab: 'BYPASSED' });
    put(v, 6, 'failed', `Deployed ${CH.deployedAt} as #${NEW_DEPLOY.id}`, [chip('crit', `retry storm ${F.monitoring.spikeAt}`)], { lab: 'DEPLOYED' });
    v.cap = ['Every check was green', 'The missing guardrails are what hurt.'];
    return v;
  }

  function buildRollback() {
    const v = mkView();
    v.pr = { state: 'open', num: `#${RB.pr}`, title: RB.title, sub: `${RB.branch} \u00b7 ${RB.commit}`, label: 'OPEN' };
    v.steps[0].t = ['Open revert pull request', ''];
    v.cap = ['Revert PR incoming', 'Opening the revert pull request\u2026'];
    return v;
  }

  function buildReplay() {
    const v = mkView();
    v.pr = { state: 'replay', num: `#${CH.pr}`, title: CH.title, sub: `${CH.author} \u00b7 ${CH.commit} \u00b7 replayed with guardrails`, label: 'REPLAY' };
    v.cap = [`Replaying PR #${CH.pr}`, 'Same change, now with guardrails.'];
    return v;
  }

  views = { idle: buildIdle(), happened: buildHappened(), rollback: null, replay: null };
  let rollbackActive = false, deployedEmitted = false, replayRunning = false;
  let lastStage = BOT.state.stage;

  /* ---------- painting ---------- */
  function paint() {
    const v = views[current];
    flow.dataset.view = current;

    const pr = v.pr, prSig = JSON.stringify(pr);
    if (prSig !== prEl._sig) {
      prEl._sig = prSig;
      prEl.dataset.state = pr.state;
      prEl.querySelector('.gh-pr-ico').innerHTML = pr.icon === 'ok' ? OK_ICON : PR_ICON;
      prEl.querySelector('.gh-pr-num').textContent = pr.num;
      prEl.querySelector('.gh-pr-title').textContent = pr.title;
      prEl.querySelector('.gh-pr-title').title = pr.title;
      prEl.querySelector('.gh-pill').textContent = pr.label;
      prEl.querySelector('.gh-pr-sub').textContent = pr.sub;
    }

    v.steps.forEach((s, i) => {
      const e = els[i];
      const sig = JSON.stringify([s.s, s.m, s.chips, s.lab, s.t]);
      if (sig !== e.sig) {
        e.sig = sig;
        const [title, sfx] = s.t || [e.title, e.sfx];
        e.li.dataset.status = s.s;
        e.t.innerHTML = `${esc(title)}${sfx ? `<span class="gh-sfx">${esc(sfx)}</span>` : ''}`;
        e.lab.textContent = s.lab || LABELS[s.s];
        e.m.innerHTML = (s.m ? `<span class="gh-meta">${esc(s.m)}</span>` : '') +
          s.chips.map(c => `<span class="gh-chip ${c.k}" title="${esc(c.title)}"><svg viewBox="0 0 16 16" aria-hidden="true">${CHIP_ICON[c.k]}</svg>${esc(c.text)}</span>`).join('');
      }
      e.li.dataset.bar = s.bar >= 0 ? '1' : '0';
      e.li.dataset.tone = s.tone;
      e.li.style.setProperty('--p', Math.max(0, s.bar));
    });
    els[5].li.dataset.gate = v.gate ? '1' : '0';
    countEl.textContent = v.count;

    capEl.querySelector('b').textContent = v.cap[0];
    capEl.querySelector('span').textContent = v.cap[1];
    capEl.hidden = v.recov || v.prevented;
    recovEl.hidden = !v.recov;
    prevEl.hidden = !v.prevented;
    if (v.recov) recovEl.querySelector('.gh-audit').textContent = v.audit;

    tabs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.view === current)));
    syncControls();
    keepActiveVisible(v);
  }

  // the footer cards shrink the step list; keep the live step in view
  function keepActiveVisible(v) {
    if (stepsEl.scrollHeight <= stepsEl.clientHeight + 1) return;
    let idx = -1;
    v.steps.forEach((s, i) => { if (s.s === 'running' || s.s === 'waiting') idx = i; });
    if (idx < 0 && (v.recov || v.prevented)) idx = 6;
    if (idx < 0) return;
    const li = els[idx].li;
    const top = li.offsetTop, bottom = top + li.offsetHeight;
    if (bottom > stepsEl.scrollTop + stepsEl.clientHeight) stepsEl.scrollTop = bottom - stepsEl.clientHeight + 4;
    else if (top < stepsEl.scrollTop) stepsEl.scrollTop = top;
  }

  function syncControls() {
    tabs.forEach(t => {
      const n = t.dataset.view;
      t.disabled = n === 'happened' ? BOT.state.stage === 'normal' && !views.rollback && !views.replay
        : n === 'rollback' ? !views.rollback : !views.replay;
    });
    const canReplay = BOT.state.stage === 'resolved' && !replayRunning;
    replayBtn.disabled = !canReplay;
    replayBtn.dataset.ready = canReplay ? '1' : '0';
    replayBtn.querySelector('span').textContent = replayRunning ? 'REPLAYING\u2026' : 'REPLAY WITH GUARDRAILS';
    replayBtn.title = canReplay ? 'Replay PR #' + CH.pr + ' with guardrails (simulated)' : 'Available once the incident is resolved';
  }

  function showView(name, reveal) {
    if (reveal) {
      flow.classList.remove('reveal');
      void flow.offsetWidth;
      flow.classList.add('reveal');
      later('ui', () => flow.classList.remove('reveal'), 2600);
    }
    current = name;
    paint();
  }

  function setCap(v, a, b) { v.cap = [a, b]; if (views[current] === v) paint(); }
  function setPr(v, state, label) { v.pr.state = state; v.pr.label = label; if (views[current] === v) paint(); }
  function touch(v) { if (views[current] === v) paint(); }

  function pulseCard(key) {
    const c = cardEls[key];
    if (!c) return;
    c.classList.remove('hit');
    void c.offsetWidth;
    c.classList.add('hit');
    later('ui', () => c.classList.remove('hit'), 1300);
  }

  function setEnvCard(text, tone) {
    const c = cardEls.env;
    c.querySelector('em').textContent = text;
    c.dataset.tone = tone;
  }

  function flashSteps(indices) {
    if (current !== 'happened' && !rollbackActive && !replayRunning) showView('happened', true);
    if (current !== 'happened') return;
    els.forEach(e => e.li.classList.remove('hl'));
    void stepsEl.offsetWidth;
    indices.forEach(i => els[i].li.classList.add('hl'));
    later('ui', () => els.forEach(e => e.li.classList.remove('hl')), 2600);
  }

  /* ---------- rollback flow ---------- */
  function startRollback() {
    clearGroup('rb'); clearGroup('rp'); clearGroup('ca');
    replayRunning = false; rollbackActive = true; deployedEmitted = false;
    views.rollback = buildRollback();
    const v = views.rollback;
    setEnvCard('Approval required', 'ok');
    put(v, 0, 'running', 'Creating revert-4821\u2026');
    showView('rollback', true);
    BOT.log(`Revert PR #${RB.pr} opening (${RB.branch}, ${RB.commit})`, 'info', 'github');
    progress('opening');

    const steps = [
      [1000, () => {
        v.auditOpened = BOT.clock();
        put(v, 0, 'passed', `#${RB.pr} \u00b7 ${RB.branch} \u00b7 ${RB.commit}`, [chip('gh', 'revert of #' + CH.pr)]);
        put(v, 1, 'running', 'Running unit tests\u2026');
        setCap(v, 'Checks running', `Revert PR #${RB.pr} is being verified.`);
        BOT.log(`Revert PR #${RB.pr} opened (${RB.branch}, ${RB.commit})`, 'info', 'github');
        progress('checks', { done: 0 });
      }],
      [1400, () => {
        put(v, 1, 'passed', 'Unit tests passed');
        put(v, 2, 'running', 'CodeQL analysing\u2026');
        pulseCard('code');
        progress('checks', { done: 1 });
      }],
      [1200, () => {
        put(v, 2, 'passed', 'No code alerts');
        put(v, 3, 'running', 'Scanning for secrets\u2026');
        pulseCard('secret');
        progress('checks', { done: 2 });
      }],
      [1200, () => {
        put(v, 3, 'passed', 'No secrets detected');
        put(v, 4, 'running', 'Reviewing dependency changes\u2026');
        pulseCard('dep');
        progress('checks', { done: 3 });
      }],
      [1200, () => {
        put(v, 4, 'passed', 'No vulnerable packages');
        BOT.log(`Checks passed on #${RB.pr}: tests, code scanning, secret scanning, dependency review`, 'ok', 'github');
        openGate(v);
      }],
    ];
    let at = 0;
    steps.forEach(([ms, fn]) => { at += ms; later('rb', fn, at); });
  }

  function openGate(v) {
    setPr(v, 'merged', 'MERGED');
    put(v, 5, 'waiting', `Awaiting ${RB.approver}`, [chip('gh', `environment: ${CH.environment}`)], { lab: 'WAITING' });
    v.gate = true;
    setCap(v, 'Approval needed', `Protected environment '${CH.environment}' holds the deploy.`);
    setEnvCard('Awaiting approval', 'warn');
    pulseCard('env');
    BOT.log(`Production deployment waiting for approval (protected environment '${CH.environment}')`, 'warn', 'github');
    const t0 = performance.now();
    const left = () => Math.max(0, Math.ceil((GATE_MS - (performance.now() - t0)) / 1000));
    v.count = `auto in ${left()}s`;
    touch(v);
    every('rb', () => { v.count = `auto in ${left()}s`; touch(v); }, 250);
    later('rb', () => approveGate(true), GATE_MS);
    approveBtn.classList.remove('run');
    void approveBtn.offsetWidth;
    approveBtn.classList.add('run');
    approveBtn.disabled = false;
    progress('gate', { ms: GATE_MS });
  }

  function approveGate(auto) {
    const v = views.rollback;
    if (!rollbackActive || !v || !v.gate) return;
    clearGroup('rb');
    v.gate = false;
    approveBtn.classList.remove('run');
    approveBtn.disabled = true;
    v.auditApproved = BOT.clock();
    put(v, 5, 'passed', `Approved by ${RB.approver}`, [chip('ok', 'approved')]);
    setEnvCard('Approval required', 'ok');
    BOT.log(`Production deployment approved by ${RB.approver}`, 'ok', 'github');
    if (auto) BOT.toast('on-call lead approved', 'ok', 'github');
    progress('deploying', { auto: !!auto });
    deploy(v);
  }

  function deploy(v) {
    const t0 = performance.now(), dur = 2800;
    put(v, 6, 'running', `Deploying #${RB.deploy} \u00b7 ${RB.commit}`, [], { bar: 0 });
    setCap(v, `Deploying #${RB.deploy}`, 'Rolling the revert out to production.');
    BOT.log(`Deploy #${RB.deploy} started (${RB.commit})`, 'info', 'github');
    every('rb', () => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      v.steps[6].bar = Math.round(p * 100);
      touch(v);
      if (p >= 1) finishDeploy(v);
    }, 100);
  }

  function finishDeploy(v) {
    clearGroup('rb');
    rollbackActive = false;
    put(v, 6, 'passed', `Deployed #${RB.deploy} \u00b7 ${RB.commit}`, [chip('ok', 'recovery change')], { bar: 100 });
    els[6].li.dataset.bar = '0';
    v.steps[6].bar = -1;
    v.recov = true;
    v.audit = `opened ${v.auditOpened || '\u2013'} \u00b7 approved ${v.auditApproved || '\u2013'} \u00b7 deployed ${BOT.clock()}`;
    paint();
    BOT.log(`Rollback PR #${RB.pr} deployed (deploy #${RB.deploy})`, 'ok', 'github');
    if (!deployedEmitted) { deployedEmitted = true; progress('deployed'); BOT.emit('rollback:deployed'); }
  }

  /* ---------- guardrails replay ---------- */
  function startReplay() {
    if (BOT.state.stage !== 'resolved') return;
    clearGroup('rp'); clearGroup('ca'); clearGroup('ui');
    els.forEach(e => e.li.classList.remove('hl'));
    replayRunning = true;
    views.replay = buildReplay();
    const v = views.replay;
    setEnvCard('Approval required', 'ok');
    put(v, 0, 'running', 'Opening pull request\u2026');
    showView('replay', true);
    BOT.log(`Replay: PR #${CH.pr} re-run with guardrails (simulated)`, 'info', 'github');
    BOT.emit('guardrails:start');

    const timeline = [
      [700, () => {
        put(v, 0, 'passed', `Opened by ${CH.author}`, [chip('gh', 'CODEOWNERS \u2192 platform-sre', GR[0])]);
        setCap(v, 'Layer 1 \u00b7 CODEOWNERS', GR[0]);
        BOT.emit('guardrails:layer', { i: 0 });
      }],
      [900, () => put(v, 1, 'running', 'Running unit tests\u2026')],
      [600, () => { put(v, 1, 'passed', 'Unit tests passed'); put(v, 2, 'running', 'CodeQL + policy check\u2026'); pulseCard('code'); }],
      [700, () => {
        put(v, 2, 'failed', 'Policy check failed', [chip('crit', 'rate limiting must stay enabled', GR[1])], { lab: 'BLOCKED' });
        setPr(v, 'blocked', 'BLOCKED');
        setCap(v, 'Layer 2 \u00b7 Policy check', GR[1]);
        flow.classList.remove('shake'); void flow.offsetWidth; flow.classList.add('shake');
        BOT.log(`Replay: policy check fails PR #${CH.pr}: "rate limiting must stay enabled"`, 'warn', 'github');
        BOT.emit('guardrails:layer', { i: 1 });
      }],
      [1300, () => {
        put(v, 2, 'warning', 'Waived for the what-if', [], { lab: 'WAIVED' });
        setPr(v, 'replay', 'WHAT-IF');
        setCap(v, 'Safety nets stack up', 'Say the check were waived. What happens next?');
        put(v, 3, 'running', 'Scanning for secrets\u2026');
      }],
      [500, () => { put(v, 3, 'passed', 'No secrets detected'); put(v, 4, 'running', 'Reviewing dependencies\u2026'); }],
      [500, () => put(v, 4, 'passed', 'No vulnerable packages')],
      [300, () => {
        put(v, 5, 'waiting', 'Held for approval', [chip('gh', `environment: ${CH.environment}`, GR[2])], { lab: 'HELD' });
        setCap(v, 'Layer 3 \u00b7 Protected environment', GR[2]);
        setEnvCard('Holding production', 'warn');
        pulseCard('env');
        BOT.emit('guardrails:layer', { i: 2 });
      }],
      [1000, () => {
        put(v, 5, 'passed', 'Released to 5% canary', [chip('ok', 'approved')]);
        put(v, 6, 'running', 'Canary 5% \u00b7 watching alerts\u2026', [], { bar: 0 });
        setEnvCard('Approval required', 'ok');
        const t0 = performance.now();
        every('ca', () => { v.steps[6].bar = Math.min(48, Math.round((performance.now() - t0) / 14)); touch(v); }, 80);
      }],
      [900, () => {
        clearGroup('ca');
        put(v, 6, 'failed', 'Alerts tripped \u00b7 auto-rollback', [chip('gh', 'canary 5%', GR[3])], { lab: 'ROLLED BACK', bar: 48, tone: 'red' });
        setCap(v, 'Layer 4 \u00b7 Canary 5%', GR[3]);
        BOT.emit('guardrails:layer', { i: 3 });
      }],
      [900, () => {
        v.prevented = true;
        setPr(v, 'ok', 'PREVENTED');
        replayRunning = false;
        paint();
        BOT.log(`Outage prevented: guardrails would have stopped PR #${CH.pr}. 0 passengers impacted (simulated)`, 'ok', 'github');
        BOT.emit('guardrails:done');
      }],
    ];
    let at = 0;
    timeline.forEach(([ms, fn]) => { at += ms; later('rp', fn, at); });
  }

  /* ---------- stage + events ---------- */
  function resetAll() {
    clearAll();
    flow.classList.remove('reveal', 'shake');
    els.forEach(e => e.li.classList.remove('hl'));
    Object.values(cardEls).forEach(c => c.classList.remove('hit'));
    approveBtn.classList.remove('run');
    approveBtn.disabled = true;
    rollbackActive = false; deployedEmitted = false; replayRunning = false;
    views = { idle: buildIdle(), happened: buildHappened(), rollback: null, replay: null };
    setEnvCard('Approval required', 'ok');
    collapseDetail();
    lastStage = BOT.state.stage;
    current = 'idle';
    els.forEach(e => { e.sig = ''; });
    prEl._sig = '';
    paint();
  }

  function onStage(stage) {
    lastStage = stage;
    if (stage === 'normal') { if (current !== 'idle' || rollbackActive || replayRunning) resetAll(); else syncControls(); return; }
    if (current === 'idle') {
      showView('happened', true);
      setEnvCard('Bypassed on #' + NEW_DEPLOY.id, 'crit');
    }
    syncControls();
  }

  BOT.on('stage', d => onStage((d && d.stage) || BOT.state.stage));
  BOT.on('start', () => onStage(BOT.state.stage));
  BOT.on('tick', () => { if (BOT.state.stage !== lastStage) onStage(BOT.state.stage); });
  BOT.on('reset', resetAll);
  BOT.on('rollback:start', () => { setEnvCard('Approval required', 'ok'); startRollback(); });
  BOT.on('guardrails:replay', startReplay);
  BOT.on('rollback:approve', () => approveGate(false));
  BOT.on('clue', d => {
    if (!d || d.evidence !== 'github') return;
    const map = { 1: [0, 1, 2], 2: [2, 4, 5], 3: [5, 6] };
    flashSteps(map[d.index] || [0, 5, 6]);
  });

  /* ---------- interactions ---------- */
  replayBtn.addEventListener('click', startReplay);
  approveBtn.addEventListener('click', () => approveGate(false));
  tabs.forEach(t => t.addEventListener('click', () => {
    const n = t.dataset.view;
    if (views[n] && n !== current) showView(n, true);
  }));

  function collapseDetail() {
    detailEl.dataset.open = '0';
    Object.values(cardEls).forEach(c => c.setAttribute('aria-expanded', 'false'));
  }
  secGrid.addEventListener('click', ev => {
    const card = ev.target.closest('.gh-card');
    if (!card) return;
    const open = card.getAttribute('aria-expanded') === 'true';
    collapseDetail();
    if (open) return;
    const c = SECURITY.find(x => x.key === card.dataset.key);
    card.setAttribute('aria-expanded', 'true');
    detailEl.querySelector('p').innerHTML = `<b>${esc(c.title)}</b> ${esc(c.detail)}`;
    detailEl.dataset.open = '1';
  });

  resetAll();
  if (BOT.state.stage !== 'normal') onStage(BOT.state.stage);
})();

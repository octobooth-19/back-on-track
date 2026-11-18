// Incident story rail (#panel-story): what broke, how it is fixed, how to prevent it. Plain words for the audience.
(function () {
  'use strict';
  const root = document.getElementById('panel-story');
  if (!root || !window.BOT) return;
  const BOT = window.BOT, F = BOT.facts;
  const CH = F.change, RB = F.rollback;
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const narrow = () => window.matchMedia('(max-width: 1099px)').matches;

  const CHAIN = [
    { key: 'change', ico: '\u2699', kind: 'cause',
      on: ['A settings change shipped', `PR #${CH.pr} switched traffic limits off`],
      hidden: ['Something changed\u2026', 'Open the evidence to find out what'],
      fixed: ['The change was undone', `Rolled back by PR #${RB.pr}`] },
    { key: 'retry', ico: '\u21bb', kind: 'cause',
      on: ['Apps retried non-stop', 'Kiosks and the mobile app retried with no limit'],
      hidden: ['Why so much traffic?', 'The monitoring alerts hold a clue'],
      fixed: ['Retries under control', 'Limits are back on'] },
    { key: 'flood', ico: '\u224b', kind: 'symptom', at: .12,
      off: ['Traffic normal', 'The gateway is handling the load'],
      fixed: ['Traffic back to normal', 'The flood has drained away'] },
    { key: 'stuck', ico: '\u2708', kind: 'symptom', at: .4,
      off: ['Flights on time', 'Check-in and boarding are working'],
      fixed: ['Flights back on time', 'Queues are clearing'] },
  ];
  const FIXES = [
    { key: 'rollback', ico: '\u21b6', title: 'Undo the change', sub: `Roll back PR #${CH.pr}` },
    { key: 'scale', ico: '\u2b06', title: 'Add more capacity', sub: 'Bigger pipes, same flood' },
    { key: 'investigate', ico: '\u2315', title: 'Keep looking', sub: 'More evidence, more waiting' },
  ];
  const PREVENT = [
    { title: 'Send risky changes to the right experts', was: 'The network team never saw this change', gh: 'CODEOWNERS' },
    { title: 'An automatic rule: traffic limits stay on', was: 'Nothing checked the settings file', gh: 'Policy check in GitHub Actions' },
    { title: 'No skipping the production sign-off', was: 'An \u201cexpedite\u201d label skipped approval', gh: 'Protected environment' },
    { title: 'Try it on 5% first, undo automatically', was: 'It went to every passenger at once', gh: 'Canary deploy + auto-rollback' },
  ];
  const PROGRESS_TEXT = {
    opening: `Opening an \u201cundo\u201d change: PR #${RB.pr}.`,
    checks: 'Safety checks run first, even in an emergency.',
    gate: 'Production is protected. The on-call lead must approve.',
    deploying: 'Approved. The fix is going live.',
    deployed: 'The fix is live. Flights are recovering.',
  };

  root.innerHTML = `
    <div class="st-wrap">
      <header class="st-head">
        <div><h2 class="st-title">The incident story</h2><p class="st-sub">What broke, how it was fixed, how to stop it next time</p></div>
        <span class="sim-tag">FICTIONAL</span>
      </header>
      <section class="st-ch" data-ch="0">
        <button class="st-ch-head" type="button" aria-expanded="true"><b>1</b><span>What broke</span><em class="st-pill"></em></button>
        <div class="st-body">
          <ol class="st-chain">${CHAIN.map(n => `
            <li class="st-node" data-key="${n.key}" data-kind="${n.kind}">
              <span class="st-ico" aria-hidden="true">${n.ico}</span>
              <span class="st-txt"><b></b><span></span></span>
            </li>`).join('')}
          </ol>
        </div>
        <p class="st-sum"></p>
      </section>
      <section class="st-ch" data-ch="1">
        <button class="st-ch-head" type="button" aria-expanded="false"><b>2</b><span>How we fix it</span><em class="st-pill"></em></button>
        <div class="st-body">
          <ul class="st-fixes">${FIXES.map(f => `
            <li class="st-fix" data-key="${f.key}">
              <span class="st-ico" aria-hidden="true">${f.ico}</span>
              <span class="st-txt"><b>${f.title}</b><span>${f.sub}</span></span>
              <em class="st-res"></em>
            </li>`).join('')}
          </ul>
          <p class="st-why" role="status"></p>
        </div>
        <p class="st-lock">Find the cause first. Then choose a fix.</p>
        <p class="st-sum"></p>
      </section>
      <section class="st-ch" data-ch="2">
        <button class="st-ch-head" type="button" aria-expanded="false"><b>3</b><span>How to stop it happening again</span><em class="st-pill"></em></button>
        <div class="st-body">
          <ol class="st-prevent">${PREVENT.map((p, i) => `
            <li class="st-guard" data-i="${i}">
              <span class="st-num" aria-hidden="true">${i + 1}</span>
              <span class="st-txt"><b>${p.title}</b><span class="st-was">Last time: ${p.was}</span><span class="st-gh">GitHub: ${p.gh}</span></span>
              <em class="st-res"></em>
            </li>`).join('')}
          </ol>
          <div class="st-nets"><b>Always on:</b> <span>Code scanning</span><span>Secret scanning</span><span>Dependency review</span>
            <p>They check code, passwords and packages. They all passed, because this was a settings problem.</p></div>
          <div class="st-prevented" hidden><b>Outage prevented</b><span>Same change, with guardrails: 0 passengers affected (simulated)</span></div>
          <button class="btn gh st-play" type="button">\u25b6 PLAY: SAME CHANGE, WITH GUARDRAILS</button>
        </div>
        <p class="st-lock">Recover first. Then see how to stop this happening again.</p>
      </section>
    </div>`;

  const wrap = root.querySelector('.st-wrap');
  const chapters = [...root.querySelectorAll('.st-ch')];
  const nodes = [...root.querySelectorAll('.st-node')];
  const fixes = Object.fromEntries([...root.querySelectorAll('.st-fix')].map(el => [el.dataset.key, el]));
  const guards = [...root.querySelectorAll('.st-guard')];
  const whyEl = root.querySelector('.st-why');
  const playBtn = root.querySelector('.st-play');
  const preventedEl = root.querySelector('.st-prevented');

  let tried, rb, replay, userOpen, lastStage, resolvedText;
  function fresh() {
    tried = { rollback: false, scale: false, investigate: false };
    rb = '';
    replay = { running: false, layer: -1, done: false };
    userOpen = [null, null, null];
    lastStage = BOT.state.stage;
    resolvedText = '';
  }
  fresh();

  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  const setData = (el, key, value) => { if (el.dataset[key] !== value) el.dataset[key] = value; };

  function chapterState(i, stage) {
    const decided = tried.scale || tried.investigate || tried.rollback;
    if (i === 0) return stage === 'recovering' || stage === 'resolved' ? 'done' : 'active';
    if (i === 1) {
      if (stage === 'resolved') return 'done';
      if (stage === 'decision' || stage === 'recovering' || decided) return 'active';
      return 'locked';
    }
    return stage === 'resolved' ? 'active' : 'locked';
  }

  function pills(stage) {
    const s = BOT.state;
    const p0 = stage === 'normal' ? ['ok', 'ALL CLEAR']
      : stage === 'outage' ? ['crit', 'HAPPENING NOW']
      : stage === 'recovering' ? ['warn', 'BEING FIXED']
      : stage === 'resolved' ? ['ok', 'FIXED']
      : s.rootCause ? ['warn', 'CAUSE FOUND'] : ['crit', 'INVESTIGATING'];
    const p1 = stage === 'resolved' ? ['ok', 'DONE']
      : stage === 'recovering' ? ['accent', 'IN PROGRESS']
      : stage === 'decision' ? ['accent', 'YOUR CALL']
      : chapterState(1, stage) === 'active' ? ['warn', 'MORE EVIDENCE'] : ['dim', 'NEXT'];
    const p2 = stage !== 'resolved' ? ['dim', 'AFTER RECOVERY']
      : replay.done ? ['ok', 'PREVENTED'] : replay.running ? ['accent', 'PLAYING'] : ['accent', 'LESSONS'];
    return [p0, p1, p2];
  }

  function renderChain(stage) {
    const s = BOT.state, m = s.metrics, sev = s.severity;
    const ended = stage === 'resolved';
    nodes.forEach((el, i) => {
      const n = CHAIN[i];
      let state, text;
      if (n.kind === 'cause') {
        const known = s.rootCause || (n.key === 'retry' && s.clues.monitoring >= 2);
        if (stage === 'normal') { state = 'off'; text = ['', '']; }
        else if (ended || (stage === 'recovering' && sev < .3)) { state = 'fixed'; text = n.fixed; }
        else if (known) { state = 'cause'; text = n.on; }
        else { state = 'hidden'; text = n.hidden; }
      } else if (ended || (stage === 'recovering' && sev < n.at)) {
        state = 'fixed'; text = n.fixed;
      } else if (stage !== 'normal' && sev >= n.at) {
        state = 'on';
        text = n.key === 'flood'
          ? ['Traffic flood', `${m.trafficX.toFixed(1)}\u00d7 normal traffic hit the gateway`]
          : ['Passengers stuck', `${m.flightsDelayed} of ${m.flightsTotal} flights delayed \u00b7 ${fmt(m.passengersImpacted)} passengers hit`];
      } else { state = 'off'; text = n.off; }
      if (n.kind === 'cause' && state === 'off') text = i === 0 ? ['Last change: healthy', 'Nothing unusual shipped yet'] : ['Retries normal', 'Apps retry a few times, then stop'];
      setData(el, 'state', state);
      setText(el.querySelector('b'), text[0]);
      setText(el.querySelector('.st-txt > span'), text[1]);
    });
  }

  function renderFixes(stage) {
    for (const f of FIXES) {
      const el = fixes[f.key];
      let res = '', tone = '';
      if (f.key === 'rollback' && tried.rollback) {
        res = stage === 'resolved' ? 'WORKED \u2713' : 'FIXING\u2026';
        tone = stage === 'resolved' ? 'ok' : 'accent';
      } else if (f.key === 'scale' && tried.scale) { res = 'DIDN\u2019T LAST'; tone = 'warn'; }
      else if (f.key === 'investigate' && tried.investigate) { res = 'COST TIME'; tone = 'warn'; }
      setText(el.querySelector('.st-res'), res);
      setData(el, 'tone', tone);
    }
    let why;
    if (stage === 'recovering') why = PROGRESS_TEXT[rb] || PROGRESS_TEXT.opening;
    else if (stage === 'resolved') why = resolvedText;
    else if (stage === 'decision' && !tried.scale && !tried.investigate) why = 'Three options. Only one removes the cause.';
    else if (tried.investigate && !tried.scale) why = 'Every extra minute stranded more passengers. The cause was already clear.';
    else if (tried.scale && !tried.investigate) why = 'More capacity just fed the flood. The cause is still there.';
    else if (tried.scale && tried.investigate) why = 'Capacity didn\u2019t last and waiting cost time. Undo the change.';
    else why = 'Find the cause first. Guessing a fix wastes precious minutes.';
    setText(whyEl, why);
  }

  function renderPrevent(stage) {
    guards.forEach((el, i) => {
      const caught = replay.layer >= i;
      const active = replay.running && replay.layer === i;
      setData(el, 'state', stage !== 'resolved' ? 'locked' : caught ? 'caught' : 'gap');
      el.classList.toggle('now', active);
      setText(el.querySelector('.st-res'), caught ? 'WOULD STOP IT \u2713' : 'MISSING');
    });
    preventedEl.hidden = !replay.done;
    playBtn.disabled = stage !== 'resolved' || replay.running;
    setText(playBtn, replay.done ? '\u25b6 PLAY IT AGAIN' : replay.running ? 'PLAYING\u2026' : '\u25b6 PLAY: SAME CHANGE, WITH GUARDRAILS');
  }

  function summaries() {
    const sum0 = `A settings change (PR #${CH.pr}) switched traffic limits off. Apps retried non-stop and the flood took down check-in and boarding.`;
    const misses = [tried.scale && 'adding capacity didn\u2019t last', tried.investigate && 'waiting cost time'].filter(Boolean);
    const sum1 = `${resolvedText}${misses.length ? ` Along the way, ${misses.join(' and ')}.` : ''}`;
    setText(chapters[0].querySelector('.st-sum'), sum0);
    setText(chapters[1].querySelector('.st-sum'), sum1);
  }

  function render() {
    const stage = BOT.state.stage;
    if (stage !== lastStage) { lastStage = stage; userOpen = [null, null, null]; }
    const ps = pills(stage);
    chapters.forEach((ch, i) => {
      const state = chapterState(i, stage);
      const open = state === 'locked' ? false : userOpen[i] ?? state === 'active';
      setData(ch, 'state', state);
      setData(ch, 'open', open ? '1' : '0');
      const head = ch.querySelector('.st-ch-head');
      head.setAttribute('aria-expanded', String(open));
      head.disabled = state === 'locked';
      const pill = ch.querySelector('.st-pill');
      setData(pill, 'tone', ps[i][0]);
      setText(pill, ps[i][1]);
    });
    renderChain(stage);
    renderFixes(stage);
    renderPrevent(stage);
    summaries();
  }

  function focusChapter(i) {
    const ch = chapters[i];
    if (narrow()) ch.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else wrap.scrollTo({ top: ch.offsetTop - wrap.offsetTop - 8, behavior: 'smooth' });
  }

  chapters.forEach((ch, i) => ch.querySelector('.st-ch-head').addEventListener('click', () => {
    if (ch.dataset.state === 'locked') return;
    userOpen[i] = ch.dataset.open !== '1';
    render();
  }));
  playBtn.addEventListener('click', () => BOT.emit('guardrails:replay'));

  BOT.on('tick', render);
  BOT.on('stage', ({ stage } = {}) => {
    render();
    if (stage === 'resolved' && !narrow()) focusChapter(2);
    else if (stage === 'decision' && !narrow()) focusChapter(1);
    else if (stage === 'outage' && !narrow()) wrap.scrollTo({ top: 0, behavior: 'smooth' });
  });
  BOT.on('decision', ({ choice } = {}) => { if (choice in tried) tried[choice] = true; render(); });
  BOT.on('rollback:progress', ({ step } = {}) => { rb = step; render(); });
  BOT.on('resolved', () => {
    const t = document.getElementById('res-time');
    resolvedText = `Fixed in ${t ? t.textContent : 'minutes'} by undoing the change with one traceable pull request (PR #${RB.pr}).`;
    render();
  });
  BOT.on('guardrails:start', () => { replay = { running: true, layer: -1, done: false }; render(); focusChapter(2); });
  BOT.on('guardrails:layer', ({ i } = {}) => { replay.layer = Math.max(replay.layer, i); render(); });
  BOT.on('guardrails:done', () => { replay.running = false; replay.done = true; replay.layer = 3; render(); });
  BOT.on('reset', () => { fresh(); render(); });

  render();
})();

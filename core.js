// Simulation core: stage machine, outage dynamics, timeline, alerts, decision and resolved views.
(function () {
  'use strict';
  const BOT = window.BOT;
  const $ = id => document.getElementById(id);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const fmt = value => Math.round(value).toLocaleString('en-US');

  const RAMP = [[0, 0], [1.5, .18], [4, .5], [8, .8], [12, .92], [16, .97]];
  const OUTAGE_SECONDS = 16;
  const SIM_MINUTES_PER_SECOND = .7;
  const HOLD_SEVERITY = .97;
  const ROLLBACK_FALLBACK_MS = 22000;
  const CLUE_TOTAL = 9;
  // [impact weight, response rate]: the gateway fails first, crew scheduling only degrades.
  const SERVICE_DYNAMICS = { gateway: [1, 5], checkin: [1, 3], flightops: [.95, 2.5], boarding: [.9, 2], notify: [.75, 1.5], crew: [.55, 1.2] };
  const SOURCE_LABELS = { ops: 'OPS', monitoring: 'MON', github: 'GITHUB', security: 'SEC' };
  const CLOSING = 'An outage isn\u2019t always caused by a cyberattack. Sometimes a seemingly small infrastructure change can affect thousands of people. What matters is how quickly teams can detect, investigate, recover and prevent it from happening again. That\u2019s where GitHub\u2019s development and security workflows become critical.';

  const timers = new Set();
  const svcLag = Object.fromEntries(Object.keys(SERVICE_DYNAMICS).map(key => [key, 0]));
  let dyn;
  let rt;

  const freshRuntime = () => ({
    outageT: 0, paxF: 0, peakDelayed: 0, startMinute: 3, resolvedMinute: null,
    busy: false, recoveryStarted: false, sevAtRecovery: 1, rootAnnounced: false,
    scaleTried: false, investigateTried: false, note: '', fallback: null,
  });
  const freshDynamics = () => ({ sev: 0, traffic: 0, rate: 2, trafficRate: 2 });
  dyn = freshDynamics();
  rt = freshRuntime();

  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }
  function deepSet(target, source) {
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value && typeof value === 'object' && target[key] && typeof target[key] === 'object') deepSet(target[key], value);
      else target[key] = value;
    }
  }
  function interpolate(t) {
    for (let i = 1; i < RAMP.length; i += 1) {
      if (t <= RAMP[i][0]) {
        const [t0, v0] = RAMP[i - 1];
        const [t1, v1] = RAMP[i];
        return v0 + (v1 - v0) * (t - t0) / (t1 - t0);
      }
    }
    return RAMP.at(-1)[1];
  }
  const totalClues = () => Object.values(BOT.state.clues).reduce((sum, count) => sum + count, 0);

  /* ---------- stage machine ---------- */
  function applyStage(prev) {
    const { stage } = BOT.state;
    document.body.dataset.stage = stage;
    renderStepper();
    renderStatus();
    renderDecision();
    BOT.emit('stage', { stage, prev });
  }
  function setStage(next) {
    const prev = BOT.state.stage;
    if (prev === next) return;
    BOT.state.stage = next;
    if (next === 'investigate' && !rt.recoveryStarted && prev === 'outage') {
      Object.assign(dyn, { sev: HOLD_SEVERITY, traffic: 1, rate: 1.2, trafficRate: 3 });
    }
    applyStage(prev);
  }

  function start() {
    if (BOT.state.stage !== 'normal') return;
    BOT.state.simMinutes = 2.4;
    setStage('outage');
    BOT.log(`Production deploy #${BOT.facts.deploys[0].id} completed (PR #${BOT.facts.change.pr})`, 'info', 'github');
    BOT.emit('start');
    later(() => { BOT.log('Gateway traffic climbing far above normal', 'warn', 'monitoring'); BOT.toast('Traffic spike on API Gateway', 'warn', 'monitoring'); }, 900);
    later(() => BOT.log('Passenger queues forming at check-in', 'warn', 'ops'), 5500);
    later(() => BOT.log('Flights are being delayed across the network', 'warn', 'ops'), 9000);
    later(() => { BOT.log('SEV-1 declared. You are the incident response team.', 'crit', 'ops'); BOT.toast('SEV-1 declared', 'crit', 'ops'); }, 12500);
  }

  function beginInvestigation() {
    if (BOT.state.stage !== 'outage') return;
    setStage('investigate');
    BOT.log('Investigation open: three evidence sources available', 'info', 'ops');
    BOT.toast('Stage 2: find what changed', 'info', 'ops');
  }

  function openDecision() {
    if (BOT.state.stage !== 'investigate') return;
    rt.busy = false;
    setStage('decision');
    BOT.log('Incident paused for a recovery decision', 'warn', 'ops');
  }

  function onClue({ evidence, index, title }) {
    const { clues } = BOT.state;
    if (!(evidence in clues)) return;
    clues[evidence] = Math.max(clues[evidence], index);
    BOT.log(`Evidence: ${title || `${evidence} clue ${index}`}`, 'info', evidence === 'github' ? 'github' : evidence === 'monitoring' ? 'monitoring' : 'ops');
    if (!BOT.state.rootCause && (clues.change >= 3 || totalClues() >= 6)) {
      BOT.state.rootCause = true;
      if (!rt.rootAnnounced) {
        rt.rootAnnounced = true;
        BOT.log(`Likely root cause: gateway config change (PR #${BOT.facts.change.pr}) removed rate limiting and retry caps`, 'warn', 'ops');
        BOT.toast('Root cause likely identified', 'ok', 'ops');
        later(() => { if (BOT.state.stage === 'investigate') openDecision(); }, 2600);
      }
    }
    renderDecision();
  }

  /* ---------- decisions ---------- */
  function decide(choice) {
    if (BOT.state.stage !== 'decision' || rt.busy) return;
    const state = BOT.state;
    state.decision = choice;
    BOT.emit('decision', { choice });
    if (choice === 'rollback') {
      state.outcome = 'success';
      BOT.log(`DECISION: ROLL BACK PR #${BOT.facts.change.pr}`, 'ok', 'ops');
      setStage('recovering');
      BOT.emit('outcome', { choice, result: 'success' });
      BOT.emit('rollback:start');
      rt.fallback = later(startRecovery, ROLLBACK_FALLBACK_MS);
    } else if (choice === 'scale') {
      state.outcome = 'partial';
      rt.busy = true;
      rt.scaleTried = true;
      rt.note = 'Capacity added. Watching the metrics\u2026';
      BOT.log('DECISION: SCALE. Gateway and check-in capacity +60%', 'warn', 'ops');
      Object.assign(dyn, { sev: .55, traffic: .9, rate: 1.1 });
      BOT.emit('outcome', { choice, result: 'partial' });
      later(() => {
        Object.assign(dyn, { sev: .95, traffic: 1, rate: .9 });
        rt.note = 'The retry storm swallowed the new capacity. Spend is rising and nothing is fixed.';
        BOT.log('Retries absorbed the new capacity. Latency climbing again', 'crit', 'monitoring');
        BOT.toast('Scaling did not fix it', 'crit', 'ops');
      }, 6500);
      later(() => { rt.busy = false; renderDecision(); }, 9500);
    } else {
      state.outcome = 'worse';
      rt.busy = true;
      rt.investigateTried = true;
      rt.note = 'Every extra minute costs more passengers. The evidence is reopened.';
      BOT.log('DECISION: keep investigating. More passengers are stranded', 'warn', 'ops');
      dyn.sev = .985;
      setStage('investigate');
      BOT.emit('outcome', { choice, result: 'worse' });
      later(() => {
        rt.busy = false;
        if (BOT.state.stage === 'investigate') openDecision();
      }, 7500);
    }
    renderDecision();
  }

  function startRecovery() {
    if (rt.recoveryStarted || BOT.state.stage !== 'recovering') return;
    rt.recoveryStarted = true;
    rt.sevAtRecovery = Math.max(.2, BOT.state.severity);
    Object.assign(dyn, { sev: 0, traffic: .03, rate: .28, trafficRate: 1.1 });
    BOT.log('Gateway limits restored. Traffic is returning to normal', 'ok', 'ops');
    BOT.toast('Rollback live: services stabilising', 'ok', 'ops');
  }

  function finishRecovery() {
    const state = BOT.state;
    state.severity = 0;
    state.metrics.recoveryProgress = 1;
    rt.resolvedMinute = state.simMinutes;
    state.outcome = 'success';
    setStage('resolved');
    renderResolved();
    BOT.log('Incident resolved. All services nominal', 'ok', 'ops');
    BOT.toast('BACK ON TRACK', 'ok', 'ops');
    BOT.emit('resolved');
  }

  /* ---------- simulation ---------- */
  function announce(key, from, to) {
    if (BOT.state.stage === 'normal') return;
    const { name } = BOT.state.services[key];
    if (to === 'down') {
      BOT.log(`${name} is DOWN`, 'crit', 'ops');
      const messages = { checkin: 'Check-in is down', boarding: 'Boarding scanners failing', flightops: 'Flight Ops unavailable' };
      if (messages[key]) BOT.toast(messages[key], 'crit', 'ops');
    } else if (to === 'degraded') {
      BOT.log(from === 'down' ? `${name} recovering` : `${name} degraded`, from === 'down' ? 'info' : 'warn', 'ops');
    } else {
      BOT.log(`${name} restored`, 'ok', 'ops');
    }
  }

  let lastFrame = performance.now();
  let sinceTick = 0;
  function step(dt) {
    const state = BOT.state;
    const stage = state.stage;
    const running = stage === 'outage' || stage === 'investigate' || stage === 'recovering' || (stage === 'decision' && rt.busy);

    if (stage === 'outage') {
      rt.outageT += dt;
      Object.assign(dyn, { sev: interpolate(rt.outageT), traffic: clamp(rt.outageT / 3.5), rate: 4, trafficRate: 4 });
    }
    state.severity += (dyn.sev - state.severity) * (1 - Math.exp(-dyn.rate * dt));
    if (stage === 'normal' || stage === 'resolved') state.severity = state.severity < .004 ? 0 : state.severity;
    rt.traffic = (rt.traffic || 0) + (dyn.traffic - (rt.traffic || 0)) * (1 - Math.exp(-dyn.trafficRate * dt));

    const sev = state.severity;
    const metrics = state.metrics;
    const jitter = () => Math.random() - .5;
    metrics.trafficX = +Math.max(1, 1 + 11 * rt.traffic + jitter() * .5 * rt.traffic).toFixed(1);
    metrics.latencyMs = Math.round(180 + 9220 * Math.pow(sev, 1.4) * (1 + jitter() * .06 * sev));
    metrics.errorRate = +(.004 + .376 * Math.pow(sev, 1.2)).toFixed(3);
    metrics.flightsDelayed = Math.round(metrics.flightsTotal * clamp((sev - .03) / .94));
    metrics.queueLength = Math.round(120 + 3100 * Math.pow(sev, 1.1) + jitter() * 60 * sev);
    rt.peakDelayed = Math.max(rt.peakDelayed, metrics.flightsDelayed);
    if (running) {
      rt.paxF += sev * 310 * dt;
      state.simMinutes += dt * SIM_MINUTES_PER_SECOND;
    }
    metrics.passengersImpacted = Math.round(rt.paxF);
    if (stage === 'recovering' && rt.recoveryStarted) metrics.recoveryProgress = clamp(1 - sev / rt.sevAtRecovery);

    for (const [key, [weight, rate]] of Object.entries(SERVICE_DYNAMICS)) {
      svcLag[key] += (sev - svcLag[key]) * (1 - Math.exp(-rate * dt));
      const service = state.services[key];
      service.health = +(1 - clamp(svcLag[key] * weight)).toFixed(3);
      const status = service.health >= .75 ? 'ok' : service.health >= .35 ? 'degraded' : 'down';
      if (status !== service.status) {
        const previous = service.status;
        service.status = status;
        announce(key, previous, status);
      }
    }

    if (stage === 'outage' && rt.outageT >= OUTAGE_SECONDS) beginInvestigation();
    if (stage === 'recovering' && rt.recoveryStarted && sev < .04) finishRecovery();
  }

  function frame() {
    const now = performance.now();
    const dt = Math.min(.25, (now - lastFrame) / 1000);
    lastFrame = now;
    step(dt);
    sinceTick += dt;
    if (sinceTick >= .25) {
      sinceTick = 0;
      render();
      BOT.emit('tick');
    }
  }

  /* ---------- rendering ---------- */
  function statusFor() {
    const { stage, severity } = BOT.state;
    if (stage === 'resolved') return ['ok', 'RESOLVED \u00b7 BACK ON TRACK'];
    if (stage === 'normal') return ['ok', 'ALL SYSTEMS NORMAL'];
    if (stage === 'recovering' && severity < .55) return ['warn', 'RECOVERING \u00b7 STABILISING'];
    if (severity >= .55) return ['crit', 'SEV-1 \u00b7 MAJOR OUTAGE'];
    if (severity >= .12) return ['warn', 'DEGRADED SERVICE'];
    return ['ok', 'ALL SYSTEMS NORMAL'];
  }
  function renderStatus() {
    const [level, text] = statusFor();
    document.body.dataset.level = level;
    $('status-indicator').dataset.level = level;
    $('status-text').textContent = text;
  }
  function renderStepper() {
    const { stage } = BOT.state;
    const active = { outage: 1, investigate: 2, decision: 3, recovering: 3, resolved: 4 }[stage] || 0;
    document.querySelectorAll('#stage-stepper li').forEach((item, index) => {
      item.classList.toggle('active', index + 1 === active);
      item.classList.toggle('done', index + 1 < active);
    });
  }

  function render() {
    const { severity, metrics, stage, simMinutes } = BOT.state;
    document.documentElement.style.setProperty('--sev', severity.toFixed(3));
    $('sim-clock').textContent = BOT.clock(simMinutes);
    $('sim-clock').classList.toggle('frozen', stage === 'decision' && !rt.busy);
    renderStatus();
    $('btn-start').disabled = stage !== 'normal';
    if (stage === 'outage') {
      $('o-traffic').textContent = `${metrics.trafficX.toFixed(1)}\u00d7`;
      $('o-queue').textContent = fmt(metrics.queueLength);
      $('o-flights').textContent = `${metrics.flightsDelayed} / ${metrics.flightsTotal}`;
      $('o-bar').style.width = `${clamp(rt.outageT / OUTAGE_SECONDS) * 100}%`;
    }
    if (stage === 'decision') {
      $('dec-pax').textContent = fmt(metrics.passengersImpacted);
      $('dec-flights').textContent = `${metrics.flightsDelayed} / ${metrics.flightsTotal}`;
    }
    if (stage === 'recovering') {
      const waiting = !rt.recoveryStarted;
      $('rec-title').textContent = waiting ? 'ROLLBACK IN PROGRESS' : 'SERVICES STABILISING';
      $('rec-text').textContent = waiting
        ? `Watch the GitHub panel: revert PR #${BOT.facts.rollback.pr}, checks, approval, then deploy.`
        : 'Traffic is normalising. Flights are returning to green.';
      $('rec-bar').style.width = `${metrics.recoveryProgress * 100}%`;
      $('rec-queue').textContent = fmt(metrics.queueLength);
      $('rec-flights').textContent = `${metrics.flightsDelayed} / ${metrics.flightsTotal}`;
    }
    const ready = stage === 'investigate' && totalClues() >= 3 && !rt.busy;
    $('btn-decide').hidden = !ready;
    $('btn-decide').classList.toggle('hot', BOT.state.rootCause);
    $('btn-skip').hidden = stage !== 'outage' || rt.outageT < 6;
  }

  function renderDecision() {
    if (!$('panel-decision').firstChild) return;
    const busy = rt.busy;
    document.querySelectorAll('.decision').forEach(button => {
      const choice = button.dataset.choice;
      const spent = (choice === 'scale' && rt.scaleTried) || (choice === 'investigate' && totalClues() >= CLUE_TOTAL);
      button.disabled = busy || spent || BOT.state.stage !== 'decision';
      button.classList.toggle('spent', spent);
      button.querySelector('.d-tag').textContent = spent ? (choice === 'scale' ? 'TRIED \u00b7 NO LASTING EFFECT' : 'EVIDENCE EXHAUSTED') : '';
    });
    $('dec-note').textContent = rt.note;
    $('dec-paused').hidden = busy;
  }

  function renderResolved() {
    const { metrics } = BOT.state;
    const minutes = Math.max(1, Math.round((rt.resolvedMinute ?? BOT.state.simMinutes) - rt.startMinute));
    $('res-time').textContent = `${minutes} min`;
    $('res-pax').textContent = fmt(metrics.passengersImpacted);
    $('res-flights').textContent = String(rt.peakDelayed);
  }

  function addTimeline({ text, level = 'info', source = 'ops' }) {
    const item = document.createElement('li');
    item.className = `lvl-${level}`;
    const time = document.createElement('time');
    time.className = 'mono';
    time.textContent = BOT.clock();
    const tag = document.createElement('span');
    tag.className = `src src-${source}`;
    tag.textContent = SOURCE_LABELS[source] || String(source).toUpperCase();
    const message = document.createElement('span');
    message.className = 'msg';
    message.textContent = text;
    item.append(time, tag, message);
    const list = $('timeline');
    list.prepend(item);
    while (list.children.length > 60) list.lastChild.remove();
  }

  function addToast({ text, level = 'info', source = 'ops' }) {
    const box = $('toasts');
    const toast = document.createElement('div');
    toast.className = `toast lvl-${level}`;
    const tag = document.createElement('b');
    tag.textContent = SOURCE_LABELS[source] || String(source).toUpperCase();
    toast.append(tag, document.createTextNode(` ${text}`));
    box.prepend(toast);
    while (box.children.length > 4) box.lastChild.remove();
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 400);
    }, 4800);
  }

  function buildViews() {
    $('stage-intro').innerHTML = `
      <div class="center-card">
        <p class="eyebrow">MERIDIAN AIR \u00b7 OPERATIONS CONTROL (FICTIONAL)</p>
        <h1>You are the incident response team.</h1>
        <p class="lede">Peak departures begin in minutes and a routine infrastructure change has just shipped. Detect it, investigate it, recover from it.</p>
        <button id="btn-start-intro" class="btn primary big" type="button">START INCIDENT</button>
        <p class="fine">Fictional simulation inspired by recent real-world aviation technology disruptions. Not every major outage is a cyberattack.</p>
      </div>`;
    $('stage-outage').innerHTML = `
      <div class="center-card">
        <p class="eyebrow crit blink">STAGE 1 \u00b7 THE OUTAGE</p>
        <h2>Services are failing. Passengers are stranded.</h2>
        <div class="o-stats">
          <div><span id="o-traffic" class="big mono">1.0\u00d7</span><label>gateway traffic</label></div>
          <div><span id="o-queue" class="big mono">0</span><label>in check-in queues</label></div>
          <div><span id="o-flights" class="big mono">0 / 24</span><label>flights delayed</label></div>
        </div>
        <div class="bar"><i id="o-bar"></i></div>
        <p class="fine">The investigation opens as the picture becomes clear.</p>
        <button id="btn-skip" class="btn ghost" type="button" hidden>Begin investigation now \u2192</button>
      </div>`;
    $('panel-decision').innerHTML = `
      <div class="decide">
        <div class="decide-head">
          <div><p class="eyebrow">STAGE 3 \u00b7 RECOVER</p><h2>What\u2019s the call?</h2></div>
          <div class="decide-stats"><span><b id="dec-pax" class="mono">0</b> passengers affected</span><span><b id="dec-flights" class="mono">0 / 24</b> flights delayed</span></div>
        </div>
        <p id="dec-paused" class="paused">\u23f8 INCIDENT PAUSED \u00b7 DECISION REQUIRED</p>
        <div class="decide-grid">
          <button class="decision" data-choice="rollback" type="button"><span class="d-ico" aria-hidden="true">\u21b6</span><b>ROLL BACK</b><span>Revert the last infrastructure change.</span><em class="d-tag"></em></button>
          <button class="decision" data-choice="scale" type="button"><span class="d-ico" aria-hidden="true">\u2b06</span><b>SCALE</b><span>Add gateway and check-in capacity.</span><em class="d-tag"></em></button>
          <button class="decision" data-choice="investigate" type="button"><span class="d-ico" aria-hidden="true">\u2315</span><b>INVESTIGATE</b><span>Keep examining the evidence.</span><em class="d-tag"></em></button>
        </div>
        <p id="dec-note" class="dec-note" role="status"></p>
      </div>`;
    $('stage-recovering').innerHTML = `
      <div class="center-card">
        <p class="eyebrow ok">STAGE 3 \u00b7 RECOVER</p>
        <h2 id="rec-title">ROLLBACK IN PROGRESS</h2>
        <p id="rec-text" class="lede"></p>
        <div class="o-stats two">
          <div><span id="rec-queue" class="big mono">0</span><label>in check-in queues</label></div>
          <div><span id="rec-flights" class="big mono">0 / 24</span><label>flights delayed</label></div>
        </div>
        <div class="bar ok"><i id="rec-bar"></i></div>
      </div>`;
    $('stage-resolved').innerHTML = `
      <div class="center-card wide">
        <p class="eyebrow ok">INCIDENT RESOLVED \u00b7 BACK ON TRACK</p>
        <h2>Recovered with a traceable change.</h2>
        <div class="o-stats">
          <div><span id="res-time" class="big mono">0 min</span><label>time to recover</label></div>
          <div><span id="res-pax" class="big mono">0</span><label>passengers affected</label></div>
          <div><span id="res-flights" class="big mono">0</span><label>peak flights delayed</label></div>
        </div>
        <blockquote class="closing">${CLOSING}</blockquote>
        <div class="row">
          <button id="btn-replay" class="btn gh" type="button">REPLAY WITH GITHUB GUARDRAILS</button>
          <button id="btn-again" class="btn" type="button">RUN IT AGAIN</button>
        </div>
      </div>`;
    const decide = document.createElement('button');
    decide.id = 'btn-decide';
    decide.type = 'button';
    decide.className = 'btn primary floating';
    decide.hidden = true;
    decide.textContent = 'MAKE THE RECOVERY CALL \u2192';
    $('panel-stage').append(decide);
  }

  function reset() {
    const prev = BOT.state.stage;
    clearTimers();
    deepSet(BOT.state, BOT.defaults());
    rt = freshRuntime();
    dyn = freshDynamics();
    Object.keys(svcLag).forEach(key => { svcLag[key] = 0; });
    $('timeline').replaceChildren();
    $('toasts').replaceChildren();
    BOT.emit('reset');
    applyStage(prev);
    render();
  }

  function init() {
    buildViews();
    $('btn-start').addEventListener('click', start);
    $('btn-start-intro').addEventListener('click', start);
    $('btn-reset').addEventListener('click', reset);
    $('btn-skip').addEventListener('click', beginInvestigation);
    $('btn-decide').addEventListener('click', openDecision);
    $('btn-replay').addEventListener('click', () => BOT.emit('guardrails:replay'));
    $('btn-again').addEventListener('click', () => { reset(); later(start, 400); });
    $('panel-decision').addEventListener('click', event => {
      const button = event.target.closest('.decision');
      if (button) decide(button.dataset.choice);
    });
    BOT.on('log', addTimeline);
    BOT.on('toast', addToast);
    BOT.on('clue', onClue);
    BOT.on('rollback:deployed', () => {
      if (rt.fallback) { clearTimeout(rt.fallback); timers.delete(rt.fallback); rt.fallback = null; }
      startRecovery();
    });
    renderStepper();
    render();
    setInterval(frame, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

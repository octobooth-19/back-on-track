// Shared event bus and state container. See README.md for the contract.
(function () {
  'use strict';
  const handlers = Object.create(null);
  const pad = n => String(n).padStart(2, '0');

  function defaults() {
    const svc = name => ({ name, health: 1, status: 'ok' });
    const names = window.BOT_FACTS.services;
    return {
      stage: 'normal',          // normal | outage | investigate | decision | recovering | resolved
      severity: 0,              // 0 healthy .. 1 total outage (smoothed)
      simMinutes: 0,            // minutes since 14:00
      services: Object.fromEntries(Object.keys(names).map(key => [key, svc(names[key])])),
      metrics: {
        trafficX: 1, latencyMs: 180, errorRate: 0.004,
        passengersImpacted: 0, flightsDelayed: 0, flightsTotal: 24,
        queueLength: 120, recoveryProgress: 0,
      },
      clues: { change: 0, monitoring: 0, github: 0 },
      rootCause: false,
      decision: null,           // rollback | scale | investigate
      outcome: null,            // success | partial | worse
    };
  }

  const BOT = window.BOT = {
    facts: window.BOT_FACTS,
    state: defaults(),
    defaults,
    on(event, fn) {
      (handlers[event] ||= new Set()).add(fn);
      return () => handlers[event].delete(fn);
    },
    emit(event, data) {
      for (const fn of [...(handlers[event] || [])]) {
        try { fn(data); } catch (error) { console.error(`BOT handler for "${event}" failed`, error); }
      }
    },
    log(text, level = 'info', source = 'ops') { BOT.emit('log', { text, level, source }); },
    toast(text, level = 'info', source = 'ops') { BOT.emit('toast', { text, level, source }); },
    clock(minutes = BOT.state.simMinutes) {
      const total = 14 * 60 + Math.floor(minutes);
      return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
    },
  };
})();

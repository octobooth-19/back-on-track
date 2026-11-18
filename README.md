# BACK ON TRACK — Interactive Airline Outage Simulator

**Built by Daniyal Hussain ([@Jaqqen](https://github.com/Jaqqen), developer) and Ayodeji Ogunsola ([@haywhyogs](https://github.com/haywhyogs), DevOps engineer)** at GitHub Universe.

A fictional, single-screen incident war room inspired by recent aviation technology disruptions. The audience plays the incident response team: watch the outage, investigate the evidence, choose a recovery path, and see how GitHub workflows help prevent and recover from incidents. All GitHub events are **simulated**; there is no backend, authentication or external API.

Open `index.html` directly in a browser. It uses plain HTML, CSS and JavaScript only (no build, no packages).

## Architecture contract (for the people and agents building the modules)

Classic `<script>` files only (works on `file://`). Load order: `facts.js`, `bus.js`, `map.js`, `investigate.js`, `github.js`, `core.js`.

| Owner | Files | Mount point(s) in `index.html` |
| --- | --- | --- |
| Map | `map.js`, `map.css` | `#panel-map` |
| Investigate | `investigate.js`, `investigate.css` | `#panel-health`, `#panel-investigate` |
| GitHub | `github.js`, `github.css` | `#panel-github` |
| Core | `core.js`, `core.css`, `index.html`, `base.css`, `bus.js`, `facts.js` | topbar, timeline, intro/outage/decision/recovering/resolved views, toasts |

Each module wraps itself in an IIFE, renders into its mount point(s) only, and never edits files it does not own.

### Shared state: `window.BOT.state` (read-only for modules; written by `core.js`)

```
stage: 'normal' | 'outage' | 'investigate' | 'decision' | 'recovering' | 'resolved'
severity: 0..1                    // smoothed. 0 healthy, 1 total outage
simMinutes: number                // minutes since 14:00; BOT.clock() formats "HH:MM"
services: { gateway, checkin, boarding, flightops, crew, notify }  // each { name, health: 0..1, status: 'ok'|'degraded'|'down' }
metrics: { trafficX (1..12), latencyMs, errorRate (0..1), passengersImpacted, flightsDelayed,
           flightsTotal (24), queueLength, recoveryProgress (0..1) }
clues: { change, monitoring, github }   // revealed count 0..3 per evidence card
rootCause: boolean
decision: null | 'rollback' | 'scale' | 'investigate'
outcome:  null | 'success' | 'partial' | 'worse'
```

Fictional story facts live in `window.BOT_FACTS` (`facts.js`). Use them; do not invent conflicting names, numbers or PR ids.

### Events: `BOT.on(name, fn)`, `BOT.emit(name, data)`

| Event | Emitted by | Data | Meaning |
| --- | --- | --- | --- |
| `tick` | core | none | every ~250 ms; read `BOT.state` and update text/gauges |
| `stage` | core | `{ stage, prev }` | stage changed |
| `start` | core | none | START INCIDENT pressed (state already moved to `outage`) |
| `clue` | **investigate** | `{ evidence: 'change'\|'monitoring'\|'github', index: 1..3, title }` | audience revealed a clue; core updates `state.clues`, the timeline and advances the stage |
| `decision` | core | `{ choice: 'rollback'\|'scale'\|'investigate' }` | audience chose a recovery option |
| `outcome` | core | `{ choice, result: 'success'\|'partial'\|'worse' }` | result of a decision (`partial`: scale briefly helps then fails; `worse`: more investigation costs time) |
| `rollback:start` | core | none | rollback chosen: GitHub panel runs the revert PR pipeline |
| `rollback:deployed` | **github** | none | revert PR deployed; core then starts stabilising services (core falls back after ~22 s) |
| `guardrails:replay` | core | none | resolved screen asked to replay how GitHub guardrails would have caught PR #4821 |
| `resolved` | core | none | incident resolved |
| `reset` | core | none | RESET SIMULATION: **every module must return to its initial state and cancel timers/animations** |
| `log` | any | `{ text, level, source }` | use `BOT.log(text, level, source)`; level `info\|warn\|crit\|ok`, source e.g. `monitoring\|github\|security\|ops` |
| `toast` | any | `{ text, level, source }` | use `BOT.toast(text, level, source)` for a transient alert |

Stage flow: `normal` → START → `outage` (~16 s of escalation) → `investigate` → `decision` → `recovering` → `resolved`.
`decision` choices: **rollback** (correct) → `rollback:start` → `rollback:deployed` → recover; **scale** (partial: improves briefly, then the retry storm swallows the capacity) → back to `decision`; **investigate** (worse: costs time, reveals any remaining clues) → back to `decision`.

### Design rules
Dark cinematic command centre. CSS variables in `base.css`: `--ok` green, `--warn` amber, `--crit` red, `--accent` blue, `--gh-purple`, `--mono`. `core.js` sets `--sev` (0..1) on `:root` and `data-stage` / `data-level` on `<body>` so CSS can react. Target 1440×810 first; stay usable at 1100×680. Minimal text, strong hierarchy, smooth animation, `prefers-reduced-motion` respected. Everything on screen must be functional.

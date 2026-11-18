// BACK ON TRACK: animated airline operations map + KPI overlay (mounts into #panel-map).
(function () {
  'use strict';
  const BOT = window.BOT;
  const mount = document.getElementById('panel-map');
  if (!BOT || !mount) return;

  /* ---------------------------------------------------------------- data */

  // Simplified Natural Earth land (public domain), cropped to the Americas.
  // Rings separated by ';'. Each ring: first point "lon,lat" in 0.1 degree units, then "dlon,dlat" deltas.
  const LAND = '-609,101 -9,-1 -2,1 3,3 0,4 8,1;-656,182 -2,-2 -14,0 0,4 1,1 13,-1;-769,179 -3,-2 -6,2 -5,3 1,3 4,0 9,-1 5,-3 2,-2;-726,199 9,-2 1,2 8,0 6,-3 3,1 1,-4 6,0 -1,-3 5,0 5,-4 -4,-4 -5,2 -7,0 -2,-1 -4,-1 -2,2 -3,-1 -4,-7 -2,1 -1,3 -7,2 -4,-1 -6,1 -5,-2 -5,4 0,2 17,-2 4,3 -5,4 0,4 -6,2 2,2;-1556,191 -1,-2 -3,1 1,3 -2,4 3,3 -1,2 1,1 7,-4 3,-4 -4,-3;-797,228 4,-4 10,1 18,-13 9,-2 -1,-3 8,0 7,-4 -1,-2 -7,-2 -28,0 7,5 -4,3 -6,0 -4,3 -2,6 -6,0 -9,2 -3,2 -13,2 -4,2 4,2 -10,1 -7,-5 -4,-1 -2,-2 -5,-1 -4,1 5,3 3,4 9,4 10,2 17,-1;-775,238 -3,-1 -2,6 -4,3 2,6 3,0 4,-9;-778,266 -11,-2 -1,4 12,1;-770,266 -2,-7 -2,1 1,5 -5,4 0,1;-636,465 7,-1 9,0 -5,-4 -4,0 -13,4 -2,3 4,4;-618,491 -5,0 -13,3 -9,5 3,1 13,-3 11,-4;-1235,485 -5,-1 -16,4 -4,4 -9,3 -1,3 -11,2 -3,5 0,3 27,-5 8,-8 10,-4;-561,507 -7,-9 6,3 7,-2 -3,-3 9,-3 4,3 10,-4 -3,-7 7,2 5,-12 -5,-8 -4,-1 -7,2 2,8 -3,1 -11,-8 -6,0 7,5 -10,2 -30,0 -1,3 6,3 -4,3 8,6 11,16 6,6 8,3 5,0 -2,-3;-1327,540 9,1 -2,-11 8,-8 -4,0 -6,4 -4,5 -5,3 -1,5 0,3;-1530,571 -10,-4 -5,3 -2,5 15,5 6,-1 5,-3;-1656,599 -6,-1 -13,4 10,2 8,-1;-793,622 -4,-6 -4,1 -2,4 4,3 4,0;-819,627 -12,-5 -7,0 -2,3 7,4 14,0;-852,657 2,-5 5,2 29,-10 1,-4 7,0 7,-3 -9,-3 -15,2 -6,5 -10,-5 -14,-6 -4,6 -13,-1 8,5 2,8 3,9;-759,671 -11,0 -2,5 4,5 9,2 8,-3 0,-4 -1,-2;-957,691 -6,-3 -13,2 -8,-1 -14,5 9,3 7,4 16,-4 3,-2;-905,695 0,-10 13,8 12,-7 -3,-7 10,-7 10,7 7,9 1,11 29,-2 13,-5 1,-5 -8,-6 7,-5 -1,-5 -19,-7 -14,-2 -11,4 -3,-5 -9,-9 -3,-4 -12,-7 -14,-1 -8,-4 -1,-6 -11,-2 -13,-8 -10,-11 -4,-8 -1,-12 15,-1 9,-17 14,2 19,-5 9,-3 8,-5 12,-3 11,-4 27,-1 -1,-9 3,-10 7,-11 15,-10 8,3 5,11 -5,15 -7,6 16,5 11,6 6,7 -1,7 -7,9 -12,7 12,11 -5,9 -3,15 7,3 27,-4 9,3 21,-10 3,-4 18,0 0,-9 3,-12 9,-2 8,-6 14,6 10,11 6,4 32,-33 -4,-7 13,-5 9,-6 16,-3 7,-3 3,-8 8,-2 4,-3 1,-11 -14,-8 -17,-4 -12,-7 -17,-2 -22,2 -25,-1 -8,-7 -13,-4 -26,-23 8,2 16,13 21,8 15,1 9,-5 -9,-6 6,-19 13,-4 17,1 10,11 1,-7 6,-4 -13,-6 -22,-6 -10,-4 -11,-7 -7,0 -1,9 18,8 -27,-2 1,-3 -10,-5 -21,-6 -6,-7 -1,-1 0,-6 3,-5 4,0 -1,4 3,-3 0,-2 -7,-2 -5,0 -18,-3 -8,-3 14,2 4,-2 -14,-3 -7,0 1,2 -4,-3 3,-1 -2,-7 -7,-7 -1,2 -5,3 2,-5 2,-2 0,-4 -8,-12 -1,1 3,6 -5,4 -2,9 -1,-5 2,-6 -7,1 7,-3 1,-9 2,-1 3,-13 -7,-8 -10,-3 -6,-6 -6,0 -5,-4 -1,-3 -11,-7 -6,-5 -4,-6 -2,-7 2,-7 8,-15 0,-5 4,-11 0,-11 -3,-6 -3,-1 -5,1 -1,4 -4,3 -12,20 2,6 -2,6 -8,9 -4,1 -10,-5 -7,6 -6,2 -11,-1 -9,1 -8,-1 -4,-1 2,-3 0,-4 2,-2 -2,-1 -4,1 -3,-2 -8,1 -7,5 -9,-1 -7,2 -7,-1 -8,-2 -9,-8 -10,-4 -5,-5 -3,-4 1,-12 2,-4 -4,-8 -2,-7 -2,-19 2,-5 3,-5 2,-8 7,-7 2,-6 4,-5 11,-2 4,-5 8,3 22,5 6,4 3,6 0,8 2,3 7,3 10,2 16,0 2,-2 0,-5 -6,-5 -2,-6 2,-2 -4,-12 -3,2 -2,0 0,-1 2,0 -2,-8 1,-1 -1,-10 -3,-2 -1,-1 -2,-3 3,-2 1,1 4,-1 2,2 15,-1 4,2 6,-1 4,1 6,-2 12,-8 -1,-3 1,-4 -3,-7 0,-12 -1,-1 -1,-4 0,-3 -1,-2 0,-3 4,-7 12,-12 0,-2 5,0 3,-2 4,1 11,4 3,3 11,-2 5,-1 6,-6 6,-1 7,7 4,1 2,12 6,5 6,0 1,2 8,-1 11,8 6,4 3,0 3,-3 -3,-5 -6,-2 4,-4 0,-6 -5,-5 4,-8 4,0 3,8 -4,3 0,8 12,4 -1,4 4,4 3,-8 7,0 7,-5 0,-4 20,2 5,-5 8,-1 6,3 0,3 24,0 -8,-3 3,-5 8,0 8,-5 1,-8 5,0 11,-6 6,-7 0,-5 4,0 9,-8 22,0 -224,0 -1,7 -4,5 -3,3 -2,6 2,2 -2,1 -2,3 -5,3 -5,-1 -2,-3 -4,-3 -2,0 -1,-2 5,-5 -4,-3 -5,-1 -2,6 -1,-2 -3,1 -2,4 -11,2 0,-2 -7,4 -2,1 1,2 0,2 -3,3 -7,3 -1,3 -3,2 1,-3 -2,-3 -7,7 2,6 -3,1 2,2 -20,18 1,2 2,-2 1,1 -2,3 -3,1 -1,-3 -6,1 -7,3 -6,0 -3,3 -11,1 -5,2 -16,15 -6,3 -8,3 -6,-1 -13,-4 -14,4 -10,5 -7,1 -11,5 -9,4 -2,3 -6,1 -10,3 -4,5 -11,5 -5,6 -2,5 3,1 -1,3 2,3 0,3 -7,14 -9,10 -10,8 -5,6 -9,4 -1,2 1,7 -5,2 -6,5 -2,7 -6,0 -10,10 -1,4 -5,7 -3,8 0,4 -8,4 -3,-1 -6,3 -1,-4 2,-12 4,-5 10,-9 2,-4 1,0 2,-6 6,-6 6,-5 3,-10 6,-9 0,-5 5,0 8,-9 0,-2 -5,-4 -1,0 -3,6 -7,6 -12,7 1,8 -2,5 -12,8 -1,-2 -2,3 -7,2 -6,6 5,1 4,3 0,5 -7,7 -6,3 -12,20 -6,14 -6,6 -5,1 -1,3 -6,1 -3,2 -10,2 -2,1 -1,6 -10,9 -8,14 0,3 -12,12 -2,8 -5,5 2,8 0,9 -3,8 4,9 2,18 -2,14 -3,8 -3,5 1,2 15,-4 5,-9 3,3 -5,16 -28,14 -18,4 -6,9 2,6 -13,4 -2,9 -12,7 0,5 -6,4 -9,3 -3,9 -12,8 -6,9 -25,1 -12,3 -21,10 -27,6 -14,-1 -19,4 -12,5 -11,-2 2,-7 -17,-3 -9,-3 -11,-3 -1,7 4,9 11,3 -3,3 -13,-6 -7,-7 -14,-6 7,-5 -9,-8 -21,-7 -3,-4 -15,-6 -3,-4 -12,-4 -7,1 -28,-10 -17,-3 -2,2 21,7 11,6 12,1 5,4 24,12 2,7 5,6 -12,-3 -3,2 -5,-4 -7,5 -3,-3 -3,5 -11,-4 -6,0 -1,6 2,3 -6,4 -13,-2 -15,7 0,6 -8,4 4,6 8,5 3,5 8,1 7,-1 8,4 8,0 7,3 -2,4 -5,2 7,4 -17,-3 -3,-2 -7,2 -15,-1 -14,3 -5,4 -11,5 0,1 13,4 22,5 8,0 -1,-5 21,0 -8,6 -12,4 -7,5 -10,4 -14,4 6,5 18,0 12,5 3,5 10,4 10,2 19,4 9,-1 15,6 15,-3 8,-4 4,2 17,-1 -1,-2 16,-2 10,1 21,-3 19,-1 8,-1 13,2 15,-4 30,-3 15,-5 11,-1 9,4 12,3 15,-1 15,4 16,3 7,-4 7,2 3,5 7,-1 17,-9 13,7 1,-8 13,2 3,2 12,0 15,-4 24,-4 14,-2 10,1 13,-5 -14,-5 18,-2 27,1 9,2 10,-6 11,5 -10,4 6,4 20,1 9,-3 10,-5 11,1 18,-5 29,2 -1,6 9,2 16,-3 0,-10 6,8 8,0 5,10 -11,6 -12,4 1,11 12,7 13,-2 10,-4 14,-11 -9,-5;-1142,731 -5,-5 23,4 13,-5 12,5 9,-4 8,-10 5,5 -7,10 9,1 10,-1 11,-4 6,-10 3,-7 35,-10 -1,-4 -16,-1 6,-4 -3,-3 -19,1 -16,3 -12,-1 -19,-3 -43,-3 -6,5 -13,3 -9,-1 -12,7 22,3 14,0 13,2 -19,2 -36,-1 -5,4 23,4 -15,0 -18,3 9,7 6,4 27,6;-1045,734 -9,-6 -16,7 17,2;-764,731 2,-3 -36,0 -11,5 1,4 4,1 24,-1;-866,732 8,-7 9,8 26,5 17,-11 -1,-6 19,3 10,4 22,-5 14,-5 1,-5 18,3 11,-7 24,-4 9,-4 9,-9 -18,-5 23,-6 16,-2 15,-10 16,0 -4,-7 -17,-12 -13,4 -15,10 -13,-1 -1,-6 10,-6 14,-4 4,-3 6,-10 -3,-7 -13,2 -25,9 25,-15 1,-4 -27,4 -21,6 -13,5 4,3 -29,10 0,-3 -29,-2 -9,4 7,7 40,1 -4,4 4,5 13,10 -3,4 -4,4 -15,4 -21,4 7,3 -11,6 -9,0 -7,4 -6,-3 -18,-2 -37,3 -37,4 -8,4 10,4 -14,0 -3,11 8,8 10,4 26,3;-1004,738 12,-2 18,2 3,-3 -10,-5 15,-4 -1,-9 -17,-4 -9,1 -7,3 -25,8 0,3 21,-1 -12,7;-932,728 -11,-8 -11,1 -6,8 0,5 5,5 10,2 21,0 19,-2 -15,-9;-1205,714 -26,-5 -5,5 -23,5 11,11 9,7 -10,6 34,1 14,-2 26,0 20,-7 -13,-3 -24,-7 -13,-7;-936,750 -5,-4 -15,1 -12,2 5,5 14,2 9,-3;-985,767 8,-5 0,-5 -5,-7 -16,-1 -11,2 0,5 -16,0 -1,7 11,0 15,3 14,0;-1082,762 4,-3 9,1 10,0 2,-5 -6,-5 -34,-2 -25,-4 -16,0 -1,3 21,5 -45,-1 -14,1 13,10 10,3 28,-4 18,-5 17,-1 -14,9 9,4 11,-1;-947,771 11,-3 20,0 8,-3 -2,-4 12,-2 6,-3 28,-1 16,2 20,1 17,-1 10,-4 3,-4 -7,-2 -14,-3 -13,2 -50,-2 -42,4 -4,6 -1,5 -10,4 -21,1 -11,4 4,3;-1162,777 -2,-8 -7,-4 -44,-6 -14,2 18,8 20,6 15,0;-939,775 -23,0 -2,3 20,0 7,-1;-1102,777 -19,-3 -14,3 8,3 14,2 14,-2;-1097,786 -12,-2 -16,0 0,2 10,2 5,0;-958,780 -15,-1 -8,2 -5,3 0,5 18,-1 13,-4;-1000,783 3,-4 -16,1 -17,3 -22,1 10,3 -12,2 0,1 31,0 15,-2;-873,790 -17,-7 -18,-1 -21,1 -11,5 1,2;-762,790 8,-5 -10,-3 -15,-3 -5,-4 -14,-3 2,-2 17,0 0,-2 -27,-6 -26,3 -29,-2 -34,2 -1,5 18,2 -5,7 6,1 27,-5 -13,7 -16,2 7,4 18,2;-340,668 -2,-1 -22,-7 -6,0 -28,-6 -9,-6 0,-6 -5,-7 -16,-8 4,-8 -10,-18 -14,-1 -15,8 -20,1 -9,5 -7,10 -17,12 -5,7 -2,9 -14,9 4,8 -7,3 10,12 15,3 4,5 2,7 -26,-6 -12,3 -1,7 4,5 10,0 20,-2 -26,9 -10,-1 -8,2 11,10 -6,4 -20,17 -13,4 0,4 -27,6 -21,1 -51,-1 -29,9 26,3 20,1 -42,3 -23,3 1,4 45,6 347,0';

  // Meridian Air hubs. w: share of the queue, thr: severity offset at which the hub starts to struggle,
  // lab: label [dx, dy, align], qd: queue icons above (-1) or below (+1) the node.
  const HUBS = [
    { id: 'YYZ', lat: 43.68, lon: -79.63, w: 0.9, thr: 0.04, lab: [-8, -6, 'right'], qd: -1 },
    { id: 'YUL', lat: 45.47, lon: -73.74, w: 0.6, thr: 0.18, lab: [8, -5, 'left'], qd: -1 },
    { id: 'YVR', lat: 49.19, lon: -123.18, w: 0.6, thr: 0.22, lab: [-8, -3, 'right'], qd: -1 },
    { id: 'JFK', lat: 40.64, lon: -73.78, w: 1.3, thr: 0.0, lab: [8, 6, 'left'], qd: 1 },
    { id: 'ORD', lat: 41.98, lon: -87.9, w: 1.5, thr: 0.0, lab: [8, -6, 'left'], qd: -1 },
    { id: 'ATL', lat: 33.64, lon: -84.43, w: 1.3, thr: 0.06, lab: [8, 4, 'left'], qd: 1 },
    { id: 'DFW', lat: 32.9, lon: -97.04, w: 1.0, thr: 0.1, lab: [8, 4, 'left'], qd: 1 },
    { id: 'DEN', lat: 39.86, lon: -104.67, w: 0.8, thr: 0.14, lab: [8, -5, 'left'], qd: 1 },
    { id: 'LAX', lat: 33.94, lon: -118.41, w: 1.2, thr: 0.08, lab: [-8, 4, 'right'], qd: 1 },
    { id: 'SEA', lat: 47.45, lon: -122.31, w: 0.7, thr: 0.26, lab: [-8, 5, 'right'], qd: 1 },
    { id: 'MIA', lat: 25.79, lon: -80.29, w: 0.8, thr: 0.12, lab: [8, 4, 'left'], qd: 1 },
    { id: 'SFO', lat: 37.62, lon: -122.38, w: 0.8, thr: 0.2, lab: [-8, 4, 'right'], qd: 1 },
  ];
  const GATEWAY = 'ORD';
  const hubIndex = Object.fromEntries(HUBS.map((h, i) => [h.id, i]));
  const wSum = HUBS.reduce((s, h) => s + h.w, 0);

  const ROUTES = [
    ['SEA', 'ORD'], ['LAX', 'ORD'], ['JFK', 'LAX'], ['ATL', 'DEN'], ['DFW', 'YYZ'], ['MIA', 'JFK'],
    ['YVR', 'YYZ'], ['SFO', 'JFK'], ['DEN', 'ORD'], ['ATL', 'ORD'], ['YUL', 'MIA'], ['DFW', 'LAX'],
    ['SEA', 'DEN'], ['YYZ', 'YUL'], ['ORD', 'JFK'], ['MIA', 'DFW'], ['SFO', 'SEA'], ['ATL', 'JFK'],
    ['DEN', 'LAX'], ['YYZ', 'ATL'], ['ORD', 'YVR'], ['DFW', 'ORD'], ['YUL', 'ORD'], ['SFO', 'DEN'],
  ];

  /* ------------------------------------------------------------- helpers */

  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
  const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cssColor(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return fallback;
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const COL = {
    ok: cssColor('--ok', [46, 229, 157]),
    warn: cssColor('--warn', [255, 176, 32]),
    crit: cssColor('--crit', [255, 59, 82]),
    accent: cssColor('--accent', [77, 163, 255]),
  };
  // 0 healthy green -> .5 amber -> 1 red
  const statusColor = d => (d < 0.5 ? mix(COL.ok, COL.warn, d * 2) : mix(COL.warn, COL.crit, (d - 0.5) * 2));

  // Albers equal-area conic (US standard parallels)
  const D2R = Math.PI / 180;
  const A_PHI1 = 29.5 * D2R, A_PHI2 = 45.5 * D2R, A_PHI0 = 37.5 * D2R, A_LAM0 = -96 * D2R;
  const A_N = (Math.sin(A_PHI1) + Math.sin(A_PHI2)) / 2;
  const A_C = Math.cos(A_PHI1) ** 2 + 2 * A_N * Math.sin(A_PHI1);
  const A_RHO0 = Math.sqrt(A_C - 2 * A_N * Math.sin(A_PHI0)) / A_N;
  function albers(lon, lat) {
    const rho = Math.sqrt(A_C - 2 * A_N * Math.sin(lat * D2R)) / A_N;
    const th = A_N * (lon * D2R - A_LAM0);
    return [rho * Math.sin(th), A_RHO0 - rho * Math.cos(th)];
  }

  const LAND_RINGS = LAND.split(';').map(ring => {
    let x = 0, y = 0;
    return ring.split(' ').map((pt, i) => {
      const [a, b] = pt.split(',').map(Number);
      if (i === 0) { x = a; y = b; } else { x += a; y += b; }
      return [x / 10, y / 10];
    });
  });

  // Small plane silhouette pointing along +x.
  const PLANE = (() => {
    const top = [[6, 0], [1.8, -1], [-0.4, -5.2], [-2.2, -5.2], [-1.4, -1.2], [-4.6, -0.8], [-5.4, -2.6], [-6.6, -2.6], [-6, 0]];
    const p = new Path2D();
    top.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    for (let i = top.length - 2; i > 0; i--) p.lineTo(top[i][0], -top[i][1]);
    p.closePath();
    return p;
  })();

  /* ----------------------------------------------------------------- DOM */

  mount.innerHTML = `
<div class="bm" data-level="ok" data-state="normal">
  <canvas class="bm-canvas" aria-hidden="true"></canvas>
  <div class="bm-scan" aria-hidden="true"></div>
  <i class="bm-corner tl" aria-hidden="true"></i><i class="bm-corner tr" aria-hidden="true"></i>
  <i class="bm-corner bl" aria-hidden="true"></i><i class="bm-corner br" aria-hidden="true"></i>
  <header class="bm-head">
    <h2 class="panel-title"><span class="bm-live" aria-hidden="true"></span>FLIGHT OPERATIONS · MERIDIAN AIR (FICTIONAL)</h2>
    <div class="bm-net" data-level="ok" role="status" aria-live="polite">
      <span class="bm-net-label">NETWORK STATUS</span>
      <b class="bm-net-val"><i class="bm-net-dot"></i><span class="bm-net-text">NOMINAL</span></b>
    </div>
  </header>
  <div class="bm-kpis">
    <div class="bm-kpi" data-kpi="pax" data-level="ok">
      <div class="bm-kpi-label">PASSENGERS IMPACTED</div>
      <div class="bm-kpi-main"><span class="bm-kpi-val">0</span></div>
      <svg class="bm-spark" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"><path class="area"></path><path class="line"></path></svg>
    </div>
    <div class="bm-kpi" data-kpi="flights" data-level="ok">
      <div class="bm-kpi-label">FLIGHTS DELAYED</div>
      <div class="bm-kpi-main"><span class="bm-kpi-val">0</span><span class="bm-kpi-of"> / 24</span></div>
      <div class="bm-pips" aria-hidden="true"></div>
    </div>
    <div class="bm-kpi" data-kpi="queue" data-level="ok">
      <div class="bm-kpi-label">CHECK-IN QUEUE</div>
      <div class="bm-kpi-main"><span class="bm-kpi-val">0</span><span class="bm-kpi-unit">pax</span></div>
      <div class="bm-q" aria-hidden="true"><div class="bm-q-fill"></div></div>
    </div>
  </div>
</div>`;

  const $ = sel => mount.querySelector(sel);
  const root = $('.bm');
  const canvas = $('.bm-canvas');
  const ctx = canvas.getContext('2d');
  const headEl = $('.bm-head');
  const kpiEl = $('.bm-kpis');
  const netEl = $('.bm-net');
  const netText = $('.bm-net-text');
  const kpi = {
    pax: { el: $('[data-kpi="pax"]'), val: $('[data-kpi="pax"] .bm-kpi-val'), disp: 0, shown: '' },
    flights: { el: $('[data-kpi="flights"]'), val: $('[data-kpi="flights"] .bm-kpi-val'), of: $('.bm-kpi-of'), disp: 0, shown: '' },
    queue: { el: $('[data-kpi="queue"]'), val: $('[data-kpi="queue"] .bm-kpi-val'), disp: 0, shown: '' },
  };
  const pipsEl = $('.bm-pips');
  const qFill = $('.bm-q-fill');
  const sparkLine = $('.bm-spark .line');
  const sparkArea = $('.bm-spark .area');

  /* --------------------------------------------------------------- state */

  const bgc = document.createElement('canvas');
  let W = 0, H = 0, dpr = 1;
  let landPath = null;
  let proj = (lon, lat) => [0, 0];
  let flights = [];
  let pips = [];
  let radar = { x: 0, y: 0 };
  const fx = [];
  let flash = 0, flashColor = COL.crit;
  let celebrateUntil = 0;
  let sevD = 0;                       // eased severity used for visuals
  let qPeak = 1500;
  let logCount = 0;
  let flags = {};
  let partial = null;
  let snap = 3;                       // next N ticks snap displayed values (after reset/init)
  let raf = 0, last = 0;
  let sparkData = [], sparkAt = 0;
  const watch = { pax: { t: 0, v: 0, at: 0 }, flights: { t: 0, v: 0, at: 0 }, queue: { t: 0, v: 0, at: 0 } };
  const timers = new Set();
  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduce = !!(motionQuery && motionQuery.matches);
  if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', e => { reduce = e.matches; });

  const S = () => BOT.state;
  const M = () => BOT.state.metrics;
  const nowS = () => performance.now() / 1000;
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

  function ops(text, level) {
    if (logCount >= 3) return;
    logCount++;
    BOT.log(text, level, 'ops');
  }

  /* -------------------------------------------------------------- layout */

  function buildFlights(n) {
    const rnd = mulberry32(0xB07 + 17);
    const ranks = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ranks[i], ranks[j]] = [ranks[j], ranks[i]]; }
    const old = flights;
    flights = Array.from({ length: n }, (_, i) => {
      const [a, b] = ROUTES[i % ROUTES.length];
      const f = {
        i, a: hubIndex[a], b: hubIndex[b], rank: ranks[i], u: rnd() * 2, bend: 0.14 + rnd() * 0.12,
        flip: Math.floor(i / ROUTES.length) % 2 === 1, d: 0, wasDelayed: false, hold: 0,
        oa: rnd() * TAU, ow: (rnd() < 0.5 ? -1 : 1) * (1.5 + rnd() * 0.7), ph: rnd() * TAU,
        x: 0, y: 0, hd: 0, ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0, len: 100, dur: 20,
      };
      if (old[i]) { f.u = old[i].u; f.d = old[i].d; }
      return f;
    });
    // Pips: one per flight.
    pipsEl.textContent = '';
    pips = flights.map((_, i) => {
      const p = document.createElement('i');
      p.style.transitionDelay = `${Math.min(i, 30) * 9}ms`;
      pipsEl.appendChild(p);
      return p;
    });
    kpi.flights.of.textContent = ` / ${n}`;
  }

  function layout() {
    const box = mount.getBoundingClientRect();
    W = Math.max(280, Math.round(box.width));
    H = Math.max(180, Math.round(box.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    const hb = headEl.getBoundingClientRect();
    const kb = kpiEl.getBoundingClientRect();
    const top = Math.max(26, hb.bottom - box.top);
    const bottom = Math.min(H - 20, kb.top - box.top);

    const P = HUBS.map(h => albers(h.lon, h.lat));
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const padX = 38, padY = 14;
    const aw = Math.max(80, W - padX * 2), ah = Math.max(60, bottom - top - padY * 2);
    const base = Math.min(aw / (maxX - minX), ah / (maxY - minY));
    const sy = base, sx = Math.min(aw / (maxX - minX), base * 1.4);
    const ox = W / 2 - ((minX + maxX) / 2) * sx;
    const oy = top + padY + ah / 2 + ((minY + maxY) / 2) * sy;
    proj = (lon, lat) => { const p = albers(lon, lat); return [ox + p[0] * sx, oy - p[1] * sy]; };

    HUBS.forEach(h => { [h.x, h.y] = proj(h.lon, h.lat); h.hs = h.hs || 0; h.ph = h.ph ?? Math.random(); });
    const g = HUBS[hubIndex[GATEWAY]];
    radar = { x: g.x, y: g.y };

    flights.forEach(f => {
      const A = HUBS[f.a], B = HUBS[f.b];
      f.ax = A.x; f.ay = A.y; f.bx = B.x; f.by = B.y;
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len, ny = dx / len;
      if ((ny < 0) === f.flip) { nx = -nx; ny = -ny; }   // bulge towards the top of the screen (flip: other side)
      f.cx = (A.x + B.x) / 2 + nx * len * f.bend;
      f.cy = (A.y + B.y) / 2 + ny * len * f.bend;
      f.len = len * 1.08;
      f.dur = 12 + f.len / 14;
    });
    renderBackdrop();
    draw(nowS(), true);
  }

  function renderBackdrop() {
    bgc.width = canvas.width; bgc.height = canvas.height;
    const g = bgc.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const og = g.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    og.addColorStop(0, '#0b1a33'); og.addColorStop(1, '#050913');
    g.fillStyle = og; g.fillRect(0, 0, W, H);

    // graticule
    g.lineWidth = 1; g.strokeStyle = rgba(COL.accent, 0.08);
    g.beginPath();
    for (let lat = 10; lat <= 70; lat += 10) {
      for (let lon = -170; lon <= -30; lon += 2) { const [x, y] = proj(lon, lat); lon === -170 ? g.moveTo(x, y) : g.lineTo(x, y); }
    }
    for (let lon = -170; lon <= -30; lon += 10) {
      for (let lat = 5; lat <= 75; lat += 2) { const [x, y] = proj(lon, lat); lat === 5 ? g.moveTo(x, y) : g.lineTo(x, y); }
    }
    g.stroke();

    landPath = new Path2D();
    LAND_RINGS.forEach(ring => {
      ring.forEach(([lon, lat], i) => { const [x, y] = proj(lon, lat); i ? landPath.lineTo(x, y) : landPath.moveTo(x, y); });
      landPath.closePath();
    });
    g.save();
    g.shadowColor = rgba(COL.accent, 0.5); g.shadowBlur = 16;
    g.fillStyle = '#0e2038';
    g.fill(landPath, 'evenodd');
    g.restore();

    g.save();
    g.clip(landPath, 'evenodd');
    const lg = g.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, 'rgba(40,90,150,.28)'); lg.addColorStop(1, 'rgba(10,25,50,.2)');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    const dot = document.createElement('canvas'); dot.width = dot.height = 7;
    const dg = dot.getContext('2d'); dg.fillStyle = rgba(COL.accent, 0.3); dg.beginPath(); dg.arc(3.5, 3.5, 0.8, 0, TAU); dg.fill();
    g.fillStyle = g.createPattern(dot, 'repeat'); g.fillRect(0, 0, W, H);
    g.restore();

    g.lineJoin = 'round'; g.lineWidth = 1; g.strokeStyle = rgba(mix(COL.accent, [255, 255, 255], 0.2), 0.5);
    g.stroke(landPath);
  }

  /* ------------------------------------------------------------- effects */

  function addRing(x, y, o) {
    fx.push(Object.assign({ k: 'ring', x, y, c: COL.crit, r0: 4, r1: 70, life: 1.3, w: 2, a: 0.8, t0: nowS() }, o, { t0: nowS() + (o.delay || 0) }));
  }
  function addWave(x, y, o) {
    fx.push(Object.assign({ k: 'wave', x, y, c: COL.ok, life: 2.8, band: 80, a: 1, rmax: Math.hypot(W, H) * 0.8 }, o, { t0: nowS() + (o.delay || 0) }));
  }
  function doFlash(c, v) { if (reduce) return; flashColor = c; flash = Math.max(flash, v); }
  function shock() {
    if (reduce) return;
    root.classList.remove('is-shock'); void root.offsetWidth; root.classList.add('is-shock');
  }
  function gw() { return HUBS[hubIndex[GATEWAY]]; }

  function outageRipple() {
    const g = gw();
    for (let i = 0; i < 4; i++) addRing(g.x, g.y, { c: COL.crit, r1: Math.hypot(W, H) * 0.62, life: 2.4, w: 3 - i * 0.5, delay: i * 0.32, a: 0.9 - i * 0.12 });
    addWave(g.x, g.y, { c: COL.crit, life: 2.2, band: 60, a: 0.55 });
    doFlash(COL.crit, 1);
    shock();
  }
  function greenWave(strong) {
    const g = gw();
    addWave(g.x, g.y, { c: COL.ok, life: 3.2, band: 90, a: strong });
    addRing(g.x, g.y, { c: COL.ok, r1: 60, life: 1.2, w: 3, a: 0.9 });
    doFlash(COL.ok, 0.55 * strong);
  }
  function celebrate() {
    const g = gw();
    greenWave(1);
    addWave(g.x, g.y, { c: COL.accent, life: 4.2, band: 70, a: 0.55, delay: 0.6 });
    celebrateUntil = nowS() + 7;
  }

  /* --------------------------------------------------------------- update */

  const waveR = p => 0.35 * easeOut(p) + 0.65 * p;

  function boostAt(x, y, t) {
    let b = 0, c = COL.ok;
    for (const e of fx) {
      if (e.k !== 'wave') continue;
      const p = (t - e.t0) / e.life;
      if (p < 0 || p > 1) continue;
      const r = waveR(p) * e.rmax;
      const v = clamp(1 - Math.abs(Math.hypot(x - e.x, y - e.y) - r) / 55) * (1 - p) * e.a;
      if (v > b) { b = v; c = e.c; }
    }
    return [b, c];
  }

  function bezier(f, tt) {
    const k = 1 - tt;
    return [k * k * f.ax + 2 * k * tt * f.cx + tt * tt * f.bx, k * k * f.ay + 2 * k * tt * f.cy + tt * tt * f.by];
  }
  function bezierTangent(f, tt) {
    const k = 1 - tt;
    return [2 * k * (f.cx - f.ax) + 2 * tt * (f.bx - f.cx), 2 * k * (f.cy - f.ay) + 2 * tt * (f.by - f.cy)];
  }

  function updateFlight(f, dt, t, m, riskN) {
    const delayed = f.rank < m.flightsDelayed;
    const risk = !delayed && f.rank < m.flightsDelayed + riskN;
    const target = delayed ? 1 : risk ? 0.42 : 0;
    const instant = reduce;
    f.d = instant ? target : approach(f.d, target, dt * (target > f.d ? 1.1 : 0.7));
    if (delayed !== f.wasDelayed) {
      f.wasDelayed = delayed;
      if (f.x || f.y) {
        if (delayed) addRing(f.x, f.y, { c: COL.crit, r0: 3, r1: 24, life: 0.9, w: 1.5, a: 0.9 });
        else addRing(f.x, f.y, { c: COL.ok, r0: 3, r1: 30, life: 1.1, w: 2, a: 1 });
      }
    }
    f.hold = smooth((f.d - 0.3) / 0.7);
    const speed = 1 - 0.96 * f.hold;
    f.u = (f.u + (dt * speed * (reduce ? 0.5 : 1)) / f.dur) % 2;
    const fwd = f.u < 1;
    const tt = fwd ? f.u : 2 - f.u;
    const [px, py] = bezier(f, tt);
    const [tx, ty] = bezierTangent(f, tt);
    const tl = Math.hypot(tx, ty) || 1;
    const pathSpeed = (f.len / f.dur) * speed * (fwd ? 1 : -1);
    const r = 7 * f.hold;
    f.oa += dt * f.ow * f.hold * (reduce ? 0.4 : 1);
    const vx = (tx / tl) * pathSpeed + -r * Math.sin(f.oa) * f.ow;
    const vy = (ty / tl) * pathSpeed + r * 0.7 * Math.cos(f.oa) * f.ow;
    f.x = px + r * Math.cos(f.oa);
    f.y = py + r * 0.7 * Math.sin(f.oa);
    const target2 = Math.atan2(vy, vx);
    let dh = target2 - f.hd;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    f.hd += dh * (1 - Math.exp(-dt * 14));
    f.tt = tt; f.fwd = fwd;
  }

  function updateKpis(dt) {
    const m = M();
    const ease = 1 - Math.exp(-dt * 3.6);
    const set = (k, target, text) => {
      const o = kpi[k];
      o.disp = snap > 0 || reduce ? target : o.disp + (target - o.disp) * ease;
      if (Math.abs(target - o.disp) < 0.6) o.disp = target;
      const s = text(o.disp);
      if (s !== o.shown) { o.shown = s; o.val.textContent = s; }
    };
    set('pax', m.passengersImpacted, fmt);
    set('flights', m.flightsDelayed, v => String(Math.round(v)));
    set('queue', m.queueLength, fmt);
    qPeak = Math.max(qPeak, m.queueLength);
    qFill.style.width = `${clamp(kpi.queue.disp / qPeak) * 100}%`;
    qFill.parentNode.style.setProperty('--qs', (0.4 + clamp(kpi.queue.disp / qPeak) * 2.2).toFixed(2));
  }

  function update(dt, t) {
    const s = S(), m = s.metrics;
    sevD += (s.severity - sevD) * (1 - Math.exp(-dt * 4));
    if (flights.length !== m.flightsTotal && m.flightsTotal > 0) { buildFlights(m.flightsTotal); layout(); }
    const riskN = sevD > 0.15 ? Math.round(sevD * 4) : 0;
    flights.forEach(f => updateFlight(f, dt, t, m, riskN));
    HUBS.forEach(h => {
      const target = clamp((sevD - 0.1 - h.thr) / 0.5);
      h.hs += (target - h.hs) * (1 - Math.exp(-dt * 3));
    });
    flash = Math.max(0, flash - dt * 1.1);
    for (let i = fx.length - 1; i >= 0; i--) {
      const e = fx[i];
      if (t - e.t0 > e.life) fx.splice(i, 1);
    }
    if (celebrateUntil > t && !reduce && Math.random() < dt * 16) {
      const h = HUBS[Math.floor(Math.random() * HUBS.length)];
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, v = 18 + Math.random() * 30;
      fx.push({ k: 'spark', x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: Math.random() < 0.7 ? COL.ok : [255, 255, 255], t0: t, life: 1.4 + Math.random() });
    }
    updateKpis(dt);
  }

  /* ----------------------------------------------------------------- draw */

  function drawPerson(x, y, c, a) {
    ctx.fillStyle = rgba(c, a);
    ctx.beginPath(); ctx.arc(x, y - 2.6, 1.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + 1.6, 2.5, Math.PI, 0); ctx.closePath(); ctx.fill();
  }

  function drawHub(h, t) {
    const col = statusColor(clamp(h.hs));
    const [b, bc] = boostAt(h.x, h.y, t);
    let ping = 0;
    if (!reduce) {
      const ang = Math.atan2(h.y - radar.y, h.x - radar.x);
      const delta = (((t * 0.7 - ang) % TAU) + TAU) % TAU;
      ping = Math.exp(-delta * 2.6);
    }
    const R = 16 + 10 * h.hs + 8 * b;
    const gl = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, R);
    gl.addColorStop(0, rgba(b > 0.1 ? mix(col, bc, b) : col, 0.35 + 0.35 * ping + 0.4 * b));
    gl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(h.x, h.y, R, 0, TAU); ctx.fill();

    if (h.hs > 0.3) {
      const amp = clamp((h.hs - 0.3) / 0.4);
      for (let k = 0; k < 2; k++) {
        const ph = reduce ? 0.5 : (t * 0.85 + h.ph + k * 0.5) % 1;
        ctx.strokeStyle = rgba(COL.crit, (1 - ph) * 0.85 * amp);
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(h.x, h.y, 5 + ph * (10 + 10 * h.hs), 0, TAU); ctx.stroke();
      }
    }
    ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(h.x, h.y, 5.2, 0, TAU); ctx.stroke();
    ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.35 + 0.4 * ping), 1);
    ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = 10 + 6 * ping;
    ctx.beginPath(); ctx.arc(h.x, h.y, 3, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `700 9.5px ${MONO}`;
    ctx.textAlign = h.lab[2]; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(2,6,14,.85)';
    ctx.fillText(h.id, h.x + h.lab[0] + 0.8, h.y + h.lab[1] + 0.8);
    ctx.fillStyle = rgba(mix([200, 220, 255], col, 0.35 + 0.4 * h.hs), 0.95);
    ctx.fillText(h.id, h.x + h.lab[0], h.y + h.lab[1]);

    // queue icons grow with local stress
    if (h.hs > 0.18) {
      const share = 3 + (HUBS.length * h.w / wSum) * 5.5;
      const n = Math.min(8, Math.max(1, Math.round(h.hs * share)));
      const qc = mix(COL.warn, COL.crit, clamp((h.hs - 0.25) / 0.5));
      const y0 = h.y + h.qd * 14;
      const x0 = h.x - ((n - 1) * 4.6) / 2;
      for (let i = 0; i < n; i++) {
        const bob = reduce ? 0 : Math.sin(t * 3 + i * 1.3 + h.ph * 6) * 0.8;
        drawPerson(x0 + i * 4.6, y0 + bob, qc, clamp(h.hs * 8 - i * 0.4) * 0.95);
      }
    }
  }

  const pillW = (() => { const c = document.createElement('canvas').getContext('2d'); c.font = `700 7px ${MONO}`; return c.measureText('DELAYED').width + 8; })();

  function drawFlightRoute(f, t) {
    const col = statusColor(f.d);
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(col, 0.15 + 0.14 * f.d);
    if (f.d > 0.55) { ctx.setLineDash([3, 5]); ctx.lineDashOffset = reduce ? 0 : -t * 6; }
    ctx.beginPath(); ctx.moveTo(f.ax, f.ay); ctx.quadraticCurveTo(f.cx, f.cy, f.bx, f.by); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawFlightTrail(f) {
    const col = statusColor(f.d);
    const span = 0.2 * (1 - 0.7 * f.hold);
    const dir = f.fwd ? -1 : 1;
    const steps = 9;
    ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    let prev = null;
    for (let i = 0; i <= steps; i++) {
      const tt = clamp(f.tt + (dir * span * (steps - i)) / steps);
      const p = bezier(f, tt);
      if (prev) {
        ctx.strokeStyle = rgba(col, (i / steps) * 0.85);
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
      }
      prev = p;
    }
  }

  function drawPlane(f, t) {
    let col = statusColor(f.d);
    const [b, bc] = boostAt(f.x, f.y, t);
    if (b > 0.05) col = mix(col, bc === COL.crit ? COL.crit : [210, 255, 235], clamp(b));
    const pulse = reduce ? 0.5 : Math.sin(t * 5 + f.ph) * 0.5 + 0.5;
    if (f.hold > 0.2) {
      ctx.strokeStyle = rgba(COL.crit, 0.35 * f.hold * (0.4 + 0.6 * pulse));
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(f.x, f.y, 8 + 4 * pulse, 0, TAU); ctx.stroke();
    }
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(f.hd);
    const sc = 1 + f.hold * 0.12 * pulse + b * 0.5;
    ctx.scale(sc, sc);
    ctx.shadowColor = rgba(col, 0.95); ctx.shadowBlur = 7 + f.hold * 6 * pulse + b * 10;
    ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.3), 1);
    ctx.fill(PLANE);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function drawPill(f) {
    const a = smooth((f.d - 0.6) / 0.35);
    if (a < 0.02) return;
    const x = f.x - pillW / 2, y = f.y - 20;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(40,6,12,.82)';
    ctx.strokeStyle = rgba(COL.crit, 0.9); ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, pillW, 10, 2); else ctx.rect(x, y, pillW, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(mix(COL.crit, [255, 255, 255], 0.55), 1);
    ctx.font = `700 7px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DELAYED', f.x, y + 5.4);
    ctx.globalAlpha = 1;
  }

  function drawEffects(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of fx) {
      const p = (t - e.t0) / e.life;
      if (p < 0 || p > 1) continue;
      if (e.k === 'ring') {
        const r = lerp(e.r0, e.r1, easeOut(p));
        ctx.strokeStyle = rgba(e.c, (1 - p) * e.a);
        ctx.lineWidth = e.w * (1 - p * 0.5);
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke();
      } else if (e.k === 'wave') {
        const r = waveR(p) * e.rmax;
        const fade = (1 - p * p) * e.a;
        const g = ctx.createRadialGradient(e.x, e.y, Math.max(0, r - e.band), e.x, e.y, r + 3);
        g.addColorStop(0, rgba(e.c, 0));
        g.addColorStop(0.7, rgba(e.c, 0.16 * fade));
        g.addColorStop(0.96, rgba(e.c, 0.7 * fade));
        g.addColorStop(1, rgba([255, 255, 255], 0.0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = rgba(mix(e.c, [255, 255, 255], 0.4), 0.85 * fade);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.stroke();
      } else if (e.k === 'spark') {
        const x = e.x + e.vx * (t - e.t0), y = e.y + e.vy * (t - e.t0) + 14 * (t - e.t0) * (t - e.t0);
        ctx.fillStyle = rgba(e.c, (1 - p) * 0.9);
        ctx.beginPath(); ctx.arc(x, y, 1.6 * (1 - p * 0.5), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawRadar(t) {
    if (reduce) return;
    const a = t * 0.7;
    const R = Math.hypot(W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const tint = mix(COL.accent, COL.crit, sevD * 0.8);
    if (ctx.createConicGradient) {
      const g = ctx.createConicGradient(a, radar.x, radar.y);
      g.addColorStop(0, rgba(tint, 0.2));
      g.addColorStop(0.012, rgba(tint, 0));
      g.addColorStop(0.72, rgba(tint, 0));
      g.addColorStop(1, rgba(tint, 0.2));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.strokeStyle = rgba(tint, 0.3); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(radar.x, radar.y); ctx.lineTo(radar.x + Math.cos(a) * R, radar.y + Math.sin(a) * R); ctx.stroke();
    ctx.restore();
  }

  function draw(t, still) {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bgc, 0, 0, W, H);

    // severity washes the land red; resolved state glows green
    const stage = S().stage;
    if (landPath && sevD > 0.02) { ctx.fillStyle = rgba(COL.crit, 0.14 * sevD); ctx.fill(landPath, 'evenodd'); }
    if (landPath && stage === 'resolved') { ctx.fillStyle = rgba(COL.ok, 0.06 + (reduce ? 0 : 0.025 * Math.sin(t * 1.5))); ctx.fill(landPath, 'evenodd'); }
    if (sevD > 0.02) {
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, rgba(COL.crit, 0)); vg.addColorStop(1, rgba(COL.crit, 0.16 * sevD));
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    drawRadar(t);
    flights.forEach(f => drawFlightRoute(f, t));
    HUBS.forEach(h => drawHub(h, t));
    flights.forEach(f => { if (f.tt !== undefined) drawFlightTrail(f); });
    flights.forEach(f => { if (f.tt !== undefined) drawPlane(f, t); });
    flights.forEach(f => drawPill(f));
    drawEffects(t);
    if (flash > 0.01) { ctx.fillStyle = rgba(flashColor, flash * 0.26); ctx.fillRect(0, 0, W, H); }
  }

  /* ------------------------------------------------------------ main loop */

  function frame(ts) {
    raf = 0;
    if (document.hidden) return;
    const t = ts / 1000;
    const dt = Math.min(0.1, Math.max(0.001, t - last));
    last = t;
    update(dt, t);
    draw(t);
    raf = requestAnimationFrame(frame);
  }
  function startLoop() {
    if (raf || document.hidden) return;
    last = nowS();
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else { snap = Math.max(snap, 1); startLoop(); }
  });

  /* ----------------------------------------------------- tick / KPI levels */

  function kpiFlash(k, cls) {
    const el = kpi[k].el;
    el.classList.remove('surge', 'ease'); void el.offsetWidth; el.classList.add(cls);
  }
  Object.values(kpi).forEach(o => o.el.addEventListener('animationend', () => o.el.classList.remove('surge', 'ease')));

  function onTick() {
    const s = S(), m = s.metrics, now = nowS();
    root.dataset.state = s.stage;

    // KPI colour levels
    const sevLevel = s.severity < 0.12 ? 'ok' : s.severity < 0.5 ? 'warn' : 'crit';
    const fl = m.flightsDelayed <= 0 ? 'ok' : m.flightsDelayed / Math.max(1, m.flightsTotal) < 0.3 ? 'warn' : 'crit';
    const calm = s.stage === 'resolved';
    kpi.pax.el.dataset.level = calm ? 'ok' : (m.passengersImpacted > 0 && sevLevel === 'ok' ? 'warn' : sevLevel);
    kpi.queue.el.dataset.level = calm ? 'ok' : sevLevel;
    kpi.flights.el.dataset.level = fl;
    pips.forEach((p, i) => { const on = i < m.flightsDelayed; if (p.classList.contains('on') !== on) p.classList.toggle('on', on); });

    // Network status label
    let level = 'ok', text = 'NOMINAL';
    if (s.stage === 'resolved') { text = 'RESTORED'; }
    else if (s.stage === 'recovering') { level = s.severity < 0.15 ? 'ok' : 'warn'; text = s.severity < 0.15 ? 'STABILISING' : 'RECOVERING'; }
    else if (s.stage !== 'normal' || s.severity > 0.05) {
      level = s.severity >= 0.55 ? 'crit' : 'warn';
      text = s.severity >= 0.55 ? 'CRITICAL' : s.severity > 0.08 ? 'DEGRADED' : 'ALERT';
    }
    if (netText.textContent !== text) netText.textContent = text;
    if (netEl.dataset.level !== level) { netEl.dataset.level = level; root.dataset.level = level; }

    // Quick-rise flashes (compared over a short window)
    const checks = { pax: [m.passengersImpacted, v => Math.max(250, v * 0.04)], flights: [m.flightsDelayed, () => 1], queue: [m.queueLength, v => Math.max(60, v * 0.05)] };
    for (const k in checks) {
      const w = watch[k], [v, thr] = checks[k];
      if (snap > 0) { w.v = v; w.t = now; continue; }
      if (now - w.t >= 0.6) {
        const dlt = v - w.v;
        if (now - w.at > 0.8 && !reduce) {
          if (dlt >= thr(w.v)) { kpiFlash(k, 'surge'); w.at = now; }
          else if (dlt <= -thr(w.v) * 1.5) { kpiFlash(k, 'ease'); w.at = now; }
        }
        w.v = v; w.t = now;
      }
    }

    // Sparkline of passengers impacted
    if (now - sparkAt > 0.5) {
      sparkAt = now;
      sparkData.push(m.passengersImpacted);
      if (sparkData.length > 60) sparkData.shift();
      drawSpark();
    }

    // Flavour log lines (max 3 per run)
    if (!flags.gs && s.stage !== 'normal' && s.stage !== 'recovering' && s.severity > 0.32) { flags.gs = true; ops(`Ground stop requested at ${GATEWAY}: check-in kiosks timing out`, 'warn'); }
    if (!flags.spill && s.stage !== 'recovering' && s.severity > 0.72) { flags.spill = true; ops('Check-in queues spilling into terminals at JFK, ATL and ORD', 'crit'); }
    if (!flags.resume && s.stage === 'recovering' && m.flightsDelayed <= m.flightsTotal * 0.5) { flags.resume = true; ops('Ground stop lifted: departures resuming across the network', 'ok'); }

    // Scale decision: briefly better, then the retry storm returns
    if (partial) {
      partial.min = Math.min(partial.min, s.severity);
      if (s.severity > partial.min + 0.06 && now - partial.t0 > 1.5) {
        partial = null;
        const g = gw();
        for (let i = 0; i < 3; i++) addRing(g.x, g.y, { c: COL.crit, r1: Math.hypot(W, H) * 0.5, life: 1.8, w: 2.4, delay: i * 0.25 });
        doFlash(COL.crit, 0.6); shock();
      } else if (now - partial.t0 > 30) partial = null;
    }
    if (snap > 0) snap--;
  }

  function drawSpark() {
    const n = sparkData.length;
    if (n < 2) { sparkLine.setAttribute('d', ''); sparkArea.setAttribute('d', ''); return; }
    const max = Math.max(1, ...sparkData);
    const pts = sparkData.map((v, i) => `${(i / (n - 1)) * 100},${(18 - (v / max) * 16).toFixed(2)}`);
    sparkLine.setAttribute('d', `M${pts.join(' L')}`);
    sparkArea.setAttribute('d', `M0,20 L${pts.join(' L')} L100,20 Z`);
  }

  function resetAll() {
    timers.forEach(clearTimeout); timers.clear();
    fx.length = 0; flash = 0; celebrateUntil = 0; partial = null;
    logCount = 0; flags = {}; qPeak = 1500; sparkData = []; sparkAt = 0;
    sevD = S().severity; snap = 3;
    flights.forEach(f => { f.d = 0; f.hold = 0; f.wasDelayed = false; });
    HUBS.forEach(h => { h.hs = 0; });
    root.classList.remove('is-shock');
    root.dataset.state = 'normal';
    Object.values(kpi).forEach(o => o.el.classList.remove('surge', 'ease'));
    drawSpark();
    onTick();
  }

  /* --------------------------------------------------------------- events */

  BOT.on('tick', onTick);
  BOT.on('stage', ({ stage }) => {
    root.dataset.state = stage;
    if (stage === 'outage') outageRipple();
    else if (stage === 'normal') { fx.length = 0; flash = 0; celebrateUntil = 0; partial = null; }
  });
  BOT.on('decision', ({ choice }) => {
    if (choice === 'scale') {
      HUBS.forEach((h, i) => addRing(h.x, h.y, { c: COL.warn, r0: 3, r1: 28, life: 1.1, w: 1.5, a: 0.8, delay: i * 0.05 }));
    }
  });
  BOT.on('outcome', ({ choice, result }) => {
    if (result === 'success' || choice === 'rollback') greenWave(0.75);
    else if (result === 'partial' || choice === 'scale') {
      const g = gw();
      addWave(g.x, g.y, { c: mix(COL.ok, COL.warn, 0.35), life: 2.6, band: 70, a: 0.7 });
      doFlash(COL.ok, 0.3);
      partial = { min: S().severity, t0: nowS() };
    }
  });
  BOT.on('rollback:deployed', () => greenWave(1));
  BOT.on('resolved', () => celebrate());
  BOT.on('reset', resetAll);

  /* ----------------------------------------------------------------- boot */

  buildFlights(M().flightsTotal || 24);
  sevD = S().severity;
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(mount);
  else window.addEventListener('resize', layout);
  layout();
  onTick();
  startLoop();
})();

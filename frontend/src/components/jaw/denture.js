/**
 * Denture-style gingival base built around the REAL (CT) teeth:
 * thick flanges, rolled borders, root eminences, scalloped margins with papillae,
 * an upper palate and a lower lingual flange — like a finished complete-denture model.
 */
import * as THREE from 'three';
import { MM, UPPER, LOWER, toothType } from './anatomy';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* Catmull-Rom through the cervical centres of the teeth → smooth arch with arc length. */
export function archFromTeeth(info, upper) {
  const order = (upper ? UPPER : LOWER).filter(f => info[f]);
  const ctrl = order.map(f => info[f].cervical);
  const cen = ctrl.reduce((a, p) => ({ x: a.x + p.x / ctrl.length, z: a.z + p.z / ctrl.length }), { x: 0, z: 0 });
  const pts = [];
  const STEPS = 24;
  const at = (i) => ctrl[clamp(i, 0, ctrl.length - 1)];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < STEPS; k++) {
      const t = k / STEPS, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), z: f(p0.z, p1.z, p2.z, p3.z), ti: i + t });
    }
  }
  pts.push({ x: ctrl[ctrl.length - 1].x, z: ctrl[ctrl.length - 1].z, ti: ctrl.length - 1 });
  let s = 0;
  pts.forEach((p, i) => { if (i) s += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z); p.s = s; });
  const total = s;
  const sample = (q) => {
    const sq = clamp(q, 0, total);
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; pts[m].s < sq ? lo = m + 1 : hi = m; }
    const i = clamp(lo, 1, pts.length - 1), a = pts[i - 1], b = pts[i];
    const t = (sq - a.s) / Math.max(1e-9, b.s - a.s);
    let x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
    const tx = (b.x - a.x), tz = (b.z - a.z), tl = Math.hypot(tx, tz) || 1;
    let nx = -tz / tl, nz = tx / tl;
    if ((x - cen.x) * nx + (z - cen.z) * nz < 0) { nx = -nx; nz = -nz; }
    // straight extension beyond the last molars
    if (q < 0 || q > total) { const d = q < 0 ? q : q - total; x += (tx / tl) * d; z += (tz / tl) * d; }
    return { x, z, nx, nz, tx: tx / tl, tz: tz / tl };
  };
  const slots = order.map((f, i) => {
    const sl = pts.find(p => p.ti >= i) || pts[pts.length - 1];
    const n = sample(sl.s);
    // measured half-depth (labial / lingual) and half-width of the tooth at its neck
    let lab = 0, lin = 0, wid = 0;
    info[f].ring.forEach(([x, z]) => {
      const dx = x - info[f].cervical.x, dz = z - info[f].cervical.z;
      const dn = dx * n.nx + dz * n.nz, dt = dx * n.tx + dz * n.tz;
      lab = Math.max(lab, dn); lin = Math.max(lin, -dn); wid = Math.max(wid, Math.abs(dt));
    });
    return { fdi: f, s: sl.s, lab, lin, halfW: wid, y: info[f].cervical.y };
  });
  // half-width as half the distance to the neighbours (teeth touch at the contacts)
  slots.forEach((sl, i) => {
    const prev = slots[i - 1], next = slots[i + 1];
    const l = prev ? (sl.s - prev.s) / 2 : sl.halfW, r = next ? (next.s - sl.s) / 2 : sl.halfW;
    sl.halfW = (l + r) / 2;
  });
  return { slots, total, sample, cen };
}

/* ── surface maps: acrylic veining (red fibres) + fine stippling ── */
let _maps = null;
export function dentureMaps() {
  if (_maps) return _maps;
  const S = 1024;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 260; i++) {
    const px = rnd() * S, py = rnd() * S, len = 20 + rnd() * 60, a = rnd() * Math.PI * 2;
    x.strokeStyle = `rgba(${170 + rnd() * 40},${25 + rnd() * 30},${40 + rnd() * 25},${0.06 + rnd() * 0.1})`;
    x.lineWidth = 0.5 + rnd() * 0.8;
    x.beginPath(); x.moveTo(px, py);
    x.bezierCurveTo(px + Math.cos(a) * len * 0.4 + (rnd() - 0.5) * 30, py + Math.sin(a) * len * 0.4 + (rnd() - 0.5) * 30,
      px + Math.cos(a) * len * 0.7 + (rnd() - 0.5) * 30, py + Math.sin(a) * len * 0.7 + (rnd() - 0.5) * 30,
      px + Math.cos(a) * len, py + Math.sin(a) * len);
    x.stroke();
  }
  const color = new THREE.CanvasTexture(c);
  color.colorSpace = THREE.SRGBColorSpace; color.wrapS = color.wrapT = THREE.RepeatWrapping; color.anisotropy = 8;

  const b = document.createElement('canvas'); b.width = b.height = 512;
  const y = b.getContext('2d');
  y.fillStyle = '#808080'; y.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const g = 90 + rnd() * 90;
    y.fillStyle = `rgba(${g},${g},${g},.35)`;
    y.beginPath(); y.arc(rnd() * 512, rnd() * 512, 0.6 + rnd() * 1.6, 0, 7); y.fill();
  }
  const bump = new THREE.CanvasTexture(b); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  _maps = { color, bump };
  return _maps;
}

const C_MARGIN = new THREE.Color('#f1b5ac');
const C_GUM = new THREE.Color('#e89b92');
const C_DEEP = new THREE.Color('#de8c86');
const C_BORDER = new THREE.Color('#e49890');

/**
 * Swept denture base. `flange` = height of the base beyond the cervical line (scene units).
 */
export function buildDentureBase(arch, upper, flange) {
  const { slots, total, sample } = arch;
  const N = 520, ext = 0.55;
  const verts = [], cols = [], idx = [], uvs = [];
  const col = new THREE.Color();
  const papillaOf = (f) => { const t = toothType(f); return (t === 'molar' ? 1.6 : t === 'premolar' ? 2.2 : 2.9) * MM; };

  const at = (s) => {
    let i = slots.findIndex(sl => sl.s >= s);
    if (i === -1) i = slots.length - 1; if (i === 0) i = 1;
    const a = slots[i - 1], b = slots[i];
    const mid = (a.s + b.s) / 2;
    const sl = s < mid ? a : b;
    const t = clamp(Math.abs(s - sl.s) / sl.halfW, 0, 1);
    const k = clamp((s - a.s) / (b.s - a.s), 0, 1), kk = k * k * (3 - 2 * k);
    const shape = Math.pow((1 - Math.cos(Math.PI * t)) / 2, 1.0);
    const type = toothType(sl.fdi);
    return {
      h: papillaOf(sl.fdi) * shape - 0.6 * MM,
      hl: papillaOf(sl.fdi) * shape * 0.6 - 0.6 * MM,
      lab: lerp(a.lab, b.lab, kk), lin: lerp(a.lin, b.lin, kk), y: lerp(a.y, b.y, kk),
      jug: (type === 'canine' ? 0.06 : type === 'incisor' ? 0.025 : type === 'premolar' ? 0.03 : 0.02) * Math.pow(Math.cos((Math.PI / 2) * t), 2),
    };
  };

  const F = flange;
  // [outward offset, height above the cervical line (+ toward the occlusal plane)]
  const PROFILE = (m) => [
    [m.lab * 0.55 + 0.05, -F],                          // 0 border (labial inner)
    [m.lab * 0.95 + 0.17, -F + 0.04],                   // 1 rolled border
    [m.lab * 1.05 + 0.24, -F + 0.18],                   // 2
    [m.lab * 1.05 + 0.22 + m.jug * 0.5, -F * 0.68],     // 3 vestibular flange
    [m.lab * 1.02 + 0.17 + m.jug, -F * 0.42],           // 4 root eminence
    [m.lab * 0.95 + 0.07 + m.jug * 0.7, -0.24],         // 5
    [m.lab * 0.86 + 0.012, m.h - 0.1],                  // 6
    [m.lab * 0.78, m.h],                                // 7 labial margin
    [0, m.h - 0.25],                                    // 8 crest (hidden)
    [-m.lin * 0.8, m.hl],                               // 9 lingual margin
    [-m.lin * 0.88 - 0.015, m.hl - 0.1],                // 10
    [-m.lin * 1.05 - 0.13, -0.35],                      // 11
    [-m.lin * 1.05 - 0.2, -F * 0.62],                   // 12 lingual flange
    [-m.lin * 0.9 - 0.2, -F + 0.08],                    // 13
    [-m.lin * 0.55 - 0.06, -F],                         // 14 border (lingual)
  ];
  const P = 15;
  const tone = [0.9, 0.85, 0.75, 0.55, 0.35, 0.18, 0.06, 0, 0, 0, 0.1, 0.3, 0.55, 0.8, 0.9];

  for (let i = 0; i <= N; i++) {
    const s = -ext + (total + 2 * ext) * (i / N);
    const g = sample(s);
    const m = at(clamp(s, 0, total));
    const over = s < 0 ? -s : s > total ? s - total : 0;
    const fade = 1 - sm(0, ext, over); // retromolar pad rounds off
    PROFILE(m).forEach(([off, hh], k) => {
      const tip = k >= 6 && k <= 10;
      const hy = tip ? lerp(-0.45, hh, fade) : lerp(hh * (0.6 + 0.4 * fade), hh, fade);
      const o = lerp(off * (k === 8 ? 1 : 0.55), off, fade);
      verts.push(g.x + g.nx * o, m.y + (upper ? -hy : hy), g.z + g.nz * o);
      const v = tone[k];
      col.copy(C_MARGIN).lerp(C_GUM, sm(0, 0.3, v)).lerp(C_DEEP, sm(0.3, 0.6, v) * 0.6).lerp(C_BORDER, sm(0.75, 0.95, v));
      cols.push(col.r, col.g, col.b);
      uvs.push((s / total) * 5, (k / (P - 1)) * 2.4);
    });
  }
  const quad = (a, b, c, d) => (upper ? idx.push(a, b, c, b, d, c) : idx.push(a, c, b, b, c, d));
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < P - 1; k++) quad(i * P + k, i * P + k + 1, (i + 1) * P + k, (i + 1) * P + k + 1);
    quad(i * P + P - 1, i * P, (i + 1) * P + P - 1, (i + 1) * P); // underside
  }
  [0, N].forEach((ring, e) => {
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < P; k++) { cx += verts[(ring * P + k) * 3]; cy += verts[(ring * P + k) * 3 + 1]; cz += verts[(ring * P + k) * 3 + 2]; }
    verts.push(cx / P, cy / P, cz / P); cols.push(C_GUM.r, C_GUM.g, C_GUM.b); uvs.push(0, 0);
    const c = verts.length / 3 - 1;
    for (let k = 0; k < P; k++) {
      const a = ring * P + k, b = ring * P + ((k + 1) % P);
      (upper ? e === 0 : e === 1) ? idx.push(c, a, b) : idx.push(c, b, a);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/* Upper palate: vaulted plate joining the lingual borders of the upper base. */
export function buildDenturePalate(arch, flange) {
  const { slots, total, sample } = arch;
  const N = 80, R = 28;
  const verts = [], cols = [], idx = [], uvs = [];
  const col = new THREE.Color();
  // smoothly interpolated lingual depth & cervical height (no steps between teeth)
  const linAt = (s) => {
    let i = slots.findIndex(sl => sl.s >= s);
    if (i <= 0) return { lin: slots[0].lin, y: slots[0].y };
    if (i === -1) i = slots.length - 1;
    const a = slots[i - 1], b = slots[i], k = clamp((s - a.s) / (b.s - a.s), 0, 1), kk = k * k * (3 - 2 * k);
    return { lin: lerp(a.lin, b.lin, kk), y: lerp(a.y, b.y, kk) };
  };
  const edge = (s) => { const g = sample(s), sl = linAt(s); const o = sl.lin * 0.9 + 0.12; return { x: g.x - g.nx * o, z: g.z - g.nz * o, y: sl.y + 0.28 }; };
  for (let i = 0; i <= N; i++) {
    const s = (total / 2) * (i / N) * 0.999;
    const L = edge(s), Rr = edge(total - s);
    const span = Math.hypot(L.x - Rr.x, L.z - Rr.z);
    for (let r = 0; r <= R; r++) {
      const t = r / R;
      const vault = Math.pow(Math.sin(Math.PI * t), 0.65) * Math.min(flange * 0.85, span * 0.45);
      const rug = sm(0.68, 0.92, i / N) * Math.max(0, Math.sin((L.z + 3) * 30 + Math.sin(t * 9) * 0.6)) * Math.max(0, 1 - Math.abs(t - 0.5) * 2.6);
      verts.push(lerp(L.x, Rr.x, t), lerp(L.y, Rr.y, t) + vault + rug * 0.02, lerp(L.z, Rr.z, t));
      col.copy(C_GUM).lerp(C_MARGIN, 0.35 * rug);
      cols.push(col.r, col.g, col.b);
      uvs.push(t * 2, (i / N) * 2);
    }
  }
  for (let i = 0; i < N; i++)
    for (let r = 0; r < R; r++) { const a = i * (R + 1) + r, b = a + 1, c = a + R + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

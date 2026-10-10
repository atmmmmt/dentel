/**
 * Procedural dental anatomy — real crown dimensions (mm), parabolic dental arch,
 * per-type occlusal height fields (cusps, fissures, marginal ridges, mamelons),
 * cervical constriction, roots, and gingiva that hugs every tooth with papillae.
 *
 * Tooth local frame: +y = occlusal (crown tip), +z = labial/buccal, +x = along the arch.
 * Units: 1 = MM millimetres.
 */
import * as THREE from 'three';

export const MM = 0.075;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const spow = (x, p) => Math.sign(x) * Math.pow(Math.abs(x) + 1e-9, p);
const g2 = (x, z, cx, cz, s) => Math.exp(-1 * ((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));

export const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const toothType = (fdi) => {
  const p = fdi % 10;
  return p <= 2 ? 'incisor' : p === 3 ? 'canine' : p <= 5 ? 'premolar' : 'molar';
};

/* Average adult crown dimensions in mm: [mesio-distal, crown height, bucco-lingual, root length] */
const DIM_U = { 1: [8.6, 10.5, 7.0, 13], 2: [6.6, 9.0, 6.0, 13], 3: [7.6, 10.0, 8.0, 17], 4: [7.1, 8.3, 9.2, 14], 5: [6.6, 7.8, 9.0, 14], 6: [10.2, 7.5, 11.2, 13], 7: [9.1, 7.0, 11.0, 12], 8: [8.6, 6.5, 10.2, 11] };
const DIM_L = { 1: [5.2, 9.0, 6.0, 12.5], 2: [5.8, 9.5, 6.4, 14], 3: [6.9, 11.0, 7.6, 16], 4: [7.0, 8.5, 7.6, 14], 5: [7.2, 8.0, 8.2, 14.5], 6: [11.2, 7.5, 10.4, 14], 7: [10.6, 7.0, 10.0, 13], 8: [10.2, 6.8, 9.6, 11] };
// Roots are shortened to stay inside the model base (they're never seen through the gum).
export const dims = (fdi, upper) => (upper ? DIM_U : DIM_L)[fdi % 10].map((v, i) => v * MM * (i === 3 ? 0.55 : 1));

/* ── Dental arch: parabola-like curve, scaled so the teeth fit edge to edge ── */
function archCurve(W, D, p) {
  const pts = []; let s = 0, prev = null;
  for (let i = 0; i <= 600; i++) {
    const x = -W + (2 * W * i) / 600;
    const z = D * (1 - Math.pow(Math.abs(x) / W, p)) - D * 0.55;
    if (prev) s += Math.hypot(x - prev.x, z - prev.z);
    pts.push({ x, z, s }); prev = { x, z };
  }
  return pts;
}

function sampleArch(pts, s) {
  let lo = 0, hi = pts.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; pts[m].s < s ? lo = m + 1 : hi = m; }
  const i = clamp(lo, 1, pts.length - 1);
  const a = pts[i - 1], b = pts[i];
  const t = (s - a.s) / Math.max(1e-9, b.s - a.s);
  const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t);
  const tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
  const nx = -tz / tl, nz = tx / tl; // outward (labial/buccal) normal
  return { x, z, nx, nz, rotY: Math.atan2(nx, nz) };
}

/** Builds the arch for one jaw. Returns tooth slots + a sampler for the gum. */
export function buildArch(upper) {
  const list = upper ? UPPER : LOWER;
  const widths = list.map(f => dims(f, upper)[0]);
  const CONTACT = 0.1 * MM; // teeth touch at the contact points
  const need = widths.reduce((a, b) => a + b, 0) + CONTACT * (list.length - 1);
  // Shape constants (upper arch broader and more rounded, lower slightly narrower).
  const p = upper ? 2.5 : 2.4;
  let W = upper ? 2.55 : 2.42, D = upper ? 3.15 : 2.95;
  const base = archCurve(W, D, p);
  const k = need / base[base.length - 1].s;
  W *= k; D *= k;
  const pts = archCurve(W, D, p);
  const total = pts[pts.length - 1].s;
  const slots = []; let cum = 0;
  list.forEach((fdi, i) => {
    const s = cum + widths[i] / 2;
    const at = sampleArch(pts, s);
    slots.push({ fdi, s, halfW: widths[i] / 2, ...at, side: at.x < 0 ? -1 : 1 });
    cum += widths[i] + CONTACT;
  });
  return { slots, pts, total, W, D, sample: (s) => sampleArch(pts, clamp(s, 0, total)) };
}

/* ── Occlusal height fields (normalised X,Z ∈ [-1,1]; X>0 = mesial) ── */
function occlusal(type, X, Z, upper, pos) {
  switch (type) {
    case 'incisor': {
      // incisal edge: mesio-incisal angle nearly square, disto-incisal angle rounded (X>0 = mesial)
      const corner = X >= 0 ? sm(0.72, 1.0, X) : sm(0.38, 1.0, -X);
      const drop = X >= 0 ? 0.05 : (pos === 2 ? 0.16 : 0.11);
      return -0.012 * X * X - drop * Math.pow(corner, 2.2) - 0.015 * Z * Z;
    }
    case 'canine': {
      // single cusp, mesial slope shorter than distal slope
      const slope = X >= 0 ? 1.15 : 0.85;
      return 0.22 * Math.pow(Math.max(0, 1 - Math.abs(X) * slope), 1.25) - 0.04 * Z * Z;
    }
    case 'premolar': {
      const bH = 0.20, lH = upper ? 0.17 : (pos === 4 ? 0.07 : 0.13); // lower first premolar: tiny lingual cusp
      let h = bH * g2(X, Z, 0.0, 0.42, 0.34) + lH * g2(X, Z, 0.05, -0.45, 0.30);
      h += 0.05 * (g2(X, Z, 0.82, 0, 0.16) + g2(X, Z, -0.82, 0, 0.16)); // marginal ridges
      h -= 0.10 * Math.exp(-1 * ((Z + 0.02) / 0.10) ** 2) * (1 - X * X * 0.7); // central groove
      h -= 0.06 * (g2(X, Z, 0.55, 0, 0.12) + g2(X, Z, -0.55, 0, 0.12)); // mesial/distal pits
      return h - 0.04;
    }
    default: { // molar
      let h;
      if (upper) {
        h = 0.21 * g2(X, Z, 0.45, 0.45, 0.30) + 0.18 * g2(X, Z, -0.42, 0.45, 0.28)
          + 0.23 * g2(X, Z, 0.38, -0.45, 0.33) + (pos === 8 ? 0.06 : 0.12) * g2(X, Z, -0.50, -0.50, 0.24);
        h += 0.07 * Math.exp(-1 * (((X + Z) * 0.7 - 0) / 0.18) ** 2) * sm(0.9, 0.2, Math.abs(X - Z)); // oblique ridge
        h -= 0.11 * Math.exp(-1 * ((Z - 0.02) / 0.09) ** 2) * (1 - X * X * 0.6) * (X > -0.1 ? 1 : 0.6);
        h -= 0.08 * Math.exp(-1 * (X / 0.08) ** 2) * sm(-0.1, 0.4, Z); // buccal groove
        h -= 0.07 * Math.exp(-1 * ((X + 0.25) / 0.08) ** 2) * sm(0.1, -0.5, Z); // distolingual groove
      } else {
        const five = pos === 6; // lower first molar has 5 cusps
        h = 0.20 * g2(X, Z, 0.55, 0.45, 0.26) + 0.18 * g2(X, Z, (five ? 0.0 : -0.45), 0.47, 0.26)
          + (five ? 0.13 * g2(X, Z, -0.62, 0.30, 0.20) : 0)
          + 0.22 * g2(X, Z, 0.50, -0.45, 0.28) + 0.20 * g2(X, Z, -0.42, -0.45, 0.27);
        h -= 0.11 * Math.exp(-1 * ((Z + 0.02) / 0.09) ** 2) * (1 - X * X * 0.6); // central groove
        h -= 0.08 * Math.exp(-1 * ((X - 0.25) / 0.07) ** 2) * sm(0.0, 0.5, Z); // mesiobuccal groove
        if (five) h -= 0.07 * Math.exp(-1 * ((X + 0.35) / 0.07) ** 2) * sm(0.0, 0.5, Z); // distobuccal groove
        h -= 0.07 * Math.exp(-1 * ((X + 0.05) / 0.07) ** 2) * sm(0.0, -0.5, Z); // lingual groove
      }
      h += 0.05 * (g2(X, Z, 0.86, 0, 0.14) + g2(X, Z, -0.86, 0, 0.14)); // marginal ridges
      return h - 0.06;
    }
  }
}

/* Crown outline: half-widths & squareness as a function of v (0 = cervical, 1 = occlusal). */
function outline(type, v, upper) {
  switch (type) {
    case 'incisor': return {
      a: lerp(0.74, 1.0, sm(0, 0.7, v)) - 0.05 * sm(0.85, 1, v),
      b: lerp(0.92, 0.10, sm(0.25, 1.0, v)) * (1 + 0.1 * Math.exp(-1 * ((v - 0.2) / 0.15) ** 2)),
      n: lerp(2.1, 2.7, sm(0.2, 0.9, v)), lingualFossa: upper ? 0.22 : 0.12,
    };
    case 'canine': return {
      a: lerp(0.78, 1.0, sm(0, 0.55, v)) * (1 - 0.55 * sm(0.72, 1, v)),
      b: lerp(0.95, 0.35, sm(0.3, 1.0, v)),
      n: lerp(2.1, 2.5, v), lingualFossa: 0.1,
    };
    case 'premolar': return {
      a: lerp(0.80, 1.0, sm(0, 0.6, v)) * (1 - 0.18 * sm(0.75, 1, v)),
      b: lerp(0.86, 1.0, sm(0, 0.35, v)) * (1 - 0.28 * sm(0.55, 1, v)),
      n: lerp(2.2, 2.7, sm(0.2, 0.8, v)), lingualFossa: 0,
    };
    default: return {
      a: lerp(0.84, 1.0, sm(0, 0.55, v)) * (1 - 0.14 * sm(0.75, 1, v)),
      b: lerp(0.86, 1.0, sm(0, 0.35, v)) * (1 - 0.24 * sm(0.55, 1, v)),
      n: lerp(2.3, 2.9, sm(0.2, 0.8, v)), lingualFossa: 0,
    };
  }
}

/* Colours: dentin shows through at the neck, enamel is translucent at edges, fissures stain. */
const C_NECK = new THREE.Color('#dcc596');
const C_BODY = new THREE.Color('#efe6d3');
const C_TIP = new THREE.Color('#f7f3ea');
const C_EDGE = new THREE.Color('#bfcacd');
const C_STAIN = new THREE.Color('#a8916a');
const C_ROOT = new THREE.Color('#d8c08f');

/**
 * Tooth geometry with crown, cervical constriction, root and a real occlusal surface.
 * `pos` = FDI position digit (1–8). `upper` mirrors the tooth so the crown points down.
 */
export function buildToothGeometry(fdi, upper) {
  const type = toothType(fdi), pos = fdi % 10;
  const [w, h, d, rootLen] = dims(fdi, upper);
  const A = w / 2, B = d / 2;
  const NU = 72, NV = 30, NR = 10, NO = 14;
  const verts = [], cols = [], idx = [];
  const col = new THREE.Color();
  const pushV = (x, y, z, c, uu = 0, vv = 0) => {
    verts.push(x, upper ? -y : y, z);
    const n = 0.985 + hash(uu * 40, vv * 40) * 0.03; // micro colour variation
    cols.push(c.r * shade.r * n, c.g * shade.g * n, c.b * shade.b * n);
    uvs.push(uu, vv);
    return verts.length / 3 - 1;
  };

  const occAmp = { incisor: 1.0, canine: 0.32, premolar: 0.28, molar: 0.26 }[type] * h;
  const q = Math.floor(fdi / 10);
  const mesial = q === 1 || q === 4 ? 1 : -1; // local +x points toward the midline on the patient's right
  const hash = (a, b) => { const t = Math.sin(a * 12.9898 + b * 78.233 + fdi * 3.7) * 43758.5453; return t - Math.floor(t); };
  const uvs = [];
  // Natural shade: canines are more chromatic, molars a touch darker, every tooth slightly different.
  const shade = new THREE.Color(1, 1, 1);
  if (type === 'canine') shade.setRGB(0.985, 0.955, 0.9);
  if (type === 'molar') shade.setRGB(0.975, 0.96, 0.93);
  if (type === 'premolar') shade.setRGB(0.985, 0.97, 0.945);
  const ring = (v, u, extra = {}) => {
    const o = outline(type, v, upper);
    const cu = Math.cos(u), su = Math.sin(u);
    let x = A * o.a * spow(cu, 2 / o.n);
    let z = B * o.b * spow(su, 2 / o.n);
    // labial convexity & lingual fossa / cingulum
    if (su > 0) z += B * 0.08 * su * Math.exp(-1 * ((v - 0.35) / 0.25) ** 2);
    if (su > 0) {
      const Xl = clamp(x / (A * o.a + 1e-6), -1, 1) * mesial; // + = mesial
      if (type === 'incisor') {
        // three developmental lobes separated by two shallow vertical depressions
        z -= B * 0.035 * su * (Math.exp(-1 * ((Xl - 0.33) / 0.12) ** 2) + Math.exp(-1 * ((Xl + 0.33) / 0.12) ** 2)) * sm(0.35, 0.9, v);
        // mesial & distal marginal ridges catch the light
        z += B * 0.02 * su * sm(0.55, 0.9, Math.abs(Xl)) * sm(0.2, 0.8, v);
      } else if (type === 'canine') {
        z += B * 0.07 * su * Math.exp(-1 * ((Xl - 0.05) / 0.28) ** 2) * sm(0.15, 0.9, v); // labial ridge
      } else if (type === 'premolar') {
        z += B * 0.04 * su * Math.exp(-1 * (Xl / 0.3) ** 2) * sm(0.3, 0.95, v); // buccal ridge
      } else {
        // buccal developmental groove(s) running down from the occlusal surface
        const grooves = upper ? [0.0] : (pos === 6 ? [0.25, -0.35] : [0.0]);
        grooves.forEach(gx => { z -= B * 0.05 * su * Math.exp(-1 * ((Xl - gx) / 0.08) ** 2) * sm(0.5, 1.0, v); });
        z += B * 0.03 * su * Math.exp(-1 * ((v - 0.25) / 0.12) ** 2); // cervical ridge
      }
    }
    if (su < 0 && o.lingualFossa) z += B * o.lingualFossa * Math.abs(su) * Math.exp(-1 * ((v - 0.6) / 0.2) ** 2) * (1 - cu * cu) - B * 0.06 * Math.abs(su) * Math.exp(-1 * ((v - 0.12) / 0.08) ** 2);
    return { x, z, ...extra };
  };

  /* Root (below cervical line, y < 0) */
  const rootIdx = [];
  for (let j = 0; j <= NR; j++) {
    const t = j / NR; // 0 = apex, 1 = cervical
    const taper = Math.sqrt(sm(0, 1, t)) * lerp(0.35, 0.86, t);
    const row = [];
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2;
      const r = ring(0, u);
      const y = -rootLen * (1 - t) * (type === 'molar' ? 0.7 : 1);
      col.copy(C_ROOT).lerp(C_NECK, sm(0.7, 1, t));
      row.push(pushV(r.x * taper / 0.86, y, r.z * taper / 0.86, col, i / NU, t * 0.25));
    }
    rootIdx.push(row);
  }

  /* Crown side */
  const crownIdx = [];
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    const row = [];
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2;
      const r = ring(v, u);
      const o = outline(type, 1, upper);
      const Xn = clamp(r.x / (A * o.a + 1e-6), -1, 1);
      const Zn = clamp(r.z / (B * o.b + 1e-6), -1, 1);
      const H = occlusal(type, Xn * mesial, Zn, upper, pos) * occAmp;
      const y = v * h + sm(0.55, 1, v) * H;
      col.copy(C_NECK).lerp(C_BODY, sm(0.02, 0.35, v)).lerp(C_TIP, sm(0.6, 1, v) * 0.6);
      // incisal translucency: bluish-grey band with a bright enamel "halo" right at the edge
      if (type === 'incisor') col.lerp(C_EDGE, 0.55 * sm(0.74, 0.95, v) * (1 - sm(0.97, 1, v))).lerp(C_TIP, sm(0.975, 1, v) * 0.7);
      if (type === 'canine') col.lerp(C_EDGE, 0.3 * sm(0.8, 1, v));
      const sideAO = 1 - 0.09 * sm(0.45, 0.97, Math.abs(Math.cos(u))) * (1 - 0.5 * sm(0.7, 1, v));
      col.multiplyScalar(sideAO * (1 - 0.06 * (1 - sm(0, 0.12, v))));
      row.push(pushV(r.x, y, r.z, col, i / NU, 0.25 + v * 0.65));
    }
    crownIdx.push(row);
  }

  /* Occlusal surface: rings shrinking toward the centre, sharing the crown's top ring */
  const top = outline(type, 1, upper);
  const occIdx = [crownIdx[NV]];
  for (let k = 1; k <= NO; k++) {
    const s = 1 - k / NO;
    const row = [];
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2;
      const r = ring(1, u);
      const x = r.x * s, z = r.z * s;
      const Xn = clamp(x / (A * top.a + 1e-6), -1, 1), Zn = clamp(z / (B * top.b + 1e-6), -1, 1);
      const H = occlusal(type, Xn * mesial, Zn, upper, pos) * occAmp;
      const y = h + H;
      // fissure staining from local depth (height below the cusp average)
      const depth = clamp(-H / (occAmp * 0.12 + 1e-6), 0, 1);
      col.copy(C_TIP).lerp(C_BODY, 0.35);
      if (type === 'premolar' || type === 'molar') col.lerp(C_STAIN, 0.55 * depth * depth).multiplyScalar(1 - 0.18 * depth);
      if (type === 'incisor') col.lerp(C_EDGE, 0.5);
      row.push(pushV(x, y, z, col, i / NU, 0.9 + (k / NO) * 0.1));
    }
    occIdx.push(row);
  }

  const quad = (a, b, c, dd) => (upper ? idx.push(a, b, c, b, dd, c) : idx.push(a, c, b, b, c, dd));
  const stitch = (rows) => {
    for (let j = 0; j < rows.length - 1; j++)
      for (let i = 0; i < NU; i++) quad(rows[j][i], rows[j][i + 1], rows[j + 1][i], rows[j + 1][i + 1]);
  };
  stitch(rootIdx);
  // join root top to crown bottom
  for (let i = 0; i < NU; i++) quad(rootIdx[NR][i], rootIdx[NR][i + 1], crownIdx[0][i], crownIdx[0][i + 1]);
  stitch(crownIdx);
  stitch(occIdx);
  // apex cap
  const apex = pushV(0, -rootLen * (type === 'molar' ? 0.7 : 1) - 0.02, 0, C_ROOT, 0.5, 0);
  for (let i = 0; i < NU; i++) upper ? idx.push(apex, rootIdx[0][i + 1], rootIdx[0][i]) : idx.push(apex, rootIdx[0][i], rootIdx[0][i + 1]);

  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  // weld the u=0 / u=2π seam normals
  mergeSeam(geo, NU);
  geo.computeBoundingSphere();
  return geo;
}

function mergeSeam(geo, NU) {
  const n = geo.attributes.normal, stride = NU + 1;
  for (let r = 0; r * stride < n.count - 1; r++) {
    const a = r * stride, b = a + NU;
    if (b >= n.count) break;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l);
  }
  n.needsUpdate = true;
}

/* ── Gingiva: swept profile along the arch; the margin scallops around each tooth ── */
const G_MARGIN = new THREE.Color('#eea9a2');
const G_ATTACHED = new THREE.Color('#e39a92');
const G_MUCOSA = new THREE.Color('#c85f68');
const G_BASE = new THREE.Color('#b8525d');

export function buildGumGeometry(arch, upper, toothY) {
  const { slots, total, sample } = arch;
  const N = 420; // samples along the arch
  const ext = 0.45; // gum continues behind the last molar
  const verts = [], cols = [], idx = [], uvs = [];
  const col = new THREE.Color();

  // margin height (relative to the cervical line) and tooth half-depth at arc position s
  const papillaOf = (fdi) => { const t = toothType(fdi); return (t === 'molar' ? 2.2 : t === 'premolar' ? 2.9 : 4.8) * MM; };
  const marginAt = (s, lingual) => {
    // locate the two teeth around s
    let i = slots.findIndex(sl => sl.s >= s);
    if (i === -1) i = slots.length - 1; if (i === 0) i = 1;
    const a = slots[i - 1], b = slots[i];
    const ca = a.s + a.halfW; // contact point between a and b
    const sl = s < ca ? a : b;
    const t = clamp(Math.abs(s - sl.s) / sl.halfW, 0, 1);
    // rounded scallop: zenith at the tooth centre, soft papilla tip at the contact
    const shape = Math.pow((1 - Math.cos(Math.PI * t)) / 2, 0.9);
    const pap = lerp(papillaOf(sl.fdi), (papillaOf(a.fdi) + papillaOf(b.fdi)) / 2, t) * (lingual ? 0.65 : 1);
    const k = clamp((s - a.s) / (b.s - a.s), 0, 1), kk = k * k * (3 - 2 * k);
    const halfD = lerp(dims(a.fdi, upper)[2], dims(b.fdi, upper)[2], kk) / 2;
    const type = toothType(sl.fdi);
    // juga alveolaria: the bone/gum bulges over each root, strongest over the canine
    const jugum = (type === 'canine' ? 0.07 : type === 'incisor' ? 0.035 : 0.03) * Math.pow(Math.cos((Math.PI / 2) * t), 2);
    return { h: pap * shape - 0.5 * MM, halfD, sl, jugum };
  };

  // profile: [offset along outward normal (× halfD or absolute), height relative to cervical line]
  const PROFILE = (m, ml, halfD) => [
    [halfD * 0.55 + 0.10, -0.92],      // base (labial)
    [halfD * 0.86 + 0.13 + m.jugum * 0.3, -0.82],
    [halfD * 1.00 + 0.13 + m.jugum * 0.8, -0.62],
    [halfD * 1.04 + 0.10 + m.jugum, -0.38],      // alveolar bulge over the root
    [halfD * 1.02 + 0.05 + m.jugum * 0.7, -0.16],
    [halfD * 0.97 + 0.02, m.h - 0.06],
    [halfD * 0.90, m.h],               // labial gingival margin (hugs the tooth)
    [halfD * 0.20, m.h - 0.22],        // hidden crest under the tooth
    [-halfD * 0.90, ml.h],             // lingual margin
    [-halfD * 0.98 - 0.03, ml.h - 0.08],
    [-halfD * 1.04 - 0.08, -0.25],
    [-halfD * 1.02 - 0.14, -0.55],
    [-halfD * 0.80 - 0.16, -0.86],
    [-halfD * 0.55 - 0.10, -0.92],     // base (lingual)
  ];
  const P = 14;

  for (let i = 0; i <= N; i++) {
    const s = -ext + (total + 2 * ext) * (i / N);
    const at = sample(s);
    // extend straight beyond the arch ends
    const over = s < 0 ? s : s > total ? s - total : 0;
    const tx = at.nz, tz = -at.nx; // tangent
    const cx = at.x + tx * over * (s < 0 ? 1 : 1), cz = at.z + tz * over;
    const m = marginAt(clamp(s, 0, total), false), ml = marginAt(clamp(s, 0, total), true);
    const fade = 1 - sm(0, ext, Math.abs(over)); // round off the ends
    const prof = PROFILE(m, ml, m.halfD);
    const yBase = toothY(clamp(s, 0, total));
    prof.forEach(([off, hh], k) => {
      const inner = k >= 5 && k <= 9;
      const hy = inner ? lerp(-0.3, hh, fade) : hh;
      const o = inner ? lerp(off * 0.4, off, fade) : off;
      verts.push(cx + at.nx * o, yBase + (upper ? -hy : hy), cz + at.nz * o);
      // colour by distance below the margin
      const below = [1, 0.95, 0.8, 0.55, 0.3, 0.1, 0, 0.1, 0, 0.1, 0.35, 0.65, 0.9, 1][k];
      col.copy(G_MARGIN).lerp(G_ATTACHED, sm(0, 0.3, below)).lerp(G_MUCOSA, sm(0.35, 0.9, below)).lerp(G_BASE, sm(0.9, 1, below) * 0.5);
      const nz = 0.97 + 0.06 * (Math.sin(i * 1.7 + k * 3.1) * 0.5 + 0.5) * (Math.sin(i * 0.31) * 0.5 + 0.5);
      cols.push(col.r * nz, col.g * nz, col.b * nz);
      uvs.push((s / total) * 6, k / (P - 1));
    });
  }
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < P - 1; k++) {
      const a = i * P + k, b = a + 1, c = a + P, dd = c + 1;
      upper ? idx.push(a, b, c, b, dd, c) : idx.push(a, c, b, b, c, dd);
    }
    // bottom (close the base)
    const a = i * P + P - 1, b = i * P, c = a + P, dd = b + P;
    upper ? idx.push(a, b, c, b, dd, c) : idx.push(a, c, b, b, c, dd);
  }
  // close both ends of the swept profile (retromolar region)
  [0, N].forEach((ring, e) => {
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < P; k++) { cx += verts[(ring * P + k) * 3]; cy += verts[(ring * P + k) * 3 + 1]; cz += verts[(ring * P + k) * 3 + 2]; }
    verts.push(cx / P, cy / P, cz / P); cols.push(G_MUCOSA.r, G_MUCOSA.g, G_MUCOSA.b); uvs.push(0, 1);
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

/* Upper palate: vaulted surface spanning the arch interior. */
export function buildPalateGeometry(arch, toothY) {
  const { total, sample, slots } = arch;
  const N = 90, R = 24;
  const verts = [], cols = [], idx = [];
  const col = new THREE.Color();
  const cBase = new THREE.Color('#d7838a'), cRugae = new THREE.Color('#eaa5a6');
  const halfDAt = (s) => { let b = slots[0]; for (const sl of slots) if (Math.abs(sl.s - s) < Math.abs(b.s - s)) b = sl; return dims(b.fdi, true)[2] / 2; };
  const edge = (s) => { const at = sample(s); const o = halfDAt(s) * 1.0 + 0.05; return { x: at.x - at.nx * o, z: at.z - at.nz * o, y: toothY(s) + 0.18 }; };
  for (let i = 0; i <= N; i++) {
    const s = (total / 2) * (i / N) * 0.999;
    const L = edge(s), Rr = edge(total - s);
    const span = Math.hypot(L.x - Rr.x, L.z - Rr.z);
    for (let r = 0; r <= R; r++) {
      const t = r / R;
      const x = lerp(L.x, Rr.x, t), z = lerp(L.z, Rr.z, t);
      const vault = Math.pow(Math.sin(Math.PI * t), 0.7) * Math.min(0.95, span * 0.42);
      const ant = sm(0.15, 0.5, i / N); // rugae only in the anterior palate
      const rugae = ant * Math.max(0, Math.sin(z * 26)) * (1 - Math.abs(t - 0.5) * 1.6) * Math.max(0, 1 - Math.abs(t - 0.5) * 2.4);
      col.copy(cBase).lerp(cRugae, 0.6 * rugae + 0.3 * Math.abs(t - 0.5));
      verts.push(x, lerp(L.y, Rr.y, t) + vault + rugae * 0.03, z);
      cols.push(col.r, col.g, col.b);
    }
  }
  for (let i = 0; i < N; i++)
    for (let r = 0; r < R; r++) {
      const a = i * (R + 1) + r, b = a + 1, c = a + R + 1, dd = c + 1;
      idx.push(a, b, c, b, dd, c);
    }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  return geo;
}

/* Long-axis inclinations (radians): crown tip toward labial (+) or lingual (−). */
export function inclination(fdi, upper) {
  const p = fdi % 10;
  if (upper) return [0, 0.30, 0.24, 0.12, 0.04, 0.02, -0.02, -0.04, -0.05][p];
  return [0, 0.22, 0.18, 0.10, -0.04, -0.08, -0.14, -0.17, -0.20][p];
}

/* Small, deterministic per-tooth variation so the dentition doesn't look cloned. */
export function variation(fdi) {
  const s = Math.sin(fdi * 127.1) * 43758.5453, r1 = s - Math.floor(s);
  const s2 = Math.sin(fdi * 311.7) * 12543.13, r2 = s2 - Math.floor(s2);
  return { rot: (r1 - 0.5) * 0.06, shade: 0.97 + r2 * 0.05, tilt: (r2 - 0.5) * 0.04 };
}

/* Incisal/cusp level offsets (mm, toward the gum) giving a natural smile arc. */
export function tipOffset(fdi, upper) {
  const p = fdi % 10;
  const up = [0, 0, 0.7, 0.1, 0.5, 0.7, 0.9, 1.1, 1.3];
  const lo = [0, 0, 0.0, -0.3, 0.3, 0.4, 0.5, 0.6, 0.7];
  return (upper ? up : lo)[p] * MM;
}
/* Bucco-lingual offsets (mm, + = labial): laterals sit slightly palatal, canines prominent. */
export function archOffset(fdi, upper) {
  const p = fdi % 10;
  const up = [0, 0.2, -0.5, 0.35, 0, 0, 0, 0, 0];
  const lo = [0, 0, 0, 0.2, 0, 0, 0, 0, 0];
  return (upper ? up : lo)[p] * MM;
}

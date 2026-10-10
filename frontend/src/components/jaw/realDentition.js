/**
 * Real human dentition (BodyParts3D, CT-derived) → smooth, coloured BufferGeometries.
 * Data is loaded lazily (separate chunk) and processed once per session.
 */
import * as THREE from 'three';
import { MM, dims, toothType } from './anatomy';
import { alignDentition, measureTooth } from './align';

const decode = (b64, Type) => {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Type(bytes.buffer);
};

/* Weld duplicate positions so subdivision and normals are continuous. */
function weld(pos, idx) {
  const map = new Map(), out = [], remap = new Int32Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    const key = `${Math.round(pos[i * 3] * 1e3)}_${Math.round(pos[i * 3 + 1] * 1e3)}_${Math.round(pos[i * 3 + 2] * 1e3)}`;
    let j = map.get(key);
    if (j === undefined) { j = out.length / 3; map.set(key, j); out.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); }
    remap[i] = j;
  }
  const tri = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = remap[idx[i]], b = remap[idx[i + 1]], c = remap[idx[i + 2]];
    if (a !== b && b !== c && a !== c) tri.push(a, b, c);
  }
  return { pos: out, idx: tri };
}

/* One step of Loop subdivision (handles boundaries). */
function loop({ pos, idx }) {
  const nV = pos.length / 3;
  const edges = new Map(); // key → {a,b,opp:[],id}
  const ekey = (a, b) => (a < b ? a * 1048576 + b : b * 1048576 + a);
  const nbr = Array.from({ length: nV }, () => new Set());
  for (let t = 0; t < idx.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const a = idx[t + k], b = idx[t + (k + 1) % 3], c = idx[t + (k + 2) % 3];
      const key = ekey(a, b);
      let e = edges.get(key);
      if (!e) { e = { a, b, opp: [] }; edges.set(key, e); }
      e.opp.push(c);
      nbr[a].add(b); nbr[b].add(a);
    }
  }
  const P = (i, a) => pos[i * 3 + a];
  const out = new Array((nV + edges.size) * 3);
  // boundary detection
  const boundaryNbr = Array.from({ length: nV }, () => []);
  edges.forEach(e => { if (e.opp.length === 1) { boundaryNbr[e.a].push(e.b); boundaryNbr[e.b].push(e.a); } });
  // even (original) vertices
  for (let i = 0; i < nV; i++) {
    const bn = boundaryNbr[i];
    for (let a = 0; a < 3; a++) {
      if (bn.length === 2) out[i * 3 + a] = 0.75 * P(i, a) + 0.125 * (P(bn[0], a) + P(bn[1], a));
      else {
        const n = nbr[i].size; const beta = n > 3 ? 3 / (8 * n) : 3 / 16;
        let s = 0; nbr[i].forEach(j => { s += P(j, a); });
        out[i * 3 + a] = (1 - n * beta) * P(i, a) + beta * s;
      }
    }
  }
  // odd (edge) vertices
  let id = nV;
  edges.forEach(e => {
    e.id = id;
    for (let a = 0; a < 3; a++) {
      out[id * 3 + a] = e.opp.length === 2
        ? 0.375 * (P(e.a, a) + P(e.b, a)) + 0.125 * (P(e.opp[0], a) + P(e.opp[1], a))
        : 0.5 * (P(e.a, a) + P(e.b, a));
    }
    id++;
  });
  const tri = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    const ab = edges.get(ekey(a, b)).id, bc = edges.get(ekey(b, c)).id, ca = edges.get(ekey(c, a)).id;
    tri.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  return { pos: out, idx: tri };
}

const C_NECK = new THREE.Color('#e9dcc0');
const C_BODY = new THREE.Color('#f3ecdd');
const C_TIP = new THREE.Color('#f9f6ef');
const C_EDGE = new THREE.Color('#bcc7cb');
const C_STAIN = new THREE.Color('#9d8660');
const C_ROOT = new THREE.Color('#e6d6b6');

function toothGeometry(fdi, data, levels) {
  const upper = fdi < 30;
  let m = weld(Array.from(decode(data.p, Int16Array), v => (v / 100) * MM), Array.from(decode(data.i, data.i32 ? Uint32Array : Uint16Array)));
  for (let l = 0; l < levels; l++) m = loop(m);
  // Keep the crown plus a short root stub — the rest of the root would poke through the gingiva.
  {
    let mn = Infinity, mx = -Infinity;
    for (let i = 1; i < m.pos.length; i += 3) { mn = Math.min(mn, m.pos[i]); mx = Math.max(mx, m.pos[i]); }
    const tip = upper ? mn : mx, keep = dims(fdi, upper)[1] * 1.6;
    const inside = (vi) => Math.abs(m.pos[vi * 3 + 1] - tip) <= keep;
    const tri = [];
    for (let t = 0; t < m.idx.length; t += 3) if (inside(m.idx[t]) || inside(m.idx[t + 1]) || inside(m.idx[t + 2])) tri.push(m.idx[t], m.idx[t + 1], m.idx[t + 2]);
    m.idx = tri;
  }
  const geo = new THREE.BufferGeometry();
  geo.setIndex(m.idx);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(m.pos, 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  // Colour: height along the long axis (occlusal end known from the jaw), plus cavity darkening.
  const bb = geo.boundingBox;
  const tipY = upper ? bb.min.y : bb.max.y;
  const crownH = dims(fdi, upper)[1];
  const type = toothType(fdi);
  const P = geo.attributes.position, N = geo.attributes.normal, n = P.count;
  // Laplacian · normal → concavity (fissures, fossae, embrasures)
  const sum = new Float32Array(n * 3), cnt = new Uint16Array(n);
  const ix = m.idx;
  for (let t = 0; t < ix.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = ix[t + k], b = ix[t + (k + 1) % 3];
    sum[a * 3] += P.getX(b); sum[a * 3 + 1] += P.getY(b); sum[a * 3 + 2] += P.getZ(b); cnt[a]++;
  }
  const cols = new Float32Array(n * 3), uvs = new Float32Array(n * 2);
  const col = new THREE.Color();
  const tint = type === 'canine' ? [0.985, 0.955, 0.9] : type === 'molar' ? [0.975, 0.96, 0.93] : type === 'premolar' ? [0.985, 0.97, 0.945] : [1, 1, 1];
  for (let i = 0; i < n; i++) {
    const y = P.getY(i);
    const fromTip = Math.abs(y - tipY);
    const v = 1 - Math.min(1.4, fromTip / crownH); // 1 at the tip, 0 at the cervical line, < 0 root
    const lx = sum[i * 3] / cnt[i] - P.getX(i), ly = sum[i * 3 + 1] / cnt[i] - P.getY(i), lz = sum[i * 3 + 2] / cnt[i] - P.getZ(i);
    const cav = (lx * N.getX(i) + ly * N.getY(i) + lz * N.getZ(i)) / (MM * 0.06); // >0 = concave
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    if (v < 0) col.copy(C_ROOT);
    else {
      col.copy(C_NECK).lerp(C_BODY, sm(-0.5, 0.3, v)).lerp(C_TIP, sm(0.6, 1, v) * 0.55);
      if (type === 'incisor') col.lerp(C_EDGE, 0.5 * sm(0.78, 0.96, v) * (1 - sm(0.97, 1, v)));
      if (type === 'canine') col.lerp(C_EDGE, 0.25 * sm(0.82, 1, v));
      const c = Math.min(1, Math.max(0, cav));
      if ((type === 'molar' || type === 'premolar') && v > 0.7) col.lerp(C_STAIN, 0.6 * c * c);
      col.multiplyScalar(1 - 0.12 * c);
    }
    cols[i * 3] = col.r * tint[0]; cols[i * 3 + 1] = col.g * tint[1]; cols[i * 3 + 2] = col.b * tint[2];
    uvs[i * 2] = Math.atan2(P.getZ(i) - (bb.min.z + bb.max.z) / 2, P.getX(i) - (bb.min.x + bb.max.x) / 2) / (Math.PI * 2) + 0.5;
    uvs[i * 2 + 1] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  // Neck ring (where the gum meets the tooth): vertices ~0.85–1.0 crown heights from the tip.
  const ring = []; let rx = 0, rz = 0;
  for (let i = 0; i < n; i += 2) {
    const f = Math.abs(P.getY(i) - tipY) / crownH;
    if (f > 0.8 && f < 1.0) { ring.push([P.getX(i), P.getZ(i)]); rx += P.getX(i); rz += P.getZ(i); }
  }
  const cervical = { x: rx / Math.max(1, ring.length), z: rz / Math.max(1, ring.length), y: tipY + (upper ? 1 : -1) * crownH * 1.02 };
  geo.userData = { tipY, upper, center: bb.getCenter(new THREE.Vector3()), size: bb.getSize(new THREE.Vector3()), cervical, ring };
  return geo;
}

let cache = null;
/** Loads + builds everything once. Returns { teeth: {fdi: geo}, gumU, gumL }. */
export async function loadRealDentition(levels = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 1 : 2)) {
  if (cache) return cache;
  const { DENTITION } = await import('./dentition.data.js');
  const teeth = {};
  Object.keys(DENTITION).filter(k => /^\d+$/.test(k)).forEach(k => { teeth[+k] = toothGeometry(+k, DENTITION[k], levels); });
  // Ideal orthodontic alignment (the scanned subject has natural crowding).
  alignDentition(teeth);
  Object.entries(teeth).forEach(([f, g]) => measureTooth(g, +f));
  const info = {}; Object.entries(teeth).forEach(([f, g]) => { info[f] = g.userData; });
  cache = { teeth, info };
  return cache;
}

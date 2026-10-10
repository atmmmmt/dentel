/**
 * Digital orthodontic set-up: keeps every real tooth's shape and natural inclination,
 * but places it on an ideal, symmetric arch — de-rotated, contacts touching, level incisal
 * edges, curve of Spee, and a normal overjet/overbite between the arches.
 */
import * as THREE from 'three';
import { MM, UPPER, LOWER, dims, toothType } from './anatomy';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Symmetric arch fitted to the patient's own form: z = a0 + a2·x² + a4·x⁴ (flat front, straight-ish sides),
// then uniformly expanded about the front point so every tooth fits edge to edge (no crowding).
function fitArch(points, need, zFront) {
  const rows = points.map(([x, z]) => [1, x * x, x ** 4, z]);
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  rows.forEach(r => { for (let i = 0; i < 3; i++) { b[i] += r[i] * r[3]; for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j]; } });
  // solve 3×3 (Cramer)
  const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const D = det(A);
  const co = [0, 1, 2].map(k => det(A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / D);
  const z0 = zFront ?? co[0];
  const X0 = Math.max(...points.map(p => Math.abs(p[0])));
  const curve = (x, k) => ({ x: x * k, z: z0 + k * (co[1] * x * x + co[2] * x ** 4) });
  const build = (k) => {
    const pts = []; let s = 0, prev = null;
    for (let i = 0; i <= 800; i++) { const x = -X0 * 1.15 + (2.3 * X0 * i) / 800; const p = curve(x, k); if (prev) s += Math.hypot(p.x - prev.x, p.z - prev.z); pts.push({ ...p, s }); prev = p; }
    return pts;
  };
  // arc length between the outermost centroids must equal the summed widths
  let k = 1;
  for (let it = 0; it < 25; it++) {
    const pts = build(k);
    const sA = pts.find(p => p.x >= -X0 * k).s, sB = pts.find(p => p.x >= X0 * k).s;
    k *= need / (sB - sA);
  }
  const pts = build(k);
  const start = pts.find(p => p.x >= -X0 * k).s - 0; // arc position of the first tooth centre
  const at = (q) => {
    const qq = q + start;
    let lo = 0, hi = pts.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; pts[m].s < qq ? lo = m + 1 : hi = m; }
    const i = clamp(lo, 1, pts.length - 1), a = pts[i - 1], bb = pts[i];
    const t = (qq - a.s) / Math.max(1e-9, bb.s - a.s);
    const tx = bb.x - a.x, tz = bb.z - a.z, l = Math.hypot(tx, tz) || 1;
    return { x: a.x + (bb.x - a.x) * t, z: a.z + (bb.z - a.z) * t, tx: tx / l, tz: tz / l };
  };
  return { at, X: X0 * k };
}

// Crown footprint of a tooth: centroid, mesio-distal axis (from horizontal PCA) and widths.
function crownStats(geo, fdi, roughTangent) {
  const { tipY } = geo.userData;
  const P = geo.attributes.position, crownH = dims(fdi, fdi < 30)[1];
  // incisors: the incisal edge is a clean mesio-distal line → use only the edge region
  const isInc = toothType(fdi) === 'incisor';
  const band = isInc ? 0.28 : 0.7;
  let cx = 0, cz = 0, n = 0;
  const pts = [];
  for (let i = 0; i < P.count; i += 3) {
    if (Math.abs(P.getY(i) - tipY) < crownH * band) { pts.push([P.getX(i), P.getZ(i)]); cx += P.getX(i); cz += P.getZ(i); n++; }
  }
  cx /= n; cz /= n;
  let sxx = 0, szz = 0, sxz = 0;
  pts.forEach(([x, z]) => { sxx += (x - cx) ** 2; szz += (z - cz) ** 2; sxz += (x - cx) * (z - cz); });
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  let a1 = [Math.cos(th), Math.sin(th)], a2 = [-Math.sin(th), Math.cos(th)];
  // the mesio-distal axis is whichever principal axis runs along the arch
  let md = Math.abs(a1[0] * roughTangent[0] + a1[1] * roughTangent[1]) >= Math.abs(a2[0] * roughTangent[0] + a2[1] * roughTangent[1]) ? a1 : a2;
  if (md[0] * roughTangent[0] + md[1] * roughTangent[1] < 0) md = [-md[0], -md[1]];
  let mn = Infinity, mx = -Infinity;
  pts.forEach(([x, z]) => { const d = (x - cx) * md[0] + (z - cz) * md[1]; mn = Math.min(mn, d); mx = Math.max(mx, d); });
  const tr = sxx + szz, dt = sxx * szz - sxz * sxz, disc = Math.sqrt(Math.max(0, tr * tr / 4 - dt));
  const elong = (tr / 2 + disc) / Math.max(1e-9, tr / 2 - disc); // eigenvalue ratio
  // Near-round crowns (molars, canines) have no reliable axis → keep their natural orientation.
  if (isInc) { md = a1; if (md[0] * roughTangent[0] + md[1] * roughTangent[1] < 0) md = [-md[0], -md[1]]; }
  else if (elong < 1.35) md = roughTangent;
  mn = Infinity; mx = -Infinity;
  pts.forEach(([x, z]) => { const d = (x - cx) * md[0] + (z - cz) * md[1]; mn = Math.min(mn, d); mx = Math.max(mx, d); });
  return { cx, cz, md, width: mx - mn, mid: (mx + mn) / 2 };
}

/* Target occlusal levels (mm): curve of Spee + natural smile arc. */
const speeMM = (xNorm) => 1.6 * Math.pow(clamp(Math.abs(xNorm), 0, 1), 2.2);
const lowerTip = (fdi) => [0, 0, 0, -0.4, 0.2, 0.3, 0.4, 0.5, 0.6][fdi % 10];          // canine slightly higher
const upperOverlap = (fdi) => [0, 2.6, 2.2, 2.0, 1.4, 1.3, 1.2, 1.1, 1.0][fdi % 10];  // overbite / cusp interdigitation

// Long axis of a tooth = dominant direction of its vertices (power iteration on the 3×3 covariance).
function longAxis(geo) {
  const P = geo.attributes.position; let mx = 0, my = 0, mz = 0; const n = P.count;
  for (let i = 0; i < n; i++) { mx += P.getX(i); my += P.getY(i); mz += P.getZ(i); }
  mx /= n; my /= n; mz /= n;
  const C = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i += 2) {
    const d = [P.getX(i) - mx, P.getY(i) - my, P.getZ(i) - mz];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) C[a * 3 + b] += d[a] * d[b];
  }
  let v = [0, 1, 0];
  for (let k = 0; k < 40; k++) {
    const w = [0, 1, 2].map(a => C[a * 3] * v[0] + C[a * 3 + 1] * v[1] + C[a * 3 + 2] * v[2]);
    const l = Math.hypot(...w) || 1; v = w.map(x => x / l);
  }
  return { axis: new THREE.Vector3(...v), centre: new THREE.Vector3(mx, my, mz) };
}

// Natural mesial crown tip (degrees) of an ideal set-up.
const ANGULATION = { incisor: 3, canine: 6, premolar: 3 };

/* Stand single-rooted teeth upright in the frontal plane (removes the fanned / crowded look). */
function uprightTeeth(teeth, order, tangents) {
  order.forEach((f, i) => {
    const type = toothType(f);
    if (type === 'molar') return;
    const geo = teeth[f], upper = f < 30;
    const { axis, centre } = longAxis(geo);
    if (upper ? axis.y > 0 : axis.y < 0) axis.negate(); // point toward the crown tip
    const T = new THREE.Vector3(tangents[i][0], 0, tangents[i][1]).normalize();
    const N = new THREE.Vector3(-T.z, 0, T.x); // horizontal axis across the arch
    const up = new THREE.Vector3(0, upper ? -1 : 1, 0);
    // current tip of the crown along the arch (in the tangent/vertical plane)
    const cur = Math.atan2(axis.dot(T), axis.dot(up));
    const mesialSign = centre.x < 0 ? 1 : -1; // +T points to the midline on the patient's right
    const want = mesialSign * (ANGULATION[type] * Math.PI / 180);
    const rot = new THREE.Matrix4().makeRotationAxis(N, (want - cur) * (upper ? 1 : -1));
    const m = new THREE.Matrix4().makeTranslation(centre.x, centre.y, centre.z).multiply(rot).multiply(new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z));
    geo.applyMatrix4(m);
    geo.computeBoundingBox();
    geo.userData.tipY = upper ? geo.boundingBox.min.y : geo.boundingBox.max.y;
  });
}

/* The scan's head position tilts the occlusal plane; level it (incisors ↔ first molars). */
function levelOcclusalPlane(teeth) {
  const tip = (f) => { const b = new THREE.Box3().setFromBufferAttribute(teeth[f].attributes.position); return { y: b.max.y, z: (b.min.z + b.max.z) / 2 }; };
  if (![31, 41, 36, 46].every(f => teeth[f])) return;
  const a = [tip(31), tip(41)], p = [tip(36), tip(46)];
  const ya = (a[0].y + a[1].y) / 2, za = (a[0].z + a[1].z) / 2, yp = (p[0].y + p[1].y) / 2, zp = (p[0].z + p[1].z) / 2;
  const angle = Math.atan2(yp - ya, za - zp); // rise toward the back
  const m = new THREE.Matrix4().makeRotationX(-angle);
  Object.values(teeth).forEach(g => { g.applyMatrix4(m); g.computeBoundingBox(); g.userData.tipY = g.userData.upper ? g.boundingBox.min.y : g.boundingBox.max.y; });
}

export function alignDentition(teeth) {
  levelOcclusalPlane(teeth);
  // 1) upright every single-rooted tooth along its original arch tangent
  for (const upper of [false, true]) {
    const order = (upper ? UPPER : LOWER).filter(f => teeth[f]);
    const cents = order.map(f => { const b = new THREE.Box3().setFromBufferAttribute(teeth[f].attributes.position); const c = b.getCenter(new THREE.Vector3()); return [c.x, c.z]; });
    const tans = order.map((f, i) => { const a = cents[Math.max(0, i - 1)], b = cents[Math.min(order.length - 1, i + 1)]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; });
    uprightTeeth(teeth, order, tans);
  }
  const stats = {};
  for (const upper of [false, true]) {
    const order = (upper ? UPPER : LOWER).filter(f => teeth[f]);
    // rough tangent from the original neighbours
    const cents = order.map(f => { const b = new THREE.Box3().setFromBufferAttribute(teeth[f].attributes.position); const c = b.getCenter(new THREE.Vector3()); return [c.x, c.z]; });
    order.forEach((f, i) => {
      const a = cents[Math.max(0, i - 1)], b = cents[Math.min(order.length - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      stats[f] = crownStats(teeth[f], f, [(b[0] - a[0]) / l, (b[1] - a[1]) / l]);
    });
  }

  // Arch sizes: total crown widths with light contacts; proportions follow the original dentition.
  const sumW = (order) => order.reduce((s, f) => s + stats[f].width * 0.985, 0);
  const lowerOrder = LOWER.filter(f => teeth[f]), upperOrder = UPPER.filter(f => teeth[f]);
  const mirrored = (order) => order.map(f => [stats[f].cx, stats[f].cz]).concat(order.map(f => [-stats[f].cx, stats[f].cz]));
  const centreSpan = (order) => sumW(order) - (stats[order[0]].width + stats[order[order.length - 1]].width) * 0.985 / 2;
  const lowerArch = fitArch(mirrored(lowerOrder), centreSpan(lowerOrder));
  const lowerFrontZ = lowerArch.at(centreSpan(lowerOrder) / 2).z;
  // upper incisors ~3 mm labial to the lowers (overjet); upper arch is naturally larger (Bolton)
  const upperArch = fitArch(mirrored(upperOrder), centreSpan(upperOrder), lowerFrontZ + 3.4 * MM);

  const place = (order, arch, upper) => {
    let cum = -stats[order[0]].width * 0.985 / 2; // first tooth centre sits at arc position 0
    const halfSpan = arch.X;
    order.forEach(f => {
      const st = stats[f], w = st.width * 0.985;
      const target = arch.at(cum + w / 2); cum += w;
      // rotate the tooth's mesio-distal axis onto the arch tangent (about the vertical axis)
      const d = Math.atan2(target.tz, target.tx) - Math.atan2(st.md[1], st.md[0]);
      const cos = Math.cos(d), sin = Math.sin(d);
      // crown mid-point along the MD axis (PCA centre may be off by the crown asymmetry)
      const ox = st.cx + st.md[0] * st.mid, oz = st.cz + st.md[1] * st.mid;
      // vertical: level the tip on the ideal occlusal curve
      const xn = target.x / Math.abs(halfSpan);
      const lowerLevel = (speeMM(xn) + lowerTip(f)) * MM;
      const tipTarget = upper ? lowerLevel - upperOverlap(f) * MM : lowerLevel;
      const dy = tipTarget - teeth[f].userData.tipY;
      const P = teeth[f].attributes.position;
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i) - ox, z = P.getZ(i) - oz;
        P.setXYZ(i, x * cos - z * sin + target.x, P.getY(i) + dy, x * sin + z * cos + target.z);
      }
      P.needsUpdate = true;
      teeth[f].computeVertexNormals();
      teeth[f].computeBoundingBox();
      teeth[f].computeBoundingSphere();
    });
  };
  place(lowerOrder, lowerArch, false);
  place(upperOrder, upperArch, true);
}

/* Re-measure tip / neck ring after the set-up (used by the gum and markers). */
export function measureTooth(geo, fdi) {
  const upper = fdi < 30, crownH = dims(fdi, upper)[1];
  geo.computeBoundingBox();
  const bb = geo.boundingBox, P = geo.attributes.position;
  const tipY = upper ? bb.min.y : bb.max.y;
  const ring = []; let rx = 0, rz = 0;
  for (let i = 0; i < P.count; i += 2) {
    const f = Math.abs(P.getY(i) - tipY) / crownH;
    if (f > 0.8 && f < 1.0) { ring.push([P.getX(i), P.getZ(i)]); rx += P.getX(i); rz += P.getZ(i); }
  }
  const cervical = { x: rx / Math.max(1, ring.length), z: rz / Math.max(1, ring.length), y: tipY + (upper ? 1 : -1) * crownH * 1.02 };
  geo.userData = { ...geo.userData, tipY, upper, center: bb.getCenter(new THREE.Vector3()), size: bb.getSize(new THREE.Vector3()), cervical, ring, type: toothType(fdi) };
}

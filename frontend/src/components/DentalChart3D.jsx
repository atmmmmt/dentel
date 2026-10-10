import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TOOTH_CONDITIONS, toothName } from './DentalChart';
import {
  UPPER, LOWER, toothType, dims, buildArch, buildToothGeometry, buildGumGeometry,
  buildPalateGeometry, inclination, variation, tipOffset, archOffset,
} from './jaw/anatomy';
import { loadRealDentition } from './jaw/realDentition';
import { archFromTeeth, buildDentureBase, buildDenturePalate, dentureMaps } from './jaw/denture';

const CREDIT = 'مجسم الأسنان مبني على بيانات BodyParts3D © The Database Center for Life Science — CC BY-SA 2.1 Japan';

/* A real scanned model, if present, replaces the procedural jaw automatically.
   Requirements: GLB with one mesh per tooth whose name contains its FDI number (e.g. "tooth_11"). */
export const REAL_JAW_URL = '/models/jaw.glb';

/* ── Geometry caches (built once per session) ─────────────────────────── */
const GEO = {};
const toothGeo = (fdi, upper) => (GEO[`${fdi}${upper ? 'u' : 'l'}`] ||= buildToothGeometry(fdi, upper));
const ARCH = { upper: buildArch(true), lower: buildArch(false) };
const GAP = 0.62; // vertical opening between the arches (tip to tip)

// Curve of Spee: occlusal plane rises toward the molars.
const spee = (x, arch) => 0.11 * Math.pow(Math.abs(x) / arch.W, 2.2);
const baseY = (slot, upper) => {
  const h = dims(slot.fdi, upper)[1];
  const tip = upper ? GAP / 2 + spee(slot.x, ARCH.upper) + tipOffset(slot.fdi, true) : -GAP / 2 + spee(slot.x, ARCH.lower) - tipOffset(slot.fdi, false);
  return upper ? tip + h : tip - h; // cervical line
};
const cervicalAt = (upper) => {
  const arch = upper ? ARCH.upper : ARCH.lower;
  const ys = arch.slots.map(s => ({ s: s.s, y: baseY(s, upper) }));
  return (s) => {
    if (s <= ys[0].s) return ys[0].y;
    for (let i = 1; i < ys.length; i++) if (s <= ys[i].s) {
      const t = (s - ys[i - 1].s) / (ys[i].s - ys[i - 1].s); const k = t * t * (3 - 2 * t);
      return ys[i - 1].y + (ys[i].y - ys[i - 1].y) * k;
    }
    return ys[ys.length - 1].y;
  };
};

/* ── Surface detail maps (generated, so the chart keeps working offline) ── */
let _maps = null;
function detailMaps() {
  if (_maps) return _maps;
  const make = (draw, rep) => {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'); draw(x, S);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); return t;
  };
  _maps = {
    // enamel perikymata: faint horizontal growth lines
    enamel: make((x, S) => {
      x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 90; i++) {
        const y = Math.random() * S, g = 110 + Math.random() * 50;
        x.strokeStyle = `rgba(${g},${g},${g},.18)`; x.lineWidth = .6 + Math.random();
        x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(S * .3, y + 2, S * .6, y - 2, S, y + 1); x.stroke();
      }
    }, [1, 3]),
    // gingival stippling ("orange-peel")
    gum: make((x, S) => {
      x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 2600; i++) {
        const g = 70 + Math.random() * 150;
        x.fillStyle = `rgba(${g},${g},${g},.22)`;
        x.beginPath(); x.arc(Math.random() * S, Math.random() * S, .6 + Math.random() * 1.3, 0, 7); x.fill();
      }
    }, [14, 3]),
  };
  return _maps;
}

/* ── Studio environment (soft-boxes) for believable wet reflections ──── */
function StudioEnv() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const room = new THREE.Scene();
    room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x3a3d42, side: THREE.BackSide })));
    [
      { c: '#ffffff', i: 14, p: [0, 11, 3], s: [10, .4, 6] },   // overhead softbox
      { c: '#fff3e6', i: 5, p: [-10, 3, 6], s: [.4, 7, 7] },    // warm key side
      { c: '#e9f1ff', i: 3.5, p: [10, 2, -2], s: [.4, 6, 8] },  // cool fill
      { c: '#ffffff', i: 2.2, p: [0, 1, 12], s: [9, 5, .4] },   // front bounce
    ].forEach(({ c, i, p, s }) => {
      const m = new THREE.MeshBasicMaterial({ color: c }); m.color.multiplyScalar(i);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...s), m); mesh.position.set(...p); room.add(mesh);
    });
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(room, 0.035).texture;
    scene.environment = tex;
    return () => { scene.environment = null; tex.dispose(); pmrem.dispose(); };
  }, [gl, scene]);
  return null;
}

/* ── Materials ────────────────────────────────────────────────────────── */
function enamelProps(condition, selected, hovered, primary) {
  const maps = detailMaps();
  const ghost = condition === 'extraction' || condition === 'missing';
  const c = condition && !ghost && condition !== 'healthy' ? TOOTH_CONDITIONS[condition]?.color : null;
  const tint = c ? new THREE.Color(c).lerp(new THREE.Color('#ffffff'), condition === 'crown' || condition === 'veneer' ? 0.55 : 0.68) : new THREE.Color('#ffffff');
  return {
    vertexColors: true, color: tint,
    roughness: condition === 'crown' || condition === 'veneer' ? 0.12 : 0.3,
    roughnessMap: maps.enamel, bumpMap: maps.enamel, bumpScale: 0.25,
    clearcoat: 0.7, clearcoatRoughness: 0.12,           // saliva film
    ior: 1.62, specularIntensity: 0.9, specularColor: new THREE.Color('#fffaf2'),
    sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color('#fff4e2'),
    transmission: ghost ? 0 : 0.06, thickness: 0.35,
    attenuationColor: new THREE.Color('#efd3a2'), attenuationDistance: 0.5,
    transparent: ghost, opacity: ghost ? 0.13 : 1, depthWrite: !ghost,
    emissive: new THREE.Color(selected ? primary : hovered ? '#5b7083' : '#000000'),
    emissiveIntensity: selected ? 0.28 : hovered ? 0.12 : 0,
    envMapIntensity: 1.0,
  };
}

/* ── One procedural tooth ─────────────────────────────────────────────── */
function Tooth({ slot, upper, record, selected, onClick, primary }) {
  const [hovered, setHovered] = useState(false);
  const { fdi } = slot;
  const [, h, d] = dims(fdi, upper);
  const vary = useMemo(() => variation(fdi), [fdi]);
  const condition = record?.condition;
  const props = useMemo(() => enamelProps(condition, selected, hovered, primary), [condition, selected, hovered, primary]);
  const geo = useMemo(() => toothGeo(fdi, upper), [fdi, upper]);
  const incl = inclination(fdi, upper) + vary.tilt;
  const dir = upper ? -1 : 1; // crown direction along y
  const type = toothType(fdi);

  return (
    <group position={[slot.x + slot.nx * archOffset(fdi, upper), baseY(slot, upper), slot.z + slot.nz * archOffset(fdi, upper)]} rotation={[0, slot.rotY + vary.rot, 0]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(fdi); } : undefined}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}>
      <group rotation={[upper ? -incl : incl, 0, 0]} scale={selected ? 1.04 : 1}>
        <mesh geometry={geo} castShadow receiveShadow scale={[vary.shade > 1 ? 1.0 : 0.985, 1, 1]}>
          <meshPhysicalMaterial {...props} />
        </mesh>

        {condition === 'filling' && (type === 'molar' || type === 'premolar') && (
          <mesh position={[0, dir * (h - 0.012), 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[d * 0.17, 28]} />
            <meshPhysicalMaterial color="#9fa9b3" metalness={0.75} roughness={0.28} clearcoat={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
        {condition === 'implant' && (
          <mesh position={[0, dir * 0.015, 0]}>
            <cylinderGeometry args={[d * 0.36, d * 0.33, 0.05, 32]} />
            <meshPhysicalMaterial color="#b9c4cf" metalness={0.95} roughness={0.2} />
          </mesh>
        )}
        {condition === 'extraction' && [Math.PI / 4, -Math.PI / 4].map((r, i) => (
          <mesh key={i} position={[0, dir * h * 0.5, d * 0.55]} rotation={[0, 0, r]}>
            <boxGeometry args={[0.035, h * 0.9, 0.035]} />
            <meshStandardMaterial color="#EF4444" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {(hovered || selected) && (
        <Html center position={[0, dir * (h + 0.32), 0]} style={{ pointerEvents: 'none' }} zIndexRange={[40, 0]}>
          <Tip fdi={fdi} condition={condition} />
        </Html>
      )}
    </group>
  );
}

function Tip({ fdi, condition }) {
  const c = TOOTH_CONDITIONS[condition];
  return (
    <div style={{ background: 'rgba(11,24,36,.92)', color: '#fff', padding: '5px 11px', borderRadius: 10, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font-arabic)', direction: 'rtl', border: c ? `1.5px solid ${c.color}` : 'none' }}>
      {toothName(fdi)}
      {c && <span style={{ color: c.color }}> — {c.label}</span>}
    </div>
  );
}

/* ── Gingiva + palate ─────────────────────────────────────────────────── */
function Gum({ upper }) {
  const arch = upper ? ARCH.upper : ARCH.lower;
  const geo = useMemo(() => buildGumGeometry(arch, upper, cervicalAt(upper)), [upper]); // eslint-disable-line react-hooks/exhaustive-deps
  const palate = useMemo(() => (upper ? buildPalateGeometry(arch, cervicalAt(true)) : null), [upper]); // eslint-disable-line react-hooks/exhaustive-deps
  const maps = detailMaps();
  const mat = { vertexColors: true, roughness: 0.58, roughnessMap: maps.gum, bumpMap: maps.gum, bumpScale: 0.9, clearcoat: 0.3, clearcoatRoughness: 0.35, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffc2bb'), specularIntensity: 0.45, envMapIntensity: 0.6 };
  return (
    <>
      <mesh geometry={geo} receiveShadow castShadow><meshPhysicalMaterial {...mat} side={THREE.DoubleSide} /></mesh>
      {palate && <mesh geometry={palate} receiveShadow><meshPhysicalMaterial {...mat} side={THREE.DoubleSide} /></mesh>}
    </>
  );
}

function ProceduralJaw({ byTooth, selectedTooth, onToothClick, primary }) {
  return (
    <group>
      {[true, false].map(upper => (
        <group key={upper ? 'u' : 'l'} rotation={[upper ? -0.06 : 0.02, 0, 0]}>
          <Gum upper={upper} />
          {(upper ? ARCH.upper : ARCH.lower).slots.map(slot => (
            <Tooth key={slot.fdi} slot={slot} upper={upper} record={byTooth[slot.fdi]}
              selected={selectedTooth === slot.fdi} onClick={onToothClick} primary={primary} />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ── Real human dentition (CT-derived BodyParts3D data) ──────────────── */
const OPEN = 0.8; // jaw opening so every occlusal surface stays visible and clickable

function CTTooth({ fdi, geo, record, selected, onClick, primary }) {
  const [hovered, setHovered] = useState(false);
  const condition = record?.condition;
  const props = useMemo(() => enamelProps(condition, selected, hovered, primary), [condition, selected, hovered, primary]);
  const { tipY, upper, center, size } = geo.userData;
  const dir = upper ? -1 : 1; // toward the occlusal surface
  const h = dims(fdi, upper)[1];
  const type = toothType(fdi);
  const tipLocal = [0, tipY - center.y, 0];
  return (
    <group position={[center.x, center.y, center.z]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(fdi); } : undefined}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (onClick) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}>
      <group scale={selected ? 1.04 : 1}>
        <mesh geometry={geo} position={[-center.x, -center.y, -center.z]} castShadow receiveShadow>
          <meshPhysicalMaterial {...props} />
        </mesh>
        {condition === 'filling' && (type === 'molar' || type === 'premolar') && (
          <mesh position={[tipLocal[0], tipLocal[1] - dir * 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.min(size.x, size.z) * 0.2, 28]} />
            <meshPhysicalMaterial color="#9fa9b3" metalness={0.75} roughness={0.28} clearcoat={0.6} side={THREE.DoubleSide} />
          </mesh>
        )}
        {condition === 'implant' && (
          <mesh position={[0, tipLocal[1] - dir * h * 0.97, 0]}>
            <cylinderGeometry args={[Math.min(size.x, size.z) * 0.36, Math.min(size.x, size.z) * 0.33, 0.05, 32]} />
            <meshPhysicalMaterial color="#b9c4cf" metalness={0.95} roughness={0.2} />
          </mesh>
        )}
      </group>
      {condition === 'extraction' && (
        <Html center occlude position={[0, tipLocal[1] - dir * h * 0.45, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
          <span style={{ color: '#EF4444', fontSize: 22, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.25)' }}>✕</span>
        </Html>
      )}
      {(hovered || selected) && (
        <Html center position={[0, tipLocal[1] + dir * 0.32, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[40, 0]}>
          <Tip fdi={fdi} condition={condition} />
        </Html>
      )}
    </group>
  );
}

function DentureMat() {
  const maps = dentureMaps();
  return (
    <meshPhysicalMaterial vertexColors map={maps.color} bumpMap={maps.bump} bumpScale={0.25}
      roughness={0.3} clearcoat={0.75} clearcoatRoughness={0.11}
      sheen={0.45} sheenRoughness={0.5} sheenColor="#ffd6d0"
      specularIntensity={0.6} envMapIntensity={0.95} side={THREE.DoubleSide} />
  );
}

function DentureBase({ info, upper }) {
  const { base, palate } = useMemo(() => {
    const arch = archFromTeeth(info, upper);
    const F = upper ? 1.28 : 1.12;
    return { base: buildDentureBase(arch, upper, F), palate: upper ? buildDenturePalate(arch, F) : null };
  }, [info, upper]);
  return (
    <>
      <mesh geometry={base} receiveShadow><DentureMat /></mesh>
      {palate && <mesh geometry={palate} receiveShadow><DentureMat /></mesh>}
    </>
  );
}

function CTJaw({ byTooth, selectedTooth, onToothClick, primary, open }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    loadRealDentition().then(d => alive && setData(d)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);
  if (failed) return <ProceduralJaw byTooth={byTooth} selectedTooth={selectedTooth} onToothClick={onToothClick} primary={primary} />;
  if (!data) return <Html center><span style={{ fontFamily: 'var(--font-arabic)', fontSize: 13, color: '#64748b' }}>جارٍ تحميل المجسم…</span></Html>;
  const jaw = (upper) => Object.entries(data.teeth).filter(([f]) => (+f < 30) === upper).map(([f, geo]) => (
    <CTTooth key={f} fdi={+f} geo={geo} record={byTooth[f]} selected={selectedTooth === +f} onClick={onToothClick} primary={primary} />
  ));
  const gap = open ? OPEN : 0;
  return (
    <group position={[0, -0.05, 1.75]}>
      <group position={[0, gap * 0.6, 0]} rotation={[open ? -0.09 : 0, 0, 0]}>
        <DentureBase info={data.info} upper />
        {jaw(true)}
      </group>
      <group position={[0, -gap * 0.4, 0]}>
        <DentureBase info={data.info} upper={false} />
        {jaw(false)}
      </group>
    </group>
  );
}

/* ── Real scanned model (GLB) ─────────────────────────────────────────── */
function RealJaw({ byTooth, selectedTooth, onToothClick, primary }) {
  const { scene } = useGLTF(REAL_JAW_URL, false);
  const [hovered, setHovered] = useState(null);
  const model = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const k = 5.4 / Math.max(size.x, size.z);
    root.position.sub(center.multiplyScalar(k)); root.scale.setScalar(k);
    const teeth = {};
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      const m = o.name.match(/(?:^|\D)([1-4][1-8])(?:\D|$)/);
      if (m) { teeth[+m[1]] = o; o.userData.fdi = +m[1]; o.userData.base = o.material; }
    });
    return { root, teeth };
  }, [scene]);

  useEffect(() => {
    Object.entries(model.teeth).forEach(([fdi, mesh]) => {
      const cond = byTooth[fdi]?.condition;
      const sel = selectedTooth === +fdi, hov = hovered === +fdi;
      if (!cond && !sel && !hov) { mesh.material = mesh.userData.base; return; }
      const base = mesh.userData.base;
      const p = enamelProps(cond, sel, hov, primary);
      mesh.material = new THREE.MeshPhysicalMaterial({ ...p, vertexColors: !!mesh.geometry.attributes.color, map: base.map || null, normalMap: base.normalMap || null, roughnessMap: base.roughnessMap || p.roughnessMap });
    });
  }, [model, byTooth, selectedTooth, hovered, primary]);

  return (
    <primitive object={model.root}
      onClick={onToothClick ? (e) => { const f = e.object.userData.fdi; if (f) { e.stopPropagation(); onToothClick(f); } } : undefined}
      onPointerMove={(e) => { const f = e.object.userData.fdi || null; setHovered(f); document.body.style.cursor = f && onToothClick ? 'pointer' : 'auto'; }}
      onPointerOut={() => { setHovered(null); document.body.style.cursor = 'auto'; }}>
      {hovered && model.teeth[hovered] && (
        <Html center position={new THREE.Box3().setFromObject(model.teeth[hovered]).getCenter(new THREE.Vector3()).divideScalar(model.root.scale.x).add(new THREE.Vector3(0, 0.3 / model.root.scale.x, 0))} style={{ pointerEvents: 'none' }}>
          <Tip fdi={hovered} condition={byTooth[hovered]?.condition} />
        </Html>
      )}
    </primitive>
  );
}

let realModelAvailable = null; // cached HEAD check
function useRealModel() {
  const [ok, setOk] = useState(realModelAvailable);
  useEffect(() => {
    if (realModelAvailable !== null) return;
    fetch(REAL_JAW_URL, { method: 'HEAD' })
      .then(r => { realModelAvailable = r.ok && !(r.headers.get('content-type') || '').includes('text/html'); setOk(realModelAvailable); })
      .catch(() => { realModelAvailable = false; setOk(false); });
  }, []);
  return ok;
}

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC COMPONENT — API unchanged: records, onToothClick, selectedTooth,
   primary, showLegend, maxWidth, height
   ═══════════════════════════════════════════════════════════════════════ */
export default function DentalChart3D({
  records = [], onToothClick, selectedTooth = null,
  primary = '#2D6BEB', showLegend = true, maxWidth = 560, height = 380,
}) {
  const ctrlRef = useRef();
  const [touched, setTouched] = useState(false);
  const [open, setOpen] = useState(false);
  const real = useRealModel();

  const byTooth = {};
  records.forEach(r => { byTooth[r.tooth] = r; });
  const used = [...new Set(records.map(r => r.condition))];
  const jawProps = { byTooth, selectedTooth, onToothClick, primary };

  return (
    <div className="select-none" style={{ maxWidth, margin: '0 auto' }}>
      <div style={{ height, borderRadius: 18, overflow: 'hidden', background: 'radial-gradient(120% 95% at 50% 30%, #f4f4f3 0%, #e9e9e8 55%, #dcdcdb 100%)' }}>
        <Canvas shadows dpr={[1, 2]}
          camera={{ position: [-5.6, 1.0, 8.2], fov: 32 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12 }}
          onCreated={(st) => { if (import.meta.env.DEV) window.__jaw3d = st; }}
          onPointerDown={() => setTouched(true)}>
          <StudioEnv />
          <hemisphereLight args={['#ffffff', '#c9a9a6', 0.35]} />
          <directionalLight position={[3, 7, 6]} intensity={1.6} castShadow
            shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} shadow-normalBias={0.02}
            shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} />
          <directionalLight position={[-5, 2, 5]} intensity={0.45} color="#fff1e4" />
          <directionalLight position={[0, 3, -6]} intensity={0.55} color="#eaf2ff" />

          <group position={[0, 0.25, 0]}>
            {real
              ? <Suspense fallback={null}><RealJaw {...jawProps} /></Suspense>
              : <CTJaw {...jawProps} open={open} />}
          </group>

          <ContactShadows position={[0, -1.85, 0]} opacity={0.45} scale={13} blur={2.4} far={3.5} />
          <OrbitControls ref={ctrlRef} enablePan={false} target={[0, 0.1, -0.2]}
            minDistance={3.2} maxDistance={12} minPolarAngle={0.25} maxPolarAngle={2.6}
            autoRotate={!touched} autoRotateSpeed={0.7} enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-gray-400">اسحب لتدوير الفك — عجلة الفأرة أو إصبعان للتقريب</span>
        <span title={CREDIT} aria-label={CREDIT} className="cursor-help text-xs text-gray-300">ⓘ</span>
        <button onClick={() => setOpen(o => !o)} className="rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-gray-200 hover:text-gray-700">
          {open ? 'إطباق الفكين' : 'فتح الفك'}
        </button>
        {touched && (
          <button onClick={() => { setTouched(false); ctrlRef.current?.reset(); }} className="text-xs font-semibold text-gray-500 underline hover:text-gray-700">إعادة الوضع</button>
        )}
      </div>

      {showLegend && used.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {used.map(k => (
            <span key={k} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: `${TOOTH_CONDITIONS[k]?.color}14`, color: TOOTH_CONDITIONS[k]?.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: TOOTH_CONDITIONS[k]?.color }} />{TOOTH_CONDITIONS[k]?.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


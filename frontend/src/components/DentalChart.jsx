import { useRef, useState } from 'react';

/* ─── Tooth conditions meta ──────────────────────────────────────── */
export const TOOTH_CONDITIONS = {
  healthy:    { label: 'سليم',          color: '#16A34A' },
  caries:     { label: 'تسوس',          color: '#DC2626' },
  fracture:   { label: 'كسر',           color: '#EA580C' },
  missing:    { label: 'مفقود',         color: '#64748B' },
  extraction: { label: 'قلع',         color: '#EF4444' },
  filling:    { label: 'حشوة',        color: '#0D9488' },
  treatment:  { label: 'معالجة',      color: '#F59E0B' },
  implant:    { label: 'زرعة',        color: '#2563EB' },
  crown:      { label: 'تاج',         color: '#8B5CF6' },
  bridge:     { label: 'جسر',          color: '#4F46E5' },
  veneer:     { label: 'فينير',        color: '#0891B2' },
  root_canal: { label: 'معالجة عصب',  color: '#EC4899' },
  cleaning:   { label: 'تنظيف',       color: '#10B981' },
  sealant:    { label: 'سد شقوق',      color: '#14B8A6' },
  temporary:  { label: 'ترميم مؤقت',   color: '#D97706' },
  other:      { label: 'أخرى',        color: '#6B7280' },
};

/* ─── FDI tooth naming (Arabic) ──────────────────────────────────── */
const QUADRANTS = { 1: 'العلوي الأيمن', 2: 'العلوي الأيسر', 3: 'السفلي الأيسر', 4: 'السفلي الأيمن' };
const POSITIONS = {
  1: 'الثنية (القاطع المركزي)', 2: 'الرباعية (القاطع الجانبي)', 3: 'الناب',
  4: 'الضاحك الأول', 5: 'الضاحك الثاني',
  6: 'الرحى الأولى', 7: 'الرحى الثانية', 8: 'الرحى الثالثة (ضرس العقل)',
};
export const toothName = (fdi) => {
  const q = Math.floor(fdi / 10), p = fdi % 10;
  return `${POSITIONS[p] || 'سن'} — الفك ${QUADRANTS[q] || ''} (${fdi})`;
};

/* ─── Geometry ───────────────────────────────────────────────────── */
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const CX = 260, RX = 185, RY = 170;
const CY_UPPER = 240, CY_LOWER = 400;

const toothType = (fdi) => {
  const p = fdi % 10;
  if (p <= 2) return 'incisor';
  if (p === 3) return 'canine';
  if (p <= 5) return 'premolar';
  return 'molar';
};
const TOOTH_W = { incisor: 22, canine: 24, premolar: 28, molar: 36 };
const TOOTH_H = 44;

// Position + rotation of each tooth along the arch
const layoutTooth = (index, isUpper) => {
  const deg = 168 - index * (156 / 15);           // 168° → 12°
  const rad = (deg * Math.PI) / 180;
  const x = CX + RX * Math.cos(rad);
  const y = isUpper ? CY_UPPER - RY * Math.sin(rad) : CY_LOWER + RY * Math.sin(rad);
  const rotate = isUpper ? 90 - deg : deg - 90;   // long axis points radially outward
  const nx = CX + (RX + 34) * Math.cos(rad);
  const ny = isUpper ? CY_UPPER - (RY + 32) * Math.sin(rad) : CY_LOWER + (RY + 32) * Math.sin(rad);
  return { x, y, rotate, nx, ny };
};

/* ─── Tooth outline (black & white line drawing) ─────────────────── */
function ToothShape({ type }) {
  const w = TOOTH_W[type], h = TOOTH_H;
  const common = { fill: '#fff', stroke: '#374151', strokeWidth: 1.6 };
  return (
    <g>
      {type === 'canine' ? (
        <path {...common}
          d={`M ${-w / 2 + 4} ${-h / 2 + 6} Q ${-w / 2 + 2} ${-h / 2} 0 ${-h / 2 - 3} Q ${w / 2 - 2} ${-h / 2} ${w / 2 - 4} ${-h / 2 + 6}
              L ${w / 2} ${h / 2 - 8} Q ${w / 2} ${h / 2} ${w / 2 - 8} ${h / 2} L ${-w / 2 + 8} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 8} Z`} />
      ) : (
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={type === 'incisor' ? 7 : 9} {...common} />
      )}
      {/* occlusal grooves */}
      {type === 'molar' && (
        <>
          <path d={`M ${-w / 2 + 6} -2 q 6 -6 12 0 t 12 0`} fill="none" stroke="#9CA3AF" strokeWidth="1.2" />
          <path d={`M ${-w / 2 + 8} 8 q 5 4 10 0`} fill="none" stroke="#9CA3AF" strokeWidth="1.2" />
        </>
      )}
      {type === 'premolar' && (
        <path d={`M ${-w / 2 + 5} 0 q 6 -5 12 0 q -6 5 -12 0`} fill="none" stroke="#9CA3AF" strokeWidth="1.2" />
      )}
      {type === 'incisor' && (
        <line x1={-w / 2 + 5} y1={h / 2 - 9} x2={w / 2 - 5} y2={h / 2 - 9} stroke="#D1D5DB" strokeWidth="1" />
      )}
    </g>
  );
}

/* ─── Condition marker drawn over the tooth ──────────────────────── */
function ConditionMarker({ condition, type }) {
  const w = TOOTH_W[type], h = TOOTH_H;
  const c = TOOTH_CONDITIONS[condition]?.color || '#6B7280';
  switch (condition) {
    case 'healthy':
      return <circle cx="0" cy="0" r="4" fill={c} opacity="0.8" />;
    case 'caries':
      return <path d={`M ${-w / 4} -4 q ${w / 4} -8 ${w / 2} 0 q ${-w / 4} 11 ${-w / 2} 0`} fill={c} opacity="0.9" />;
    case 'fracture':
      return <path d={`M ${-w / 2 + 3} ${-h / 2 + 5} L -2 -2 L 5 5 L ${w / 2 - 3} ${h / 2 - 6}`} fill="none" stroke={c} strokeWidth="2.7" strokeLinecap="round" />;
    case 'missing':
      return <rect x={-w / 2 + 3} y={-h / 2 + 4} width={w - 6} height={h - 8} rx="6" fill="none" stroke={c} strokeWidth="2" strokeDasharray="4 3" />;
    case 'extraction':
      return (
        <g stroke={c} strokeWidth="3" strokeLinecap="round">
          <line x1={-w / 2 + 3} y1={-h / 2 + 4} x2={w / 2 - 3} y2={h / 2 - 4} />
          <line x1={w / 2 - 3} y1={-h / 2 + 4} x2={-w / 2 + 3} y2={h / 2 - 4} />
        </g>
      );
    case 'implant':
      return (
        <g stroke={c} strokeWidth="2.2" strokeLinecap="round">
          <line x1="0" y1={-h / 2 + 5} x2="0" y2={h / 2 - 5} />
          <line x1="-6" y1={-h / 2 + 10} x2="6" y2={-h / 2 + 13} />
          <line x1="-6" y1="-1" x2="6" y2="2" />
          <line x1="-6" y1={h / 2 - 12} x2="6" y2={h / 2 - 9} />
        </g>
      );
    case 'filling':
      return <circle cx="0" cy="0" r={Math.min(w, 20) / 3.2} fill={c} opacity="0.9" />;
    case 'treatment':
      return (
        <g stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.9">
          <line x1={-w / 2 + 4} y1={h / 4} x2={w / 4} y2={-h / 2 + 6} />
          <line x1={-w / 4} y1={h / 2 - 6} x2={w / 2 - 4} y2={-h / 4} />
        </g>
      );
    case 'crown':
      return <rect x={-w / 2 - 3.5} y={-h / 2 - 3.5} width={w + 7} height={h + 7} rx="11"
        fill="none" stroke={c} strokeWidth="2.4" strokeDasharray="none" />;
    case 'bridge':
      return <path d={`M ${-w / 2 - 3} 0 H ${w / 2 + 3}`} fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />;
    case 'veneer':
      return <path d={`M ${-w / 2 + 3} ${-h / 2 + 5} Q 0 ${-h / 2 - 1} ${w / 2 - 3} ${-h / 2 + 5} V ${h / 2 - 7} Q 0 ${h / 2} ${-w / 2 + 3} ${h / 2 - 7} Z`} fill={c} opacity="0.32" />;
    case 'root_canal':
      return (
        <g stroke={c} strokeWidth="2.4" strokeLinecap="round">
          <line x1="0" y1={-h / 2 + 5} x2="0" y2={h / 2 - 5} />
          <circle cx="0" cy={-h / 2 + 7} r="3.2" fill={c} stroke="none" />
        </g>
      );
    case 'cleaning':
      return (
        <g stroke={c} strokeWidth="2" strokeLinecap="round">
          <line x1="-5" y1="0" x2="5" y2="0" /><line x1="0" y1="-5" x2="0" y2="5" />
          <line x1={w / 4} y1={-h / 4} x2={w / 4 + 4} y2={-h / 4} />
        </g>
      );
    case 'sealant':
      return <path d={`M ${-w / 3} 0 Q 0 -7 ${w / 3} 0 Q 0 7 ${-w / 3} 0`} fill="none" stroke={c} strokeWidth="2.5" />;
    case 'temporary':
      return <rect x={-w / 3} y={-h / 4} width={w / 1.5} height={h / 2} rx="4" fill={c} opacity="0.45" />;
    default:
      return <circle cx="0" cy="0" r="5" fill="none" stroke={c} strokeWidth="2.2" />;
  }
}

/* ─── Single tooth group ─────────────────────────────────────────── */
function Tooth({ fdi, index, isUpper, record, selected, onClick, primary }) {
  const { x, y, rotate, nx, ny } = layoutTooth(index, isUpper);
  const type = toothType(fdi);
  const w = TOOTH_W[type];
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${rotate})`}
        onClick={onClick ? () => onClick(fdi) : undefined}
        style={onClick ? { cursor: 'pointer' } : undefined}>
        {selected && (
          <rect x={-w / 2 - 6} y={-TOOTH_H / 2 - 6} width={w + 12} height={TOOTH_H + 12} rx="12"
            fill={`${primary}18`} stroke={primary} strokeWidth="2" />
        )}
        <ToothShape type={type} />
        {record && <ConditionMarker condition={record.condition} type={type} />}
        {/* invisible hit area for easier clicking */}
        <rect x={-w / 2 - 6} y={-TOOTH_H / 2 - 6} width={w + 12} height={TOOTH_H + 12} fill="transparent" />
      </g>
      <text x={nx} y={ny} textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontWeight="700" fill={record ? (TOOTH_CONDITIONS[record.condition]?.color || '#9CA3AF') : '#9CA3AF'}>
        {fdi}
      </text>
    </g>
  );
}

/* ─── Main component ─────────────────────────────────────────────────
   records:      [{ tooth, condition, note }]
   onToothClick: (fdi) => void        — omit for read-only
   selectedTooth: fdi | null
   primary:      accent color for selection
   showLegend:   render condition legend under the chart
   interactive3d: drag-to-rotate 3D tilt (default true)
──────────────────────────────────────────────────────────────────── */
export default function DentalChart({
  records = [], onToothClick, selectedTooth = null,
  primary = '#2D6BEB', showLegend = true, interactive3d = true, maxWidth = 560,
}) {
  const [rot, setRot] = useState({ x: 16, y: 0 });
  const drag = useRef(null);

  const byTooth = {};
  records.forEach(r => { byTooth[r.tooth] = r; });

  const onPointerDown = (e) => {
    if (!interactive3d) return;
    drag.current = { sx: e.clientX, sy: e.clientY, rx: rot.x, ry: rot.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy;
    setRot({
      x: Math.max(-40, Math.min(45, drag.current.rx - dy * 0.25)),
      y: Math.max(-45, Math.min(45, drag.current.ry + dx * 0.25)),
    });
  };
  const onPointerUp = () => { drag.current = null; };

  const usedConditions = [...new Set(records.map(r => r.condition))];

  return (
    <div className="select-none" style={{ maxWidth, margin: '0 auto' }}>
      <div style={{ perspective: '950px' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
        className={interactive3d ? 'touch-none' : ''}>
        <svg viewBox="0 0 520 650" style={{
          width: '100%', display: 'block',
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: drag.current ? 'none' : 'transform 0.25s ease',
        }}>
          {/* arch labels */}
          <text x="260" y="252" textAnchor="middle" fontSize="13" fontWeight="800" fill="#D1D5DB">الفك العلوي</text>
          <text x="260" y="404" textAnchor="middle" fontSize="13" fontWeight="800" fill="#D1D5DB">الفك السفلي</text>
          {/* midline */}
          <line x1="260" y1="46" x2="260" y2="120" stroke="#F3F4F6" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="260" y1="524" x2="260" y2="600" stroke="#F3F4F6" strokeWidth="1.5" strokeDasharray="4 4" />

          {UPPER.map((fdi, i) => (
            <Tooth key={fdi} fdi={fdi} index={i} isUpper
              record={byTooth[fdi]} selected={selectedTooth === fdi}
              onClick={onToothClick} primary={primary} />
          ))}
          {LOWER.map((fdi, i) => (
            <Tooth key={fdi} fdi={fdi} index={i} isUpper={false}
              record={byTooth[fdi]} selected={selectedTooth === fdi}
              onClick={onToothClick} primary={primary} />
          ))}
        </svg>
      </div>

      {interactive3d && (
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[11px] text-gray-300 font-medium">اسحب لتدوير الفك 🦷</span>
          {(rot.x !== 16 || rot.y !== 0) && (
            <button onClick={() => setRot({ x: 16, y: 0 })}
              className="text-[11px] font-bold text-gray-400 hover:text-gray-600 underline">إعادة الوضع</button>
          )}
        </div>
      )}

      {showLegend && usedConditions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          {usedConditions.map(k => (
            <span key={k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: `${TOOTH_CONDITIONS[k]?.color}14`, color: TOOTH_CONDITIONS[k]?.color }}>
              <span className="w-2 h-2 rounded-full" style={{ background: TOOTH_CONDITIONS[k]?.color }} />
              {TOOTH_CONDITIONS[k]?.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

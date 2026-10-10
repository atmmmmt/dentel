import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Trash2, Search, ArrowRight, Phone, MapPin,
  FileText, Calendar, X, Edit3, List, Activity, User, Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clinicPatientsApi } from '../../services/clinicApi';
import DentalChart2D, { TOOTH_CONDITIONS, toothName } from '../../components/DentalChart';
import DentalChart3D from '../../components/DentalChart3D';
import ClinicalRecords from './ClinicalRecords';

/* ─── shared modal shell ────────────────────────────────────────── */
function Modal({ onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className={`relative bg-white rounded-3xl border border-gray-100 p-6 w-full ${wide ? 'max-w-3xl' : 'max-w-md'} shadow-2xl max-h-[92vh] overflow-y-auto`}>
        {children}
      </motion.div>
    </div>
  );
}

/* ─── Patient form (create / edit) ──────────────────────────────── */
const EMPTY_PATIENT = { name: '', phone: '', gender: '', birthYear: '', address: '', notes: '' };

function PatientForm({ initial, onSave, onClose, saving, P }) {
  const [form, setForm] = useState(initial || EMPTY_PATIENT);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-5">{initial?.name ? 'تعديل بيانات المريض' : 'مريض جديد'}</h2>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">الاسم الكامل *</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-gray-50"
              placeholder="محمد أحمد" value={form.name} onChange={e => f('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">الهاتف</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50" dir="ltr"
              placeholder="+963..." value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">الجنس</label>
            <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
              value={form.gender} onChange={e => f('gender', e.target.value)}>
              <option value="">—</option><option value="male">ذكر</option><option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">سنة الميلاد</label>
            <input type="number" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50" dir="ltr"
              placeholder="1990" value={form.birthYear || ''} onChange={e => f('birthYear', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1.5">العنوان</label>
          <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
            value={form.address} onChange={e => f('address', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1.5">ملاحظات طبية عامة</label>
          <textarea rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none bg-gray-50"
            placeholder="حساسية، أمراض مزمنة..." value={form.notes} onChange={e => f('notes', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">إلغاء</button>
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50" style={{ background: P }}>
          {saving ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </>
  );
}

/* ═══ Patients list page ═══════════════════════════════════════════ */
export function ClinicPatientsPage({ slug, settings }) {
  const P = settings?.primaryColor || '#1a1a1a';
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(false);

  const load = (q = search) => {
    clinicPatientsApi.getPatients(slug, { search: q || undefined })
      .then(r => { setPatients(r.data.patients || []); setTotal(r.data.total || 0); })
      .catch(err => { if (err.response?.status === 403) setLocked(true); });
  };
  useEffect(() => { load(); }, [slug]);
  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const create = async (form) => {
    if (!form.name) return toast.error('اسم المريض مطلوب');
    setSaving(true);
    try {
      const r = await clinicPatientsApi.createPatient(slug, { ...form, birthYear: form.birthYear || null });
      toast.success('تم إنشاء ملف المريض');
      setShowForm(false);
      navigate(`/clinic/${slug}/dashboard/patients/${r.data.patient._id}`);
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const del = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('حذف ملف المريض بكل جلساته؟')) return;
    await clinicPatientsApi.deletePatient(slug, id).catch(() => {});
    load(); toast.success('تم الحذف');
  };

  if (locked) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 px-6">
        <Lock size={44} className="mx-auto mb-4 text-gray-200" />
        <h2 className="font-black text-gray-700 text-lg mb-1">ميزة ملف المريض غير متوفرة في باقتك</h2>
        <p className="text-gray-400 text-sm">هذه الميزة المتقدمة متوفرة في باقة Premium وما فوق — تواصل مع Prootech للترقية.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">ملفات المرضى</h1>
          <p className="text-gray-400 text-sm mt-1">{total} مريض — سجل جلسات ومخطط أسنان لكل مريض</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: P }}>
          <Plus size={16} /> مريض جديد
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
        <input className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          placeholder="ابحث بالاسم أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {patients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">{search ? 'لا نتائج مطابقة' : 'لا يوجد مرضى بعد'}</p>
            {!search && <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: P }}>+ أضف أول مريض</button>}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {patients.map(p => (
              <div key={p._id} onClick={() => navigate(`/clinic/${slug}/dashboard/patients/${p._id}`)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                  style={{ background: P }}>{p.name?.[0] || 'م'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    {p.phone && <span className="flex items-center gap-1" dir="ltr"><Phone size={11} />{p.phone}</span>}
                    <span className="flex items-center gap-1"><FileText size={11} />{p.sessions?.length || 0} جلسة</span>
                  </div>
                </div>
                <button onClick={e => del(e, p._id)}
                  className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={15} />
                </button>
                <ArrowRight size={15} className="text-gray-200 rotate-180" />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)}>
            <PatientForm onSave={create} onClose={() => setShowForm(false)} saving={saving} P={P} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Session editor (interactive dental chart) ─────────────────── */
const EMPTY_SESSION = () => ({ date: new Date().toISOString().split('T')[0], title: '', notes: '', teeth: [] });

function SessionEditor({ initial, onSave, onClose, saving, P }) {
  const [form, setForm] = useState(initial ? {
    date: initial.date, title: initial.title, notes: initial.notes,
    teeth: (initial.teeth || []).map(t => ({ tooth: t.tooth, condition: t.condition, note: t.note || '' })),
  } : EMPTY_SESSION());
  const [selected, setSelected] = useState(null);
  const [chartView, setChartView] = useState('2d');

  const record = form.teeth.find(t => t.tooth === selected);

  const setTooth = (condition) => {
    setForm(p => {
      const others = p.teeth.filter(t => t.tooth !== selected);
      return { ...p, teeth: [...others, { tooth: selected, condition, note: record?.note || '' }] };
    });
  };
  const setToothNote = (note) => {
    setForm(p => ({ ...p, teeth: p.teeth.map(t => t.tooth === selected ? { ...t, note } : t) }));
  };
  const clearTooth = () => {
    setForm(p => ({ ...p, teeth: p.teeth.filter(t => t.tooth !== selected) }));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-gray-800">{initial ? 'تعديل الجلسة' : 'جلسة جديدة'}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={17} className="text-gray-400" /></button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1.5">التاريخ</label>
          <input type="date" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
            value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-400 mb-1.5">عنوان الجلسة</label>
          <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
            placeholder="معالجة + حشوة..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
      </div>

      {/* Interactive chart */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-gray-500">اضغط على السن أو الضرس ثم اختر حالته السريرية</div>
          <div className="flex rounded-xl border border-gray-200 bg-white p-1" role="tablist" aria-label="طريقة عرض مخطط الأسنان">
            {[['2d', 'مخطط 2D'], ['3d', 'عرض 3D']].map(([value, label]) => <button key={value} type="button" onClick={() => setChartView(value)} role="tab" aria-selected={chartView === value} className={`min-h-9 rounded-lg px-3 text-[11px] font-bold transition ${chartView === value ? 'bg-[#12324A] text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{label}</button>)}
          </div>
        </div>
        {chartView === '2d' ? (
          <DentalChart2D records={form.teeth} onToothClick={fdi => setSelected(s => s === fdi ? null : fdi)} selectedTooth={selected} primary={P} showLegend={false} interactive3d={false} maxWidth={520} />
        ) : (
          <DentalChart3D records={form.teeth} onToothClick={fdi => setSelected(s => s === fdi ? null : fdi)} selectedTooth={selected} primary={P} showLegend={false} maxWidth={520} height={320} />
        )}

        {/* Condition picker for selected tooth */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-black text-gray-700">🦷 {toothName(selected)}</div>
                {record && (
                  <button onClick={clearTooth} className="text-xs font-bold text-red-400 hover:text-red-500">إزالة التحديد</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(TOOTH_CONDITIONS).map(([key, { label, color }]) => (
                  <button key={key} onClick={() => setTooth(key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                    style={record?.condition === key
                      ? { background: color, borderColor: color, color: '#fff' }
                      : { background: `${color}0D`, borderColor: `${color}30`, color }}>
                    {label}
                  </button>
                ))}
              </div>
              {record && (
                <input className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs outline-none bg-gray-50"
                  placeholder="ملاحظة على هذا السن (اختياري)..."
                  value={record.note} onChange={e => setToothNote(e.target.value)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Marked teeth summary */}
      {form.teeth.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[...form.teeth].sort((a, b) => a.tooth - b.tooth).map(t => (
            <button key={t.tooth} onClick={() => setSelected(t.tooth)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: `${TOOTH_CONDITIONS[t.condition]?.color}14`, color: TOOTH_CONDITIONS[t.condition]?.color }}>
              {t.tooth} · {TOOTH_CONDITIONS[t.condition]?.label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-1.5">ملاحظات الجلسة (سجل مكتوب)</label>
        <textarea rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none bg-gray-50"
          placeholder="ماذا تم في هذه الجلسة..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">إلغاء</button>
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50" style={{ background: P }}>
          {saving ? 'جاري الحفظ...' : 'حفظ الجلسة'}
        </button>
      </div>
    </>
  );
}

/* ─── Session card (chart / list view toggle) ───────────────────── */
function SessionCard({ session, P, onEdit, onDelete }) {
  const [view, setView] = useState('list'); // 'list' | 'chart' — الـ 3D يُحمَّل عند الطلب
  const hasTeeth = (session.teeth || []).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${P}12` }}>
            <Calendar size={16} style={{ color: P }} />
          </div>
          <div>
            <div className="font-bold text-sm text-gray-800">{session.title || 'جلسة'}</div>
            <div className="text-xs text-gray-400">{session.date}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasTeeth && (
            <div className="flex rounded-xl border border-gray-100 overflow-hidden ml-1">
              <button onClick={() => setView('chart')}
                className="px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-colors"
                style={view === 'chart' ? { background: P, color: '#fff' } : { color: '#9CA3AF' }}>
                <Activity size={11} /> مخطط
              </button>
              <button onClick={() => setView('list')}
                className="px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-colors"
                style={view === 'list' ? { background: P, color: '#fff' } : { color: '#9CA3AF' }}>
                <List size={11} /> قائمة
              </button>
            </div>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50"><Edit3 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="p-5">
        {hasTeeth ? (
          view === 'chart' ? (
            <DentalChart3D records={session.teeth} primary={P} maxWidth={440} height={300} />
          ) : (
            <div className="space-y-2">
              {[...session.teeth].sort((a, b) => a.tooth - b.tooth).map((t, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl bg-gray-50/70">
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-black text-white flex-shrink-0 mt-0.5"
                    style={{ background: TOOTH_CONDITIONS[t.condition]?.color }}>
                    {TOOTH_CONDITIONS[t.condition]?.label}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-gray-700">{toothName(t.tooth)}</div>
                    {t.note && <div className="text-xs text-gray-400 mt-0.5">{t.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-xs text-gray-300 font-medium text-center py-2">لا توجد أسنان محددة في هذه الجلسة</div>
        )}

        {session.notes && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="text-[11px] font-black text-gray-300 mb-1">ملاحظات الجلسة</div>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Patient file page ════════════════════════════════════════════ */
export function PatientFilePage({ slug, settings }) {
  const P = settings?.primaryColor || '#1a1a1a';
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [editPatient, setEditPatient] = useState(false);
  const [sessionModal, setSessionModal] = useState(null); // 'new' | session object
  const [saving, setSaving] = useState(false);
  const [mapView, setMapView] = useState('2d');

  const load = () => {
    clinicPatientsApi.getPatient(slug, patientId)
      .then(r => setPatient(r.data.patient))
      .catch(() => { toast.error('تعذر تحميل الملف'); navigate(`/clinic/${slug}/dashboard/patients`); });
  };
  useEffect(() => { load(); }, [slug, patientId]);

  // الخريطة السنية الحالية — آخر حالة لكل سن عبر كل الجلسات
  const mergedRecords = useMemo(() => {
    if (!patient) return [];
    const map = {};
    [...(patient.sessions || [])]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .forEach(s => (s.teeth || []).forEach(t => { map[t.tooth] = t; }));
    return Object.values(map);
  }, [patient]);

  const sessions = useMemo(() =>
    [...(patient?.sessions || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
  [patient]);

  const savePatient = async (form) => {
    if (!form.name) return toast.error('الاسم مطلوب');
    setSaving(true);
    try {
      const r = await clinicPatientsApi.updatePatient(slug, patientId, { ...form, birthYear: form.birthYear || null });
      setPatient(r.data.patient); setEditPatient(false); toast.success('تم الحفظ');
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const saveSession = async (form) => {
    setSaving(true);
    try {
      const r = sessionModal === 'new'
        ? await clinicPatientsApi.addSession(slug, patientId, form)
        : await clinicPatientsApi.updateSession(slug, patientId, sessionModal._id, form);
      setPatient(r.data.patient); setSessionModal(null);
      toast.success('تم حفظ الجلسة');
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('حذف هذه الجلسة؟')) return;
    try {
      const r = await clinicPatientsApi.deleteSession(slug, patientId, sessionId);
      setPatient(r.data.patient); toast.success('تم الحذف');
    } catch { toast.error('فشل الحذف'); }
  };

  if (!patient) return null;
  const age = patient.birthYear ? new Date().getFullYear() - patient.birthYear : null;

  return (
    <div>
      {/* Back + header */}
      <NavLink to={`/clinic/${slug}/dashboard/patients`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 mb-4">
        <ArrowRight size={13} /> كل المرضى
      </NavLink>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
            style={{ background: P }}>{patient.name?.[0] || 'م'}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-800">{patient.name}</h1>
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-1.5">
              {patient.phone && <span className="flex items-center gap-1" dir="ltr"><Phone size={12} />{patient.phone}</span>}
              {age && <span className="flex items-center gap-1"><User size={12} />{age} سنة</span>}
              {patient.address && <span className="flex items-center gap-1"><MapPin size={12} />{patient.address}</span>}
              <span className="flex items-center gap-1"><FileText size={12} />{sessions.length} جلسة</span>
            </div>
            {patient.notes && (
              <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700 font-medium inline-block">
                ⚕️ {patient.notes}
              </div>
            )}
          </div>
          <button onClick={() => setEditPatient(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">
            <Edit3 size={13} /> تعديل
          </button>
        </div>
      </div>

      {/* Current dental map (merged across sessions) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-extrabold text-gray-800">الخريطة السنية الحالية</h2><p className="mt-1 text-xs text-gray-400">
          {mergedRecords.length > 0
            ? 'آخر حالة مسجلة لكل سن عبر جميع الجلسات'
            : 'لا توجد حالات مسجلة بعد'}
          </p></div>
          <div className="flex rounded-xl border border-gray-200 p-1" role="tablist" aria-label="عرض الخريطة السنية">
            {[['2d', '2D'], ['3d', '3D']].map(([value, label]) => <button key={value} type="button" onClick={() => setMapView(value)} role="tab" aria-selected={mapView === value} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${mapView === value ? 'text-white' : 'text-gray-500'}`} style={mapView === value ? { background: P } : undefined}>{label}</button>)}
          </div>
        </div>
        {mapView === '2d' ? <DentalChart2D records={mergedRecords} primary={P} interactive3d={false} maxWidth={560} /> : <DentalChart3D records={mergedRecords} primary={P} maxWidth={560} height={380} />}
      </div>

      {/* Sessions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-gray-800">سجل الجلسات</h2>
        <button onClick={() => setSessionModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm" style={{ background: P }}>
          <Plus size={15} /> جلسة جديدة
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-14">
          <Calendar size={44} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium text-sm">لا توجد جلسات بعد</p>
          <button onClick={() => setSessionModal('new')} className="mt-3 text-sm font-bold" style={{ color: P }}>+ سجّل أول جلسة</button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <SessionCard key={s._id} session={s} P={P}
              onEdit={() => setSessionModal(s)} onDelete={() => deleteSession(s._id)} />
          ))}
        </div>
      )}

      <ClinicalRecords patient={patient} slug={slug} primary={P} onChanged={setPatient} />

      <AnimatePresence>
        {editPatient && (
          <Modal onClose={() => setEditPatient(false)}>
            <PatientForm initial={{
              name: patient.name, phone: patient.phone, gender: patient.gender,
              birthYear: patient.birthYear || '', address: patient.address, notes: patient.notes,
            }} onSave={savePatient} onClose={() => setEditPatient(false)} saving={saving} P={P} />
          </Modal>
        )}
        {sessionModal && (
          <Modal onClose={() => setSessionModal(null)} wide>
            <SessionEditor initial={sessionModal === 'new' ? null : sessionModal}
              onSave={saveSession} onClose={() => setSessionModal(null)} saving={saving} P={P} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

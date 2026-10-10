import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Stethoscope, Clock, Image,
  Settings, Globe, LogOut, Menu, X, ExternalLink,
  CheckCircle, AlertCircle, TrendingUp, Plus, Trash2,
  Edit3, Save, MessageCircle, Phone, Mail, MapPin,
  ChevronDown, Bell, Moon, Sun, ArrowLeft, Wifi, WifiOff, Search,
  QrCode, AlertTriangle, RefreshCw, Users, CloudOff, Cloud, CreditCard, UserCog, Armchair,
} from 'lucide-react';
import { useClinicAuth } from '../../context/ClinicAuthContext';
import { clinicDashApi, clinicWaApi } from '../../services/clinicApi';
import { subscribeOffline } from '../../services/offlineStore';
import { ClinicPatientsPage, PatientFilePage } from './PatientsPage';
import FinancePage from './FinancePage';
import TeamPage from './TeamPage';
import OperationsPage from './OperationsPage';
import DomainPage from './DomainPage';
import WaitingScreenAdmin from './WaitingScreenAdmin';
import InstallPWA from '../../components/InstallPWA';
import { Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

// ميزة ملف المريض + مخطط الأسنان — Premium وما فوق
const hasPatientFile = () => true;

/* ─── شريط حالة الأوفلاين والمزامنة ─────────────────────────────── */
function OfflineBanner() {
  const [st, setSt] = useState({ online: true, pending: 0, syncing: false, lastSyncCount: 0 });
  const prevSyncing = useState({ v: false })[0];

  useEffect(() => subscribeOffline((s) => {
    // إشعار عند اكتمال المزامنة
    if (prevSyncing.v && !s.syncing && s.lastSyncCount > 0) {
      toast.success(`☁️ تمت مزامنة ${s.lastSyncCount} تغيير مع السيرفر`);
    }
    prevSyncing.v = s.syncing;
    setSt(s);
  }), []);

  if (!st.online) {
    return (
      <div className="bg-slate-800 text-white px-5 py-2.5 flex items-center gap-3 text-sm">
        <CloudOff size={15} className="text-amber-400 shrink-0" />
        <span>لا يوجد اتصال بالإنترنت — <strong>تعمل الآن أوفلاين</strong>، كل التغييرات تُحفَظ محلياً وسترتفع تلقائياً عند عودة النت</span>
        {st.pending > 0 && (
          <span className="mr-auto px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-black shrink-0">
            {st.pending} بانتظار المزامنة
          </span>
        )}
      </div>
    );
  }
  if (st.syncing) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-5 py-2 flex items-center gap-2.5 text-sm text-blue-700">
        <RefreshCw size={14} className="animate-spin shrink-0" />
        جاري مزامنة التغييرات المحفوظة أوفلاين...
      </div>
    );
  }
  if (st.pending > 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2.5 text-sm text-amber-700">
        <Cloud size={14} className="shrink-0" />
        {st.pending} تغيير محفوظ محلياً بانتظار المزامنة
      </div>
    );
  }
  return null;
}

/* ─── helpers ──────────────────────────────────────────────────── */
const STATUS_MAP = {
  pending:   { label: 'معلّق',   color: '#F59E0B', bg: '#FFFBEB' },
  confirmed: { label: 'مؤكد',   color: '#3B82F6', bg: '#EFF6FF' },
  completed: { label: 'مكتمل',  color: '#10B981', bg: '#ECFDF5' },
  cancelled: { label: 'ملغى',   color: '#EF4444', bg: '#FEF2F2' },
};

/* ─── Sidebar ───────────────────────────────────────────────────── */
function Sidebar({ slug, clinic, settings, onLogout, mobile, onClose }) {
  const P = settings?.primaryColor || '#123B57';
  const navItems = [
    { to: `/clinic/${slug}/dashboard/team`,         label: 'فريق العيادة', icon: UserCog },
    { to: `/clinic/${slug}/dashboard/operations`,   label: 'تشغيل العيادة', icon: Armchair },
    { to: `/clinic/${slug}/dashboard/finance`,      label: 'المالية والتحصيل', icon: CreditCard },
    { to: `/clinic/${slug}/dashboard`,              label: 'الرئيسية',      icon: LayoutDashboard, end: true },
    { to: `/clinic/${slug}/dashboard/appointments`, label: 'المواعيد',      icon: Calendar },
    { to: `/clinic/${slug}/dashboard/waiting-screen`, label: 'شاشة الانتظار', icon: Monitor },
    ...(hasPatientFile(clinic)
      ? [{ to: `/clinic/${slug}/dashboard/patients`, label: 'ملفات المرضى', icon: Users }]
      : []),
    { to: `/clinic/${slug}/dashboard/services`,     label: 'الخدمات',       icon: Stethoscope },
    { to: `/clinic/${slug}/dashboard/hours`,        label: 'أوقات الدوام',  icon: Clock },
    { to: `/clinic/${slug}/dashboard/gallery`,      label: 'معرض الأعمال',  icon: Image },
    { to: `/clinic/${slug}/dashboard/whatsapp`,     label: 'واتساب',        icon: MessageCircle },
    { to: `/clinic/${slug}/dashboard/domain`,       label: 'ربط دومين',     icon: Globe },
    { to: `/clinic/${slug}/dashboard/settings`,     label: 'إعدادات الموقع',icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {settings?.logo
            ? <img src={settings.logo} alt="logo" className="h-11 w-11 rounded-2xl object-cover flex-shrink-0" />
            : <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: P }}><Stethoscope size={21} aria-label="رمز العيادة" /></div>
          }
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm truncate text-gray-800">
              {settings?.clinicNameAr || clinic?.clinicName}
            </div>
            <div className="text-xs text-gray-400 truncate">{clinic?.doctorName}</div>
          </div>
          {mobile && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Website link */}
      <div className="px-3 pt-4 pb-1">
        <a href={`/clinic/${slug}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors group"
          style={{ background: `${P}10`, color: P }}>
          <Globe size={13} />
          <span className="flex-1 truncate">عرض موقع العيادة</span>
          <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
        </a>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            style={({ isActive }) => isActive ? { background: P } : {}}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
            style={{ background: P }}>
            {clinic?.doctorName?.[0] || 'د'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-800 truncate">{clinic?.doctorName}</div>
            <div className="text-xs text-gray-400 truncate">Prootech Complete</div>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full min-h-11 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={15} /> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, bg, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-3xl border border-slate-200 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700">مؤشر اليوم</span>
      </div>
      <div className="text-3xl font-black text-[#12324A] mb-1">{value ?? '—'}</div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </motion.div>
  );
}

/* ─── Dashboard Home ────────────────────────────────────────────── */
function DashHome({ slug, settings, clinic }) {
  const P = settings?.primaryColor || '#123B57';
  const [stats, setStats] = useState(null);
  const [recentAppts, setRecentAppts] = useState([]);

  useEffect(() => {
    clinicDashApi.getStats(slug)
      .then(r => { setStats(r.data.stats); setRecentAppts(r.data.recentAppts || []); })
      .catch(() => {});
  }, [slug]);

  const cards = [
    { label: 'مواعيد اليوم',    value: stats?.todayAppts,    icon: Calendar,     color: P,        bg: `${P}12` },
    { label: 'مواعيد معلّقة',   value: stats?.pendingAppts,  icon: AlertCircle,  color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'إجمالي المواعيد', value: stats?.totalAppts,    icon: CheckCircle,  color: '#10B981', bg: '#ECFDF5' },
    { label: 'عدد الخدمات',     value: stats?.servicesCount, icon: Stethoscope,  color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-800">
          أهلاً، {clinic?.doctorName?.replace('د. ', '') || 'دكتور'} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">نظرة عامة على عيادتك اليوم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => <StatCard key={i} {...c} delay={i * 0.06} />)}
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-[1.25rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-gray-800">آخر المواعيد</h2>
          <NavLink to={`/clinic/${slug}/dashboard/appointments`}
            className="flex items-center gap-1 text-sm font-semibold" style={{ color: P }}>
            عرض الكل <ArrowLeft size={13} />
          </NavLink>
        </div>
        {recentAppts.length === 0 ? (
          <div className="text-center py-14 text-gray-300">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">لا توجد مواعيد بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentAppts.map(a => {
              const S = STATUS_MAP[a.status] || STATUS_MAP.pending;
              return (
                <div key={a._id} className="flex items-center justify-between px-6 py-4 hover:bg-teal-50/35 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: P }}>
                      {a.patientName?.[0] || 'م'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{a.patientName}</div>
                      <div className="text-xs text-gray-400">{a.date} · {a.time}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: S.bg, color: S.color }}>
                    {S.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Domain Card */}
      {clinic?.domain && (
        <div className="mt-6 rounded-2xl border border-blue-100 p-5 flex items-center gap-4" style={{ background: '#EFF6FF' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600" style={{ background: '#DBEAFE' }}>
            <Globe size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-blue-800 mb-0.5">الدومين الخاص بك</div>
            <a href={`https://${clinic.domain}`} target="_blank" rel="noreferrer"
              className="text-sm font-mono text-blue-600 hover:underline" dir="ltr">
              {clinic.domain}
            </a>
            {!clinic.domainConnected && (
              <div className="text-xs text-blue-400 mt-0.5">⏳ قيد الإعداد من فريق Prootech</div>
            )}
            {clinic.domainConnected && (
              <div className="text-xs text-green-600 mt-0.5">✅ الدومين مفعّل وجاهز</div>
            )}
          </div>
          {clinic.domainCpanelUrl && (
            <a href={clinic.domainCpanelUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0"
              style={{ background: P }}>
              <ExternalLink size={13} /> لوحة التحكم
            </a>
          )}
        </div>
      )}

      {/* Subscription info */}
      {clinic && (
        <div className="mt-4 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 bg-white">
          <div className="flex-1">
            <div className="text-xs font-bold text-gray-400 mb-1">الاشتراك</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-gray-700">
                Prootech Complete · {clinic.billingCycle === 'yearly' ? 'سنوي' : clinic.billingCycle === 'monthly' ? 'شهري' : '—'}
              </span>
              {clinic.subscriptionStatus === 'trial' && clinic.trialEndDate && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  تجريبي — حتى {new Date(clinic.trialEndDate).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {clinic.subscriptionStatus === 'active' && clinic.subscriptionEnd && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#ECFDF5', color: '#059669' }}>
                  نشط — حتى {new Date(clinic.subscriptionEnd).toLocaleDateString('ar', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-gray-400 mb-3">إجراءات سريعة</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'موعد جديد', to: `/clinic/${slug}/dashboard/appointments`, icon: Calendar },
            { label: 'خدمة جديدة', to: `/clinic/${slug}/dashboard/services`, icon: Stethoscope },
            { label: 'واتساب', to: `/clinic/${slug}/dashboard/whatsapp`, icon: MessageCircle },
            { label: 'إعدادات الموقع', to: `/clinic/${slug}/dashboard/settings`, icon: Settings },
          ].map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all">
              <Icon size={15} style={{ color: P }} /> {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Appointments ──────────────────────────────────────────────── */
function AppointmentsPage({ slug, settings }) {
  const P = settings?.primaryColor || '#123B57';
  const [appts, setAppts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientName: '', phone: '', service: '', date: '', time: '', chair: 'الكرسي الرئيسي', durationMinutes: 30, notes: '', status: 'confirmed' });
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);

  const load = () => {
    clinicDashApi.getAppointments(slug).then(r => setAppts(r.data.appointments || [])).catch(() => {});
    clinicDashApi.getServices(slug).then(r => setServices(r.data.services || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [slug]);

  const add = async () => {
    if (!form.patientName || !form.phone) return toast.error('الاسم والهاتف مطلوبان');
    setSaving(true);
    try { await clinicDashApi.createAppointment(slug, form); toast.success('تم إضافة الموعد'); setShowForm(false); setForm({ patientName: '', phone: '', service: '', date: '', time: '', notes: '', status: 'confirmed' }); load(); }
    catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const changeStatus = async (id, status) => {
    await clinicDashApi.updateAppointment(slug, id, { status }).catch(() => {});
    load();
  };

  const del = async (id) => {
    await clinicDashApi.deleteAppointment(slug, id).catch(() => {});
    load();
    toast.success('تم الحذف');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">المواعيد</h1>
          <p className="text-gray-400 text-sm mt-1">{appts.length} موعد إجمالاً</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md transition-all"
          style={{ background: P }}>
          <Plus size={16} /> موعد جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {appts.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">لا توجد مواعيد بعد</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: P }}>+ أضف موعداً</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['المريض', 'الخدمة', 'التاريخ', 'الوقت', 'الحالة', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-right text-xs font-bold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appts.map(a => {
                  const S = STATUS_MAP[a.status] || STATUS_MAP.pending;
                  return (
                    <tr key={a._id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: P }}>{a.patientName?.[0] || 'م'}</div>
                          <div>
                            <div className="font-bold text-gray-800">{a.patientName}</div>
                            <div className="text-xs text-gray-400" dir="ltr">{a.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{a.service || '—'}</td>
                      <td className="px-5 py-4 text-gray-500">{a.date || '—'}</td>
                      <td className="px-5 py-4 text-gray-500" dir="ltr">{a.time || '—'}</td>
                      <td className="px-5 py-4">
                        <select value={a.status} onChange={e => changeStatus(a._id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border-0 outline-none cursor-pointer"
                          style={{ background: S.bg, color: S.color }}>
                          {Object.entries(STATUS_MAP).map(([v, { label }]) => (
                            <option key={v} value={v} style={{ background: '#fff', color: '#333' }}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => del(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl border border-gray-100 p-7 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-black text-gray-800 mb-6">إضافة موعد</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <select className="col-span-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50" value={form.chair || 'الكرسي الرئيسي'} onChange={e => setForm(p => ({ ...p, chair: e.target.value }))} aria-label="الكرسي أو الغرفة">
                    {(settings?.chairs || [{ name: 'الكرسي الرئيسي', isActive: true }]).filter(chair => chair.isActive !== false).map(chair => <option key={chair.name} value={chair.name}>{chair.name}</option>)}
                  </select>
                  <select className="col-span-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50" value={form.durationMinutes || 30} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))} aria-label="مدة الموعد">
                    {[15, 30, 45, 60, 90, 120].map(value => <option key={value} value={value}>{value} دقيقة</option>)}
                  </select>
                  {[{ label: 'اسم المريض *', key: 'patientName', ph: 'محمد أحمد' }, { label: 'الهاتف *', key: 'phone', ph: '+963...', ltr: true }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">{f.label}</label>
                      <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-colors bg-gray-50"
                        placeholder={f.ph} dir={f.ltr ? 'ltr' : undefined}
                        value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                {services.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">الخدمة</label>
                    <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
                      value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}>
                      <option value="">اختر خدمة</option>
                      {services.filter(s => s.isActive !== false).map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: 'التاريخ', key: 'date', type: 'date' }, { label: 'الوقت', key: 'time', type: 'time' }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">{f.label}</label>
                      <input type={f.type} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
                        value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">ملاحظات</label>
                  <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none resize-none bg-gray-50" rows={2}
                    value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                  إلغاء
                </button>
                <button onClick={add} disabled={saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: P }}>
                  {saving ? 'جاري الحفظ...' : 'حفظ الموعد'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Services ──────────────────────────────────────────────────── */
function ServicesPage({ slug, settings }) {
  const P = settings?.primaryColor || '#123B57';
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [saving, setSaving] = useState(false);

  const load = () => clinicDashApi.getServices(slug).then(r => setServices(r.data.services || [])).catch(() => {});
  useEffect(() => { load(); }, [slug]);

  const add = async () => {
    if (!form.name) return toast.error('اسم الخدمة مطلوب');
    setSaving(true);
    try { await clinicDashApi.addService(slug, form); toast.success('تمت الإضافة'); setShowForm(false); setForm({ name: '', description: '', price: '', duration: '' }); load(); }
    catch { toast.error('فشل'); } finally { setSaving(false); }
  };
  const del = async (id) => { await clinicDashApi.deleteService(slug, id).catch(() => {}); load(); toast.success('تم الحذف'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">الخدمات</h1>
          <p className="text-gray-400 text-sm mt-1">{services.length} خدمة مضافة</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: P }}>
          <Plus size={16} /> خدمة جديدة
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Stethoscope size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium">لا توجد خدمات بعد</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: P }}>+ أضف خدمة</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(svc => (
            <div key={svc._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: `${P}12` }}>🦷</div>
                <button onClick={() => del(svc._id)}
                  className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="font-extrabold text-gray-800 mb-1">{svc.name}</div>
              {svc.description && <p className="text-sm text-gray-400 mb-3 leading-relaxed">{svc.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                {svc.price && <span className="font-black text-sm" style={{ color: P }}>{svc.price}</span>}
                {svc.duration && <span className="text-xs text-gray-400 font-medium">{svc.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-sm border border-gray-100 shadow-2xl">
              <h2 className="text-lg font-black text-gray-800 mb-5">خدمة جديدة</h2>
              <div className="space-y-3">
                {[{ label: 'اسم الخدمة *', key: 'name', ph: 'تبييض الأسنان' }, { label: 'وصف مختصر', key: 'description', ph: 'وصف الخدمة' }, { label: 'السعر', key: 'price', ph: '50$', ltr: true }, { label: 'المدة', key: 'duration', ph: '30 دقيقة' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">{f.label}</label>
                    <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-gray-50"
                      placeholder={f.ph} dir={f.ltr ? 'ltr' : undefined}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500">إلغاء</button>
                <button onClick={add} disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: P }}>
                  {saving ? '...' : 'حفظ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Working Hours ─────────────────────────────────────────────── */
function WorkingHoursPage({ slug, settings }) {
  const P = settings?.primaryColor || '#1a1a1a';
  const [hours, setHours] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clinicDashApi.getWorkingHours(slug).then(r => setHours(r.data.workingHours || [])).catch(() => {});
  }, [slug]);

  const save = async () => {
    setSaving(true);
    try { await clinicDashApi.updateWorkingHours(slug, { workingHours: hours }); toast.success('تم الحفظ'); }
    catch { toast.error('فشل'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">أوقات الدوام</h1>
          <p className="text-gray-400 text-sm mt-1">حدد مواعيد عمل عيادتك</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: P }}>
          <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {hours.map((h, i) => (
          <div key={i} className="flex items-center gap-5 px-6 py-4 border-b last:border-0 border-gray-50">
            {/* Toggle */}
            <button onClick={() => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, isOpen: !hr.isOpen } : hr))}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${h.isOpen ? '' : 'bg-gray-200'}`}
              style={{ background: h.isOpen ? P : undefined }}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${h.isOpen ? 'right-0.5' : 'left-0.5'}`} />
            </button>

            <span className={`w-20 font-bold text-sm ${h.isOpen ? 'text-gray-800' : 'text-gray-300'}`}>{h.day}</span>

            {h.isOpen ? (
              <div className="flex items-center gap-3 flex-1">
                <input type="time" value={h.openTime}
                  onChange={e => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, openTime: e.target.value } : hr))}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-gray-50 font-mono" dir="ltr" />
                <span className="text-gray-300 font-bold">—</span>
                <input type="time" value={h.closeTime}
                  onChange={e => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, closeTime: e.target.value } : hr))}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-gray-50 font-mono" dir="ltr" />
              </div>
            ) : (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400">مغلق</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Gallery ───────────────────────────────────────────────────── */
function GalleryPage({ slug, settings }) {
  const P = settings?.primaryColor || '#1a1a1a';
  const [gallery, setGallery] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', beforeImage: '', afterImage: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = () => clinicDashApi.getGallery(slug).then(r => setGallery(r.data.gallery || [])).catch(() => {});
  useEffect(() => { load(); }, [slug]);

  const add = async () => {
    setSaving(true);
    try { await clinicDashApi.addGalleryItem(slug, form); toast.success('تمت الإضافة'); setShowForm(false); load(); }
    catch { toast.error('فشل'); } finally { setSaving(false); }
  };
  const del = async (id) => { await clinicDashApi.deleteGalleryItem(slug, id).catch(() => {}); load(); toast.success('تم الحذف'); };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">معرض الأعمال</h1>
          <p className="text-gray-400 text-sm mt-1">صور قبل وبعد</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: P }}>
          <Plus size={16} /> إضافة صورة
        </button>
      </div>

      {gallery.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <Image size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium">لا توجد صور بعد</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-bold" style={{ color: P }}>+ أضف صورة</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gallery.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-lg transition-all">
              <div className="grid grid-cols-2 relative">
                <div className="aspect-square bg-gray-100">
                  {item.beforeImage
                    ? <img src={item.beforeImage} className="w-full h-full object-cover" alt="قبل" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">قبل</div>}
                </div>
                <div className="aspect-square bg-gray-100">
                  {item.afterImage
                    ? <img src={item.afterImage} className="w-full h-full object-cover" alt="بعد" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">بعد</div>}
                </div>
                <button onClick={() => del(item._id)}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <X size={13} />
                </button>
              </div>
              {item.title && <div className="px-4 py-3 font-bold text-sm text-gray-700">{item.title}</div>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-7 w-full max-w-sm border border-gray-100 shadow-2xl">
              <h2 className="text-lg font-black text-gray-800 mb-5">إضافة صورة قبل/بعد</h2>
              <div className="space-y-3">
                {[{ label: 'العنوان', key: 'title', ph: 'تبييض الأسنان' }, { label: 'رابط صورة قبل', key: 'beforeImage', ph: 'https://...', ltr: true }, { label: 'رابط صورة بعد', key: 'afterImage', ph: 'https://...', ltr: true }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5">{f.label}</label>
                    <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50"
                      placeholder={f.ph} dir={f.ltr ? 'ltr' : undefined}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500">إلغاء</button>
                <button onClick={add} disabled={saving} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white" style={{ background: P }}>
                  {saving ? '...' : 'حفظ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── WhatsApp Page ─────────────────────────────────────────────── */
function WhatsAppPage({ slug, settings, clinic }) {
  const P = settings?.primaryColor || '#1a1a1a';
  const [info, setInfo] = useState(null);
  const [qr, setQr] = useState(null);
  const [phone, setPhone] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const loadInfo = () => {
    clinicWaApi.getInfo(slug).then(r => {
      setInfo(r.data);
      setPhone(r.data.waPhone || '');
    }).catch(() => {});
  };
  useEffect(() => { loadInfo(); }, [slug]);

  const getQR = async () => {
    setLoading(true);
    setQr(null);
    try {
      const r = await clinicWaApi.getQR(slug);
      const qrData = r.data?.qr?.qr || r.data?.qr?.qrDataUrl || r.data?.qr?.base64 || r.data?.qr;
      if (typeof qrData === 'string') setQr(qrData);
      else toast.error('تعذر تحميل QR — تحقق من إعداد الـ session');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحميل QR');
    } finally { setLoading(false); }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      const r = await clinicWaApi.getStatus(slug);
      if (r.data?.connected) {
        toast.success('✅ واتساب مربوط ونشط!');
        loadInfo();
      } else {
        toast.error('واتساب غير مربوط بعد');
      }
    } catch { toast.error('فشل التحقق'); } finally { setChecking(false); }
  };

  const savePhone = async () => {
    try { await clinicWaApi.updatePhone(slug, { waPhone: phone }); toast.success('تم حفظ الرقم'); }
    catch { toast.error('فشل الحفظ'); }
  };

  const sendTest = async () => {
    if (!testPhone) return toast.error('أدخل رقم الهاتف');
    try { await clinicWaApi.sendTest(slug, { phone: testPhone }); toast.success('تم الإرسال!'); }
    catch (err) { toast.error(err.response?.data?.message || 'فشل الإرسال'); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-800">واتساب العيادة</h1>
        <p className="text-gray-400 text-sm mt-1">ربط رقم واتساب العيادة لإرسال تذكيرات المواعيد</p>
      </div>

      {/* Status */}
      <div className={`rounded-2xl border p-5 mb-6 flex items-center gap-4 ${info?.waConnected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${info?.waConnected ? 'bg-green-100' : 'bg-amber-100'}`}>
          {info?.waConnected ? <Wifi size={22} className="text-green-600" /> : <WifiOff size={22} className="text-amber-500" />}
        </div>
        <div className="flex-1">
          <div className={`font-bold ${info?.waConnected ? 'text-green-700' : 'text-amber-700'}`}>
            {info?.waConnected ? '✅ واتساب مربوط ونشط' : '⚠️ واتساب غير مربوط'}
          </div>
          {info?.waConnectedAt && (
            <div className="text-xs text-green-600 mt-0.5">
              تم الربط: {new Date(info.waConnectedAt).toLocaleDateString('ar')}
            </div>
          )}
          {!info?.waConnected && !info?.hasSession && (
            <div className="text-xs text-amber-600 mt-0.5">تواصل مع Prootech لإعداد الـ session</div>
          )}
        </div>
        <button onClick={checkStatus} disabled={checking}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: P }}>
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          تحقق
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Section */}
        {info?.hasSession && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-extrabold text-gray-800 mb-1">ربط الرقم بالـ QR</h3>
            <p className="text-gray-400 text-sm mb-5">افتح واتساب في هاتفك ← الأجهزة المرتبطة ← ربط جهاز</p>

            {qr ? (
              <div className="flex flex-col items-center gap-4">
                <img src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
                  alt="QR Code" className="w-52 h-52 rounded-xl border border-gray-100 shadow" />
                <p className="text-xs text-gray-400">امسح الكود بكاميرا واتساب ثم اضغط "تحقق من الحالة"</p>
                <button onClick={checkStatus} disabled={checking}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: P }}>
                  <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> تحقق من الحالة
                </button>
              </div>
            ) : (
              <button onClick={getQR} disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white w-full justify-center disabled:opacity-60"
                style={{ background: P }}>
                <QrCode size={16} />
                {loading ? 'جاري التحميل...' : 'احصل على QR Code'}
              </button>
            )}
          </div>
        )}

        {/* Phone + Test */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-extrabold text-gray-800 mb-4">رقم واتساب العيادة</h3>
            <div className="flex gap-3">
              <input className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50 font-mono"
                dir="ltr" placeholder="+962 7X XXX XXXX"
                value={phone} onChange={e => setPhone(e.target.value)} />
              <button onClick={savePhone} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: P }}>
                حفظ
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2">الرقم الذي سيستلم التذكيرات من العيادة</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-extrabold text-gray-800 mb-4">إرسال رسالة تجريبية</h3>
            <div className="flex gap-3">
              <input className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none bg-gray-50 font-mono"
                dir="ltr" placeholder="+962 7X XXX XXXX"
                value={testPhone} onChange={e => setTestPhone(e.target.value)} />
              <button onClick={sendTest} disabled={!info?.waConnected}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: '#25D366' }}>
                إرسال
              </button>
            </div>
            {!info?.waConnected && <p className="text-xs text-amber-500 mt-2">⚠️ اربط الواتساب أولاً</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings ──────────────────────────────────────────────────── */
function ClinicSettingsPage({ slug, settings: initSettings, onUpdate }) {
  const P = initSettings?.primaryColor || '#1a1a1a';
  const [form, setForm] = useState(initSettings || {});
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await clinicDashApi.updateSettings(slug, form); toast.success('تم حفظ الإعدادات'); onUpdate(form); }
    catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
      <h3 className="font-extrabold text-gray-800 mb-5 pb-4 border-b border-gray-50">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, fkey, ltr, textarea, hint }) => (
    <div>
      <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
      {textarea
        ? <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 resize-none bg-gray-50" rows={3}
            value={form[fkey] || ''} onChange={e => f(fkey, e.target.value)} />
        : <input className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-gray-50 transition-colors"
            dir={ltr ? 'ltr' : undefined}
            value={form[fkey] || ''} onChange={e => f(fkey, e.target.value)} />
      }
      {hint && <p className="text-xs text-gray-300 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">إعدادات الموقع</h1>
          <p className="text-gray-400 text-sm mt-1">تخصيص موقع عيادتك</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: P }}>
          <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      <Section title="الهوية والمعلومات الأساسية">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="اسم العيادة بالعربية" fkey="clinicNameAr" />
          <Field label="الشعار (Tagline)" fkey="tagline" />
          <Field label="رابط الشعار (Logo URL)" fkey="logo" ltr hint="يمكن رفع الصورة ونسخ الرابط" />
          <Field label="وصف العيادة" fkey="description" />
        </div>
      </Section>

      <Section title="صفحة الهيرو">
        <div className="space-y-4">
          <Field label="العنوان الرئيسي" fkey="heroTitle" />
          <Field label="النص التوضيحي" fkey="heroSubtitle" textarea />
          <Field label="رابط صورة الهيرو" fkey="heroImage" ltr />
        </div>
      </Section>

      <Section title="معلومات التواصل">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="رقم الهاتف" fkey="phone" ltr />
          <Field label="واتساب" fkey="whatsapp" ltr />
          <Field label="البريد الإلكتروني" fkey="email" ltr />
          <Field label="العنوان" fkey="address" />
          <Field label="إنستغرام" fkey="instagram" ltr />
          <Field label="فيسبوك" fkey="facebook" ltr />
        </div>
      </Section>

      <Section title="الألوان">
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { label: 'اللون الرئيسي', hint: 'الأزرار والعناوين', key: 'primaryColor' },
            { label: 'لون الخلفية', hint: 'خلفية الصفحة', key: 'bgColor' },
            { label: 'لون الكاردات', hint: 'بطاقات المحتوى', key: 'secondaryColor' },
            { label: 'اللون الداكن', hint: 'الهيدر والفوتر', key: 'darkColor' },
          ].map(({ label, hint, key }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-400 mb-2">{label} <span className="text-gray-300 font-normal">— {hint}</span></label>
              <div className="flex items-center gap-3">
                <input type="color" value={form[key] || '#1a1a1a'}
                  onChange={e => f(key, e.target.value)}
                  className="w-12 h-12 rounded-2xl border border-gray-200 cursor-pointer"
                  style={{ padding: '3px' }} />
                <input className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none font-mono bg-gray-50"
                  dir="ltr" value={form[key] || ''}
                  onChange={e => f(key, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
        {/* Live preview */}
        <div className="mt-5 rounded-2xl overflow-hidden border border-gray-100">
          <div className="h-10 flex items-center px-4 gap-2" style={{ background: form.darkColor || '#18181B' }}>
            <div className="w-4 h-4 rounded" style={{ background: form.primaryColor || P }} />
            <span className="text-xs text-white/60 font-medium">معاينة الهيدر</span>
          </div>
          <div className="p-4 flex gap-3" style={{ background: form.bgColor || '#F8F7F4' }}>
            <div className="flex-1 rounded-xl p-3" style={{ background: form.secondaryColor || '#fff', border: `1px solid ${form.primaryColor || P}20` }}>
              <div className="h-2 rounded mb-2 w-3/4" style={{ background: `${form.primaryColor || P}40` }} />
              <div className="h-1.5 rounded w-1/2" style={{ background: `${form.darkColor || '#18181B'}20` }} />
            </div>
            <button className="px-4 rounded-xl text-white text-xs font-bold" style={{ background: form.primaryColor || P }}>زر</button>
          </div>
        </div>
      </Section>

      <Section title="SEO">
        <div className="space-y-4">
          <Field label="عنوان الصفحة (Meta Title)" fkey="metaTitle" />
          <Field label="وصف الصفحة (Meta Description)" fkey="metaDescription" textarea />
        </div>
      </Section>
    </div>
  );
}

/* ─── Main Layout ───────────────────────────────────────────────── */
export default function ClinicDashboard() {
  const { slug } = useParams();
  const { clinic, logout, actor } = useClinicAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    clinicDashApi.getSettings(slug).then(r => setSettings(r.data.settings)).catch(() => {});
  }, [slug]);

  const handleLogout = () => { logout(); navigate(`/clinic/${slug}/login`); };
  const P = settings?.primaryColor || '#1a1a1a';

  if (!clinic) return null;

  const props = { slug, settings, clinic, actor };

  return (
    <div dir="rtl" className="flex min-h-dvh bg-[var(--color-bg)]" style={{ fontFamily: 'var(--font-arabic)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen overflow-hidden border-l border-gray-100">
        <Sidebar {...props} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="relative w-64 h-full flex flex-col border-l border-gray-100 overflow-hidden">
              <Sidebar {...props} onLogout={handleLogout} mobile onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <button aria-label="فتح القائمة" onClick={() => setSidebarOpen(true)} className="lg:hidden min-h-11 min-w-11 p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu size={20} className="text-gray-500" />
          </button>

          <div className="hidden md:flex flex-1 max-w-sm relative"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="البحث في النظام" className="w-full min-h-10 rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-xs outline-none focus:border-teal-500" placeholder="ابحث في المرضى أو المواعيد..." /></div>

          <div className="flex items-center gap-3 mr-auto">
            <InstallPWA color={P} className="hidden sm:flex" />
            {/* WhatsApp quick link */}
            {settings?.whatsapp && (
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#25D366' }}>
                <MessageCircle size={13} /> واتساب
              </a>
            )}
            <a href={`/clinic/${slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
              style={{ background: `${P}12`, color: P }}>
              <Globe size={13} /> موقعك <ExternalLink size={11} />
            </a>
          </div>
        </header>

        {/* Offline / Sync Banner */}
        <OfflineBanner />

        {/* Subscription Banner */}
        {clinic && (() => {
          const sub = clinic.subscriptionStatus;
          const now = new Date();
          const daysLeft = clinic.trialEndDate
            ? Math.ceil((new Date(clinic.trialEndDate) - now) / 86400000) : null;
          const subDaysLeft = clinic.subscriptionEnd
            ? Math.ceil((new Date(clinic.subscriptionEnd) - now) / 86400000) : null;
          const graceDaysLeft = clinic.gracePeriodEnd
            ? Math.ceil((new Date(clinic.gracePeriodEnd) - now) / 86400000) : null;

          if (sub === 'trial' && daysLeft !== null && daysLeft <= 15) {
            return (
              <div className="bg-purple-50 border-b border-purple-200 px-5 py-2.5 flex items-center gap-3 text-sm">
                <AlertTriangle size={15} className="text-purple-500 shrink-0" />
                <span className="text-purple-700">🎉 فترة تجريبية — متبقي <strong>{Math.max(0, daysLeft)} يوم</strong> — تواصل مع Prootech للاشتراك</span>
              </div>
            );
          }
          if (sub === 'grace_period') {
            return (
              <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-3 text-sm">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span className="text-amber-700">⚠️ فترة السماح — متبقي <strong>{Math.max(0, graceDaysLeft || 0)} يوم</strong> قبل إيقاف النظام — جدّد الاشتراك الآن</span>
              </div>
            );
          }
          if (sub === 'suspended') {
            return (
              <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 flex items-center gap-3 text-sm">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <span className="text-red-700">🚫 تم إيقاف الحساب — تواصل مع Prootech لإعادة التفعيل</span>
              </div>
            );
          }
          if (sub === 'active' && subDaysLeft !== null && subDaysLeft <= 7) {
            return (
              <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center gap-3 text-sm">
                <AlertTriangle size={15} className="text-blue-500 shrink-0" />
                <span className="text-blue-700">ℹ️ اشتراكك ينتهي خلال <strong>{subDaysLeft} يوم</strong> — جدّد لتجنب الانقطاع</span>
              </div>
            );
          }
          return null;
        })()}

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto app-page">
          <Routes>
            <Route index element={<DashHome {...props} />} />
            <Route path="appointments" element={<AppointmentsPage {...props} />} />
            <Route path="waiting-screen" element={<WaitingScreenAdmin {...props} />} />
            <Route path="patients" element={<ClinicPatientsPage {...props} />} />
            <Route path="patients/:patientId" element={<PatientFilePage {...props} />} />
            <Route path="finance" element={<FinancePage {...props} />} />
            <Route path="team" element={<TeamPage {...props} />} />
            <Route path="operations" element={<OperationsPage {...props} />} />
            <Route path="services" element={<ServicesPage {...props} />} />
            <Route path="hours" element={<WorkingHoursPage {...props} />} />
            <Route path="gallery" element={<GalleryPage {...props} />} />
            <Route path="whatsapp" element={<WhatsAppPage {...props} />} />
            <Route path="domain" element={<DomainPage {...props} />} />
            <Route path="settings" element={<ClinicSettingsPage {...props} onUpdate={setSettings} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

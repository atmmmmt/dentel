import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, ExternalLink, Globe, CreditCard, KeyRound, Trash2, Copy, Check, X, Loader2,
  CheckCircle2, AlertTriangle, Building2, Sparkles, MessageCircle, Printer, ChevronLeft, ChevronRight,
  Gift, Wallet, MonitorPlay, LogIn, CalendarCheck, LifeBuoy, ShieldCheck, Package, Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminClinicApi } from '../../services/clinicApi';
import ConfirmModal from '../../components/shared/ConfirmModal';
import DomainWizard from '../../components/domain/DomainWizard';

const SUB = {
  trial: ['تجريبي', 'bg-violet-50 text-violet-700 ring-violet-200'],
  active: ['مفعّل', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  grace_period: ['فترة سماح', 'bg-amber-50 text-amber-800 ring-amber-200'],
  suspended: ['موقوف', 'bg-rose-50 text-rose-700 ring-rose-200'],
  expired: ['منتهي', 'bg-slate-100 text-slate-600 ring-slate-200'],
  cancelled: ['ملغى', 'bg-slate-100 text-slate-600 ring-slate-200'],
};
const FILTERS = [['all', 'الكل'], ['trial', 'تجريبي'], ['active', 'مفعّل'], ['grace_period', 'فترة سماح'], ['suspended', 'موقوف'], ['domain', 'بانتظار الدومين']];

const AR_LATIN = { ا: 'a', أ: 'a', إ: 'e', آ: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h', خ: 'kh', د: 'd', ذ: 'th', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'a', و: 'w', ي: 'y', ى: 'a', ئ: 'e', ؤ: 'o', ء: '' };
const slugify = (t = '') => t.toLowerCase().replace(/[ً-ْ]/g, '').split('').map(c => AR_LATIN[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const daysLeft = (c) => { const end = c.subscriptionStatus === 'trial' ? c.trialEndDate : c.subscriptionEnd; return end ? Math.ceil((new Date(end) - Date.now()) / 864e5) : null; };

const EMPTY = {
  doctorName: '', clinicName: '', specialty: '', email: '', whatsapp: '', phone: '', country: 'العراق', city: '',
  slug: '', activation: 'paid', trialDays: 15, billingCycle: 'yearly', packagePrice: '',
  hasDomain: 'later', domain: '', internalNotes: '', sendWhatsApp: true,
};

/* ───────────── small UI atoms ───────────── */
const Field = ({ label, hint, children, full }) => (
  <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
    <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text)]">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
  </label>
);
const Modal = ({ children, onClose, wide }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#061626]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} onClick={e => e.stopPropagation()}
      className={`max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--color-card)] shadow-2xl sm:rounded-3xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
      {children}
    </motion.div>
  </div>
);
const ModalHead = ({ title, subtitle, onClose }) => (
  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-card)] px-6 py-5">
    <div><h2 className="text-lg font-bold text-[var(--color-text)]">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-[var(--color-muted)]">{subtitle}</p>}</div>
    <button onClick={onClose} className="grid size-9 place-items-center rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-bg)]" aria-label="إغلاق"><X size={18} /></button>
  </div>
);
const Choice = ({ active, onClick, icon: I, title, desc }) => (
  <button type="button" onClick={onClick} className={`flex w-full items-start gap-3 rounded-2xl p-4 text-right ring-1 transition ${active ? 'bg-[#E3F6F5] ring-2 ring-[#1FA6A6]' : 'bg-[var(--color-bg)] ring-[var(--color-border)] hover:ring-[#1FA6A6]/50'}`}>
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-[#1FA6A6] text-white' : 'bg-[var(--color-card)] text-[var(--color-muted)]'}`}><I size={18} /></span>
    <span><b className="block text-sm text-[#0B2A40]">{title}</b><span className="text-[13px] leading-6 text-slate-500">{desc}</span></span>
  </button>
);

/* ───────────── welcome kit ───────────── */
function KitModal({ data, onClose }) {
  const { kit, whatsappLink, whatsappSent, clinic } = data;
  const [copied, setCopied] = useState('');
  const copy = (text, key) => { navigator.clipboard?.writeText(text); setCopied(key); toast.success('تم النسخ'); setTimeout(() => setCopied(''), 1500); };
  const rows = [
    [LogIn, 'رابط الدخول للوحة التحكم', kit.links.login],
    [Globe, 'موقع العيادة', kit.links.site],
    [CalendarCheck, 'رابط الحجز للمرضى', kit.links.booking],
    [MonitorPlay, 'شاشة غرفة الانتظار', kit.links.waitingScreen],
    [Mail, 'البريد الإلكتروني', kit.credentials.email],
    ...(kit.credentials.password ? [[KeyRound, 'كلمة المرور', kit.credentials.password]] : []),
  ];
  const print = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>${clinic?.clinicName || ''}</title><style>body{font-family:'IBM Plex Sans Arabic',system-ui;padding:40px;color:#0B2A40}h1{font-size:22px}pre{white-space:pre-wrap;font:15px/1.9 inherit;background:#F5F8FA;padding:24px;border-radius:16px}</style></head><body><h1>Prootech — بطاقة تسليم العيادة</h1><pre>${kit.message.replace(/</g, '&lt;')}</pre></body></html>`);
    w.document.close(); w.print();
  };
  return (
    <Modal onClose={onClose} wide>
      <ModalHead title="العيادة جاهزة 🎉" subtitle={`${clinic?.clinicName || ''} — أرسل هذه البيانات للطبيب`} onClose={onClose} />
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2.5">
          {rows.map(([I, label, val]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] px-4 py-3 ring-1 ring-[var(--color-border)]">
              <I size={16} className="shrink-0 text-[#1FA6A6]" />
              <div className="min-w-0 flex-1"><span className="block text-xs text-[var(--color-muted)]">{label}</span><span className="block truncate font-english text-sm font-semibold text-[var(--color-text)]" dir="ltr">{val}</span></div>
              <button onClick={() => copy(val, label)} className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-card)]">{copied === label ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}</button>
            </div>
          ))}
          {!kit.credentials.password && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">كلمة المرور لا تُعرض لاحقاً لأسباب أمنية — استخدم «كلمة مرور جديدة» إن احتجت.</p>}
        </div>
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between"><b className="text-sm text-[var(--color-text)]">رسالة الترحيب الجاهزة</b><button onClick={() => copy(kit.message, 'msg')} className="flex items-center gap-1 text-xs font-semibold text-[#137F7F]">{copied === 'msg' ? <Check size={13} /> : <Copy size={13} />}نسخ الرسالة</button></div>
          <pre className="max-h-80 flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[#ECE5DD] p-4 font-arabic text-[13px] leading-7 text-slate-800">{kit.message}</pre>
          {whatsappSent && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} />أُرسلت تلقائياً عبر واتساب Prootech</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-5 sm:flex-row">
        {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white"><MessageCircle size={18} />إرسال للطبيب عبر واتساب</a>}
        <button onClick={print} className="flex h-12 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)]"><Printer size={17} />طباعة</button>
        <button onClick={onClose} className="flex h-12 items-center justify-center rounded-xl px-6 font-semibold text-[var(--color-muted)]">تم</button>
      </div>
    </Modal>
  );
}

/* ───────────── create wizard ───────────── */
function CreateWizard({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(1);
  const [slugState, setSlugState] = useState({ checking: false, available: null, reason: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { if (!slugTouched) f('slug', slugify(form.clinicName) || slugify(form.doctorName)); }, [form.clinicName, form.doctorName, slugTouched]);
  useEffect(() => {
    if (!form.slug) { setSlugState({ checking: false, available: null }); return undefined; }
    setSlugState(s => ({ ...s, checking: true }));
    const t = setTimeout(() => adminClinicApi.checkSlug(form.slug)
      .then(r => setSlugState({ checking: false, available: r.data.available, reason: r.data.reason, suggestion: r.data.suggestion }))
      .catch(() => setSlugState({ checking: false, available: null })), 450);
    return () => clearTimeout(t);
  }, [form.slug]);

  const origin = window.location.origin;
  const valid1 = form.doctorName.trim() && form.clinicName.trim() && /^\S+@\S+\.\S+$/.test(form.email) && form.whatsapp.replace(/\D/g, '').length >= 8 && slugState.available !== false;
  const next = () => {
    if (step === 1 && !valid1) { toast.error('أكمل اسم الطبيب والعيادة والبريد ورقم الواتساب، وتأكد أن الرابط متاح'); return; }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, domain: form.hasDomain === 'yes' ? form.domain : '', package: 'Unified' };
      const r = await adminClinicApi.createClinic(payload);
      if (r.data.domainError) toast.error(`تم إنشاء العيادة، لكن الدومين: ${r.data.domainError}`);
      onCreated(r.data);
    } catch (e) { toast.error(e.response?.data?.message || 'تعذّر إنشاء العيادة'); }
    finally { setSaving(false); }
  };

  const months = form.activation === 'paid' ? '13 شهراً (12 + شهر هدية)' : `${form.trialDays} يوماً تجريبياً`;

  return (
    <Modal onClose={onClose} wide>
      <ModalHead title="تجهيز عيادة جديدة" subtitle="ثلاث خطوات — ويستلم الطبيب نظاماً جاهزاً" onClose={onClose} />
      <div className="px-6 pt-5">
        <div className="flex gap-2">
          {['الطبيب والعيادة', 'الاشتراك', 'الدومين والتسليم'].map((l, i) => (
            <div key={l} className="flex-1"><div className={`h-1.5 rounded-full ${step > i ? 'bg-[#1FA6A6]' : 'bg-[var(--color-border)]'}`} /><span className={`mt-2 block text-xs font-semibold ${step === i + 1 ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}>{i + 1}. {l}</span></div>
          ))}
        </div>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الطبيب *"><input className="input-base" placeholder="د. أحمد الكبيسي" value={form.doctorName} onChange={e => f('doctorName', e.target.value)} autoFocus /></Field>
            <Field label="اسم العيادة *"><input className="input-base" placeholder="عيادة النور لطب الأسنان" value={form.clinicName} onChange={e => f('clinicName', e.target.value)} /></Field>
            <Field label="التخصص (يظهر في الموقع)"><input className="input-base" placeholder="تجميل وزراعة الأسنان" value={form.specialty} onChange={e => f('specialty', e.target.value)} /></Field>
            <Field label="البريد الإلكتروني * (اسم الدخول)"><input className="input-base" dir="ltr" placeholder="doctor@clinic.com" value={form.email} onChange={e => f('email', e.target.value.trim())} /></Field>
            <Field label="رقم الواتساب * (مع رمز الدولة)" hint="تُرسل عليه بيانات الدخول وتذكير التجديد"><input className="input-base" dir="ltr" placeholder="9647701234567" value={form.whatsapp} onChange={e => f('whatsapp', e.target.value)} /></Field>
            <Field label="هاتف العيادة"><input className="input-base" dir="ltr" placeholder="07701234567" value={form.phone} onChange={e => f('phone', e.target.value)} /></Field>
            <Field label="الدولة"><input className="input-base" value={form.country} onChange={e => f('country', e.target.value)} /></Field>
            <Field label="المدينة" hint="تُستخدم لظهور العيادة في بحث Google المحلي"><input className="input-base" placeholder="بغداد" value={form.city} onChange={e => f('city', e.target.value)} /></Field>
            <Field full label="رابط العيادة على المنصة">
              <div className="flex items-center gap-1 rounded-xl bg-[var(--color-bg)] px-3 ring-1 ring-[var(--color-border)] focus-within:ring-2 focus-within:ring-[#1FA6A6]" dir="ltr">
                <span className="hidden shrink-0 text-xs text-[var(--color-muted)] sm:block">{origin.replace(/^https?:\/\//, '')}/clinic/</span>
                <input className="h-11 min-w-0 flex-1 bg-transparent font-english text-sm font-semibold text-[var(--color-text)] outline-none" value={form.slug} onChange={e => { setSlugTouched(true); f('slug', slugify(e.target.value)); }} />
                {slugState.checking ? <Loader2 size={16} className="animate-spin text-slate-400" /> : slugState.available ? <CheckCircle2 size={16} className="text-emerald-500" /> : slugState.available === false ? <AlertTriangle size={16} className="text-rose-500" /> : null}
              </div>
              {slugState.available === false && <span className="mt-1 block text-xs text-rose-600">{slugState.reason || 'هذا الرابط مستخدم'}{slugState.suggestion && <button type="button" onClick={() => { setSlugTouched(true); f('slug', slugState.suggestion); }} className="mr-2 font-semibold underline">استخدم {slugState.suggestion}</button>}</span>}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice active={form.activation === 'paid'} onClick={() => f('activation', 'paid')} icon={Wallet} title="تفعيل مدفوع الآن" desc="استلمنا المبلغ نقداً — يبدأ الاشتراك اليوم." />
              <Choice active={form.activation === 'trial'} onClick={() => f('activation', 'trial')} icon={Gift} title="فترة تجريبية" desc="يجرّب الطبيب النظام قبل الدفع." />
            </div>
            {form.activation === 'paid' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="مدة الاشتراك">
                  <select className="input-base" value={form.billingCycle} onChange={e => f('billingCycle', e.target.value)}>
                    <option value="yearly">سنوي — 13 شهراً للاشتراك الأول</option>
                  </select>
                </Field>
                <Field label="المبلغ المستلم ($)"><input className="input-base" type="number" min="0" dir="ltr" placeholder="0" value={form.packagePrice} onChange={e => f('packagePrice', e.target.value)} /></Field>
              </div>
            ) : (
              <Field label="مدة التجربة (أيام)"><input className="input-base" type="number" min="1" max="90" dir="ltr" value={form.trialDays} onChange={e => f('trialDays', e.target.value)} /></Field>
            )}
            <div className="flex items-center gap-3 rounded-2xl bg-[#E3F6F5] px-4 py-3 text-sm text-[#0B2A40]"><CalendarCheck size={18} className="text-[#137F7F]" />المدة: <b>{months}</b> — ويصل الطبيب تذكير واتساب قبل الانتهاء بشهر.</div>
            <Field label="ملاحظات داخلية"><textarea className="input-base resize-none" rows={2} value={form.internalNotes} onChange={e => f('internalNotes', e.target.value)} /></Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Choice active={form.hasDomain === 'yes'} onClick={() => f('hasDomain', 'yes')} icon={Globe} title="لديه دومين" desc="أدخله الآن ونجهّز الربط." />
              <Choice active={form.hasDomain === 'buy'} onClick={() => f('hasDomain', 'buy')} icon={Sparkles} title="نحجز له دومين" desc="يُضاف لاحقاً بعد الحجز." />
              <Choice active={form.hasDomain === 'later'} onClick={() => f('hasDomain', 'later')} icon={LifeBuoy} title="لاحقاً" desc="يربطه الطبيب من لوحته." />
            </div>
            {form.hasDomain === 'yes' && <Field label="الدومين" hint="بدون https و www"><input className="input-base font-english" dir="ltr" placeholder="dr-ahmed.com" value={form.domain} onChange={e => f('domain', e.target.value)} /></Field>}
            <div className="rounded-2xl bg-[var(--color-bg)] p-5 ring-1 ring-[var(--color-border)]">
              <b className="mb-3 block text-sm text-[var(--color-text)]">ملخص التسليم</b>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {[['الطبيب', form.doctorName], ['العيادة', form.clinicName], ['الدخول', form.email], ['واتساب', form.whatsapp], ['الرابط', `/clinic/${form.slug}`], ['الاشتراك', months], ['الدومين', form.hasDomain === 'yes' ? form.domain || '—' : form.hasDomain === 'buy' ? 'سنحجزه' : 'لاحقاً']].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-dashed border-[var(--color-border)] py-1.5"><dt className="text-[var(--color-muted)]">{k}</dt><dd className="truncate font-semibold text-[var(--color-text)]" dir="auto">{v}</dd></div>
                ))}
              </dl>
            </div>
            <label className="flex items-center gap-3 text-sm text-[var(--color-text)]"><input type="checkbox" className="size-4 accent-[#1FA6A6]" style={{ minHeight: 0 }} checked={form.sendWhatsApp} onChange={e => f('sendWhatsApp', e.target.checked)} />أرسل بيانات الدخول للطبيب تلقائياً عبر واتساب Prootech (إن كان مربوطاً)</label>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-[var(--color-border)] p-5">
        {step > 1 && <button onClick={() => setStep(s => s - 1)} className="flex h-12 items-center gap-1 rounded-xl px-5 font-semibold text-[var(--color-muted)] ring-1 ring-[var(--color-border)]"><ChevronRight size={17} />رجوع</button>}
        {step < 3
          ? <button onClick={next} className="flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-[#0B2A40] font-bold text-white">التالي<ChevronLeft size={17} /></button>
          : <button onClick={submit} disabled={saving} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1FA6A6] font-bold text-white shadow-lg shadow-[#1FA6A6]/25 disabled:opacity-60">{saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}إنشاء العيادة وتجهيز بطاقة التسليم</button>}
      </div>
    </Modal>
  );
}

/* ───────────── page ───────────── */
export default function ClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [domainConfig, setDomainConfig] = useState({ records: [], platformDomain: '' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [kit, setKit] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [renewTarget, setRenewTarget] = useState(null);
  const [renewForm, setRenewForm] = useState({ billingCycle: 'yearly', packagePrice: '' });
  const [domainTarget, setDomainTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    adminClinicApi.getClinics({ search, limit: 200 }).then(r => { setClinics(r.data.clinics || []); if (r.data.domainConfig) setDomainConfig(r.data.domainConfig); }),
    adminClinicApi.getStats().then(r => setStats(r.data.stats)).catch(() => {}),
  ]).catch(() => toast.error('تعذّر تحميل العيادات')).finally(() => setLoading(false));

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => clinics.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'domain') return (c.domain && !c.domainConnected) || c.domainHelpRequested;
    return c.subscriptionStatus === filter;
  }), [clinics, filter]);

  const counts = useMemo(() => ({
    trial: clinics.filter(c => c.subscriptionStatus === 'trial').length,
    active: clinics.filter(c => c.subscriptionStatus === 'active').length,
    expiring: clinics.filter(c => { const d = daysLeft(c); return d !== null && d <= 30 && d >= 0; }).length,
  }), [clinics]);

  const resetPassword = async (c) => {
    try { const r = await adminClinicApi.resetPassword(c._id); setKit({ ...r.data, clinic: c }); }
    catch { toast.error('تعذّرت إعادة التعيين'); }
  };
  const openKit = async (c) => {
    try { const r = await adminClinicApi.getWelcomeKit(c._id); setKit({ ...r.data, clinic: c }); }
    catch { toast.error('تعذّر تحميل بطاقة التسليم'); }
  };
  const renew = async () => {
    setBusy(true);
    try { await adminClinicApi.renewSubscription(renewTarget._id, renewForm); toast.success('تم تجديد الاشتراك'); setRenewTarget(null); load(); }
    catch { toast.error('تعذّر التجديد'); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await adminClinicApi.deleteClinic(delTarget._id); toast.success('تم حذف العيادة'); setDelTarget(null); load(); }
    catch { toast.error('تعذّر الحذف'); } finally { setBusy(false); }
  };

  const domainApi = domainTarget && {
    save: async (domain) => (await adminClinicApi.updateClinic(domainTarget._id, { domain })).data,
    verify: async () => (await adminClinicApi.verifyDomain(domainTarget._id)).data,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">العيادات</h1>
          <p className="mt-1 text-[15px] text-[var(--color-muted)]">جهّز عيادة جديدة، سلّم بياناتها، واربط دومينها — من مكان واحد.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex h-12 items-center gap-2 rounded-xl bg-[#1FA6A6] px-5 font-bold text-white shadow-lg shadow-[#1FA6A6]/25 transition hover:-translate-y-0.5"><Plus size={18} />تجهيز عيادة جديدة</button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[[Building2, 'كل العيادات', stats?.total ?? clinics.length], [ShieldCheck, 'اشتراك مفعّل', counts.active], [Gift, 'تجريبي', counts.trial], [CalendarCheck, 'تنتهي خلال 30 يوماً', counts.expiring], [Globe, 'دومين مربوط', `${stats?.domainsLive ?? 0}/${stats?.domains ?? 0}`]].map(([I, l, v]) => (
          <div key={l} className="rounded-2xl bg-[var(--color-card)] p-4 ring-1 ring-[var(--color-border)]">
            <I size={18} className="text-[#1FA6A6]" />
            <b className="mt-2 block font-english text-2xl text-[var(--color-text)]">{v}</b>
            <span className="text-[13px] text-[var(--color-muted)]">{l}</span>
          </div>
        ))}
      </div>

      {stats?.domainHelp > 0 && (
        <button onClick={() => setFilter('domain')} className="flex w-full items-center gap-3 rounded-2xl bg-[#FFF8EC] px-5 py-4 text-right ring-1 ring-[#F3DFB8]">
          <LifeBuoy size={20} className="text-[#B8945B]" /><span className="flex-1 text-sm font-semibold text-[#5C4520]">{stats.domainHelp} طبيب طلب مساعدتنا في ربط الدومين</span><ChevronLeft size={18} className="text-[#B8945B]" />
        </button>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو البريد أو الدومين…" className="input-base pr-10" />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
          {FILTERS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition ${filter === k ? 'bg-[#0B2A40] text-white' : 'bg-[var(--color-card)] text-[var(--color-muted)] ring-1 ring-[var(--color-border)]'}`}>{l}</button>)}
        </div>
      </div>

      <div className="space-y-3">
        {loading && <div className="grid h-40 place-items-center"><Loader2 className="animate-spin text-slate-300" /></div>}
        {!loading && visible.length === 0 && (
          <div className="rounded-3xl bg-[var(--color-card)] p-12 text-center ring-1 ring-[var(--color-border)]">
            <Package size={30} className="mx-auto text-slate-300" />
            <p className="mt-3 text-[15px] text-[var(--color-muted)]">{clinics.length ? 'لا توجد عيادات بهذا الفلتر' : 'لا توجد عيادات بعد — ابدأ بتجهيز أول عيادة'}</p>
          </div>
        )}
        {visible.map(c => {
          const [subLabel, subCls] = SUB[c.subscriptionStatus] || SUB.trial;
          const d = daysLeft(c);
          const domainState = c.domainConnected ? 'ok' : c.domain ? 'wait' : c.domainHelpRequested ? 'help' : 'none';
          return (
            <motion.article key={c._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-[var(--color-card)] p-4 ring-1 ring-[var(--color-border)] sm:p-5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#0B2A40] text-lg font-bold text-white">{c.logo ? <img src={c.logo} alt="" className="size-full object-cover" /> : c.clinicName?.[0]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--color-text)]">{c.clinicName}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${subCls}`}>{subLabel}{d !== null && ` · ${d >= 0 ? `${d} يوماً` : 'منتهي'}`}</span>
                    {c.status === 'suspended' && <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">الحساب موقوف</span>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[var(--color-muted)]">{c.doctorName} · <span dir="ltr">{c.email}</span>{c.city ? ` · ${c.city}` : ''}</p>
                </div>
                <button onClick={() => setDomainTarget(c)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold ring-1 ${domainState === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : domainState === 'wait' ? 'bg-amber-50 text-amber-800 ring-amber-200' : domainState === 'help' ? 'bg-[#FFF8EC] text-[#8A6D3B] ring-[#F3DFB8]' : 'text-[var(--color-muted)] ring-[var(--color-border)]'}`}>
                  <Globe size={15} /><span className="max-w-[160px] truncate font-english" dir="ltr">{c.domain || (domainState === 'help' ? 'طلب مساعدة' : 'ربط دومين')}</span>{domainState === 'ok' && <Check size={14} />}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
                {[
                  [Sparkles, 'بطاقة التسليم', () => openKit(c)],
                  [CreditCard, 'تجديد', () => { setRenewTarget(c); setRenewForm({ billingCycle: 'yearly', packagePrice: '' }); }],
                  [KeyRound, 'كلمة مرور جديدة', () => resetPassword(c)],
                ].map(([I, l, fn]) => <button key={l} onClick={fn} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-bg)]"><I size={15} className="text-[#1FA6A6]" />{l}</button>)}
                <a href={`/clinic/${c.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-bg)]"><ExternalLink size={15} className="text-[#1FA6A6]" />الموقع</a>
                <a href={`/clinic/${c.slug}/waiting`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-bg)]"><MonitorPlay size={15} className="text-[#1FA6A6]" />شاشة الانتظار</a>
                <button onClick={() => setDelTarget(c)} className="mr-auto grid size-9 place-items-center rounded-xl text-rose-500 ring-1 ring-[var(--color-border)] hover:bg-rose-50" aria-label="حذف"><Trash2 size={15} /></button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreate && <CreateWizard onClose={() => setShowCreate(false)} onCreated={(data) => { setShowCreate(false); setKit(data); load(); }} />}
        {kit && <KitModal data={kit} onClose={() => setKit(null)} />}
        {domainTarget && (
          <Modal onClose={() => { setDomainTarget(null); load(); }} wide>
            <ModalHead title="ربط الدومين" subtitle={domainTarget.clinicName} onClose={() => { setDomainTarget(null); load(); }} />
            <div className="bg-[var(--color-bg)] p-5 sm:p-6">
              <DomainWizard audience="admin" api={domainApi} initial={{ ...domainConfig, domain: domainTarget.domain, domainConnected: domainTarget.domainConnected, domainLive: domainTarget.domainLive, domainHelpRequested: domainTarget.domainHelpRequested }} />
              {domainTarget.domain && !domainTarget.domainConnected && (
                <button onClick={async () => { await adminClinicApi.updateClinic(domainTarget._id, { domainConnected: true, domainHelpRequested: false }); toast.success('تم التأكيد يدوياً'); setDomainTarget(null); load(); }}
                  className="mx-auto mt-4 block text-[13px] font-semibold text-[var(--color-muted)] underline">تأكيد الربط يدوياً (بعد التحقق بنفسك)</button>
              )}
            </div>
          </Modal>
        )}
        {renewTarget && (
          <Modal onClose={() => setRenewTarget(null)}>
            <ModalHead title="تجديد الاشتراك" subtitle={renewTarget.clinicName} onClose={() => setRenewTarget(null)} />
            <div className="space-y-4 p-6">
              <Field label="المدة">
                <select className="input-base" value={renewForm.billingCycle} onChange={e => setRenewForm(p => ({ ...p, billingCycle: e.target.value }))}>
                  <option value="yearly">سنوي{!renewTarget.subscriptionStart ? ' — 13 شهراً (أول اشتراك)' : ' — 12 شهراً'}</option>
                </select>
              </Field>
              <Field label="المبلغ المستلم ($)"><input className="input-base" type="number" min="0" dir="ltr" value={renewForm.packagePrice} onChange={e => setRenewForm(p => ({ ...p, packagePrice: e.target.value }))} /></Field>
              <p className="text-[13px] text-[var(--color-muted)]">ينتهي الاشتراك الحالي: {fmt(renewTarget.subscriptionEnd || renewTarget.trialEndDate)}</p>
            </div>
            <div className="flex gap-2 border-t border-[var(--color-border)] p-5">
              <button onClick={() => setRenewTarget(null)} className="h-12 flex-1 rounded-xl font-semibold text-[var(--color-muted)] ring-1 ring-[var(--color-border)]">إلغاء</button>
              <button onClick={renew} disabled={busy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}تأكيد التجديد</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ConfirmModal open={!!delTarget} onConfirm={remove} onCancel={() => setDelTarget(null)} loading={busy} message={`سيتم حذف «${delTarget?.clinicName || ''}» وكل بياناتها نهائياً.`} />
    </div>
  );
}


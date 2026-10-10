import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Copy, Check, CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, ArrowLeft,
  ShieldCheck, LifeBuoy, MessageCircle, Sparkles, AlertTriangle, Link2, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Step-by-step guides per registrar. {domain} / {target} are filled at render time.
const GUIDES = {
  godaddy: {
    name: 'GoDaddy',
    panel: 'https://dcc.godaddy.com/control/portfolio',
    steps: [
      'سجّل الدخول إلى GoDaddy ثم افتح «My Products» واختر الدومين {domain}.',
      'اضغط «DNS» ثم «Manage DNS».',
      'إن وُجد سجل CNAME باسم www احذفه أو عدّله، ثم «Add New Record».',
      'النوع: CNAME — الاسم: www — القيمة: {target} — ثم Save.',
      'للدومين بدون www: من نفس الصفحة اذهب إلى «Forwarding» → «Add Forwarding» → https://www.{domain} نوع Permanent (301).',
    ],
  },
  namecheap: {
    name: 'Namecheap',
    panel: 'https://ap.www.namecheap.com/domains/list',
    steps: [
      'من «Domain List» اضغط «Manage» بجانب {domain}.',
      'افتح تبويب «Advanced DNS».',
      'احذف سجلات «CNAME www» و«URL Redirect» الافتراضية (Parking) إن وُجدت.',
      '«Add New Record» → CNAME Record — Host: www — Value: {target} — ثم ✓.',
      'أضف «URL Redirect Record» — Host: @ — Value: https://www.{domain} — Permanent (301).',
    ],
  },
  hostinger: {
    name: 'Hostinger',
    panel: 'https://hpanel.hostinger.com/domains',
    steps: [
      'من hPanel افتح «Domains» واختر {domain} ثم «DNS / Nameservers».',
      'احذف سجل CNAME الخاص بـ www إن وُجد.',
      'أضف سجل: Type CNAME — Name: www — Points to: {target} — TTL افتراضي.',
      'للدومين بدون www: من «Domains» → «Redirects» أنشئ تحويلاً إلى https://www.{domain} (Permanent).',
    ],
  },
  cloudflare: {
    name: 'Cloudflare',
    panel: 'https://dash.cloudflare.com',
    steps: [
      'افتح الموقع {domain} من لوحة Cloudflare ثم «DNS» → «Records».',
      '«Add record» → Type: CNAME — Name: www — Target: {target}.',
      'اجعل «Proxy status» رمادياً (DNS only) — مهم جداً.',
      'أضف سجلاً ثانياً: CNAME — Name: @ — Target: {target} — DNS only (Cloudflare يدعم ذلك تلقائياً).',
    ],
  },
  other: {
    name: 'شركة أخرى',
    panel: '',
    steps: [
      'ادخل لوحة شركة الدومين وابحث عن «DNS» أو «إدارة المنطقة / Zone».',
      'أضف سجل CNAME — الاسم: www — القيمة: {target}.',
      'للدومين بدون www: استخدم «Forwarding / Redirect» إلى https://www.{domain}، أو سجل ALIAS/ANAME إن كانت الشركة تدعمه.',
      'احفظ — ثم عُد هنا واضغط «افحص الربط».',
    ],
  },
};
const PROVIDER_TABS = ['godaddy', 'namecheap', 'hostinger', 'cloudflare', 'other'];

const normalize = (v = '') => v.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '').replace(/^www\./, '');
const isValid = (d) => /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d);

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(text); setDone(true); toast.success('تم النسخ'); setTimeout(() => setDone(false), 1500); }}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
      {done ? <Check size={12} /> : <Copy size={12} />}{done ? 'نُسخ' : 'نسخ'}
    </button>
  );
}

function Stepper({ step }) {
  const labels = ['الدومين', 'إضافة السجلات', 'الفحص والتفعيل'];
  return (
    <ol className="mb-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1; const done = step > n; const cur = step === n;
        return (
          <li key={l} className="flex flex-1 items-center gap-2">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${done ? 'bg-emerald-500 text-white' : cur ? 'bg-[#0B2A40] text-white ring-4 ring-[#0B2A40]/10' : 'bg-slate-100 text-slate-400'}`}>{done ? <Check size={14} /> : n}</span>
            <span className={`hidden text-xs font-bold sm:block ${cur ? 'text-[#0B2A40]' : 'text-slate-400'}`}>{l}</span>
            {i < 2 && <span className={`h-0.5 flex-1 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function CheckRow({ ok, pending, label, detail }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
      <span className="mt-0.5">{pending ? <Loader2 size={18} className="animate-spin text-slate-400" /> : ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-slate-300" />}</span>
      <div className="min-w-0 flex-1"><b className="block text-sm text-[#0B2A40]">{label}</b>{detail && <span className="block truncate text-xs text-slate-400" dir="ltr">{detail}</span>}</div>
    </div>
  );
}

/**
 * api = { save(domain) → {domain, records, platformDomain}, verify() → report, requestHelp?(note) }
 */
export default function DomainWizard({ initial, api, supportWhatsApp, audience = 'doctor', onChange }) {
  const [domain, setDomain] = useState(initial?.domain || '');
  const [input, setInput] = useState(initial?.domain || '');
  const [records, setRecords] = useState(initial?.records || []);
  const [target, setTarget] = useState(initial?.platformDomain || '');
  const [step, setStep] = useState(initial?.domain ? (initial?.domainConnected ? 3 : 2) : 1);
  const [provider, setProvider] = useState('other');
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [auto, setAuto] = useState(false);
  const [helpSent, setHelpSent] = useState(!!initial?.domainHelpRequested);
  const timer = useRef(null);

  useEffect(() => {
    setDomain(initial?.domain || ''); setInput(initial?.domain || '');
    setRecords(initial?.records || []); setTarget(initial?.platformDomain || '');
    setStep(initial?.domain ? (initial?.domainConnected ? 3 : 2) : 1);
    setHelpSent(!!initial?.domainHelpRequested);
  }, [initial?.domain, initial?.domainConnected, initial?.platformDomain]);

  // Detect the registrar as soon as we have a domain so the right guide opens by itself.
  useEffect(() => { if (domain && step >= 2 && !report) verify(true); }, [domain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto re-check every 20s while waiting for DNS (max ~10 min).
  useEffect(() => {
    if (!auto) return undefined;
    let n = 0;
    timer.current = setInterval(async () => {
      n += 1;
      const r = await verify(true);
      if (r?.connected || n >= 30) { setAuto(false); }
    }, 20000);
    return () => clearInterval(timer.current);
  }, [auto]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const d = normalize(input);
    if (!isValid(d)) { toast.error('اكتب الدومين بشكل صحيح، مثل: dr-ahmed.com'); return; }
    setSaving(true);
    try {
      const r = await api.save(d);
      setDomain(r.domain || d); setRecords(r.records || records); setTarget(r.platformDomain || target);
      setReport(null); setStep(2); onChange?.();
      toast.success('تم حفظ الدومين — بقيت خطوة واحدة');
    } catch (e) { toast.error(e.response?.data?.message || 'تعذّر حفظ الدومين'); }
    finally { setSaving(false); }
  };

  async function verify(silent = false) {
    if (!silent) setChecking(true);
    try {
      const r = await api.verify();
      setReport(r);
      if (r.provider?.id && GUIDES[r.provider.id]) setProvider(r.provider.id);
      if (r.connected) { setStep(3); setAuto(false); onChange?.(); if (!silent) toast.success('🎉 الدومين مربوط!'); }
      else if (!silent) toast(r.hint || 'لم نجد السجلات بعد', { icon: '⏳' });
      return r;
    } catch (e) { if (!silent) toast.error(e.response?.data?.message || 'تعذّر الفحص'); return null; }
    finally { if (!silent) setChecking(false); }
  }

  const askHelp = async () => {
    try { await api.requestHelp?.('يرجى ربط الدومين نيابة عني'); } catch { /* still open WhatsApp */ }
    setHelpSent(true);
    const num = String(supportWhatsApp || '').replace(/\D/g, '');
    const msg = `مرحباً Prootech 👋\nأرغب أن تربطوا دومين عيادتي نيابةً عني.\nالدومين: ${domain || input || '—'}\nشركة الدومين: ${GUIDES[provider]?.name || ''}\n(سأرسل لكم بيانات الدخول أو أضيفكم كمدير على الدومين)`;
    if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
    toast.success('تم إرسال طلبك — سيتواصل معك فريقنا');
  };

  const fill = (t) => t.replaceAll('{domain}', domain).replaceAll('{target}', target);
  const guide = GUIDES[provider];

  return (
    <div className="mx-auto max-w-3xl" dir="rtl">
      <Stepper step={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#E3F6F5] text-[#137F7F]"><Globe size={22} /></span>
              <h2 className="mt-4 text-xl font-bold text-[#0B2A40]">ما هو دومين {audience === 'doctor' ? 'عيادتك' : 'العيادة'}؟</h2>
              <p className="mt-1 text-sm leading-7 text-slate-500">اكتبه كما اشتريته — بدون https أو www. سنعطيك بعدها الخطوات بالضبط حسب شركة الدومين.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-slate-50 px-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[#1FA6A6]" dir="ltr">
                  <span className="text-sm text-slate-400">https://</span>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()}
                    placeholder="dr-ahmed.com" className="h-14 min-w-0 flex-1 bg-transparent text-lg font-bold text-[#0B2A40]" style={{ outline: 'none', minHeight: 0 }} autoFocus />
                </div>
                <button onClick={save} disabled={saving} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0B2A40] px-7 font-bold text-white transition hover:bg-[#123B57] disabled:opacity-60">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeft size={18} />}التالي
                </button>
              </div>
            </div>
            {audience === 'doctor' && <div className="flex flex-col gap-3 rounded-3xl bg-gradient-to-l from-[#0B2A40] to-[#123B57] p-6 text-white sm:flex-row sm:items-center">
              <Sparkles size={22} className="shrink-0 text-[#7FE0DA]" />
              <div className="flex-1"><b>ليس لديك دومين بعد؟</b><p className="text-sm text-white/65">نقترح لك اسماً متاحاً، نحجزه ونربطه بالكامل — بدون أي خطوة تقنية منك.</p></div>
              <button onClick={askHelp} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B2A40]"><MessageCircle size={16} />احجزوا لي دومين</button>
            </div>}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-3"><Link2 size={18} className="text-[#1FA6A6]" /><b className="font-english text-lg text-[#0B2A40]" dir="ltr">{domain}</b></div>
              <button onClick={() => { setStep(1); setReport(null); }} className="text-xs font-bold text-slate-400 underline hover:text-slate-600">تغيير</button>
            </div>

            <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-[#0B2A40]">أين اشتريت الدومين؟</h3>
                {report?.provider && report.provider.id !== 'other' && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><Search size={12} />اكتشفنا تلقائياً: {report.provider.name}</span>}
              </div>
              <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
                {PROVIDER_TABS.map(id => (
                  <button key={id} onClick={() => setProvider(id)} className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${provider === id ? 'bg-[#0B2A40] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{GUIDES[id].name}</button>
                ))}
              </div>

              <div className="mb-5 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                <div className="grid grid-cols-[70px_70px_1fr] bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-400 sm:grid-cols-[90px_90px_1fr]" dir="ltr"><span>Type</span><span>Name</span><span>Value</span></div>
                {records.map((r, i) => (
                  <div key={i} className="grid grid-cols-[70px_70px_1fr] items-center gap-y-1 border-t border-slate-100 px-4 py-3 sm:grid-cols-[90px_90px_1fr]" dir="ltr">
                    <span className="font-english text-sm font-bold text-violet-600">{r.type}</span>
                    <span className="flex items-center gap-1.5 font-english text-sm font-bold text-[#0B2A40]">{r.host}</span>
                    <span className="flex min-w-0 items-center justify-between gap-2"><code className="truncate text-xs text-slate-600">{r.value}</code><CopyBtn text={r.value} /></span>
                    <span className="col-span-3 text-right text-xs text-slate-400" dir="rtl">{r.required ? '• مطلوب — ' : '• اختياري — '}{r.note}</span>
                  </div>
                ))}
              </div>

              <ol className="space-y-3">
                {guide.steps.map((s, i) => (
                  <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#E3F6F5] text-xs font-bold text-[#137F7F]">{i + 1}</span><p className="text-sm leading-7 text-slate-600">{fill(s)}</p></li>
                ))}
              </ol>
              {guide.panel && <a href={guide.panel} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#137F7F] hover:underline">افتح لوحة {guide.name}<ExternalLink size={14} /></a>}
            </div>

            {report && !report.connected && (
              <div className="space-y-2 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <b className="text-sm text-[#0B2A40]">نتيجة آخر فحص</b>
                <CheckRow ok={report.registered} label="الدومين مسجّل ومفعّل" detail={report.nameservers?.slice(0, 2).join(', ')} />
                <CheckRow ok={report.www?.ok} label={`www.${domain} يشير إلينا`} detail={report.www?.cname?.[0] || report.www?.a?.join(', ') || 'لا يوجد سجل'} />
                <CheckRow ok={report.root?.ok} label={`${domain} (بدون www)`} detail={report.root?.cname?.[0] || report.root?.a?.join(', ') || 'لا يوجد سجل'} />
                {report.hint && <p className="flex items-start gap-2 pt-1 text-xs leading-6 text-amber-700"><AlertTriangle size={14} className="mt-1 shrink-0" />{report.hint}</p>}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => verify()} disabled={checking} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1FA6A6] font-bold text-white shadow-lg shadow-[#1FA6A6]/25 transition hover:bg-[#168B8B] disabled:opacity-60">
                {checking ? <><Loader2 size={18} className="animate-spin" />جاري الفحص…</> : <><RefreshCw size={18} />أضفت السجلات — افحص الربط</>}
              </button>
              <button onClick={() => setAuto(a => !a)} className={`flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold ring-1 transition ${auto ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-white text-slate-600 ring-slate-200'}`}>
                {auto ? <><Loader2 size={16} className="animate-spin" />فحص تلقائي كل 20 ثانية</> : 'فحص تلقائي'}
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl bg-[#FFF8EC] p-5 ring-1 ring-[#F3DFB8] sm:flex-row sm:items-center">
              <LifeBuoy size={22} className="shrink-0 text-[#B8945B]" />
              <div className="flex-1"><b className="text-[#5C4520]">{helpSent ? 'طلبك وصلنا ✓' : 'تفضّل أن نربطه نحن؟'}</b><p className="text-sm text-[#8A6D3B]">{helpSent ? 'فريق Prootech سيتواصل معك لإكمال الربط.' : 'أرسل لنا طلباً وسنربط الدومين نيابةً عنك — عادةً خلال ساعات.'}</p></div>
              {audience === 'doctor' && <button onClick={askHelp} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2A40] px-5 py-3 text-sm font-bold text-white"><MessageCircle size={16} />{helpSent ? 'راسلنا مجدداً' : 'اربطوه عني'}</button>}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-3xl bg-white text-center ring-1 ring-emerald-200">
            <div className="bg-gradient-to-b from-emerald-50 to-white px-6 pb-6 pt-10">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: .1 }} className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"><ShieldCheck size={30} /></motion.span>
              <h2 className="mt-5 text-2xl font-bold text-[#0B2A40]">الدومين مربوط بنجاح 🎉</h2>
              <p className="mt-1 text-sm text-slate-500">{report?.live || initial?.domainLive ? 'الموقع يعمل الآن مع شهادة أمان.' : 'السجلات صحيحة — قد يستغرق تفعيل شهادة الأمان بضع دقائق.'}</p>
              <a href={report?.liveUrl || `https://${domain}`} target="_blank" rel="noreferrer" className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 font-english text-lg font-bold text-[#0B2A40] ring-1 ring-slate-200 hover:ring-[#1FA6A6]" dir="ltr">
                <ShieldCheck size={18} className="text-emerald-600" />{domain}<ExternalLink size={15} className="text-slate-400" />
              </a>
            </div>
            <div className="grid gap-2 border-t border-slate-100 p-5 text-right sm:grid-cols-2">
              <CheckRow ok label="الدومين يشير إلى Prootech" detail={report?.www?.method || report?.root?.method || 'DNS'} />
              <CheckRow ok={report ? report.live : initial?.domainLive} pending={!report && !initial?.domainLive} label="الموقع يفتح للزوار" detail={report?.liveUrl || ''} />
            </div>
            <div className="flex flex-wrap justify-center gap-3 border-t border-slate-100 p-5">
              <button onClick={() => verify()} disabled={checking} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600"><RefreshCw size={14} className={checking ? 'animate-spin' : ''} />إعادة الفحص</button>
              <button onClick={() => { setStep(1); setReport(null); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600">تغيير الدومين</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { publicApi } from '../../services/api';
import {
  BrowserFrame, DashboardMock, PhoneFrame, ClinicSiteMock, WaitingScreenMock, PatientFileMock,
  WhatsAppMock, OfflineMock, DomainBarMock, ReviewChip, ClockChip,
} from './Mockups';

const {
  ArrowLeft, MessageCircle, Check, X, Globe, CalendarDays, FolderHeart, MonitorPlay, WifiOff, Smartphone,
  ShieldCheck, Sparkles, ChevronDown, Rocket, Palette, Link2, GraduationCap, Settings2, Zap, BadgeCheck, Wallet,
} = Icons;


// Seeded database copy predates this design — treat it as "not customised" so the new copy shows.
const LEGACY = new Set(['نظام جاهز للتخصيص', 'حوّل عيادتك إلى تجربة رقمية احترافية', 'نظام متكامل لعيادات الأسنان يجمع الموقع، الحجز، إدارة المرضى، الدفعات، التقارير، ومعرض الأعمال في تجربة واحدة سهلة وفخمة.', 'شاهد الديمو', 'اطلب نسخة لعيادتك', 'هل ما زلت تدير عيادتك عبر الورق والواتساب فقط؟', 'كل ما تحتاجه في نظام واحد', 'ميزات متكاملة صُممت خصيصاً لعيادات الأسنان', 'كيف نجهز نظامك؟', 'خمس خطوات بسيطة ونبدأ رحلتك الرقمية', 'جاهز تنقل عيادتك لمستوى جديد؟', 'احصل على نسخة مخصصة من نظام عيادة الأسنان الاحترافي وابدأ بتنظيم مواعيدك ومرضاك بطريقة أسهل وأفخم.', 'نجهز نسخة خاصة بعيادتك', 'موقع احترافي للعيادة']);
const copy = (value, fallback) => (!value || LEGACY.has(value) ? fallback : value);
const customList = (list) => (list?.length && !LEGACY.has(list[0]?.title) ? list : null);

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-60px' }, transition: { duration: .55, ease: [0.22, 1, 0.36, 1] } };

export function SectionHeading({ eyebrow, title, subtitle, dark = false, center = true }) {
  return (
    <motion.div {...reveal} className={`mb-12 max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <span className={`pt-eyebrow mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 ${dark ? 'bg-white/10 text-[#7FE0DA] ring-1 ring-white/15' : 'bg-[#E3F6F5] text-[#137F7F] ring-1 ring-[#BCE9E6]'}`}><i className="size-1.5 rounded-full bg-current" />{eyebrow}</span>}
      <h2 className={`pt-h2 ${dark ? 'text-white' : 'text-[#0B2A40]'}`}>{title}</h2>
      {subtitle && <p className={`pt-lead mt-4 ${dark ? 'text-white/65' : 'text-slate-500'}`}>{subtitle}</p>}
    </motion.div>
  );
}

/* ───────────────────────── HERO ───────────────────────── */
export function Hero() {
  const { landing, openWhatsApp } = useApp();
  const hero = landing?.hero;
  return (
    <section className="pt-hero relative overflow-hidden pb-20 pt-28 text-white lg:pb-28 lg:pt-36">
      <div className="pt-grid absolute inset-0 opacity-[.35]" />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[#1FA6A6]/25 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
            <span className="pt-eyebrow mb-6 inline-flex items-center gap-2 rounded-full bg-white/[.07] px-4 py-1.5 text-[#9BEDE7] ring-1 ring-white/15">
              <Sparkles size={13} />{copy(hero?.badge, 'نظام متكامل لعيادات الأسنان')}
            </span>
            <h1 className="pt-display">
              {copy(hero?.title, <>عيادتك كاملة…<br /><span className="pt-gradient-text">على شاشة واحدة.</span></>)}
            </h1>
            <p className="pt-lead mt-6 max-w-xl text-white/70">
              {copy(hero?.subtitle, 'موقع باسمك وحجز أونلاين، ملفات مرضى بمخطط أسنان ثلاثي الأبعاد، مالية، تذكير واتساب وشاشة غرفة انتظار — نظام واحد نجهّزه لعيادتك ونسلّمك إياه جاهزاً خلال 48 ساعة.')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => openWhatsApp()} className="pt-btn-primary">
                <MessageCircle size={18} />{copy(hero?.secondaryButtonText, 'احجز عرضاً مباشراً')}
              </button>
              <Link to={hero?.primaryButtonLink || '/demo'} className="pt-btn-ghost">
                {copy(hero?.primaryButtonText, 'جرّب الديمو الآن')}<ArrowLeft size={18} />
              </Link>
            </div>
            <div className="pt-small mt-8 flex flex-wrap gap-x-6 gap-y-2 text-white/65">
              {['جاهز خلال 48 ساعة', 'دومين باسم عيادتك', 'يعمل حتى بدون إنترنت'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><BadgeCheck size={16} className="text-[#5FD6CF]" />{t}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .9, delay: .15, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-[640px] lg:mr-0">
            <BrowserFrame url="app.dr-ahmed.com/dashboard"><DashboardMock /></BrowserFrame>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-10 -left-3 w-[34%] min-w-[150px] sm:-left-8">
              <PhoneFrame><ClinicSiteMock /></PhoneFrame>
            </motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: .6 }} className="absolute -top-5 right-4 hidden sm:block">
              <DomainBarMock />
            </motion.div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, delay: 1.2 }} className="absolute -right-4 bottom-16 hidden md:block">
              <ReviewChip />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── INCLUDED STRIP ───────────────────────── */
const INCLUDED = ['موقع العيادة', 'حجز أونلاين 24/7', 'ملف المريض', 'مخطط أسنان 3D', 'المالية والديون', 'تذكير واتساب', 'شاشة الانتظار', 'تقارير الأداء', 'صلاحيات الفريق', 'يعمل أوفلاين', 'تطبيق على الموبايل', 'SEO وظهور في Google'];
export function IncludedStrip() {
  const row = [...INCLUDED, ...INCLUDED];
  return (
    <div className="relative overflow-hidden border-y border-slate-200 bg-white py-5" aria-label="ما يشمله النظام">
      <div className="pt-marquee flex w-max gap-3">
        {row.map((t, i) => (
          <span key={i} className="flex shrink-0 items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[15px] font-medium text-[#0B2A40] ring-1 ring-slate-200">
            <Check size={14} className="text-[#1FA6A6]" />{t}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white" />
    </div>
  );
}

/* ───────────────────────── BEFORE / AFTER ───────────────────────── */
const BEFORE = ['دفتر مواعيد ومكالمات طوال اليوم', 'ملفات ورقية وصور أشعة ضائعة في محادثات واتساب', 'ديون المرضى في ذاكرة السكرتيرة', 'مرضى ينسون مواعيدهم ولا يحضرون', 'لا موقع ولا ظهور في Google', 'غرفة انتظار مزدحمة بلا تنظيم'];
const AFTER = ['المريض يحجز وحده من موقعك خلال دقيقة', 'ملف رقمي لكل مريض مع مخطط أسنان 3D', 'كل دفعة ودين وفاتورة مسجلة بدقة', 'تذكير واتساب تلقائي قبل كل موعد', 'موقع فخم باسمك يظهر لمن يبحث عنك', 'شاشة انتظار تنادي المريض باسمه'];
export function BeforeAfter() {
  const { landing } = useApp();
  return (
    <section className="pt-section bg-[#F5F8FA]">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="الفرق الحقيقي" title={copy(landing?.problem?.title, 'نفس العيادة… يومٌ مختلف تماماً')} subtitle="الوقت الذي يضيع في التنظيم اليدوي كان يمكن أن يُخصَّص لمريض جديد." />
        <div className="grid gap-5 md:grid-cols-2">
          <motion.div {...reveal} className="rounded-3xl bg-white p-7 ring-1 ring-slate-200">
            <div className="mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-500"><X size={20} /></span><b className="pt-h3 text-[#0B2A40]">قبل النظام</b></div>
            <ul className="space-y-3">{BEFORE.map(t => <li key={t} className="pt-body flex items-start gap-3 text-slate-600"><X size={16} className="mt-1 shrink-0 text-rose-300" />{t}</li>)}</ul>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: .12 }} className="relative overflow-hidden rounded-3xl bg-[#0B2A40] p-7 text-white">
            <div className="absolute -left-16 -top-16 size-56 rounded-full bg-[#1FA6A6]/30 blur-3xl" />
            <div className="relative mb-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#1FA6A6] text-white"><Check size={20} /></span><b className="pt-h3">مع Prootech</b></div>
            <ul className="relative space-y-3">{AFTER.map(t => <li key={t} className="pt-body flex items-start gap-3 text-white/85"><Check size={16} className="mt-1 shrink-0 text-[#5FD6CF]" />{t}</li>)}</ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRODUCT TOUR ───────────────────────── */
const TOUR = [
  { id: 'dash', icon: CalendarDays, label: 'المواعيد واللوحة', title: 'يومك كله في نظرة واحدة', text: 'مواعيد اليوم، المرضى الواصلون، التحصيل والتنبيهات — بدون تعارض حجوزات وبتنظيم تلقائي للكراسي ووقت التعقيم.', points: ['منع تداخل المواعيد تلقائياً', 'تعدد الكراسي والأطباء', 'إحصائيات فورية للإيراد'], visual: () => <BrowserFrame url="dr-ahmed.com/dashboard"><DashboardMock compact /></BrowserFrame> },
  { id: 'file', icon: FolderHeart, label: 'ملف المريض 3D', title: 'ملف طبي يليق بعيادة حديثة', text: 'اضغط على السن مباشرةً في مجسم ثلاثي الأبعاد وحدّد الحالة: حشوة، تاج، زرعة، قلع، عصب. كل جلسة محفوظة بتاريخها.', points: ['مخطط أسنان 2D و3D بترقيم FDI', 'ملاحظات طبية وحساسية بارزة', 'سجل جلسات ودفعات لكل مريض'], visual: () => <div className="mx-auto max-w-md"><PatientFileMock /></div> },
  { id: 'wait', icon: MonitorPlay, label: 'شاشة الانتظار', title: 'غرفة انتظار تشبه المستشفيات الكبرى', text: 'شاشة تلفاز تعرض قائمة الانتظار، تنادي المريض باسمه مع صوت تنبيه، وتعرض فيديوهات أعمالك وعروض العيادة.', points: ['نداء المريض التالي بضغطة', 'فيديوهات قبل/بعد وعروض', 'تعمل على أي تلفاز ذكي'], visual: () => <WaitingScreenMock /> },
  { id: 'site', icon: Globe, label: 'موقع وحجز', title: 'موقع فخم باسمك يحجز عنك', text: 'موقع احترافي بهويتك: خدمات، معرض قبل/بعد، أسئلة شائعة، وحجز أونلاين يعمل 24 ساعة — ومجهّز للظهور في Google.', points: ['دومين خاص مثل dr-ahmed.com', 'حجز بدون اتصال هاتفي', 'SEO وبيانات Google جاهزة'], visual: () => <div className="mx-auto w-[220px]"><PhoneFrame><ClinicSiteMock /></PhoneFrame></div> },
  { id: 'wa', icon: MessageCircle, label: 'واتساب', title: 'مرضى لا ينسون مواعيدهم', text: 'تذكير تلقائي قبل الموعد، تأكيد بالرد، ورسالة شكر بعد الزيارة — من رقم عيادتك أنت.', points: ['تذكير قبل الموعد تلقائياً', 'رسائل شكر وطلب تقييم', 'ربط رقم العيادة بـ QR'], visual: () => <div className="mx-auto max-w-sm"><WhatsAppMock /></div> },
  { id: 'off', icon: WifiOff, label: 'بدون إنترنت', title: 'انقطع الإنترنت؟ عيادتك لا تتوقف', text: 'يعمل النظام كتطبيق على الكمبيوتر والموبايل، ويستمر في العمل عند انقطاع الإنترنت، ثم يُزامن كل شيء تلقائياً عند عودة الاتصال.', points: ['تطبيق يُثبّت على الويندوز والموبايل', 'حفظ محلي آمن للبيانات', 'مزامنة تلقائية بلا فقدان'], visual: () => <div className="mx-auto max-w-sm"><OfflineMock /></div> },
];
export function ProductTour() {
  const [active, setActive] = useState(TOUR[0].id);
  const item = TOUR.find(t => t.id === active);
  return (
    <section className="pt-section bg-white" id="tour">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="جولة في النظام" title="ستة أنظمة… باشتراك واحد" subtitle="بدلاً من الدفع لبرنامج مواعيد، وموقع، ومصمم، ومبرمج — كل شيء مبنيّ ليعمل معاً من اليوم الأول." />
        <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" role="tablist">
          {TOUR.map(({ id, label, icon: I }) => (
            <button key={id} role="tab" aria-selected={active === id} onClick={() => setActive(id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold transition ${active === id ? 'bg-[#0B2A40] text-white shadow-lg shadow-[#0B2A40]/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <I size={16} />{label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .3 }}
            className="grid items-center gap-10 rounded-[2rem] bg-[#F5F8FA] p-6 ring-1 ring-slate-200 sm:p-10 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <h3 className="pt-h2 text-[#0B2A40]" style={{ fontSize: 'clamp(1.5rem, 1.2rem + 1vw, 2rem)' }}>{item.title}</h3>
              <p className="pt-lead mt-4 text-slate-600">{item.text}</p>
              <ul className="mt-6 space-y-3">{item.points.map(p => <li key={p} className="pt-body flex items-center gap-3 font-medium text-[#0B2A40]"><span className="grid size-6 place-items-center rounded-full bg-[#1FA6A6] text-white"><Check size={13} /></span>{p}</li>)}</ul>
              <Link to="/demo" className="mt-8 inline-flex items-center gap-2 font-semibold text-[#137F7F] transition-all hover:gap-3">شاهدها في الديمو<ArrowLeft size={17} /></Link>
            </div>
            <div className="min-w-0">{item.visual()}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ───────────────────────── FEATURE BENTO ───────────────────────── */
const FALLBACK_FEATURES = [
  ['CalendarDays', 'مواعيد ذكية', 'بدون تعارض، مع وقت تعقيم تلقائي بين المواعيد.'],
  ['FolderHeart', 'ملفات المرضى', 'تاريخ طبي، جلسات، صور وأشعة لكل مريض.'],
  ['Wallet', 'المالية والديون', 'فواتير، دفعات، أرصدة ومتابعة المتأخرات.'],
  ['MessageCircle', 'واتساب تلقائي', 'تذكير قبل الموعد ورسالة شكر بعده.'],
  ['ChartNoAxesCombined', 'تقارير الأداء', 'الإيراد، أكثر الخدمات طلباً، ومصادر الحجز.'],
  ['UsersRound', 'فريق وصلاحيات', 'سكرتيرة، أطباء، محاسب — كل واحد يرى ما يخصه.'],
  ['Images', 'معرض قبل/بعد', 'اعرض حالاتك بطريقة احترافية تبيع عنك.'],
  ['Search', 'جاهز لـ Google', 'عناوين وبيانات منظمة لظهور عيادتك بالبحث.'],
  ['Smartphone', 'تطبيق على الموبايل', 'ثبّت النظام على الموبايل والكمبيوتر بضغطة.'],
  ['ShieldCheck', 'أمان ونسخ احتياطي', 'بيانات كل عيادة منفصلة ومحمية بصلاحيات.'],
];
export function FeatureBento() {
  const { landing } = useApp();
  const items = customList(landing?.features?.items)?.filter(f => f.isActive)?.sort((a, b) => a.displayOrder - b.displayOrder);
  const list = (items?.length ? items.map(i => [i.icon, i.title, i.description]) : FALLBACK_FEATURES).slice(0, 10);
  return (
    <section className="pt-section bg-[#F5F8FA]" id="features">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="كل الأدوات" title={copy(landing?.features?.title, 'كل ما تحتاجه عيادتك — ولا شيء زائد')} subtitle={copy(landing?.features?.subtitle, 'صُمّم بالتعاون مع أطباء أسنان ليجمع عمل الطبيب والسكرتيرة والمحاسب في مكان واحد.')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map(([icon, title, desc], i) => {
            const I = Icons[icon] || Sparkles;
            // 10 cards → two wide ones fill a clean 4-column grid.
            const featured = list.length === 10 ? (i === 0 || i === 9) : i === 0;
            return (
              <motion.div key={title} {...reveal} transition={{ ...reveal.transition, delay: (i % 4) * .06 }}
                className={`group rounded-3xl p-6 ring-1 transition hover:-translate-y-1 hover:shadow-xl ${featured ? 'bg-[#0B2A40] text-white ring-[#0B2A40] lg:col-span-2' : 'bg-white ring-slate-200'}`}>
                <span className={`mb-5 grid size-12 place-items-center rounded-2xl transition group-hover:scale-110 ${featured ? 'bg-[#1FA6A6] text-white' : 'bg-[#E3F6F5] text-[#137F7F]'}`}><I size={22} /></span>
                <h3 className={`pt-h3 ${featured ? 'text-white' : 'text-[#0B2A40]'}`}>{title}</h3>
                <p className={`pt-small mt-2 ${featured ? 'text-white/65' : 'text-slate-500'}`}>{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── DOMAIN ───────────────────────── */
const NAMES = ['dr-ahmed.com', 'noor-dental.iq', 'smile-clinic.com', 'dr-sara.net'];
function TypedDomain() {
  const [idx, setIdx] = useState(0);
  const [len, setLen] = useState(0);
  const name = NAMES[idx];
  useEffect(() => {
    const done = len === name.length;
    const t = setTimeout(() => {
      if (!done) setLen(len + 1);
      else { setLen(0); setIdx((idx + 1) % NAMES.length); }
    }, done ? 2200 : 85);
    return () => clearTimeout(t);
  }, [len, idx, name]);
  return <span dir="ltr" className="font-english">{name.slice(0, len)}<span className="pt-caret">|</span></span>;
}
export function DomainSection() {
  const steps = [
    { icon: Globe, t: 'تختار اسم الدومين', d: 'اسمك أو اسم عيادتك — نحجزه لك أو تستخدم دومينك الحالي.' },
    { icon: Link2, t: 'سجلّ واحد ويتم الربط', d: 'معالج ربط باللغة العربية يتعرّف على شركة الدومين ويعرض لك الخطوات بدقة — أو نتولّى الربط عنك.' },
    { icon: ShieldCheck, t: 'يعمل مع شهادة أمان', d: 'فحص تلقائي للربط، وتفعيل SSL (القفل الأخضر) بدون أي إعداد منك.' },
  ];
  return (
    <section className="pt-section relative overflow-hidden bg-[#071A2B] text-white">
      <div className="pt-grid absolute inset-0 opacity-25" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading dark center={false} eyebrow="دومين باسمك" title="موقع عيادتك على اسمك أنت — وليس رابطاً طويلاً" subtitle="يكتب المريض اسمك في المتصفح ويحجز مباشرة. يتم الربط بخطوات واضحة باللغة العربية، أو نتكفّل به بالكامل." />
          <div className="space-y-4">
            {steps.map(({ icon: I, t, d }, i) => (
              <motion.div key={t} {...reveal} transition={{ ...reveal.transition, delay: i * .1 }} className="flex gap-4 rounded-2xl bg-white/[.04] p-4 ring-1 ring-white/10">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#1FA6A6]/20 text-[#7FE0DA]"><I size={20} /></span>
                <div><b className="pt-h4 block">{t}</b><p className="pt-small mt-1 text-white/65">{d}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div {...reveal} className="relative">
          <div className="rounded-3xl bg-white/[.05] p-5 ring-1 ring-white/10 sm:p-8">
            <div className="mb-5 flex h-14 items-center gap-2 rounded-xl bg-white px-4 font-english text-lg font-semibold text-[#0B2A40]" dir="ltr">
              <Icons.Lock size={16} className="text-emerald-600" /><span className="text-slate-400">https://</span><TypedDomain />
            </div>
            <div className="space-y-2.5 rounded-2xl bg-[#0B2A40] p-4 text-[15px]">
              {[['الدومين مسجّل ومفعّل', true], ['www يشير إلى Prootech', true], ['تحويل الدومين الأساسي', true], ['شهادة الأمان SSL', true]].map(([l], i) => (
                <motion.div key={l} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: .3 + i * .25 }} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span className="text-white/75">{l}</span><span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-400"><Check size={15} />تم</span>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.4 }} className="mt-3 rounded-lg bg-emerald-500/15 px-3 py-2.5 text-center font-semibold text-emerald-300">🎉 موقعك أونلاين الآن</motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── LAUNCH TIMELINE ───────────────────────── */
const DEFAULT_STEPS = [
  { title: 'مكالمة تعارف (15 دقيقة)', description: 'نفهم عيادتك: عدد الكراسي، الخدمات، والفريق.', icon: 'Phone' },
  { title: 'نجهّز نسختك', description: 'شعارك، ألوانك، خدماتك، أسعارك وأوقات دوامك.', icon: 'Palette' },
  { title: 'نربط الدومين والواتساب', description: 'موقعك على اسمك ورقم عيادتك للتذكير.', icon: 'Link2' },
  { title: 'تدريب الفريق', description: 'جلسة عملية للطبيب والسكرتيرة حتى الإتقان.', icon: 'GraduationCap' },
  { title: 'الانطلاق', description: 'يصلك أول حجز أونلاين — ونبقى معك بالدعم الفني.', icon: 'Rocket' },
];
export function LaunchTimeline() {
  const { landing } = useApp();
  const steps = customList(landing?.workflow?.steps) || DEFAULT_STEPS;
  return (
    <section className="pt-section bg-white">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="من الاتفاق إلى أول حجز" title={copy(landing?.workflow?.title, 'عيادتك أونلاين خلال 48 ساعة')} subtitle={copy(landing?.workflow?.subtitle, 'لا تثبيت، ولا خوادم، ولا تعقيد تقني. نحن نجهّز كل شيء، وتستلم نظاماً جاهزاً للعمل.')} />
        <div className="relative grid gap-5 md:grid-cols-5">
          <div className="absolute right-[10%] left-[10%] top-7 hidden h-0.5 bg-gradient-to-l from-[#1FA6A6] via-[#1FA6A6]/40 to-[#1FA6A6]/10 md:block" />
          {steps.map((s, i) => {
            const I = Icons[s.icon] || [Settings2, Palette, Link2, GraduationCap, Rocket][i] || Zap;
            return (
              <motion.div key={i} {...reveal} transition={{ ...reveal.transition, delay: i * .08 }} className="relative text-center">
                <span className="relative z-10 mx-auto grid size-14 place-items-center rounded-2xl bg-[#0B2A40] text-white shadow-lg ring-4 ring-white"><I size={22} /></span>
                <span className="pt-stat mt-3 block text-[13px] font-semibold text-[#1FA6A6]">0{i + 1}</span>
                <b className="pt-h4 mt-1 block text-[#0B2A40]">{s.title}</b>
                <p className="pt-small mt-1 text-slate-500">{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRICING ───────────────────────── */
const PLAN_FEATURES = ['موقع احترافي + دومين خاص', 'حجز أونلاين 24/7', 'ملفات مرضى + مخطط أسنان 3D', 'المواعيد وتعدد الكراسي', 'المالية والفواتير والديون', 'تذكير واتساب تلقائي', 'شاشة غرفة الانتظار', 'تطبيق يعمل أوفلاين', 'تقارير وصلاحيات الفريق', 'تدريب ودعم فني مستمر', 'كل التحديثات القادمة مجاناً', 'نسخ احتياطي يومي'];
export function PricingPlan() {
  const { openWhatsApp } = useApp();
  return (
    <section className="pt-section bg-[#F5F8FA]" id="pricing">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="الاشتراك" title="خطة واحدة. كل شيء مشمول." subtitle="لا باقات مربكة ولا ميزات مقفلة: سعر واحد واضح، ودفع نقدي سنوي دون الحاجة إلى بطاقة." />
        <motion.div {...reveal} className="relative overflow-hidden rounded-[2rem] bg-[#0B2A40] text-white shadow-2xl shadow-[#0B2A40]/25">
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-[#1FA6A6]/30 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1fr_1.3fr]">
            <div className="border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-l">
              <span className="pt-eyebrow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-[#B8945B] to-[#E3C48D] px-3.5 py-1.5 text-[#2A1E0E]"><Sparkles size={13} />أول اشتراك: 13 شهراً بسعر 12</span>
              <h3 className="mt-5 font-english text-3xl font-bold">Prootech Complete</h3>
              <p className="pt-body mt-3 text-white/70">يُحدَّد السعر حسب حجم العيادة (عدد الكراسي والأطباء)، ونرسله لك خلال ساعة.</p>
              <div className="pt-small mt-6 space-y-3 text-white/80">
                {[[Wallet, 'دفع نقدي — دون بطاقة أو تحويل دولي'], [CalendarDays, 'تذكير قبل انتهاء الاشتراك بشهر'], [ShieldCheck, 'بياناتك ملكك — تصدير متى شئت']].map(([I, t]) => (
                  <span key={t} className="flex items-center gap-2"><I size={16} className="text-[#7FE0DA]" />{t}</span>
                ))}
              </div>
              <button onClick={() => openWhatsApp('Prootech Complete')} className="pt-btn-primary mt-8 w-full justify-center"><MessageCircle size={18} />اطلب عرض السعر لعيادتك</button>
              <Link to="/demo" className="pt-small mt-3 block text-center font-medium text-white/65 hover:text-white">أو جرّب الديمو أولاً ←</Link>
            </div>
            <ul className="grid gap-x-6 gap-y-3.5 p-8 sm:grid-cols-2 sm:p-10">
              {PLAN_FEATURES.map(f => <li key={f} className="pt-body flex items-start gap-2.5 text-white/85"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#1FA6A6]/25 text-[#7FE0DA]"><Check size={12} /></span>{f}</li>)}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── COMPARISON ───────────────────────── */
const COMPARE = [
  ['موقع + حجز + إدارة عيادة في نظام واحد', false, 'partial', true],
  ['دومين باسم العيادة', false, false, true],
  ['مخطط أسنان ثلاثي الأبعاد', false, false, true],
  ['يعمل بدون إنترنت', true, false, true],
  ['تذكير واتساب تلقائي', false, 'partial', true],
  ['شاشة غرفة الانتظار', false, false, true],
  ['تجهيز وتدريب بالعربي', false, false, true],
];
const Cell = ({ v }) => v === true ? <Check size={18} className="mx-auto text-[#1FA6A6]" /> : v === 'partial' ? <span className="text-[13px] font-medium text-amber-600">جزئياً</span> : <X size={16} className="mx-auto text-slate-300" />;
export function Comparison() {
  return (
    <section className="pt-section bg-white">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="مقارنة صريحة" title="لماذا Prootech وليس برنامجاً عادياً؟" />
        <motion.div {...reveal} className="overflow-x-auto rounded-3xl ring-1 ring-slate-200">
          <table className="w-full min-w-[560px] text-[15px]">
            <thead><tr className="bg-slate-50 text-slate-500"><th className="p-4 text-right font-semibold">الميزة</th><th className="p-4 font-semibold">الدفتر والورق</th><th className="p-4 font-semibold">برامج عامة</th><th className="bg-[#0B2A40] p-4 font-bold text-white">Prootech</th></tr></thead>
            <tbody>{COMPARE.map(([f, a, b, c]) => <tr key={f} className="border-t border-slate-100"><td className="p-4 font-medium text-[#0B2A40]">{f}</td><td className="p-4 text-center"><Cell v={a} /></td><td className="p-4 text-center"><Cell v={b} /></td><td className="bg-[#E3F6F5]/60 p-4 text-center"><Cell v={c} /></td></tr>)}</tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIALS ───────────────────────── */
export function Testimonials() {
  const [items, setItems] = useState([]);
  useEffect(() => { publicApi.getTestimonials().then(r => setItems(r.data.testimonials || [])).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <section className="pt-section bg-[#F5F8FA]">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="أطباء يستخدمونه" title="ماذا يقول الأطباء؟" />
        <div className="grid gap-5 md:grid-cols-3">
          {items.slice(0, 6).map((t, i) => (
            <motion.figure key={t._id} {...reveal} transition={{ ...reveal.transition, delay: i * .08 }} className="flex flex-col rounded-3xl bg-white p-7 ring-1 ring-slate-200">
              <div className="mb-4 flex text-amber-400">{Array.from({ length: 5 }).map((_, s) => <Icons.Star key={s} size={15} fill={s < t.rating ? 'currentColor' : 'none'} />)}</div>
              <blockquote className="pt-body flex-1 text-slate-600">“{t.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.image ? <img src={t.image} alt="" className="size-11 rounded-full object-cover" /> : <span className="grid size-11 place-items-center rounded-full bg-[#0B2A40] font-bold text-white">{t.doctorName?.replace('د. ', '')?.[0]}</span>}
                <span><b className="block text-[#0B2A40]">{t.doctorName}</b><span className="pt-caption text-slate-500">{t.clinicName}{t.location ? ` — ${t.location}` : ''}</span></span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
const DEFAULT_FAQS = [
  { question: 'كم يستغرق تجهيز النظام لعيادتي؟', answer: 'عادةً 48 ساعة من استلام الشعار والخدمات والأسعار. نجهّز الموقع ولوحة التحكم ونربط الدومين والواتساب وندرّب الفريق.' },
  { question: 'ليس عندي دومين، هل هذا مشكلة؟', answer: 'إطلاقاً. نقترح لك أسماء متاحة ونحجز الدومين ونربطه بالكامل. وإذا عندك دومين، معالج الربط يرشدك خطوة بخطوة أو نربطه نحن عنك.' },
  { question: 'ماذا يحدث إذا انقطع الإنترنت في العيادة؟', answer: 'النظام يعمل كتطبيق مثبّت ويستمر بالعمل من الجهاز: تسجيل مواعيد، جلسات ودفعات. عند عودة الإنترنت يُزامن كل شيء تلقائياً.' },
  { question: 'كيف يتم الدفع؟', answer: 'دفع نقدي سنوي بدون بطاقات. أول اشتراك 13 شهراً بسعر 12، ونرسل لك تذكيراً على واتساب قبل انتهاء الاشتراك بشهر.' },
  { question: 'هل بيانات مرضاي آمنة؟ ومن يملكها؟', answer: 'بيانات كل عيادة منفصلة تماماً ومحمية بصلاحيات، مع نسخ احتياطي. البيانات ملكك ويمكنك طلب تصديرها في أي وقت.' },
  { question: 'هل يمكن أن يعمل أكثر من طبيب وسكرتيرة؟', answer: 'نعم، تضيف فريقك بصلاحيات مختلفة: الطبيب يرى الملفات الطبية، السكرتيرة المواعيد، والمحاسب المالية.' },
];
export function FAQ() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [open, setOpen] = useState(0);
  useEffect(() => { publicApi.getFAQs().then(r => { if (r.data.faqs?.length) setFaqs([...DEFAULT_FAQS, ...r.data.faqs.filter(f => f.isActive !== false)].slice(0, 10)); }).catch(() => {}); }, []);
  return (
    <section className="pt-section bg-white" id="faq">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="أسئلة شائعة" title="كل ما تريد معرفته قبل البدء" />
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f._id || i} className={`overflow-hidden rounded-2xl ring-1 transition ${open === i ? 'bg-[#F5F8FA] ring-[#BCE9E6]' : 'bg-white ring-slate-200'}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right">
                <span className="pt-h4 text-[#0B2A40]">{f.question}</span>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open === i ? 'rotate-180 text-[#1FA6A6]' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><p className="pt-body px-6 pb-5 text-slate-600">{f.answer}</p></motion.div>}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */
export function FinalCTA() {
  const { landing, openWhatsApp } = useApp();
  const cta = landing?.cta;
  return (
    <section className="px-5 pb-20 pt-4 sm:px-8">
      <motion.div {...reveal} className="pt-hero relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
        <div className="pt-grid absolute inset-0 opacity-30" />
        <div className="absolute -bottom-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-[#1FA6A6]/35 blur-[100px]" />
        <div className="relative">
          <div className="mx-auto mb-6 flex w-fit gap-2"><ClockChip /></div>
          <h2 className="pt-h1 mx-auto max-w-3xl">{copy(cta?.title, 'عيادتك تستحق نظاماً بمستوى عملك')}</h2>
          <p className="pt-lead mx-auto mt-5 max-w-2xl text-white/70">{copy(cta?.subtitle, 'احجز عرضاً مباشراً مدته 15 دقيقة، وشاهد كيف ستعمل عيادتك من أول حجز حتى آخر تقرير.')}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <button onClick={() => openWhatsApp()} className="pt-btn-primary"><MessageCircle size={18} />{cta?.secondaryButtonText || 'تواصل عبر واتساب'}</button>
            <Link to="/contact" className="pt-btn-ghost">{cta?.primaryButtonText || 'اطلب عرض سعر'}<ArrowLeft size={18} /></Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="pt-hero relative overflow-hidden px-5 pb-16 pt-32 text-center text-white sm:px-8 lg:pb-20 lg:pt-40">
      <div className="pt-grid absolute inset-0 opacity-30" />
      <div className="absolute -top-40 left-1/2 h-96 w-[700px] -translate-x-1/2 rounded-full bg-[#1FA6A6]/25 blur-[110px]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto max-w-3xl">
        {eyebrow && <span className="pt-eyebrow mb-5 inline-flex rounded-full bg-white/[.07] px-4 py-1.5 text-[#9BEDE7] ring-1 ring-white/15">{eyebrow}</span>}
        <h1 className="pt-h1">{title}</h1>
        {subtitle && <p className="pt-lead mx-auto mt-5 max-w-2xl text-white/70">{subtitle}</p>}
        {children}
      </motion.div>
    </section>
  );
}


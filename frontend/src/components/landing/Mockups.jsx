// Coded product mockups for the marketing pages — crisp at any size, no screenshots to maintain.
import {
  CalendarDays, Users, WalletCards, Bell, Search, CheckCircle2, Globe, Lock, Wifi, WifiOff,
  MessageCircle, Stethoscope, Clock, Volume2, Star, ChevronLeft, CloudOff, RefreshCw,
} from 'lucide-react';

export function BrowserFrame({ url = 'dr-ahmed.com', children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_40px_120px_-20px_rgba(4,20,35,.55)] ${className}`}>
      <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3" dir="ltr">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" /><span className="size-2.5 rounded-full bg-[#FEBC2E]" /><span className="size-2.5 rounded-full bg-[#28C840]" />
        <div className="mx-auto flex h-6 w-1/2 min-w-0 items-center justify-center gap-1.5 rounded-md bg-white px-3 text-[11.5px] text-slate-500 ring-1 ring-slate-200">
          <Lock size={9} className="shrink-0 text-emerald-600" /><span className="truncate">{url}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

const APPTS = [
  ['09:00', 'سارة عبد الرحمن', 'تنظيف وتلميع', 'bg-emerald-50 text-emerald-700', 'وصل'],
  ['10:30', 'محمد الشمري', 'زراعة — مرحلة 2', 'bg-amber-50 text-amber-700', 'بالانتظار'],
  ['11:15', 'ليان أحمد', 'ابتسامة هوليود', 'bg-sky-50 text-sky-700', 'مؤكد'],
  ['12:00', 'حسن كريم', 'معالجة عصب', 'bg-sky-50 text-sky-700', 'مؤكد'],
];

export function DashboardMock({ compact = false }) {
  return (
    <div className="flex bg-[#F5F8FA] text-right" dir="rtl" style={{ minHeight: compact ? 300 : 380 }}>
      <aside className="hidden w-[22%] shrink-0 flex-col gap-1 border-l border-slate-200 bg-white p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-[#0B2A40] text-white"><Stethoscope size={13} /></span>
          <b className="text-[12.5px] text-[#0B2A40]">عيادة النور</b>
        </div>
        {[['الرئيسية', 1], ['المواعيد'], ['المرضى'], ['المالية'], ['شاشة الانتظار'], ['الموقع']].map(([l, a]) => (
          <span key={l} className={`rounded-lg px-2 py-1.5 text-[11.5px] font-semibold ${a ? 'bg-[#E3F6F5] text-[#137F7F]' : 'text-slate-400'}`}>{l}</span>
        ))}
      </aside>
      <div className="min-w-0 flex-1 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11.5px] text-slate-400">صباح الخير د. أحمد 👋</p>
            <b className="text-sm text-[#0B2A40]">الثلاثاء — 14 موعداً</b>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="hidden h-7 w-28 items-center gap-1 rounded-lg bg-white px-2 text-[10.5px] text-slate-400 ring-1 ring-slate-200 md:flex"><Search size={10} />بحث عن مريض</span>
            <span className="relative grid size-7 place-items-center rounded-lg bg-white ring-1 ring-slate-200"><Bell size={12} className="text-slate-500" /><i className="absolute -top-0.5 -left-0.5 size-2 rounded-full bg-rose-500" /></span>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[[CalendarDays, 'مواعيد اليوم', '14', '+3'], [Users, 'مرضى جدد', '6', '+2'], [WalletCards, 'تحصيل اليوم', '1.2 م', '92%']].map(([I, l, v, t]) => (
            <div key={l} className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200/70">
              <div className="flex items-center justify-between"><I size={12} className="text-[#1FA6A6]" /><span className="rounded-full bg-emerald-50 px-1.5 text-[10px] font-bold text-emerald-700">{t}</span></div>
              <b className="mt-1 block text-base leading-tight text-[#0B2A40]">{v}</b>
              <span className="text-[10.5px] text-slate-400">{l}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white p-2.5 ring-1 ring-slate-200/70">
          <div className="mb-2 flex items-center justify-between"><b className="text-[12.5px] text-[#0B2A40]">جدول اليوم</b><span className="text-[10.5px] text-[#1FA6A6]">عرض الكل</span></div>
          <div className="space-y-1.5">
            {APPTS.slice(0, compact ? 3 : 4).map(([t, n, s, c, st]) => (
              <div key={n} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                <span className="w-9 shrink-0 text-[11.5px] font-bold text-[#0B2A40]" dir="ltr">{t}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-[11.5px] text-slate-700">{n}</b><span className="block truncate text-[10.5px] text-slate-400">{s}</span></span>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${c}`}>{st}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneFrame({ children, className = '' }) {
  return (
    <div className={`relative rounded-[2.2rem] border-[7px] border-[#0B1824] bg-[#0B1824] shadow-[0_30px_80px_-10px_rgba(4,20,35,.6)] ${className}`}>
      <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0B1824]" />
      <div className="overflow-hidden rounded-[1.7rem] bg-white">{children}</div>
    </div>
  );
}

export function ClinicSiteMock() {
  return (
    <div className="text-right" dir="rtl">
      <div className="relative bg-gradient-to-b from-[#F3EEE6] to-white px-4 pb-4 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <b className="text-[11.5px] tracking-wide text-[#3A2F25]">Dr. Ahmed</b>
          <span className="h-1.5 w-5 rounded-full bg-[#3A2F25]/70" />
        </div>
        <p className="text-[10px] font-bold text-[#B8945B]">عيادة تجميل وزراعة الأسنان</p>
        <b className="mt-1 block text-[15px] leading-snug text-[#221A12]">ابتسامتك تبدأ هنا</b>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">احجز موعدك خلال دقيقة واحدة بدون اتصال.</p>
        <span className="mt-3 inline-flex rounded-lg bg-[#221A12] px-3 py-1.5 text-[10px] font-bold text-white">احجز موعدك الآن</span>
      </div>
      <div className="space-y-2 px-4 pb-5">
        <b className="text-[10.5px] text-[#221A12]">اختر الوقت — الخميس</b>
        <div className="grid grid-cols-3 gap-1.5" dir="ltr">
          {['4:00', '4:30', '5:00', '5:30', '6:00', '6:30'].map((t, i) => (
            <span key={t} className={`rounded-md py-1 text-center text-[10px] font-bold ${i === 2 ? 'bg-[#1FA6A6] text-white' : 'bg-slate-100 text-slate-500'} ${i === 4 ? 'line-through opacity-40' : ''}`}>{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10px] font-bold text-emerald-700"><CheckCircle2 size={10} />تم الحجز — وصلك التأكيد على واتساب</div>
      </div>
    </div>
  );
}

export function WaitingScreenMock() {
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0B1E2E] p-4 text-right text-white" dir="rtl">
      <div className="absolute -left-10 -top-10 size-40 rounded-full bg-[#1FA6A6]/25 blur-3xl" />
      <div className="relative flex h-full gap-3">
        <div className="flex flex-1 flex-col justify-between rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
          <span className="flex items-center gap-1 text-[10.5px] text-[#7FE0DA]"><Volume2 size={10} />يرجى التوجه إلى العيادة</span>
          <div>
            <p className="text-[10.5px] text-white/50">المريض التالي</p>
            <b className="block text-2xl leading-tight">ليان أحمد</b>
            <p className="text-[10.5px] text-white/60">الكرسي 2 — د. أحمد</p>
          </div>
          <span className="w-fit rounded-full bg-[#1FA6A6] px-2 py-0.5 text-[10px] font-bold">رقم 07</span>
        </div>
        <div className="flex w-[38%] flex-col gap-1.5">
          <p className="text-[10.5px] font-bold text-white/70">قائمة الانتظار</p>
          {['حسن كريم', 'نور علي', 'زيد سالم'].map((n, i) => (
            <span key={n} className="flex items-center justify-between rounded-md bg-white/5 px-2 py-1 text-[10.5px] ring-1 ring-white/10"><b>{n}</b><span className="text-white/40">{['11:30', '11:45', '12:00'][i]}</span></span>
          ))}
          <div className="mt-auto rounded-md bg-gradient-to-l from-[#B8945B] to-[#E0C08A] px-2 py-1.5 text-[10px] font-bold text-[#2A1E0E]">عرض الشهر: تبييض بخصم 20%</div>
        </div>
      </div>
    </div>
  );
}

// Simplified occlusal arch — echoes the in-app 3D chart without loading WebGL on the landing page.
export function ToothArchMock() {
  const cond = { 3: '#F59E0B', 6: '#1FA6A6', 11: '#EF4444', 13: '#8B5CF6' };
  const teeth = Array.from({ length: 16 }, (_, i) => {
    const a = Math.PI * (0.08 + (0.84 * i) / 15);
    return { x: 150 - Math.cos(a) * 112, y: 30 + Math.sin(a) * 92, r: i < 3 || i > 12 ? 13 : i < 5 || i > 10 ? 11 : 9.5, c: cond[i] };
  });
  return (
    <svg viewBox="0 0 300 150" className="w-full" aria-hidden>
      <defs>
        <radialGradient id="tg" cx="40%" cy="35%"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#E9E3D6" /></radialGradient>
      </defs>
      <path d="M30 45 Q150 205 270 45" fill="none" stroke="#F6C9C4" strokeWidth="34" strokeLinecap="round" opacity=".55" />
      {teeth.map((t, i) => (
        <g key={i}>
          <circle cx={t.x} cy={t.y} r={t.r} fill="url(#tg)" stroke={t.c || '#D6CFC0'} strokeWidth={t.c ? 3 : 1.2} />
          {t.c && <circle cx={t.x} cy={t.y} r={t.r * 0.35} fill={t.c} opacity=".85" />}
        </g>
      ))}
    </svg>
  );
}

export function PatientFileMock() {
  return (
    <div className="rounded-xl bg-white p-3 text-right ring-1 ring-slate-200" dir="rtl">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-[#E3F6F5] text-[12.5px] font-bold text-[#137F7F]">س</span>
        <div className="min-w-0 flex-1"><b className="block text-[12.5px] text-[#0B2A40]">سارة عبد الرحمن</b><span className="text-[10.5px] text-slate-400">ملف #1042 · آخر زيارة قبل 3 أيام</span></div>
        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">حساسية بنسلين</span>
      </div>
      <div className="rounded-lg bg-[#F7F9FA] p-1"><ToothArchMock /></div>
      <div className="mt-2 flex flex-wrap gap-1">
        {[['#1FA6A6', 'حشوة'], ['#F59E0B', 'تاج'], ['#EF4444', 'قلع'], ['#8B5CF6', 'زرعة']].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1 rounded-full bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500"><i className="size-1.5 rounded-full" style={{ background: c }} />{l}</span>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppMock() {
  return (
    <div className="rounded-xl bg-[#ECE5DD] p-3 text-right" dir="rtl">
      <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#075E54] px-2 py-1.5 text-white">
        <span className="grid size-6 place-items-center rounded-full bg-white/20"><MessageCircle size={11} /></span>
        <b className="text-[11.5px]">عيادة النور</b><span className="mr-auto text-[10px] text-white/60">متصل</span>
      </div>
      <div className="space-y-1.5">
        <p className="max-w-[85%] rounded-lg rounded-tr-none bg-white px-2 py-1.5 text-[10.5px] leading-4 text-slate-700 shadow-sm">مرحباً سارة 🌿 نذكّرك بموعدك غداً الساعة <b>9:00 ص</b> مع د. أحمد. للتأكيد اكتبي 1</p>
        <p className="mr-auto w-fit rounded-lg rounded-tl-none bg-[#DCF8C6] px-2 py-1 text-[10.5px] text-slate-700 shadow-sm">1 ✅</p>
        <p className="max-w-[85%] rounded-lg rounded-tr-none bg-white px-2 py-1.5 text-[10.5px] leading-4 text-slate-700 shadow-sm">تم تأكيد موعدك. ننتظرك 🦷</p>
      </div>
    </div>
  );
}

export function OfflineMock() {
  return (
    <div className="space-y-2 rounded-xl bg-white p-3 text-right ring-1 ring-slate-200" dir="rtl">
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] font-bold text-amber-800"><WifiOff size={11} />انقطع الإنترنت — العمل مستمر من الجهاز</div>
      {['إضافة جلسة: سارة — حشوة 16', 'دفعة 150,000 — محمد', 'موعد جديد: الخميس 5:00'].map((t, i) => (
        <div key={t} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10.5px] text-slate-600">
          <CloudOff size={10} className="text-slate-400" /><span className="flex-1">{t}</span><span className="text-[10px] text-amber-600">بانتظار المزامنة</span>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[10.5px] font-bold text-emerald-700"><RefreshCw size={11} />عاد الاتصال — تمت مزامنة 3 تغييرات</div>
    </div>
  );
}

export function DomainBarMock({ domain = 'dr-ahmed.com', status = 'live' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12.5px] shadow-lg ring-1 ring-slate-200" dir="ltr">
      <Globe size={14} className="text-[#1FA6A6]" />
      <b className="text-[#0B2A40]">{domain}</b>
      {status === 'live'
        ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700"><Wifi size={9} />Live · Secure</span>
        : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">Connecting…</span>}
    </div>
  );
}

export function ReviewChip() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200" dir="rtl">
      <span className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}</span>
      <span className="text-[11.5px] font-bold text-[#0B2A40]">حجز جديد من الموقع</span>
      <ChevronLeft size={12} className="text-slate-300" />
    </div>
  );
}

export function ClockChip({ text = 'جاهز خلال 48 ساعة' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#0B2A40] px-3 py-2 text-white shadow-lg" dir="rtl">
      <Clock size={13} className="text-[#7FE0DA]" /><span className="text-[11.5px] font-bold">{text}</span>
    </div>
  );
}

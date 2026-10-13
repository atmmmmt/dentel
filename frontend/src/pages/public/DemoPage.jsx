import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowLeft, CalendarDays, Check, ChevronLeft, FileText,
  MessageCircle, ScanLine, Search, ShieldCheck, Stethoscope, TrendingUp, Users, WalletCards
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import BrandLogo from '../../components/shared/BrandLogo';
import DentalChart2D, { TOOTH_CONDITIONS, toothName } from '../../components/DentalChart';
import DentalChart3D from '../../components/DentalChart3D';

const screens = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'appointments', label: 'المواعيد', icon: CalendarDays },
  { id: 'patients', label: 'المرضى', icon: Users },
  { id: 'dental', label: 'مخطط الأسنان', icon: ScanLine },
  { id: 'finance', label: 'المالية', icon: WalletCards }
];

const appointments = [
  ['09:00', 'سارة عبد الرحمن', 'تنظيف دوري', 'مؤكد'],
  ['10:30', 'محمد الشمري', 'استشارة زراعة', 'بانتظار التأكيد'],
  ['12:15', 'ليان أحمد', 'تقويم الأسنان', 'مؤكد']
];

function Metric({ label, value, trend, tone = 'teal' }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <strong className="text-lg text-[#12324A]">{value}</strong>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${tone === 'teal' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>{trend}</span>
      </div>
    </div>
  );
}

function ProductPreview({ active }) {
  const activeLabel = screens.find((screen) => screen.id === active)?.label;
  const [dentalView, setDentalView] = useState('2d');
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [teeth, setTeeth] = useState([{ tooth: 16, condition: 'crown' }, { tooth: 21, condition: 'filling' }, { tooth: 36, condition: 'caries' }]);
  const selectedRecord = teeth.find((record) => record.tooth === selectedTooth);
  const setCondition = (condition) => setTeeth((current) => [...current.filter((record) => record.tooth !== selectedTooth), { tooth: selectedTooth, condition }]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#F8FAFB] shadow-[0_28px_70px_rgba(18,50,74,0.15)]" dir="rtl">
      <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#12324A]">
          <BrandLogo compact />
          <span className="font-english">Dentovi</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="hidden sm:block">عيادة د. أيهم درويش</span>
          <span className="size-6 rounded-full bg-[#DFF7F6]" />
        </div>
      </div>

      <div className="flex min-h-[385px]">
        <aside className="hidden w-32 shrink-0 border-l border-slate-200 bg-white p-3 md:block">
          <p className="mb-4 text-[9px] font-semibold text-slate-400">إدارة العيادة</p>
          {screens.map((screen) => {
            const Icon = screen.icon;
            const selected = screen.id === active;
            return <div key={screen.id} className={`mb-1 flex items-center gap-2 rounded-xl px-2 py-2 text-[10px] ${selected ? 'bg-[#DFF7F6] font-bold text-[#12324A]' : 'text-slate-500'}`}><Icon size={13} />{screen.label}</div>;
          })}
        </aside>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-400">داخل النظام</p>
              <h3 className="text-base font-extrabold text-[#12324A]">{activeLabel}</h3>
            </div>
            <button className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-[#12324A] px-3 text-[10px] font-bold text-white"><span className="text-base leading-none">+</span> {active === 'appointments' ? 'موعد جديد' : 'إضافة جديدة'}</button>
          </div>

          {active === 'overview' && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Metric label="مواعيد اليوم" value="18" trend="+3" />
              <Metric label="مرضى جدد" value="12" trend="+18%" />
              <Metric label="الإيرادات" value="42,500 ر.س" trend="+12%" />
              <Metric label="الحضور" value="96%" trend="ممتاز" />
            </div>
            <div className="grid gap-3 lg:grid-cols-[1.35fr_.85fr]">
              <section className="rounded-2xl border border-slate-100 bg-white p-3">
                <div className="mb-3 flex items-center justify-between"><b className="text-xs text-[#12324A]">نمو الحجوزات</b><span className="text-[9px] text-teal-700">هذا الشهر</span></div>
                <div className="flex h-24 items-end gap-2 border-b border-dashed border-slate-200 px-1 pb-2" dir="ltr">
                  {[35, 48, 42, 62, 58, 78, 88, 74].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-[#0FB5A7] to-[#A7E5E2]" style={{ height: `${height}%` }} />)}
                </div>
              </section>
              <section className="rounded-2xl bg-[#EAF8F2] p-3">
                <div className="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#12324A]"><MessageCircle size={14} className="text-[#0FB5A7]" /> متابعة ذكية</div>
                <p className="text-[10px] leading-5 text-slate-600">تم تأكيد 9 مواعيد عبر واتساب اليوم.</p>
                <button className="mt-3 text-[10px] font-bold text-teal-700">عرض المحادثات ←</button>
              </section>
            </div>
          </div>}

          {active === 'appointments' && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3"><b className="text-xs text-[#12324A]">الخميس، 24 أكتوبر</b><span className="rounded-lg bg-[#DFF7F6] px-2 py-1 text-[9px] font-bold text-teal-700">عرض اليوم</span></div>
            {appointments.map(([time, patient, treatment, status]) => <div key={time} className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 last:border-0"><strong className="w-9 text-[10px] text-[#12324A]" dir="ltr">{time}</strong><span className="size-7 rounded-full bg-[#EAF8F2]" /><div className="min-w-0 flex-1"><b className="block text-[10px] text-[#12324A]">{patient}</b><span className="text-[9px] text-slate-400">{treatment}</span></div><span className={`rounded-full px-2 py-1 text-[9px] ${status === 'مؤكد' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status}</span></div>)}
          </section>}

          {active === 'patients' && <div className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-100 p-3 text-[10px] text-slate-400"><Search size={13} /> البحث باسم المريض أو رقمه</div>
              {['سارة عبد الرحمن', 'نورا القحطاني', 'فهد العتيبي', 'ريم خالد'].map((name, index) => <div key={name} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0"><span className="grid size-7 place-items-center rounded-full bg-[#DFF7F6] text-[10px] font-bold text-teal-700">{name.slice(0, 1)}</span><div className="flex-1"><b className="block text-[10px] text-[#12324A]">{name}</b><span className="text-[9px] text-slate-400">آخر زيارة: {index + 10}/10/2026</span></div><ChevronLeft size={13} className="text-slate-300" /></div>)}
            </section>
            <section className="rounded-2xl bg-[#12324A] p-4 text-white"><FileText size={18} className="text-[#80DFDA]" /><b className="mt-5 block text-sm">ملف موحّد للمريض</b><p className="mt-2 text-[10px] leading-5 text-slate-300">سجل الزيارات والخطة العلاجية والملفات والمدفوعات في مكان واحد.</p><div className="mt-5 flex items-center gap-1 text-[9px] text-[#80DFDA]"><Check size={12} /> محفوظ وآمن</div></section>
          </div>}

          {active === 'dental' && <section className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><b className="text-xs text-[#12324A]">مخطط الأسنان التفاعلي</b><p className="mt-1 text-[10px] text-slate-400">اضغط على سن ثم اختر الحالة — تجربة حية</p></div><div className="flex rounded-lg border border-slate-200 p-0.5">{[['2d', '2D'], ['3d', '3D']].map(([value, label]) => <button key={value} onClick={() => setDentalView(value)} className={`min-h-8 rounded-md px-2.5 text-[10px] font-bold ${dentalView === value ? 'bg-[#12324A] text-white' : 'text-slate-500'}`}>{label}</button>)}</div></div>
            <div className="max-h-[250px] overflow-hidden">{dentalView === '2d' ? <DentalChart2D records={teeth} onToothClick={setSelectedTooth} selectedTooth={selectedTooth} primary="#0FB5A7" showLegend={false} interactive3d={false} maxWidth={410} /> : <DentalChart3D records={teeth} onToothClick={setSelectedTooth} selectedTooth={selectedTooth} primary="#0FB5A7" showLegend={false} maxWidth={410} height={235} />}</div>
            {selectedTooth ? <div className="mt-2 rounded-xl bg-[#EAF8F2] p-2.5"><div className="mb-2 flex items-center justify-between gap-2"><b className="text-[10px] text-[#12324A]">{toothName(selectedTooth)}</b><button onClick={() => setTeeth((current) => current.filter((record) => record.tooth !== selectedTooth))} className="text-[10px] font-bold text-red-600">إزالة الحالة</button></div><div className="flex flex-wrap gap-1.5">{Object.entries(TOOTH_CONDITIONS).map(([key, meta]) => <button key={key} onClick={() => setCondition(key)} className={`min-h-8 rounded-lg border px-2 text-[9px] font-bold ${selectedRecord?.condition === key ? 'text-white' : 'bg-white'}`} style={selectedRecord?.condition === key ? { background: meta.color, borderColor: meta.color } : { color: meta.color, borderColor: `${meta.color}55` }}>{meta.label}</button>)}</div></div> : <p className="mt-2 text-center text-[10px] text-slate-400">اختر سناً من المخطط لتجربة الحالات.</p>}
          </section>}

          {active === 'finance' && <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2"><Metric label="دخل الشهر" value="87,420 ر.س" trend="+14%" /><Metric label="مستحقات" value="8,650 ر.س" trend="متابعة" tone="amber" /><Metric label="مدفوعات اليوم" value="6,200 ر.س" trend="+8%" /></div>
            <section className="rounded-2xl border border-slate-100 bg-white p-4"><div className="mb-3 flex items-center justify-between"><b className="text-xs text-[#12324A]">تحصيل الشهر</b><TrendingUp size={15} className="text-[#0FB5A7]" /></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[78%] rounded-full bg-[#0FB5A7]" /></div><p className="mt-2 text-[10px] text-slate-500">78% من مستهدف الشهر تم تحصيله.</p></section>
          </div>}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [active, setActive] = useState('overview');
  const { openWhatsApp } = useApp();

  return (
    <main className="overflow-hidden bg-[#F8FAFB] text-[#17212B]" dir="rtl">
      <section className="pt-hero relative overflow-hidden px-4 pb-24 pt-36 sm:px-6 lg:pb-32 lg:pt-44">
        <div className="pt-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/[.07] px-4 py-2 text-xs font-bold text-[#9BEDE7] ring-1 ring-white/15"><span className="size-2 rounded-full bg-[#0FB5A7]" /> جولة حية داخل Prootech Complete</div>
          <h1 className="mx-auto max-w-3xl pt-h1 text-white">ليست صفحة عرض.<br />هذه طريقة عمل عيادتك الجديدة.</h1>
          <p className="mx-auto mt-5 pt-lead max-w-2xl text-white/70">تجربة سريعة توضح كيف تجتمع الحجوزات والمرضى وواتساب والتقارير والمالية في نظام واحد واضح لفريق العيادة.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="pt-btn-primary">اطلب عرضاً مخصصاً <ArrowLeft size={17} /></Link>
            <button onClick={() => openWhatsApp()} className="pt-btn-ghost"><MessageCircle size={17} /> تحدث معنا</button>
          </div>
        </div>
      </section>

      <section className="relative -mt-14 px-4 pb-20 sm:px-6 lg:-mt-10 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex flex-wrap justify-center gap-2" role="tablist" aria-label="شاشات النظام">
            {screens.map((screen) => { const Icon = screen.icon; const selected = active === screen.id; return <button key={screen.id} onClick={() => setActive(screen.id)} role="tab" aria-selected={selected} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${selected ? 'bg-[#12324A] text-white shadow-lg shadow-slate-900/10' : 'border border-slate-200 bg-white text-slate-600 hover:border-[#0FB5A7]'}`}><Icon size={16} />{screen.label}</button>; })}
          </div>
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}><ProductPreview active={active} /></motion.div>
          <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-6 text-slate-500">هذه معاينة توضيحية لرحلة العمل. تُضبط الواجهات والصلاحيات بما يناسب فريق عيادتك.</p>
        </div>
      </section>

      <section className="border-y border-[#D9F0ED] bg-[#EAF8F2] px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-700">الخطة الموحدة</span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-[#12324A]">كل أدوات العيادة،<br />في اشتراك واحد واضح.</h2>
            <p className="mt-4 max-w-md leading-7 text-slate-600">لا نقسم عملياتك الأساسية إلى باقات ناقصة. Prootech Complete يجمع ما يحتاجه الطبيب والاستقبال والإدارة للنمو بثقة.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['إدارة المرضى', 'ملف علاجي، صور، زيارات وخطة متابعة', Users],
              ['حجوزات وواتساب', 'تأكيدات وتذكيرات تقلل الغياب', CalendarDays],
              ['مالية وتقارير', 'فواتير، دفعات ومؤشرات مفهومة', WalletCards],
              ['أمان وصلاحيات', 'وصول منظم لكل عضو في الفريق', ShieldCheck]
            ].map(([title, text, Icon]) => <div key={title} className="rounded-2xl border border-white bg-white/80 p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#DFF7F6] text-[#147C7C]"><Icon size={20} /></span><h3 className="mt-3 font-bold text-[#12324A]">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="navy-panel mx-auto max-w-6xl rounded-[32px] px-6 py-12 text-center sm:px-12 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#A7E5E2]"><Check size={14} /> Prootech Complete</span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">هل تريد أن نعرض النظام على سير عمل عيادتك؟</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-200">نرتّب جلسة تعريفية مختصرة تشمل الحجوزات وملفات المرضى والمالية، بحسب احتياج عيادتك.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0FB5A7] px-6 text-sm font-bold text-white transition hover:bg-[#168B8B]">احجز العرض <ArrowLeft size={17} /></Link><button onClick={() => openWhatsApp('أريد حجز عرض توضيحي لنظام Prootech Complete.')} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-bold text-white transition hover:bg-white/10"><MessageCircle size={17} /> واتساب</button></div>
        </div>
      </section>
    </main>
  );
}

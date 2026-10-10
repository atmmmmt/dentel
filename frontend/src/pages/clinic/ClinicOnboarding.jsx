import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, Palette, Clock, Stethoscope, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
import { clinicDashApi } from '../../services/clinicApi';
import { useClinicAuth } from '../../context/ClinicAuthContext';
import toast from 'react-hot-toast';

const STYLES = [
  { name: 'Medical Blue',  colors: ['#2D6BEB','#FFFFFF','#F0F5FF','#1A3A7C'], desc: 'ثقة طبية بأزرق هادئ' },
  { name: 'Premium Gold',  colors: ['#C9A84C','#1C1C1C','#FDF9F0','#8B6914'], desc: 'ذهبي فاخر ومميز' },
  { name: 'Luxury Silver', colors: ['#9CA3AF','#1A1A2E','#F7F7F4','#6B7280'], desc: 'أناقة فضية راقية' },
  { name: 'Minimal White', colors: ['#374151','#FFFFFF','#F9F9F9','#D1D5DB'], desc: 'نقاء أبيض بسيط' },
  { name: 'Dark Luxury',   colors: ['#C9B89A','#18181B','#27272A','#71717A'], desc: 'داكن فاخر عصري' },
];

const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const defaultHours = DAYS.map((day,i) => ({
  day, dayEn: ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][i],
  openTime: '09:00', closeTime: '17:00', isOpen: i < 5,
}));

const STEPS = [
  { icon: Upload,      label: 'الشعار والاسم',   desc: 'هوية عيادتك' },
  { icon: Palette,     label: 'الألوان والستايل', desc: 'الشكل البصري' },
  { icon: Stethoscope, label: 'خدماتك',           desc: 'ما تقدمه' },
  { icon: Clock,       label: 'أوقات الدوام',     desc: 'جدول عملك' },
  { icon: Rocket,      label: 'انطلق!',           desc: 'عيادتك جاهزة' },
];

export default function ClinicOnboarding() {
  const { slug } = useParams();
  const { clinic } = useClinicAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(clinic?.onboardingStep || 0);
  const [saving, setSaving] = useState(false);

  // Step data
  const [logoUrl, setLogoUrl]         = useState('');
  const [clinicNameAr, setClinicNameAr] = useState(clinic?.clinicName || '');
  const [tagline, setTagline]         = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Medical Blue');
  const [primaryColor, setPrimaryColor]   = useState('#2D6BEB');
  const [bgColor, setBgColor]             = useState('#F7F7F4');
  const [darkColor, setDarkColor]         = useState('#18181B');
  const [cardColor, setCardColor]         = useState('#FFFFFF');
  const [services, setServices]       = useState([{ name: '', description: '', price: '' }]);
  const [hours, setHours]             = useState(defaultHours);

  const primary = primaryColor;

  const next = async (data = {}) => {
    setSaving(true);
    try {
      const res = await clinicDashApi.completeOnboardingStep(slug, { step, data });
      if (res.data.completed) {
        toast.success('🎉 عيادتك جاهزة!');
        // Full reload so clinic context re-fetches onboardingCompleted = true
        window.location.href = `/clinic/${slug}/dashboard`;
      } else {
        setStep(res.data.nextStep);
      }
    } catch { toast.error('حدث خطأ، حاول مرة أخرى'); }
    finally { setSaving(false); }
  };

  const handleStep0 = () => next({ clinicNameAr, tagline, logo: logoUrl });
  const handleStep1 = () => {
    next({ selectedStyle, primaryColor, secondaryColor: cardColor, accentColor: darkColor, darkColor, bgColor: bgColor });
  };
  const handleStep2 = () => {
    const validServices = services.filter(s => s.name.trim());
    next({ services: validServices });
  };
  const handleStep3 = () => next({ workingHours: hours });
  const handleStep4 = () => next({});

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F4', fontFamily: 'var(--font-arabic)' }} dir="rtl">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: primary }}>
            {clinicNameAr?.[0] || 'د'}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#20242A' }}>{clinicNameAr || 'إعداد عيادتك'}</div>
            <div className="text-xs" style={{ color: '#6F7378' }}>مرحباً {clinic?.doctorName}</div>
          </div>
        </div>
        <div className="text-sm font-medium" style={{ color: '#6F7378' }}>الخطوة {step + 1} من {STEPS.length}</div>
      </div>

      {/* Progress */}
      <div className="h-1.5" style={{ background: '#E4E6E2' }}>
        <motion.div className="h-full rounded-full transition-all"
          style={{ background: primary, width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {/* Steps nav */}
      <div className="flex items-center justify-center gap-2 py-6 px-4 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step; const active = i === step;
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'text-white' : done ? 'text-white' : ''}`}
                style={{
                  background: active ? primary : done ? `${primary}CC` : '#E4E6E2',
                  color: active || done ? '#fff' : '#6F7378',
                }}>
                {done ? <Check size={13} /> : <Icon size={13} />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ background: '#E4E6E2' }} />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* Step 0: Logo & Name */}
            {step === 0 && (
              <div className="rounded-2xl border p-8 space-y-5" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                <div>
                  <h2 className="text-xl font-black mb-1" style={{ color: '#20242A' }}>هوية عيادتك</h2>
                  <p className="text-sm" style={{ color: '#6F7378' }}>الاسم والشعار الذي يراه مرضاك</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#20242A' }}>اسم العيادة بالعربية *</label>
                  <input className="w-full px-4 py-3 rounded-xl border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}
                    value={clinicNameAr} onChange={e => setClinicNameAr(e.target.value)} placeholder="عيادة د. محمد للأسنان" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#20242A' }}>شعار العيادة (Tagline)</label>
                  <input className="w-full px-4 py-3 rounded-xl border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}
                    value={tagline} onChange={e => setTagline(e.target.value)} placeholder="ابتسامتك صحتنا" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#20242A' }}>رابط الشعار (Logo URL)</label>
                  <input className="w-full px-4 py-3 rounded-xl border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}
                    dir="ltr" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
                  <p className="text-xs mt-1" style={{ color: '#6F7378' }}>يمكنك تغييره لاحقاً من لوحة التحكم</p>
                </div>
                <button onClick={handleStep0} disabled={!clinicNameAr || saving}
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
                  style={{ background: primary }}>
                  {saving ? 'جاري الحفظ...' : 'التالي →'}
                </button>
              </div>
            )}

            {/* Step 1: Colors */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Quick presets */}
                <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                  <h2 className="text-xl font-black mb-1" style={{ color: '#20242A' }}>الألوان والستايل</h2>
                  <p className="text-sm mb-5" style={{ color: '#6F7378' }}>اختر ستايلاً جاهزاً أو خصّص الألوان بنفسك</p>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {STYLES.map(style => (
                      <button key={style.name} title={style.name}
                        onClick={() => {
                          setSelectedStyle(style.name);
                          setPrimaryColor(style.colors[0]);
                          setCardColor(style.colors[1]);
                          setBgColor(style.colors[2]);
                          setDarkColor(style.colors[3]);
                        }}
                        className="aspect-square rounded-xl border-2 overflow-hidden transition-all"
                        style={{ borderColor: selectedStyle === style.name ? style.colors[0] : '#E4E6E2' }}>
                        <div className="grid grid-cols-2 h-full">
                          <div style={{ background: style.colors[0] }} />
                          <div style={{ background: style.colors[1] }} />
                          <div style={{ background: style.colors[2] }} />
                          <div style={{ background: style.colors[3] }} />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-center" style={{ color: '#6F7378' }}>
                    {selectedStyle || 'مخصص'}
                  </div>
                </div>

                {/* Live preview */}
                <div className="rounded-2xl border p-4 overflow-hidden" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: '#6F7378' }}>معاينة مباشرة</p>
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#E4E6E2' }}>
                    <div className="p-3 flex items-center gap-2" style={{ background: darkColor }}>
                      <div className="w-4 h-4 rounded-lg" style={{ background: primaryColor }} />
                      <div className="text-xs font-bold" style={{ color: '#fff' }}>{clinicNameAr || 'اسم العيادة'}</div>
                    </div>
                    <div className="p-4" style={{ background: bgColor }}>
                      <div className="h-2 rounded w-3/4 mb-2" style={{ background: primaryColor }} />
                      <div className="h-1.5 rounded w-1/2 mb-3" style={{ background: `${primaryColor}60` }} />
                      <div className="rounded-lg p-3" style={{ background: cardColor, border: `1px solid ${primaryColor}30` }}>
                        <div className="h-1.5 rounded w-2/3 mb-1.5" style={{ background: `${darkColor}40` }} />
                        <div className="h-1.5 rounded w-1/2" style={{ background: `${darkColor}25` }} />
                      </div>
                      <button className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: primaryColor }}>
                        احجز موعد
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual color pickers */}
                <div className="rounded-2xl border p-6" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                  <p className="text-sm font-bold mb-4" style={{ color: '#20242A' }}>تخصيص الألوان</p>
                  <div className="space-y-4">
                    {[
                      { label: 'اللون الرئيسي', hint: 'الأزرار والعناوين', val: primaryColor, set: setPrimaryColor },
                      { label: 'لون الخلفية', hint: 'خلفية الصفحة', val: bgColor, set: setBgColor },
                      { label: 'لون الكاردات', hint: 'بطاقات المحتوى', val: cardColor, set: setCardColor },
                      { label: 'اللون الداكن', hint: 'الهيدر والفوتر', val: darkColor, set: setDarkColor },
                    ].map(({ label, hint, val, set }) => (
                      <div key={label} className="flex items-center gap-3">
                        <input type="color" value={val}
                          onChange={e => { set(e.target.value); setSelectedStyle(''); }}
                          className="w-11 h-11 rounded-xl border cursor-pointer shrink-0"
                          style={{ borderColor: '#E4E6E2', padding: '2px' }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: '#20242A' }}>{label}</div>
                          <div className="text-xs" style={{ color: '#6F7378' }}>{hint}</div>
                        </div>
                        <input value={val} onChange={e => { set(e.target.value); setSelectedStyle(''); }}
                          className="w-28 px-3 py-2 rounded-lg border outline-none text-xs font-mono text-center"
                          style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }} dir="ltr" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl border font-semibold text-sm" style={{ borderColor: '#E4E6E2', color: '#6F7378' }}>← السابق</button>
                  <button onClick={handleStep1} disabled={saving} className="flex-1 py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: primary }}>
                    {saving ? '...' : 'التالي →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Services */}
            {step === 2 && (
              <div className="rounded-2xl border p-6 space-y-5" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                <div>
                  <h2 className="text-xl font-black mb-1" style={{ color: '#20242A' }}>خدمات عيادتك</h2>
                  <p className="text-sm" style={{ color: '#6F7378' }}>أضف الخدمات التي تقدمها (يمكن إضافة المزيد لاحقاً)</p>
                </div>
                {services.map((svc, i) => (
                  <div key={i} className="p-4 rounded-xl border space-y-3" style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#6F7378' }}>خدمة {i + 1}</span>
                      {services.length > 1 && (
                        <button onClick={() => setServices(s => s.filter((_, si) => si !== i))} className="text-xs text-red-400">حذف</button>
                      )}
                    </div>
                    <input className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#fff' }}
                      placeholder="اسم الخدمة (مثال: تبييض الأسنان)" value={svc.name}
                      onChange={e => setServices(s => s.map((sv, si) => si === i ? { ...sv, name: e.target.value } : sv))} />
                    <input className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#fff' }}
                      placeholder="وصف مختصر" value={svc.description}
                      onChange={e => setServices(s => s.map((sv, si) => si === i ? { ...sv, description: e.target.value } : sv))} />
                    <input className="w-full px-3 py-2.5 rounded-lg border outline-none text-sm" style={{ borderColor: '#E4E6E2', background: '#fff' }}
                      placeholder="السعر (مثال: 50$)" value={svc.price} dir="ltr"
                      onChange={e => setServices(s => s.map((sv, si) => si === i ? { ...sv, price: e.target.value } : sv))} />
                  </div>
                ))}
                <button onClick={() => setServices(s => [...s, { name: '', description: '', price: '' }])}
                  className="w-full py-2.5 rounded-xl border text-sm font-medium dashed" style={{ borderColor: '#E4E6E2', color: '#6F7378', borderStyle: 'dashed' }}>
                  + إضافة خدمة
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl border font-semibold text-sm" style={{ borderColor: '#E4E6E2' }}>← السابق</button>
                  <button onClick={handleStep2} disabled={saving} className="flex-1 py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: primary }}>
                    {saving ? '...' : 'التالي →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Working Hours */}
            {step === 3 && (
              <div className="rounded-2xl border p-6 space-y-4" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                <div>
                  <h2 className="text-xl font-black mb-1" style={{ color: '#20242A' }}>أوقات الدوام</h2>
                  <p className="text-sm" style={{ color: '#6F7378' }}>حدد مواعيد عمل عيادتك</p>
                </div>
                {hours.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F7F4' }}>
                    <input type="checkbox" checked={h.isOpen} onChange={e => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, isOpen: e.target.checked } : hr))}
                      className="w-4 h-4" style={{ accentColor: primary }} />
                    <span className="w-20 text-sm font-medium" style={{ color: '#20242A' }}>{h.day}</span>
                    <input type="time" value={h.openTime} disabled={!h.isOpen}
                      onChange={e => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, openTime: e.target.value } : hr))}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#E4E6E2', background: h.isOpen ? '#fff' : '#f0f0f0' }} dir="ltr" />
                    <span className="text-xs" style={{ color: '#6F7378' }}>—</span>
                    <input type="time" value={h.closeTime} disabled={!h.isOpen}
                      onChange={e => setHours(hrs => hrs.map((hr, hi) => hi === i ? { ...hr, closeTime: e.target.value } : hr))}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: '#E4E6E2', background: h.isOpen ? '#fff' : '#f0f0f0' }} dir="ltr" />
                  </div>
                ))}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3.5 rounded-xl border font-semibold text-sm" style={{ borderColor: '#E4E6E2' }}>← السابق</button>
                  <button onClick={handleStep3} disabled={saving} className="flex-1 py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-60" style={{ background: primary }}>
                    {saving ? '...' : 'التالي →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl border p-10 text-center space-y-5" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl mx-auto"
                  style={{ background: primary }}>🎉</div>
                <h2 className="text-2xl font-black" style={{ color: '#20242A' }}>عيادتك جاهزة!</h2>
                <p className="text-sm" style={{ color: '#6F7378' }}>
                  تم إعداد كل شيء. يمكنك الآن الدخول للوحة التحكم وتعديل أي تفاصيل إضافية.
                </p>
                <div className="p-4 rounded-xl text-sm text-right space-y-2" style={{ background: `${primary}10` }}>
                  <div className="flex items-center gap-2"><Check size={14} style={{ color: primary }} /><span>موقع عيادتك جاهز</span></div>
                  <div className="flex items-center gap-2"><Check size={14} style={{ color: primary }} /><span>لوحة التحكم مفعّلة</span></div>
                  <div className="flex items-center gap-2"><Check size={14} style={{ color: primary }} /><span>خدماتك وأوقات دوامك محددة</span></div>
                </div>
                <button onClick={handleStep4} disabled={saving}
                  className="w-full py-4 rounded-xl font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: primary }}>
                  <Rocket size={18} /> {saving ? '...' : 'انطلق للوحة التحكم'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

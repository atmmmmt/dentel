import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, User, Phone, AlertCircle, Link } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';
import { createVipPublicApi } from '../../../services/vipPublicApi';

function to12h(t) {
  const [h, m] = t.split(':').map(Number);
  const p = h < 12 ? 'ص' : 'م';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2,'0')} ${p}`;
}

const STEPS = ['الخدمة', 'الموعد', 'بياناتك'];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

export default function VipBookPage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};

  const [services, setServices]     = useState([]);
  const [slots, setSlots]           = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep]             = useState(0);
  const [done, setDone]             = useState(false);
  const [submitErr, setSubmitErr]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    serviceId: '', serviceName: '',
    date: '', time: '',
    patientName: '', phone: '', age: '', notes: '',
  });

  useEffect(() => {
    if (!slug) return;
    createVipPublicApi(slug).getServices()
      .then(r => setServices(r.data.services || []))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!form.date || !slug) return;
    setSlots([]); setLoadingSlots(true);
    createVipPublicApi(slug).getAvailability(form.date)
      .then(r => setSlots(r.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [form.date, slug]);

  const today = new Date().toISOString().split('T')[0];
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nextStep = () => {
    if (step === 0 && !form.serviceId) { setSubmitErr('يرجى اختيار الخدمة'); return; }
    if (step === 1 && !form.date)      { setSubmitErr('يرجى اختيار التاريخ'); return; }
    if (step === 1 && !form.time)      { setSubmitErr('يرجى اختيار الوقت'); return; }
    setSubmitErr('');
    setStep(s => s + 1);
  };

  const submit = async () => {
    if (!form.patientName || !form.phone) { setSubmitErr('يرجى تعبئة الاسم والهاتف'); return; }
    setSubmitting(true); setSubmitErr('');
    try {
      await createVipPublicApi(slug).createBooking({
        patientName: form.patientName,
        phone:       form.phone,
        service:     form.serviceName,
        date:        form.date,
        time:        form.time,
        notes:       form.notes,
      });
      setDone(true);
    } catch {
      setSubmitErr('حدث خطأ، يرجى المحاولة مجدداً أو التواصل بنا مباشرة.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (done) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-24">
      <motion.div {...fadeUp()} className="bg-white rounded-card max-w-md w-full p-10 text-center border border-border shadow-card-hover">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-charcoal mb-3">تم إرسال طلب الحجز!</h2>
        <p className="text-charcoal-light text-sm leading-relaxed mb-8">
          سيتم تأكيد الموعد من قبل العيادة والتواصل معك قريباً.
        </p>
        <button
          onClick={() => { setDone(false); setStep(0); setForm({ serviceId:'', serviceName:'', date:'', time:'', patientName:'', phone:'', age:'', notes:'' }); setSlots([]); }}
          className="btn-primary w-full justify-center">
          حجز موعد آخر
        </button>
      </motion.div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-10 bg-cream">
        <div className="container-custom text-center max-w-2xl">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">حجز موعد</p>
            <h1 className="section-title mb-3">احجز موعدك الآن</h1>
            <p className="text-charcoal-light text-[15px] leading-relaxed">
              لضمان أعلى معايير التعقيم، يتم تخصيص وقت كافٍ بعد كل موعد للتنظيف والتجهيز.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 bg-cream">
        <div className="container-custom max-w-2xl">

          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    i < step  ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-charcoal text-white' :
                                 'bg-border text-charcoal-light'
                  }`}>
                    {i < step ? <CheckCircle size={16} /> : i + 1}
                  </div>
                  <span className="text-xs mt-1.5 font-semibold text-charcoal-light">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 sm:w-20 h-0.5 mb-5 mx-1 transition-colors ${i < step ? 'bg-emerald-500' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-card p-8 sm:p-6 border border-border shadow-card">

            {/* ── Step 0: خدمة ── */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-charcoal mb-6">اختر الخدمة</h2>
                {services.length === 0 ? (
                  <p className="text-charcoal-light text-sm text-center py-8">جاري تحميل الخدمات...</p>
                ) : (
                  <div className="space-y-3">
                    {services.map(s => (
                      <label key={s._id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          form.serviceId === s._id ? 'border-charcoal bg-cream' : 'border-border hover:border-silver-dark'
                        }`}>
                        <input type="radio" className="hidden" checked={form.serviceId === s._id}
                          onChange={() => { set('serviceId', s._id); set('serviceName', s.name); }} />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          form.serviceId === s._id ? 'border-charcoal' : 'border-border'
                        }`}>
                          {form.serviceId === s._id && <div className="w-2.5 h-2.5 rounded-full bg-charcoal" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-charcoal">{s.name}</p>
                          {s.duration && <p className="text-xs text-charcoal-light mt-0.5">{s.duration} دقيقة</p>}
                        </div>
                        {s.price && <p className="text-silver-dark font-bold text-sm">{s.price}</p>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 1: تاريخ ووقت ── */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-charcoal mb-6">اختر التاريخ والوقت</h2>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-charcoal mb-2">
                    <Calendar size={14} className="inline ml-1" />التاريخ
                  </label>
                  <input type="date" min={today} value={form.date}
                    onChange={e => { set('date', e.target.value); set('time', ''); }}
                    className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-charcoal text-sm focus:outline-none focus:border-silver-dark transition-colors" />
                </div>

                {form.date && (
                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-3">
                      <Clock size={14} className="inline ml-1" />الأوقات المتاحة
                    </label>
                    {loadingSlots ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 rounded-full border-2 border-silver border-t-charcoal animate-spin" />
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="text-center py-8 text-charcoal-light">
                        <Clock size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">لا توجد أوقات متاحة في هذا اليوم</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {slots.map(slot => (
                          <button key={slot} type="button" onClick={() => set('time', slot)}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                              form.time === slot
                                ? 'bg-charcoal text-white'
                                : 'bg-cream hover:bg-cream-dark text-charcoal border border-border hover:border-silver-dark'
                            }`}>
                            {to12h(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: بيانات شخصية ── */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-charcoal mb-6">بياناتك الشخصية</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-2">
                      <User size={13} className="inline ml-1" />الاسم الكامل *
                    </label>
                    <input value={form.patientName} onChange={e => set('patientName', e.target.value)}
                      placeholder="محمد أحمد"
                      className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-charcoal text-sm focus:outline-none focus:border-silver-dark transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-2">
                      <Phone size={13} className="inline ml-1" />رقم الهاتف *
                    </label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+963 9XXXXXXXX" dir="ltr"
                      className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-charcoal text-sm focus:outline-none focus:border-silver-dark transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-2">العمر (اختياري)</label>
                    <input value={form.age} onChange={e => set('age', e.target.value)}
                      type="number" placeholder="25"
                      className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-charcoal text-sm focus:outline-none focus:border-silver-dark transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-charcoal mb-2">ملاحظات إضافية (اختياري)</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                      rows={3} placeholder="أي معلومات إضافية..."
                      className="w-full bg-cream border border-border rounded-xl px-4 py-3 text-charcoal text-sm focus:outline-none focus:border-silver-dark transition-colors resize-none" />
                  </div>
                </div>

                {/* ملخص الحجز */}
                <div className="mt-6 p-4 rounded-2xl bg-cream border border-border">
                  <p className="text-xs font-bold text-charcoal-light mb-2">ملخص الحجز</p>
                  <p className="text-sm font-bold text-charcoal">{form.serviceName}</p>
                  <p className="text-sm text-charcoal-light">{form.date} — {form.time ? to12h(form.time) : ''}</p>
                </div>
              </div>
            )}

            {/* خطأ */}
            {submitErr && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{submitErr}</p>
              </div>
            )}

            {/* أزرار التنقل */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button type="button" onClick={() => { setStep(s => s - 1); setSubmitErr(''); }}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-charcoal font-bold text-sm hover:border-silver-dark transition-colors">
                  السابق
                </button>
              )}
              {step < 2 ? (
                <button type="button" onClick={nextStep}
                  className="btn-primary flex-1 justify-center">
                  التالي
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={submitting}
                  className="btn-primary flex-1 justify-center disabled:opacity-60">
                  {submitting ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                </button>
              )}
            </div>
          </motion.div>

        </div>
      </section>
    </>
  );
}

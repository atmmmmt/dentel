import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Palette } from 'lucide-react';
import { publicApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';
import FormField from '../../components/forms/FormField';

const THEMES = [
  {
    id: 'royal',
    name: 'رويال داكن',
    desc: 'أناقة داكنة وذهبية',
    primary: '#C9B89A',
    bg: '#0F0F0F',
    sidebar: '#141414',
  },
  {
    id: 'ocean',
    name: 'أوشن أزرق',
    desc: 'نظيف واحترافي',
    primary: '#2563EB',
    bg: '#F0F4FF',
    sidebar: '#1E3A8A',
  },
  {
    id: 'mint',
    name: 'مينت أخضر',
    desc: 'منعش وحيوي',
    primary: '#059669',
    bg: '#F0FDF4',
    sidebar: '#064E3B',
  },
];

const schema = z.object({
  doctorName: z.string().min(2, 'الاسم مطلوب'),
  clinicName: z.string().optional(),
  phone: z.string().min(7, 'رقم الهاتف مطلوب'),
  whatsapp: z.string().min(7, 'رقم الواتساب مطلوب'),
  email: z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  selectedPackage: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly', '']).optional(),
  message: z.string().optional(),
  wantsDemo: z.boolean().optional(),
  wantsDomain: z.boolean().optional(),
  domainName: z.string().optional(),
  preferredContactMethod: z.enum(['whatsapp', 'phone', 'email']).optional(),
});

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('');
  const { openWhatsApp } = useApp();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { preferredContactMethod: 'whatsapp', wantsDemo: false, wantsDomain: false, billingCycle: '' },
  });
  const wantsDomain = watch('wantsDomain');

  const onSubmit = async (data) => {
    try {
      await publicApi.submitLead({ ...data, preferredTheme: selectedTheme });
      setSubmitted(true);
      toast.success('تم إرسال طلبك بنجاح!');
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    }
  };

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      <div className="pt-hero relative overflow-hidden px-5 pb-16 pt-36 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="mb-5 inline-flex rounded-full bg-white/[.07] px-4 py-1.5 text-xs font-bold text-[#9BEDE7] ring-1 ring-white/15">تواصل معنا</span>
          <h1 className="pt-h1 mb-4 text-white">نحن هنا لمساعدتك</h1>
          <p className="pt-lead text-white/70">أرسل طلبك وسنتواصل معك خلال ساعة عمل.</p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16">
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center rounded-2xl border p-12"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-5"
              style={{ background: 'var(--color-primary)' }}>✓</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>شكراً لتواصلك!</h2>
            <p className="mb-6" style={{ color: 'var(--color-muted)' }}>تم استلام طلبك وسنتواصل معك في أقرب وقت ممكن.</p>
            <button onClick={() => openWhatsApp()} className="btn-primary justify-center">
              <MessageCircle size={16} /> تواصل واتساب الآن
            </button>
          </motion.div>
        ) : (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border p-8 space-y-5"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>اطلب عرض سعر</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="اسم الطبيب *" error={errors.doctorName?.message}>
                <input {...register('doctorName')} placeholder="د. محمد أحمد" className="input-base" />
              </FormField>
              <FormField label="اسم العيادة" error={errors.clinicName?.message}>
                <input {...register('clinicName')} placeholder="عيادة النور" className="input-base" />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="رقم الهاتف *" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+962 7X XXX XXXX" className="input-base" dir="ltr" />
              </FormField>
              <FormField label="رقم الواتساب *" error={errors.whatsapp?.message}>
                <input {...register('whatsapp')} placeholder="+962 7X XXX XXXX" className="input-base" dir="ltr" />
              </FormField>
            </div>

            <FormField label="البريد الإلكتروني" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="doctor@clinic.com" className="input-base" dir="ltr" />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="الدولة">
                <input {...register('country')} placeholder="الأردن" className="input-base" />
              </FormField>
              <FormField label="المدينة">
                <input {...register('city')} placeholder="عمّان" className="input-base" />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="الباقة المهتم بها">
                <select {...register('selectedPackage')} className="input-base">
                  <option value="">اختر باقة (اختياري)</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP Custom">VIP Custom</option>
                </select>
              </FormField>
              <FormField label="دورة الاشتراك">
                <select {...register('billingCycle')} className="input-base">
                  <option value="">اختر (اختياري)</option>
                  <option value="monthly">شهري</option>
                  <option value="yearly">سنوي (وفّر 20%)</option>
                </select>
              </FormField>
            </div>

            <FormField label="طريقة التواصل المفضلة">
              <select {...register('preferredContactMethod')} className="input-base">
                <option value="whatsapp">واتساب</option>
                <option value="phone">هاتف</option>
                <option value="email">بريد إلكتروني</option>
              </select>
            </FormField>

            <FormField label="رسالتك">
              <textarea {...register('message')} rows={4} placeholder="أخبرنا عن عيادتك واحتياجاتك..." className="input-base resize-none" />
            </FormField>

            {/* Domain add-on */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('wantsDomain')} className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>أريد شراء دومين باسم عيادتي</span>
                  <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>سيتم التواصل معك لاختيار اسم الدومين المناسب</span>
                </div>
              </label>
              {wantsDomain && (
                <FormField label="اسم الدومين المطلوب" error={errors.domainName?.message}>
                  <input {...register('domainName')} placeholder="myclinic.com أو اسم العيادة" className="input-base" dir="ltr" />
                </FormField>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register('wantsDemo')} className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>أريد تجربة الديمو أولاً</span>
            </label>

            {/* Theme Picker */}
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Palette size={16} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>اختر تصميم عيادتك (اختياري)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map(t => (
                  <button key={t.id} type="button" onClick={() => setSelectedTheme(selectedTheme === t.id ? '' : t.id)}
                    className="rounded-xl border-2 p-2.5 text-right transition-all"
                    style={{
                      borderColor: selectedTheme === t.id ? t.primary : 'var(--color-border)',
                      background: selectedTheme === t.id ? t.primary + '11' : 'var(--color-card)',
                      boxShadow: selectedTheme === t.id ? `0 0 0 3px ${t.primary}22` : 'none',
                    }}>
                    {/* Mini preview */}
                    <div className="rounded-lg overflow-hidden mb-2 h-10 flex gap-0.5" style={{ background: t.bg }}>
                      <div className="w-5 rounded-r" style={{ background: t.sidebar }} />
                      <div className="flex-1 p-1 flex flex-col gap-1">
                        <div className="h-1.5 rounded" style={{ background: t.primary + '55', width: '70%' }} />
                        <div className="h-1.5 rounded" style={{ background: t.primary + '33', width: '50%' }} />
                      </div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{t.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)', fontSize: 10 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
              {selectedTheme && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                  ✓ اخترت تصميم "{THEMES.find(t => t.id === selectedTheme)?.name}" — يمكن تغييره لاحقاً
                </p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center text-base py-3.5">
              <Send size={16} />
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}

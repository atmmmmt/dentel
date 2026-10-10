import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Stethoscope } from 'lucide-react';
import { useClinicAuth } from '../../context/ClinicAuthContext';
import { clinicPublicApi } from '../../services/clinicApi';
import toast from 'react-hot-toast';

export default function ClinicLoginPage() {
  const { slug } = useParams();
  const { login, clinic: authedClinic } = useClinicAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (authedClinic) {
      navigate(authedClinic.onboardingCompleted
        ? `/clinic/${slug}/dashboard`
        : `/clinic/${slug}/onboarding`);
    }
  }, [authedClinic]);

  useEffect(() => {
    clinicPublicApi.getClinic(slug)
      .then(r => setClinicInfo(r.data))
      .catch(() => {});
  }, [slug]);

  const onSubmit = async ({ email, password }) => {
    try {
      const c = await login(email, password);
      toast.success(`مرحباً ${c.doctorName} 👋`);
      navigate(c.onboardingCompleted ? `/clinic/${slug}/dashboard` : `/clinic/${slug}/onboarding`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    }
  };

  const settings = clinicInfo?.settings;
  const primary = settings?.primaryColor || '#2D6BEB';

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${primary}18 0%, #F7F7F4 100%)` }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        {/* Logo / Name */}
        <div className="text-center mb-8">
          {settings?.logo
            ? <img src={settings.logo} alt="logo" className="h-16 object-contain mx-auto mb-4" />
            : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4"
                style={{ background: primary }}>
                <Stethoscope size={28} />
              </div>
            )
          }
          <h1 className="text-xl font-black" style={{ color: '#20242A' }}>
            {settings?.clinicNameAr || clinicInfo?.clinic?.clinicName || 'لوحة تحكم العيادة'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6F7378' }}>
            {clinicInfo?.clinic?.doctorName || 'تسجيل دخول'}
          </p>
        </div>

        <div className="rounded-2xl border p-8 shadow-lg" style={{ background: '#fff', borderColor: '#E4E6E2' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#20242A' }}>البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: '#6F7378' }} />
                <input {...register('email', { required: true })} type="email"
                  className="w-full px-4 py-3 pr-9 rounded-xl border outline-none text-sm transition-all"
                  style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}
                  dir="ltr" placeholder="doctor@clinic.com"
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = '#E4E6E2'} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#20242A' }}>كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: '#6F7378' }} />
                <input {...register('password', { required: true })}
                  type={showPass ? 'text' : 'password'}
                  className="w-full px-4 py-3 pr-9 pl-9 rounded-xl border outline-none text-sm transition-all"
                  style={{ borderColor: '#E4E6E2', background: '#F7F7F4' }}
                  dir="ltr" placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = primary}
                  onBlur={e => e.target.style.borderColor = '#E4E6E2'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 -translate-y-1/2 left-3" style={{ color: '#6F7378' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mt-2 disabled:opacity-60 transition-all"
              style={{ background: primary }}>
              {isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#6F7378' }}>
          مشغّل بواسطة <span className="font-semibold" style={{ color: primary }}>Prootech Agency</span>
        </p>
      </motion.div>
    </div>
  );
}

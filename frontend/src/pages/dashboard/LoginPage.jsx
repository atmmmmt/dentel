import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/shared/BrandLogo';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
      navigate('/product-admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-dark)' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <div className="text-center mb-8">
          <div className="mb-5 flex justify-center"><BrandLogo /></div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>إدارة منصة Dentovi</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>تسجيل الدخول للوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: 'var(--color-muted)' }} />
              <input {...register('email', { required: true })} type="email"
                defaultValue="admin@prootech.com"
                className="input-base pr-9" dir="ltr" placeholder="admin@prootech.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>كلمة المرور</label>
            <div className="relative">
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: 'var(--color-muted)' }} />
              <input {...register('password', { required: true })} type={showPass ? 'text' : 'password'}
                className="input-base pr-9 pl-9" dir="ltr" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 left-3" style={{ color: 'var(--color-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="btn-primary w-full justify-center py-3.5 mt-2">
            {isSubmitting ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

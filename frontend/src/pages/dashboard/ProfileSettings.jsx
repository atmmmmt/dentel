import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { admin } = useAuth();
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const data = { name, email };
      if (currentPass && newPass) { data.password = currentPass; data.newPassword = newPass; }
      await authApi.updateProfile(data);
      toast.success('تم تحديث الملف الشخصي');
      setCurrentPass(''); setNewPass('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحديث');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="الملف الشخصي" subtitle="تحديث بيانات حسابك" />
      <div className="max-w-lg space-y-6">
        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>المعلومات الأساسية</h3>
          <div className="space-y-4">
            <FormField label="الاسم"><input className="input-base" value={name} onChange={e => setName(e.target.value)} /></FormField>
            <FormField label="البريد الإلكتروني"><input className="input-base" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} /></FormField>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>تغيير كلمة المرور</h3>
          <div className="space-y-4">
            <FormField label="كلمة المرور الحالية"><input type="password" className="input-base" dir="ltr" value={currentPass} onChange={e => setCurrentPass(e.target.value)} /></FormField>
            <FormField label="كلمة المرور الجديدة"><input type="password" className="input-base" dir="ltr" value={newPass} onChange={e => setNewPass(e.target.value)} /></FormField>
          </div>
        </Card>

        <button onClick={save} disabled={saving} className="btn-primary px-8 py-3">
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}

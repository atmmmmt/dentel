import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import SaveBar from '../../components/forms/SaveBar';
import toast from 'react-hot-toast';

export default function SEOSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(r => setSettings(r.data.settings)).catch(() => {});
  }, []);

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await adminApi.updateSettings(settings); toast.success('تم الحفظ'); }
    catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div>
      <PageTitle title="إعدادات SEO" subtitle="تحسين محركات البحث" />
      <SaveBar onSave={save} saving={saving} onPreview />

      <Card>
        <div className="space-y-5">
          <FormField label="عنوان الصفحة (Meta Title)" hint="الحد الأقصى 60 حرف">
            <input className="input-base" value={settings.metaTitle || ''} onChange={e => set('metaTitle', e.target.value)} />
            <div className="text-xs mt-1" style={{ color: settings.metaTitle?.length > 60 ? 'red' : 'var(--color-muted)' }}>
              {settings.metaTitle?.length || 0}/60
            </div>
          </FormField>
          <FormField label="وصف الصفحة (Meta Description)" hint="الحد الأقصى 160 حرف">
            <textarea className="input-base resize-none" rows={3} value={settings.metaDescription || ''} onChange={e => set('metaDescription', e.target.value)} />
            <div className="text-xs mt-1" style={{ color: settings.metaDescription?.length > 160 ? 'red' : 'var(--color-muted)' }}>
              {settings.metaDescription?.length || 0}/160
            </div>
          </FormField>
          <FormField label="الكلمات المفتاحية" hint="افصل بين الكلمات بفاصلة">
            <input className="input-base" value={settings.metaKeywords || ''} onChange={e => set('metaKeywords', e.target.value)} />
          </FormField>
          <FormField label="Open Graph Image URL" hint="الصورة التي تظهر عند مشاركة الرابط">
            <input className="input-base" dir="ltr" value={settings.ogImage || ''} onChange={e => set('ogImage', e.target.value)} />
          </FormField>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="Google Analytics ID">
              <input className="input-base" dir="ltr" value={settings.googleAnalyticsId || ''} onChange={e => set('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
            </FormField>
            <FormField label="Facebook Pixel ID">
              <input className="input-base" dir="ltr" value={settings.pixelId || ''} onChange={e => set('pixelId', e.target.value)} />
            </FormField>
          </div>
          <FormField label="Robots">
            <select className="input-base" value={settings.robots || 'index, follow'} onChange={e => set('robots', e.target.value)}>
              <option value="index, follow">index, follow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
              <option value="index, nofollow">index, nofollow</option>
            </select>
          </FormField>
        </div>
      </Card>
    </div>
  );
}

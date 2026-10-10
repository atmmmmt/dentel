import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import SaveBar from '../../components/forms/SaveBar';
import FormField from '../../components/forms/FormField';
import toast from 'react-hot-toast';

export default function StylesPage() {
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getLanding().then(r => setContent(r.data.content)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { await adminApi.updateLanding({ stylesSection: content.stylesSection }); toast.success('تم الحفظ'); }
    catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const updateStyle = (i, key, val) => {
    const styles = [...content.stylesSection.styles];
    styles[i] = { ...styles[i], [key]: val };
    setContent(prev => ({ ...prev, stylesSection: { ...prev.stylesSection, styles } }));
  };

  if (!content) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div>
      <PageTitle title="الستايلات البصرية" subtitle="تعديل أسماء وأوصاف الستايلات" />
      <SaveBar onSave={save} saving={saving} onPreview />

      <div className="space-y-5 mb-8">
        <Card>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="عنوان القسم">
              <input className="input-base" value={content.stylesSection?.title || ''} onChange={e => setContent(p => ({ ...p, stylesSection: { ...p.stylesSection, title: e.target.value } }))} />
            </FormField>
            <FormField label="النص التوضيحي">
              <input className="input-base" value={content.stylesSection?.subtitle || ''} onChange={e => setContent(p => ({ ...p, stylesSection: { ...p.stylesSection, subtitle: e.target.value } }))} />
            </FormField>
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(content.stylesSection?.styles || []).map((style, i) => (
          <Card key={i}>
            <div className="flex gap-2 mb-3">
              {style.colors?.map((c, ci) => (
                <div key={ci} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ background: c }} />
              ))}
            </div>
            <div className="space-y-3">
              <FormField label="الاسم">
                <input className="input-base text-sm" value={style.name} onChange={e => updateStyle(i, 'name', e.target.value)} />
              </FormField>
              <FormField label="الوصف">
                <input className="input-base text-sm" value={style.description} onChange={e => updateStyle(i, 'description', e.target.value)} />
              </FormField>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={style.isActive} onChange={e => updateStyle(i, 'isActive', e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text)' }}>نشط</span>
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import SaveBar from '../../components/forms/SaveBar';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'hero', label: 'الهيرو' },
  { key: 'problem', label: 'المشكلة' },
  { key: 'solution', label: 'الحل' },
  { key: 'features', label: 'الميزات' },
  { key: 'workflow', label: 'طريقة العمل' },
  { key: 'demo', label: 'الديمو' },
  { key: 'cta', label: 'CTA' },
  { key: 'footer', label: 'الفوتر' },
];

export default function LandingEditor() {
  const [content, setContent] = useState(null);
  const [tab, setTab] = useState('hero');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getLanding().then(r => setContent(r.data.content)).catch(() => toast.error('فشل تحميل المحتوى'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateLanding(content);
      toast.success('تم الحفظ');
    } catch {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const set = (section, field, value) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  if (!content) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div>
      <PageTitle title="محرر اللاندينغ" subtitle="تحكم في كل محتوى الموقع العام" />
      <SaveBar onSave={save} saving={saving} onPreview />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'text-white' : 'border'}`}
            style={tab === t.key
              ? { background: 'var(--color-primary)' }
              : { background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero */}
      {tab === 'hero' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>قسم الهيرو</h3>
            <FormField label="البادج / الشارة">
              <input className="input-base" value={content.hero?.badge || ''} onChange={e => set('hero', 'badge', e.target.value)} />
            </FormField>
            <FormField label="العنوان الرئيسي">
              <input className="input-base" value={content.hero?.title || ''} onChange={e => set('hero', 'title', e.target.value)} />
            </FormField>
            <FormField label="النص التوضيحي">
              <textarea className="input-base resize-none" rows={3} value={content.hero?.subtitle || ''} onChange={e => set('hero', 'subtitle', e.target.value)} />
            </FormField>
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="نص الزر الأول">
                <input className="input-base" value={content.hero?.primaryButtonText || ''} onChange={e => set('hero', 'primaryButtonText', e.target.value)} />
              </FormField>
              <FormField label="رابط الزر الأول">
                <input className="input-base" dir="ltr" value={content.hero?.primaryButtonLink || ''} onChange={e => set('hero', 'primaryButtonLink', e.target.value)} />
              </FormField>
              <FormField label="نص الزر الثاني">
                <input className="input-base" value={content.hero?.secondaryButtonText || ''} onChange={e => set('hero', 'secondaryButtonText', e.target.value)} />
              </FormField>
              <FormField label="رابط الزر الثاني">
                <input className="input-base" dir="ltr" value={content.hero?.secondaryButtonLink || ''} onChange={e => set('hero', 'secondaryButtonLink', e.target.value)} />
              </FormField>
            </div>
            <FormField label="رابط صورة الهيرو" hint="اتركه فارغاً لاستخدام الموكب المدمج">
              <input className="input-base" dir="ltr" value={content.hero?.heroImage || ''} onChange={e => set('hero', 'heroImage', e.target.value)} />
            </FormField>
          </div>
        </Card>
      )}

      {/* Problem */}
      {tab === 'problem' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>قسم المشكلة</h3>
            <FormField label="العنوان">
              <input className="input-base" value={content.problem?.title || ''} onChange={e => set('problem', 'title', e.target.value)} />
            </FormField>
            <FormField label="النص التوضيحي">
              <input className="input-base" value={content.problem?.subtitle || ''} onChange={e => set('problem', 'subtitle', e.target.value)} />
            </FormField>
            <div>
              <label className="text-sm font-medium mb-3 block" style={{ color: 'var(--color-text)' }}>البطاقات</label>
              {(content.problem?.cards || []).map((card, i) => (
                <div key={i} className="grid sm:grid-cols-3 gap-3 mb-3 p-4 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                  <input className="input-base text-sm" placeholder="الأيقونة" value={card.icon || ''} onChange={e => {
                    const cards = [...content.problem.cards]; cards[i] = { ...card, icon: e.target.value };
                    set('problem', 'cards', cards);
                  }} />
                  <input className="input-base text-sm" placeholder="العنوان" value={card.title || ''} onChange={e => {
                    const cards = [...content.problem.cards]; cards[i] = { ...card, title: e.target.value };
                    set('problem', 'cards', cards);
                  }} />
                  <input className="input-base text-sm" placeholder="الوصف" value={card.description || ''} onChange={e => {
                    const cards = [...content.problem.cards]; cards[i] = { ...card, description: e.target.value };
                    set('problem', 'cards', cards);
                  }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Solution */}
      {tab === 'solution' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>قسم الحل</h3>
            <FormField label="العنوان">
              <input className="input-base" value={content.solution?.title || ''} onChange={e => set('solution', 'title', e.target.value)} />
            </FormField>
            <FormField label="النص التوضيحي">
              <input className="input-base" value={content.solution?.subtitle || ''} onChange={e => set('solution', 'subtitle', e.target.value)} />
            </FormField>
          </div>
        </Card>
      )}

      {/* Demo */}
      {tab === 'demo' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>قسم الديمو</h3>
            <FormField label="العنوان">
              <input className="input-base" value={content.demo?.title || ''} onChange={e => set('demo', 'title', e.target.value)} />
            </FormField>
            <FormField label="النص التوضيحي">
              <input className="input-base" value={content.demo?.subtitle || ''} onChange={e => set('demo', 'subtitle', e.target.value)} />
            </FormField>
            <div className="grid sm:grid-cols-3 gap-5">
              <FormField label="رابط الديمو">
                <input className="input-base" dir="ltr" value={content.demo?.demoUrl || ''} onChange={e => set('demo', 'demoUrl', e.target.value)} />
              </FormField>
              <FormField label="بريد الديمو">
                <input className="input-base" dir="ltr" value={content.demo?.demoEmail || ''} onChange={e => set('demo', 'demoEmail', e.target.value)} />
              </FormField>
              <FormField label="كلمة مرور الديمو">
                <input className="input-base" dir="ltr" value={content.demo?.demoPassword || ''} onChange={e => set('demo', 'demoPassword', e.target.value)} />
              </FormField>
            </div>
            <FormField label="ملاحظات">
              <textarea className="input-base resize-none" rows={3} value={content.demo?.notes || ''} onChange={e => set('demo', 'notes', e.target.value)} />
            </FormField>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={content.demo?.showCredentials} onChange={e => set('demo', 'showCredentials', e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>إظهار بيانات الدخول للزوار</span>
            </label>
          </div>
        </Card>
      )}

      {/* CTA */}
      {tab === 'cta' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>قسم CTA</h3>
            <FormField label="العنوان">
              <input className="input-base" value={content.cta?.title || ''} onChange={e => set('cta', 'title', e.target.value)} />
            </FormField>
            <FormField label="النص التوضيحي">
              <textarea className="input-base resize-none" rows={3} value={content.cta?.subtitle || ''} onChange={e => set('cta', 'subtitle', e.target.value)} />
            </FormField>
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField label="نص الزر الأول">
                <input className="input-base" value={content.cta?.primaryButtonText || ''} onChange={e => set('cta', 'primaryButtonText', e.target.value)} />
              </FormField>
              <FormField label="نص الزر الثاني">
                <input className="input-base" value={content.cta?.secondaryButtonText || ''} onChange={e => set('cta', 'secondaryButtonText', e.target.value)} />
              </FormField>
            </div>
          </div>
        </Card>
      )}

      {/* Footer */}
      {tab === 'footer' && (
        <Card>
          <div className="space-y-5">
            <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>الفوتر</h3>
            <FormField label="وصف الفوتر">
              <textarea className="input-base resize-none" rows={3} value={content.footer?.description || ''} onChange={e => set('footer', 'description', e.target.value)} />
            </FormField>
          </div>
        </Card>
      )}

      {['features', 'workflow'].includes(tab) && (
        <Card>
          <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
            تعديل هذا القسم متاح — أضف/حرّر العناصر عبر صفحات مخصصة
            <br /><span className="text-xs">الميزات والخطوات محددة مسبقاً من seed البيانات</span>
          </p>
        </Card>
      )}
    </div>
  );
}

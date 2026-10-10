import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Star } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import ConfirmModal from '../../components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const empty = { name: '', subtitle: '', price: '', currency: '$', badge: '', features: [], isHighlighted: false, isActive: true, displayOrder: 0, buttonText: 'اطلب الآن' };

export default function PricingEditor() {
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(empty);
  const [featText, setFeatText] = useState('');
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getPricing().then(r => setPackages(r.data.packages || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const openEdit = (pkg = null) => {
    setIsNew(!pkg);
    setForm(pkg ? { ...pkg } : { ...empty });
    setFeatText(pkg ? pkg.features.join('\n') : '');
    setEditing(pkg?._id || 'new');
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...form, features: featText.split('\n').filter(f => f.trim()) };
      if (isNew) await adminApi.createPricing(data);
      else await adminApi.updatePricing(editing, data);
      toast.success('تم الحفظ');
      setEditing(null);
      load();
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await adminApi.deletePricing(delId);
      toast.success('تم الحذف');
      setDelId(null);
      load();
    } catch { toast.error('فشل الحذف'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="الباقات والأسعار" subtitle="أضف وعدّل باقات المنتج"
        action={
          <button onClick={() => openEdit()} className="btn-primary gap-2">
            <Plus size={16} /> إضافة باقة
          </button>
        } />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {packages.map((pkg, i) => (
          <motion.div key={pkg._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative">
              {pkg.isHighlighted && <Star size={14} className="absolute top-3 left-3" style={{ color: 'var(--color-primary)' }} fill="currentColor" />}
              <div className="mb-3">
                <div className="font-black text-lg" style={{ color: 'var(--color-text)' }}>{pkg.name}</div>
                <div className="text-2xl font-black mt-1" style={{ color: 'var(--color-primary)' }}>{pkg.currency}{pkg.price}</div>
              </div>
              {pkg.badge && <span className="badge text-xs mb-3 inline-block">{pkg.badge}</span>}
              <ul className="text-xs space-y-1 mb-4" style={{ color: 'var(--color-muted)' }}>
                {pkg.features.slice(0, 4).map((f, fi) => <li key={fi}>• {f}</li>)}
                {pkg.features.length > 4 && <li className="font-medium" style={{ color: 'var(--color-primary)' }}>+{pkg.features.length - 4} ميزة</li>}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => openEdit(pkg)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border font-medium"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                  <Edit2 size={13} /> تعديل
                </button>
                <button onClick={() => setDelId(pkg._id)} className="p-2 rounded-xl text-xs border text-red-400 hover:bg-red-50"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-text)' }}>
              {isNew ? 'إضافة باقة' : 'تعديل الباقة'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="اسم الباقة">
                  <input className="input-base" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </FormField>
                <FormField label="البادج">
                  <input className="input-base" value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} placeholder="الأكثر طلباً" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="السعر">
                  <input className="input-base" dir="ltr" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </FormField>
                <FormField label="العملة">
                  <input className="input-base" dir="ltr" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="الوصف المختصر">
                <input className="input-base" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
              </FormField>
              <FormField label="الميزات (ميزة في كل سطر)">
                <textarea className="input-base resize-none" rows={6} value={featText} onChange={e => setFeatText(e.target.value)} />
              </FormField>
              <FormField label="نص الزر">
                <input className="input-base" value={form.buttonText} onChange={e => setForm(p => ({ ...p, buttonText: e.target.value }))} />
              </FormField>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isHighlighted} onChange={e => setForm(p => ({ ...p, isHighlighted: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                  مميزة
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                  نشطة
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)' }}>إلغاء</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}>
                {saving ? '...' : 'حفظ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal open={!!delId} onConfirm={remove} onCancel={() => setDelId(null)} loading={saving}
        message="هل تريد حذف هذه الباقة نهائياً؟" />
    </div>
  );
}

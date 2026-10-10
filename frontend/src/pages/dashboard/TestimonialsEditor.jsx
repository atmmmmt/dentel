import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Star } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import ConfirmModal from '../../components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const empty = { doctorName: '', clinicName: '', location: '', rating: 5, text: '', image: '', isActive: true, displayOrder: 0 };

export default function TestimonialsEditor() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(empty);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getTestimonials().then(r => setItems(r.data.testimonials || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const openEdit = (item = null) => { setIsNew(!item); setForm(item ? { ...item } : { ...empty }); setEditing(item?._id || 'new'); };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await adminApi.createTestimonial(form);
      else await adminApi.updateTestimonial(editing, form);
      toast.success('تم الحفظ'); setEditing(null); load();
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await adminApi.deleteTestimonial(delId); toast.success('تم الحذف'); setDelId(null); load(); }
    catch { toast.error('فشل الحذف'); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="آراء العملاء" subtitle="أضف وعدّل شهادات الأطباء"
        action={<button onClick={() => openEdit()} className="btn-primary gap-2"><Plus size={16} /> إضافة شهادة</button>} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} size={13} fill={si < t.rating ? 'var(--color-primary)' : 'none'} style={{ color: 'var(--color-primary)' }} />
                ))}
              </div>
              <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--color-muted)' }}>"{t.text}"</p>
              <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{t.doctorName}</div>
              <div className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>{t.clinicName} — {t.location}</div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                  <Edit2 size={13} /> تعديل
                </button>
                <button onClick={() => setDelId(t._id)} className="p-2 rounded-xl text-xs border text-red-400"
                  style={{ borderColor: 'var(--color-border)' }}><Trash2 size={13} /></button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-text)' }}>{isNew ? 'إضافة شهادة' : 'تعديل الشهادة'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="اسم الطبيب"><input className="input-base" value={form.doctorName} onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))} /></FormField>
                <FormField label="اسم العيادة"><input className="input-base" value={form.clinicName} onChange={e => setForm(p => ({ ...p, clinicName: e.target.value }))} /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="الموقع"><input className="input-base" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></FormField>
                <FormField label="التقييم (1-5)"><input className="input-base" type="number" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: Number(e.target.value) }))} /></FormField>
              </div>
              <FormField label="نص الشهادة"><textarea className="input-base resize-none" rows={4} value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} /></FormField>
              <FormField label="رابط الصورة" hint="اختياري"><input className="input-base" dir="ltr" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} /></FormField>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: 'var(--color-border)' }}>إلغاء</button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)' }}>
                {saving ? '...' : 'حفظ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <ConfirmModal open={!!delId} onConfirm={remove} onCancel={() => setDelId(null)} loading={saving} />
    </div>
  );
}

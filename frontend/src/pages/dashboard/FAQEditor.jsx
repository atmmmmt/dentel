import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import ConfirmModal from '../../components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const empty = { question: '', answer: '', isActive: true, displayOrder: 0 };

export default function FAQEditor() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(empty);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => adminApi.getFAQs().then(r => setItems(r.data.faqs || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const openEdit = (item = null) => { setIsNew(!item); setForm(item ? { ...item } : { ...empty }); setEditing(item?._id || 'new'); };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await adminApi.createFAQ(form);
      else await adminApi.updateFAQ(editing, form);
      toast.success('تم الحفظ'); setEditing(null); load();
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await adminApi.deleteFAQ(delId); toast.success('تم الحذف'); setDelId(null); load(); }
    catch { toast.error('فشل الحذف'); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="الأسئلة الشائعة" subtitle="أضف وعدّل الأسئلة والأجوبة"
        action={<button onClick={() => openEdit()} className="btn-primary gap-2"><Plus size={16} /> إضافة سؤال</button>} />

      <Card padding={false}>
        {items.length === 0
          ? <div className="text-center py-12" style={{ color: 'var(--color-muted)' }}>لا يوجد أسئلة بعد</div>
          : items.map((faq, i) => (
            <div key={faq._id} className="flex items-start gap-4 px-6 py-4 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{faq.question}</div>
                <div className="text-sm line-clamp-2" style={{ color: 'var(--color-muted)' }}>{faq.answer}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(faq)} className="p-2 rounded-lg border text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}><Edit2 size={14} /></button>
                <button onClick={() => setDelId(faq._id)} className="p-2 rounded-lg border text-red-400" style={{ borderColor: 'var(--color-border)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
      </Card>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border p-6" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--color-text)' }}>{isNew ? 'إضافة سؤال' : 'تعديل السؤال'}</h2>
            <div className="space-y-4">
              <FormField label="السؤال"><input className="input-base" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} /></FormField>
              <FormField label="الإجابة"><textarea className="input-base resize-none" rows={5} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} /></FormField>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ accentColor: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-text)' }}>نشط</span>
              </label>
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

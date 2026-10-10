import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Copy, Image as ImageIcon } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import ConfirmModal from '../../components/shared/ConfirmModal';
import toast from 'react-hot-toast';

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [delId, setDelId] = useState(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef();

  const load = () => adminApi.getMedia().then(r => setMedia(r.data.media || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('title', file.name);
        await adminApi.uploadMedia(fd);
      }
      toast.success('تم رفع الملفات');
      load();
    } catch { toast.error('فشل الرفع'); }
    finally { setUploading(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await adminApi.deleteMedia(delId); toast.success('تم الحذف'); setDelId(null); load(); }
    catch { toast.error('فشل الحذف'); } finally { setSaving(false); }
  };

  const copyUrl = (url) => { navigator.clipboard.writeText(url); toast.success('تم نسخ الرابط'); };

  return (
    <div>
      <PageTitle title="مكتبة الوسائط" subtitle={`${media.length} ملف`}
        action={
          <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary gap-2">
            <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'رفع صورة'}
          </button>
        } />
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />

      {media.length === 0 ? (
        <Card>
          <div className="text-center py-16" style={{ color: 'var(--color-muted)' }}>
            <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
            <p>لا توجد صور في المكتبة بعد</p>
            <button onClick={() => inputRef.current?.click()} className="btn-primary mt-4">
              <Upload size={15} /> رفع أول صورة
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((m, i) => (
            <motion.div key={m._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className="group relative rounded-2xl overflow-hidden border aspect-square"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <img src={m.url} alt={m.title || m.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => copyUrl(m.url)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"><Copy size={14} /></button>
                <button onClick={() => setDelId(m._id)} className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500"><Trash2 size={14} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmModal open={!!delId} onConfirm={remove} onCancel={() => setDelId(null)} loading={saving} message="هل تريد حذف هذه الصورة نهائياً؟" />
    </div>
  );
}

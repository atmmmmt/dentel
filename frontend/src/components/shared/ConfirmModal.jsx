import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div
            className="relative rounded-2xl p-6 w-full max-w-sm border shadow-xl"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-lg font-bold mb-2">{title || 'تأكيد الحذف'}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{message || 'هل أنت متأكد من هذا الإجراء؟'}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm border font-medium" style={{ borderColor: 'var(--color-border)' }}>إلغاء</button>
              <button onClick={onConfirm} disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                {loading ? '...' : 'حذف'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { Save, Eye } from 'lucide-react';

export default function SaveBar({ onSave, saving, onPreview }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-8 p-4 rounded-2xl border"
      style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>التغييرات تُحفظ فوراً وتظهر على الموقع العام</p>
      <div className="flex items-center gap-3">
        {onPreview && (
          <a href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border font-medium transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
            <Eye size={15} /> معاينة
          </a>
        )}
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: 'var(--color-primary)' }}>
          <Save size={15} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}

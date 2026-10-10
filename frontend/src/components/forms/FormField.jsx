export default function FormField({ label, error, children, hint }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      {children}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

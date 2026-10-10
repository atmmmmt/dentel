export default function PageTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{title}</h1>
        {subtitle && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

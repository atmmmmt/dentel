export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`rounded-2xl border ${padding ? 'p-6' : ''} ${className}`}
      style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-16" style={{ background: 'var(--color-bg)' }}>
      <motion.div className="text-center px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-8xl font-black mb-4 gradient-text">404</div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>الصفحة غير موجودة</h1>
        <p className="mb-8" style={{ color: 'var(--color-muted)' }}>عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        <Link to="/" className="btn-primary"><Home size={16} /> العودة للرئيسية</Link>
      </motion.div>
    </div>
  );
}

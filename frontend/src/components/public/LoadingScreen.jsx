import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import BrandLogo from '../shared/BrandLogo';

export default function LoadingScreen() {
  const { settings } = useApp();
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'var(--color-dark)' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.6, ease: 'easeInOut' } }}
        >
          <motion.div
            initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: .65, ease: 'easeOut' }}>
              <BrandLogo light />
            </motion.div>
            <motion.h1
              className="text-white text-xl font-bold text-center"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              {settings?.loadingText || 'Dentovi — منصة إدارة عيادات الأسنان'}
            </motion.h1>
            <motion.div
              initial={reduceMotion ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
              className="h-0.5 w-32 rounded-full origin-right"
              style={{ background: 'var(--color-primary)' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

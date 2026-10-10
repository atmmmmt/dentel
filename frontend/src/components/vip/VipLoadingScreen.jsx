import { motion, AnimatePresence } from 'framer-motion';

export default function VipLoadingScreen({ logo, clinicName }) {
  return (
    <AnimatePresence>
      <motion.div
        key="vip-loading"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: '#1a1a1a' }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-5"
        >
          {logo ? (
            <img src={logo} alt={clinicName} className="h-20 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5l1 4c.3 1.2 1 2 2 2h4c1 0 1.7-.8 2-2l1-4c.5-1.5 1-3 1-5 0-3-2-6-6-6z" fill="white" opacity="0.9"/>
              </svg>
            </div>
          )}

          {clinicName && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-white/80 text-base font-semibold tracking-wide"
            >
              {clinicName}
            </motion.p>
          )}

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: 'easeInOut' }}
            className="h-[2px] w-24 rounded-full bg-white/40 origin-right"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

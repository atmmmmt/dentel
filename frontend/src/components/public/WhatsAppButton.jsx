import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export default function WhatsAppButton() {
  const { openWhatsApp, settings } = useApp();
  if (!settings?.whatsappNumber) return null;

  return (
    <motion.button
      onClick={() => openWhatsApp()}
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white"
      style={{ background: '#25D366' }}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3, type: 'spring' }}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      aria-label="تواصل واتساب"
    >
      <MessageCircle size={26} fill="white" />
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center animate-pulse">1</span>
    </motion.button>
  );
}

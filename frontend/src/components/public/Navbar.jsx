import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

const links = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/features', label: 'الميزات' },
  { to: '/pricing', label: 'الاشتراك' },
  { to: '/demo', label: 'الديمو' },
  { to: '/contact', label: 'تواصل معنا' },
];

export function BrandMark({ light = false, settings }) {
  return (
    <span className="flex items-center gap-2.5">
      {settings?.logo
        ? <img src={settings.logo} alt={settings?.brandName || 'Prootech'} className="h-9 object-contain" />
        : <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#2CC5BE] to-[#137F7F] text-white shadow-lg shadow-[#1FA6A6]/30"><Stethoscope size={18} /></span>}
      <span className="leading-tight">
        <b className={`block text-[15px] ${light ? 'text-white' : 'text-[#0B2A40]'}`}>Prootech</b>
        <span className={`block text-[11px] font-medium ${light ? 'text-white/55' : 'text-slate-400'}`}>Dental Clinic Pro</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const { settings, openWhatsApp } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  // Every public page opens on a dark hero, so the bar is transparent/white-text until scrolled.
  const solid = scrolled || open;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${solid ? 'bg-white/90 shadow-[0_1px_0_rgba(15,23,42,.08)] backdrop-blur-xl' : 'bg-transparent'}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="Prootech"><BrandMark light={!solid} settings={settings} /></Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `rounded-xl px-4 py-2 text-[15px] font-medium transition ${solid
                ? (isActive ? 'bg-[#E3F6F5] text-[#137F7F]' : 'text-slate-600 hover:text-[#0B2A40]')
                : (isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white')}`}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => openWhatsApp()}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-br from-[#22B5B1] to-[#168B8B] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#1FA6A6]/30 transition hover:-translate-y-0.5 md:inline-flex">
            <MessageCircle size={16} />احجز عرضاً
          </button>
          <button onClick={() => setOpen(!open)} aria-label="القائمة" aria-expanded={open}
            className={`grid size-11 place-items-center rounded-xl md:hidden ${solid ? 'text-[#0B2A40]' : 'text-white'}`}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden">
            <nav className="space-y-1 px-5 py-4">
              {links.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => `block rounded-xl px-4 py-3 text-base font-medium ${isActive ? 'bg-[#E3F6F5] text-[#137F7F]' : 'text-slate-600'}`}>
                  {label}
                </NavLink>
              ))}
              <button onClick={() => openWhatsApp()} className="pt-btn-primary mt-3 w-full justify-center"><MessageCircle size={17} />احجز عرضاً مباشراً</button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

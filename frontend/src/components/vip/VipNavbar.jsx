import { useState, useEffect } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVipSettings } from '../../context/VipSettingsContext';
import { useCustomDomainSlug } from '../../context/CustomDomainContext';

export default function VipNavbar() {
  const { slug: paramSlug } = useParams();
  const ctxSlug = useCustomDomainSlug();
  const slug = paramSlug || ctxSlug;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { settings, clinic } = useVipSettings() || {};
  const phone = settings?.phone || '';
  const logoUrl = settings?.logo || '';
  const clinicName = settings?.clinicNameAr || clinic?.clinicName || '';

  const base = ctxSlug ? '' : `/clinic/${slug}`;
  const navLinks = [
    { to: base,                            label: 'الرئيسية', end: true },
    { to: `${base}/about`,                 label: 'عن الدكتور' },
    { to: `${base}/services`,              label: 'الخدمات' },
    { to: `${base}/gallery`,               label: 'الأعمال' },
    { to: `${base}/book`,                  label: 'احجز موعد' },
    { to: `${base}/contact`,               label: 'تواصل معنا' },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/96 backdrop-blur-sm shadow-sm border-b border-border' : 'bg-transparent'
    }`}>
      <div className="container-custom">
        <div className="flex items-center h-18 py-3 gap-6">
          <Link to={base} className="flex items-center flex-shrink-0">
            {logoUrl
              ? <img src={logoUrl} alt={clinicName} className="h-[66px] w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
              : <span className="text-lg font-bold text-charcoal">{clinicName}</span>
            }
          </Link>

          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            {navLinks.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-[14px] font-semibold transition-all duration-150 ${
                    isActive ? 'text-charcoal bg-cream-dark' : 'text-charcoal-light hover:text-charcoal hover:bg-cream-dark'
                  }`
                }
              >{label}</NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 mr-auto lg:mr-0">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`}
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-charcoal-light hover:text-charcoal transition-colors">
                <Phone size={15} />
                <span>{phone}</span>
              </a>
            )}
            <Link to={`${base}/book`} className="hidden lg:inline-flex btn-primary py-2.5 px-5 text-sm">
              احجز الآن
            </Link>
            <button onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-xl hover:bg-cream-dark transition-colors text-charcoal">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }} className="lg:hidden bg-white border-t border-border shadow-lg">
            <div className="container-custom py-4 space-y-1">
              {navLinks.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl text-[15px] font-semibold transition-colors ${
                      isActive ? 'bg-cream-dark text-charcoal' : 'text-charcoal-light hover:bg-cream-dark hover:text-charcoal'
                    }`
                  }
                >{label}</NavLink>
              ))}
              <div className="pt-3 border-t border-border">
                <Link to={`${base}/book`} onClick={() => setOpen(false)} className="btn-primary w-full justify-center">
                  احجز موعدك الآن
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

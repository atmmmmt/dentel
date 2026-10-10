import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [landing, setLanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, lRes] = await Promise.all([publicApi.getSettings(), publicApi.getLanding()]);
        setSettings(sRes.data.settings);
        setLanding(lRes.data.content);

        // The public product identity is intentionally fixed. Clinic branding is configured
        // inside each clinic; it must not overwrite the SaaS brand from database settings.
        document.documentElement.style.setProperty('--color-primary', '#1FA6A6');
        document.documentElement.style.setProperty('--color-primary-hover', '#168B8B');
        document.documentElement.style.setProperty('--color-dark', '#12324A');
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openWhatsApp = (pkg = null) => {
    const num = settings?.whatsappNumber?.replace(/\D/g, '') || '';
    // No sales number configured yet → the contact form still captures the lead.
    if (!num) { navigate(pkg ? `/contact?plan=${encodeURIComponent(pkg)}` : '/contact'); return; }
    let msg = settings?.whatsappMessage || 'مرحباً Prootech، أرغب بالحصول على نسخة من نظام عيادة الأسنان الاحترافي ومعرفة الباقات والتفاصيل.';
    if (pkg) msg = `مرحباً Prootech، أرغب بالاستفسار عن باقة ${pkg}. ${msg}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <AppContext.Provider value={{ settings, landing, loading, openWhatsApp }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

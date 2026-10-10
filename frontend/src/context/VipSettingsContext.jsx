import { createContext, useContext, useState, useEffect } from 'react';
import { createVipPublicApi } from '../services/vipPublicApi';

const VipSettingsContext = createContext(null);

export function VipSettingsProvider({ slug, children }) {
  const [settings, setSettings] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    createVipPublicApi(slug).getSettings()
      .then(r => {
        setSettings(r.data.settings);
        setClinic(r.data.clinic);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <VipSettingsContext.Provider value={{ settings, clinic, loading }}>
      {children}
    </VipSettingsContext.Provider>
  );
}

export const useVipSettings = () => useContext(VipSettingsContext);

import { createContext, useContext, useState, useEffect } from 'react';
import { clinicAuthApi } from '../services/clinicApi';

const ClinicAuthContext = createContext(null);

export const ClinicAuthProvider = ({ children, slug }) => {
  const [clinic, setClinic] = useState(null);
  const [actor, setActor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('clinic_token');
    const savedSlug = localStorage.getItem('clinic_slug');
    if (!token || savedSlug !== slug) { setLoading(false); return; }
    clinicAuthApi.getMe(slug)
      .then(r => { setClinic(r.data.clinic); setActor(r.data.actor || null); })
      .catch(() => { localStorage.removeItem('clinic_token'); localStorage.removeItem('clinic_slug'); setActor(null); })
      .finally(() => setLoading(false));
  }, [slug]);

  const login = async (email, password) => {
    const res = await clinicAuthApi.login(slug, { email, password });
    localStorage.setItem('clinic_token', res.data.token);
    localStorage.setItem('clinic_slug', slug);
    setClinic(res.data.clinic);
    setActor(res.data.actor || null);
    return res.data.clinic;
  };

  const logout = () => {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_slug');
    setClinic(null);
    setActor(null);
  };

  return (
    <ClinicAuthContext.Provider value={{ clinic, actor, loading, login, logout }}>
      {children}
    </ClinicAuthContext.Provider>
  );
};

export const useClinicAuth = () => useContext(ClinicAuthContext);

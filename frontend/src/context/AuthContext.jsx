import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('prootech_dark') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const token = localStorage.getItem('prootech_token');
    if (!token) { setAuthLoading(false); return; }
    authApi.getMe()
      .then(res => setAdmin(res.data.admin))
      .catch(() => localStorage.removeItem('prootech_token'))
      .finally(() => setAuthLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('prootech_token', res.data.token);
    setAdmin(res.data.admin);
  };

  const logout = () => {
    localStorage.removeItem('prootech_token');
    setAdmin(null);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('prootech_dark', String(next));
  };

  return (
    <AuthContext.Provider value={{ admin, authLoading, login, logout, darkMode, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

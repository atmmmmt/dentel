import { Outlet } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import WhatsAppButton from '../components/public/WhatsAppButton';
import LoadingScreen from '../components/public/LoadingScreen';
import { useApp } from '../context/AppContext';

export default function PublicLayout() {
  const { settings, loading } = useApp();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div dir="rtl" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      {settings?.loadingEnabled && <LoadingScreen />}
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

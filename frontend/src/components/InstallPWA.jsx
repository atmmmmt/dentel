import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

/* زر تثبيت التطبيق على الجهاز (ويندوز/أندرويد).
   يظهر فقط عندما يسمح المتصفح بالتثبيت (beforeinstallprompt)،
   ويختفي بعد التثبيت أو إذا كان التطبيق مثبّتاً/مفتوحاً كتطبيق. */
export default function InstallPWA({ color = '#2D6BEB', label = 'ثبّت التطبيق', className = '' }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) { setInstalled(true); return; }
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  const install = async () => {
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* المستخدم أغلق */ }
    setDeferred(null);
  };

  return (
    <button onClick={install} title="ثبّت النظام على جهازك ليفتح كتطبيق"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-sm ${className}`}
      style={{ background: color }}>
      <Download size={16} /> {label}
    </button>
  );
}

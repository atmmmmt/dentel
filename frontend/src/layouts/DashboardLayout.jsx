import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Settings, FileText, Package, Star, HelpCircle,
  Users, Image, Search, Moon, Sun, LogOut, Menu, X, Globe,
  ExternalLink, User, Palette, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/shared/BrandLogo';

const navItems = [
  { to: '/product-admin', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/product-admin/clinics', label: 'إدارة العيادات', icon: Building2 },
  { to: '/product-admin/leads', label: 'العملاء المحتملون', icon: Users },
  { to: '/product-admin/landing', label: 'محرر اللاندينغ', icon: FileText },
  { to: '/product-admin/pricing', label: 'الباقات', icon: Package },
  { to: '/product-admin/testimonials', label: 'آراء العملاء', icon: Star },
  { to: '/product-admin/faq', label: 'الأسئلة الشائعة', icon: HelpCircle },
  { to: '/product-admin/media', label: 'مكتبة الوسائط', icon: Image },
  { to: '/product-admin/seo', label: 'إعدادات SEO', icon: Search },
  { to: '/product-admin/styles', label: 'الستايلات', icon: Palette },
  { to: '/product-admin/settings', label: 'الإعدادات العامة', icon: Settings },
  { to: '/product-admin/profile', label: 'الملف الشخصي', icon: User },
];

export default function DashboardLayout() {
  const { admin, logout, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/product-admin/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <BrandLogo light={darkMode} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--color-border)' }}>
        <a href="/" target="_blank" rel="noreferrer"
          className="sidebar-link flex items-center gap-3 text-sm">
          <Globe size={17} />
          <span>عرض الموقع</span>
          <ExternalLink size={13} className="mr-auto opacity-50" />
        </a>
        <button onClick={handleLogout} className="sidebar-link w-full text-right flex items-center gap-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut size={17} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className={`min-h-dvh flex ${darkMode ? 'dark' : ''}`}
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-arabic)' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-l shrink-0"
        style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', height: '100vh', position: 'sticky', top: 0 }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full border-l flex flex-col"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-5 py-3 border-b backdrop-blur-xl"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button aria-label="فتح القائمة" onClick={() => setSidebarOpen(true)} className="lg:hidden min-h-11 min-w-11 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 mr-auto">
            <button aria-label={darkMode ? 'تفعيل المظهر الفاتح' : 'تفعيل المظهر الداكن'} onClick={toggleDark} className="min-h-11 min-w-11 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--color-primary)' }}>
                {admin?.name?.[0] || 'A'}
              </div>
              <span className="text-sm font-medium hidden sm:block">{admin?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-5 md:p-8 overflow-y-auto">
          <div className="app-page"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}

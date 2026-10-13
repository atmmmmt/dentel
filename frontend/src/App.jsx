import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { CustomDomainSlugContext, CustomDomainInfoContext } from './context/CustomDomainContext';
import VipLoadingScreen from './components/vip/VipLoadingScreen';

const PLATFORM_HOSTS = [
  import.meta.env.VITE_PLATFORM_HOST?.toLowerCase(),
  'dash-dintist.euphoria-motiva.com',
  'app.prootech-cloud.com',
  'localhost',
  '127.0.0.1',
].filter(Boolean);

function CustomDomainGateway() {
  const [info, setInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const host = window.location.hostname;

  useEffect(() => {
    axios.get('/api/clinic/by-domain', { params: { domain: host } })
      .then(r => setInfo({ slug: r.data.slug, logo: r.data.logo || '', clinicName: r.data.clinicName || '' }))
      .catch(() => setNotFound(true));
  }, [host]);

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <div className="text-6xl mb-4">🦷</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">الدومين غير مرتبط</h1>
        <p className="text-gray-400 text-sm">هذا الدومين غير مرتبط بأي عيادة</p>
      </div>
    </div>
  );

  if (!info) return <VipLoadingScreen logo={null} clinicName="" />;

  return <CustomDomainApp slug={info.slug} logo={info.logo} clinicName={info.clinicName} />;
}

function CustomDomainApp({ slug, logo, clinicName }) {
  return (
    <CustomDomainSlugContext.Provider value={slug}>
    <CustomDomainInfoContext.Provider value={{ logo, clinicName }}>
      <ScrollToTop />
      <Routes>
        <Route element={<VipPublicLayout />}>
          <Route index element={<VipHomePage />} />
          <Route path="about" element={<VipAboutPage />} />
          <Route path="services" element={<VipServicesPage />} />
          <Route path="gallery" element={<VipGalleryPage />} />
          <Route path="book" element={<VipBookPage />} />
          <Route path="contact" element={<VipContactPage />} />
          <Route path="faq" element={<VipFAQPage />} />
          <Route path="hollywood-smile" element={<VipHollywoodSmilePage />} />
          <Route path="implants" element={<VipImplantsPage />} />
          <Route path="general-dentistry" element={<VipGeneralDentistryPage />} />
        </Route>
      </Routes>
    </CustomDomainInfoContext.Provider>
    </CustomDomainSlugContext.Provider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
import { useAuth } from './context/AuthContext';
import { ClinicAuthProvider, useClinicAuth } from './context/ClinicAuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import FeaturesPage from './pages/public/FeaturesPage';
import PricingPage from './pages/public/PricingPage';
import DemoPage from './pages/public/DemoPage';
import ContactPage from './pages/public/ContactPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Prootech dashboard pages
import LoginPage from './pages/dashboard/LoginPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import LandingEditor from './pages/dashboard/LandingEditor';
import PricingEditor from './pages/dashboard/PricingEditor';
import TestimonialsEditor from './pages/dashboard/TestimonialsEditor';
import FAQEditor from './pages/dashboard/FAQEditor';
import LeadsPage from './pages/dashboard/LeadsPage';
import GeneralSettings from './pages/dashboard/GeneralSettings';
import SEOSettings from './pages/dashboard/SEOSettings';
import ProfileSettings from './pages/dashboard/ProfileSettings';
import MediaLibrary from './pages/dashboard/MediaLibrary';
import StylesPage from './pages/dashboard/StylesPage';
import ClinicsPage from './pages/dashboard/ClinicsPage';

// Clinic pages
import ClinicLoginPage from './pages/clinic/ClinicLoginPage';
import ClinicOnboarding from './pages/clinic/ClinicOnboarding';
import ClinicDashboard from './pages/clinic/ClinicDashboard';
import ClinicPublicSite from './pages/clinic/ClinicPublicSite';
import WaitingScreen from './pages/clinic/WaitingScreen';
import DentalChart3D from './components/DentalChart3D';

// VIP Public Site
import VipPublicLayout from './layouts/VipPublicLayout';
import VipHomePage from './pages/clinic/vip/VipHomePage';
import VipAboutPage from './pages/clinic/vip/VipAboutPage';
import VipServicesPage from './pages/clinic/vip/VipServicesPage';
import VipGalleryPage from './pages/clinic/vip/VipGalleryPage';
import VipBookPage from './pages/clinic/vip/VipBookPage';
import VipContactPage from './pages/clinic/vip/VipContactPage';
import VipFAQPage from './pages/clinic/vip/VipFAQPage';
import VipHollywoodSmilePage from './pages/clinic/vip/VipHollywoodSmilePage';
import VipImplantsPage from './pages/clinic/vip/VipImplantsPage';
import VipGeneralDentistryPage from './pages/clinic/vip/VipGeneralDentistryPage';

const PrivateRoute = ({ children }) => {
  const { admin, authLoading } = useAuth();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  return admin ? children : <Navigate to="/product-admin/login" replace />;
};

function ClinicAuthWrapper({ children }) {
  const { slug } = useParams();
  return <ClinicAuthProvider slug={slug}>{children}</ClinicAuthProvider>;
}

function ClinicOnboardingGate() {
  const { slug } = useParams();
  const { clinic, loading } = useClinicAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return !clinic ? <Navigate to={`/clinic/${slug}/login`} replace /> : <ClinicOnboarding />;
}

function ClinicDashboardGate() {
  const { slug } = useParams();
  const { clinic, loading } = useClinicAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  if (!clinic) return <Navigate to={`/clinic/${slug}/login`} replace />;
  return !clinic.onboardingCompleted ? <Navigate to={`/clinic/${slug}/onboarding`} replace /> : <ClinicDashboard />;
}

export default function App() {
  const host = window.location.hostname;
  // Hostinger's temporary *.hostingersite.com URLs are SaaS previews, not client domains.
  const isHostingerPreview = host.endsWith('.hostingersite.com');
  const isCustomDomain = !isHostingerPreview && !PLATFORM_HOSTS.some(h => host === h || host.endsWith(`.${h}`));

  if (isCustomDomain) {
    return <CustomDomainGateway />;
  }

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Prootech Product Landing */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Prootech Admin Dashboard */}
      <Route path="/product-admin/login" element={<LoginPage />} />
      <Route path="/product-admin" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="clinics" element={<ClinicsPage />} />
        <Route path="landing" element={<LandingEditor />} />
        <Route path="pricing" element={<PricingEditor />} />
        <Route path="testimonials" element={<TestimonialsEditor />} />
        <Route path="faq" element={<FAQEditor />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="styles" element={<StylesPage />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="seo" element={<SEOSettings />} />
        <Route path="settings" element={<GeneralSettings />} />
        <Route path="profile" element={<ProfileSettings />} />
      </Route>

      {/* Clinic Auth + Onboarding + Dashboard */}
      <Route path="/clinic/:slug/login" element={<ClinicAuthWrapper><ClinicLoginPage /></ClinicAuthWrapper>} />
      <Route path="/clinic/:slug/onboarding" element={<ClinicAuthWrapper><ClinicOnboardingGate /></ClinicAuthWrapper>} />
      <Route path="/clinic/:slug/dashboard/*" element={<ClinicAuthWrapper><ClinicDashboardGate /></ClinicAuthWrapper>} />

      {/* شاشة غرفة الانتظار — عامة، ملء الشاشة */}
      <Route path="/clinic/:slug/waiting" element={<WaitingScreen />} />

      {/* Clinic Public Website - VIP multi-page design */}
      <Route path="/clinic/:slug" element={<VipPublicLayout />}>
        <Route index element={<VipHomePage />} />
        <Route path="about" element={<VipAboutPage />} />
        <Route path="services" element={<VipServicesPage />} />
        <Route path="gallery" element={<VipGalleryPage />} />
        <Route path="book" element={<VipBookPage />} />
        <Route path="contact" element={<VipContactPage />} />
        <Route path="faq" element={<VipFAQPage />} />
        <Route path="hollywood-smile" element={<VipHollywoodSmilePage />} />
        <Route path="implants" element={<VipImplantsPage />} />
        <Route path="general-dentistry" element={<VipGeneralDentistryPage />} />
      </Route>

      {import.meta.env.DEV && <Route path="/dev/jaw" element={<div style={{ padding: 20 }}><DentalChart3D records={[{ tooth: 16, condition: 'filling' }, { tooth: 21, condition: 'crown' }, { tooth: 36, condition: 'extraction' }]} maxWidth={1200} height={760} /></div>} />}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

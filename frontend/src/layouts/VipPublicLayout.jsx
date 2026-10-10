import { useParams } from 'react-router-dom';
import { VipSettingsProvider, useVipSettings } from '../context/VipSettingsContext';
import VipSEO from '../components/vip/VipSEO';
import VipNavbar from '../components/vip/VipNavbar';
import VipFooter from '../components/vip/VipFooter';
import VipLoadingScreen from '../components/vip/VipLoadingScreen';
import { Outlet } from 'react-router-dom';
import { useCustomDomainSlug, useCustomDomainInfo } from '../context/CustomDomainContext';
import { AnimatePresence, motion } from 'framer-motion';

function VipInner() {
  const { settings, clinic, loading } = useVipSettings() || {};
  const domainInfo = useCustomDomainInfo();

  if (loading) {
    const logo = domainInfo?.logo || null;
    const name = domainInfo?.clinicName || '';
    return <VipLoadingScreen logo={logo} clinicName={name} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="vip-site"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="min-h-screen flex flex-col bg-cream"
        dir="rtl"
      >
        <VipSEO />
        <VipNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <VipFooter />
      </motion.div>
    </AnimatePresence>
  );
}

export default function VipPublicLayout() {
  const { slug: paramSlug } = useParams();
  const ctxSlug = useCustomDomainSlug();
  const slug = paramSlug || ctxSlug;
  return (
    <VipSettingsProvider slug={slug}>
      <VipInner />
    </VipSettingsProvider>
  );
}

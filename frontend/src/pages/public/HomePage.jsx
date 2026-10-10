import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hero, IncludedStrip, BeforeAfter, ProductTour, FeatureBento, DomainSection,
  LaunchTimeline, PricingPlan, Comparison, Testimonials, FAQ, FinalCTA,
} from '../../components/landing/Sections';

export default function HomePage() {
  const { settings } = useApp();

  useEffect(() => {
    document.title = settings?.metaTitle || 'نظام عيادة الأسنان الاحترافي | Prootech';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = settings?.metaDescription || '';
  }, [settings]);

  return (
    <>
      <Hero />
      <IncludedStrip />
      <BeforeAfter />
      <ProductTour />
      <FeatureBento />
      <DomainSection />
      <LaunchTimeline />
      <PricingPlan />
      <Comparison />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}

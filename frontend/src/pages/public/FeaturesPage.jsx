import { PageHero, ProductTour, FeatureBento, DomainSection, LaunchTimeline, Comparison, FinalCTA } from '../../components/landing/Sections';

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="الميزات الكاملة" title="كل أدوات عيادتك في نظام واحد" subtitle="من أول حجز يصل من موقعك، إلى الجلسة على مخطط الأسنان، إلى آخر دفعة في التقرير الشهري." />
      <ProductTour />
      <FeatureBento />
      <DomainSection />
      <Comparison />
      <LaunchTimeline />
      <FinalCTA />
    </>
  );
}

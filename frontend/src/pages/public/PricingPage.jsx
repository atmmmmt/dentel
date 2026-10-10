import { PageHero, PricingPlan, Comparison, FAQ, FinalCTA } from '../../components/landing/Sections';

export default function PricingPage() {
  return (
    <>
      <PageHero eyebrow="الاشتراك" title="سعر واحد واضح. كل شيء مشمول." subtitle="دفع نقدي سنوي، أول اشتراك 13 شهراً بسعر 12، وتجهيز كامل خلال 48 ساعة." />
      <PricingPlan />
      <Comparison />
      <FAQ />
      <FinalCTA />
    </>
  );
}

import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

const steps = [
  { num: '01', title: 'الاستشارة', desc: 'نبدأ بفهم احتياجاتك وتصميم الابتسامة المثالية لك.' },
  { num: '02', title: 'التصميم الرقمي', desc: 'نستخدم أحدث التقنيات لتصميم ابتسامتك قبل التنفيذ.' },
  { num: '03', title: 'التنفيذ', desc: 'تركيب القشور أو التيجان بدقة عالية ونتائج طبيعية مذهلة.' },
  { num: '04', title: 'التسليم', desc: 'ابتسامة هوليوود جاهزة، مشرقة ومثالية لك.' },
];

const benefits = [
  'نتائج طبيعية ومذهلة', 'إجراء سريع وآمن', 'متانة طويلة الأمد',
  'تصميم مخصص لكل حالة', 'تقنيات رقمية متقدمة', 'نتائج فورية',
];

export default function VipHollywoodSmilePage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};
  const base = `/clinic/${slug}`;
  const heroImage = settings?.heroImage;

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-cream">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()}>
              <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">تجميل الأسنان</p>
              <h1 className="text-[52px] md:text-[40px] font-extrabold text-charcoal leading-tight mb-6">
                ابتسامة <span className="text-silver-dark">هوليوود</span>
              </h1>
              <p className="text-charcoal-light text-lg leading-relaxed mb-8">
                حوّل ابتسامتك إلى تحفة فنية مع أحدث تقنيات القشور الخزفية والتيجان الزيركون. ابتسامة طبيعية، مشرقة، ودائمة.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={`${base}/book`} className="btn-primary">احجز استشارة مجانية <ArrowLeft size={16} /></Link>
                <Link to={`${base}/gallery`} className="btn-secondary">شاهد الأعمال</Link>
              </div>
            </motion.div>
            {heroImage && (
              <motion.div {...fadeUp(0.2)} className="hidden lg:block">
                <div className="rounded-[40px] overflow-hidden border border-border shadow-card-hover aspect-square max-w-md mx-auto">
                  <img src={heroImage} alt="ابتسامة هوليوود" className="w-full h-full object-cover" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="section-title">خطوات الحصول على ابتسامتك</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }, i) => (
              <motion.div key={num} {...fadeUp(i * 0.1)} className="text-center">
                <div className="w-16 h-16 rounded-full bg-cream border-2 border-silver flex items-center justify-center text-silver-dark font-extrabold text-xl mx-auto mb-4">
                  {num}
                </div>
                <h3 className="font-bold text-charcoal mb-2">{title}</h3>
                <p className="text-charcoal-light text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-cream">
        <div className="container-custom">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="section-title">مميزات ابتسامة هوليوود</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={b} {...fadeUp(i * 0.07)} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-border">
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-charcoal text-sm">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark text-center">
        <div className="container-custom">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl font-extrabold text-white mb-5">جاهز لابتسامة هوليوود؟</h2>
            <p className="text-white/55 mb-8 max-w-md mx-auto">احجز استشارتك المجانية الآن واكتشف كيف يمكننا تحويل ابتسامتك.</p>
            <Link to={`${base}/book`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-charcoal font-bold rounded-btn hover:bg-cream transition-colors">
              احجز الآن <ArrowLeft size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

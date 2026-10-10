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

const advantages = [
  'يبدو ويشعر تماماً كالسن الطبيعي', 'لا يؤثر على الأسنان المجاورة',
  'يدوم مدى الحياة مع العناية الصحيحة', 'يحافظ على عظم الفك',
  'لا يحتاج إلى نزعه أو تركيبه يومياً', 'يمكنك الأكل والتحدث بثقة',
];

export default function VipImplantsPage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};
  const base = `/clinic/${slug}`;

  return (
    <>
      <section className="pt-32 pb-20 bg-cream">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div {...fadeUp()}>
              <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">زراعة الأسنان</p>
              <h1 className="text-[52px] md:text-[40px] font-extrabold text-charcoal leading-tight mb-6">
                زراعة الأسنان
              </h1>
              <p className="text-charcoal-light text-lg leading-relaxed mb-8">
                الحل الدائم والأمثل لاستبدال الأسنان المفقودة. زراعة بتقنيات حديثة، نتائج طبيعية، وثقة لا تُقدر بثمن.
              </p>
              <Link to={`${base}/book`} className="btn-primary">احجز استشارة مجانية <ArrowLeft size={16} /></Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="section-title">مميزات زراعة الأسنان</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {advantages.map((a, i) => (
              <motion.div key={a} {...fadeUp(i * 0.07)} className="flex items-center gap-3 bg-cream rounded-xl p-5 border border-border">
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-charcoal text-sm">{a}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-custom max-w-3xl">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="section-title">مراحل الزراعة</h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { n: '1', t: 'الفحص والتصوير', d: 'تصوير شامل بالأشعة لتقييم كثافة العظم وتحديد الخطة المثلى.' },
              { n: '2', t: 'زراعة الدعامة', d: 'زرع الدعامة التيتانيوم داخل العظم تحت تخدير موضعي كامل.' },
              { n: '3', t: 'فترة التئام العظم', d: 'انتظار 3-6 أشهر حتى تندمج الدعامة تماماً مع العظم.' },
              { n: '4', t: 'تركيب التاج', d: 'تركيب التاج الخزفي الطبيعي المظهر على الدعامة.' },
            ].map(({ n, t, d }, i) => (
              <motion.div key={n} {...fadeUp(i * 0.1)} className="flex gap-5 bg-white rounded-card p-6 border border-border">
                <div className="w-10 h-10 rounded-full bg-dark text-white font-extrabold flex items-center justify-center flex-shrink-0 text-sm">{n}</div>
                <div>
                  <h3 className="font-bold text-charcoal mb-1">{t}</h3>
                  <p className="text-charcoal-light text-sm leading-relaxed">{d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark text-center">
        <div className="container-custom">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl font-extrabold text-white mb-5">هل أنت مرشح لزراعة الأسنان؟</h2>
            <p className="text-white/55 mb-8 max-w-md mx-auto">احجز استشارتك وسنقيّم حالتك بدقة ونضع لك خطة علاج مناسبة.</p>
            <Link to={`${base}/book`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-charcoal font-bold rounded-btn hover:bg-cream transition-colors">
              احجز الآن <ArrowLeft size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

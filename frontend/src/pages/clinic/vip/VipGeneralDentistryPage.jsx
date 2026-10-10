import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';
import { createVipPublicApi } from '../../../services/vipPublicApi';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

const defaultServices = [
  { name: 'حشوات الأسنان', description: 'علاج التسوس بحشوات عالية الجودة بألوان مطابقة للأسنان.', icon: '🦷' },
  { name: 'تنظيف الأسنان', description: 'إزالة الجير والترسبات للحفاظ على صحة اللثة والأسنان.', icon: '✨' },
  { name: 'خلع الأسنان', description: 'إجراء آمن ومريح تحت تخدير موضعي كامل وفعّال.', icon: '⚕️' },
  { name: 'علاج جذور الأسنان', description: 'إنقاذ الأسنان المتضررة بعلاج قناة الجذر الحديث.', icon: '🔬' },
  { name: 'علاج اللثة', description: 'علاج أمراض اللثة والتهاباتها للحفاظ على صحة الفم.', icon: '💚' },
  { name: 'الفحص الدوري', description: 'كشف مبكر للمشاكل والوقاية خير من العلاج.', icon: '🔍' },
];

export default function VipGeneralDentistryPage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};
  const [services, setServices] = useState([]);
  const base = `/clinic/${slug}`;

  useEffect(() => {
    if (!slug) return;
    createVipPublicApi(slug).getServices()
      .then(r => setServices(r.data.services || []))
      .catch(() => {});
  }, [slug]);

  const display = services.length > 0 ? services : defaultServices;

  return (
    <>
      <section className="pt-32 pb-20 bg-cream">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">طب الأسنان العام</p>
            <h1 className="text-[52px] md:text-[40px] font-extrabold text-charcoal leading-tight mb-6">طب الأسنان العام</h1>
            <p className="text-charcoal-light text-lg leading-relaxed mb-8">
              رعاية شاملة لأسنانك تبدأ من الفحص والوقاية وصولاً إلى العلاج المتكامل.
            </p>
            <Link to={`${base}/book`} className="btn-primary">احجز موعدك <ArrowLeft size={16} /></Link>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {display.map(({ _id, name, description, icon }, i) => (
              <motion.div key={_id || i} {...fadeUp(i * 0.08)}
                className="bg-cream rounded-card p-7 border border-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="text-3xl mb-4">{icon || '🦷'}</div>
                <h3 className="font-bold text-charcoal text-lg mb-2">{name}</h3>
                <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-dark text-center">
        <div className="container-custom">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl font-extrabold text-white mb-5">ابدأ رحلة الاهتمام بأسنانك</h2>
            <Link to={`${base}/book`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-charcoal font-bold rounded-btn hover:bg-cream transition-colors">
              احجز الآن <ArrowLeft size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

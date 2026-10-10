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

export default function VipServicesPage() {
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

  const display = services.length > 0 ? services : (settings?.services || []).filter(s => s.isActive);

  return (
    <>
      <section className="pt-32 pb-16 bg-cream">
        <div className="container-custom text-center">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">ما نقدمه</p>
            <h1 className="section-title mb-4">خدماتنا</h1>
            <p className="text-charcoal-light text-lg max-w-xl mx-auto">
              نقدم طيفاً واسعاً من خدمات طب وتجميل الأسنان بأعلى معايير الجودة والرعاية.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {display.length === 0 ? (
            <div className="text-center py-20 text-charcoal-light">جاري تحميل الخدمات...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {display.map(({ _id, name, description, icon, price }, i) => (
                <motion.div key={_id || i} {...fadeUp(i * 0.08)}
                  className="bg-cream rounded-card p-8 border border-border hover:border-silver-dark hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-3xl mb-6 border border-border">
                    {icon || '🦷'}
                  </div>
                  <h3 className="text-xl font-bold text-charcoal mb-3">{name}</h3>
                  <p className="text-charcoal-light text-sm leading-relaxed mb-4">{description}</p>
                  {price && (
                    <p className="text-silver-dark font-bold text-sm">{price}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <motion.div {...fadeUp(0.3)} className="text-center mt-14">
            <p className="text-charcoal-light mb-6">هل لديك سؤال عن خدمة معينة؟</p>
            <Link to={`${base}/book`} className="btn-primary">احجز استشارة مجانية <ArrowLeft size={16} /></Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

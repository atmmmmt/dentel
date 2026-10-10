import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, GraduationCap, Users } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

export default function VipAboutPage() {
  const { slug } = useParams();
  const { settings, clinic } = useVipSettings() || {};
  const base = `/clinic/${slug}`;

  const doctorName    = clinic?.doctorName || '';
  const specialty     = settings?.doctorSpecialty || 'أخصائي طب وتجميل الأسنان';
  const heroImage     = settings?.heroImage || null;
  const bio           = settings?.doctorBio || '';
  const trustPoints   = settings?.trustPoints || [
    { title: 'تقنيات متقدمة', desc: 'نستخدم أحدث التقنيات الرقمية في التشخيص والعلاج.' },
    { title: 'خبرة واسعة', desc: 'أكثر من 8 سنوات من الخبرة في طب وتجميل الأسنان.' },
    { title: 'تعقيم كامل', desc: 'معايير تعقيم صارمة تضمن سلامة جميع مرضانا.' },
  ];
  const philosophyItems = settings?.philosophyItems || [];
  const stats = [
    { num: '500+', label: 'مريض راضٍ', icon: Users },
    { num: '8+',   label: 'سنوات خبرة', icon: Award },
    { num: '98%',  label: 'نسبة الرضا',  icon: GraduationCap },
  ];

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 bg-cream">
        <div className="container-custom text-center">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">من نحن</p>
            <h1 className="section-title mb-4">عن الدكتور {doctorName}</h1>
            <p className="text-charcoal-light text-lg max-w-xl mx-auto">{specialty}</p>
          </motion.div>
        </div>
      </section>

      {/* Doctor section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {heroImage && (
              <motion.div {...fadeUp(0.1)}>
                <div className="rounded-[40px] overflow-hidden border border-border shadow-card-hover aspect-[4/5] max-w-sm mx-auto lg:mx-0">
                  <img src={heroImage} alt={doctorName} className="w-full h-full object-cover" />
                </div>
              </motion.div>
            )}
            <motion.div {...fadeUp(0.2)}>
              <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">التعريف</p>
              <h2 className="text-3xl font-extrabold text-charcoal mb-6">{doctorName}</h2>
              <p className="text-charcoal-light font-semibold mb-4">{specialty}</p>
              {bio && <p className="text-charcoal-light leading-relaxed mb-8">{bio}</p>}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map(({ num, label }) => (
                  <div key={label} className="bg-cream rounded-2xl p-4 border border-border text-center">
                    <p className="text-2xl font-extrabold text-charcoal">{num}</p>
                    <p className="text-xs text-charcoal-light mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <Link to={`${base}/book`} className="btn-primary">احجز موعدك <ArrowLeft size={16} /></Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust points */}
      {trustPoints.length > 0 && (
        <section className="section-padding bg-cream">
          <div className="container-custom">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <h2 className="section-title">لماذا تختارنا؟</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {trustPoints.map(({ title, desc, icon }, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} className="bg-white rounded-card p-8 border border-border hover:shadow-card-hover transition-all">
                  <div className="text-3xl mb-4">{icon || '✓'}</div>
                  <h3 className="font-bold text-charcoal text-lg mb-3">{title}</h3>
                  <p className="text-charcoal-light text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      {philosophyItems.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <h2 className="section-title">فلسفة العيادة</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {philosophyItems.map(({ title, desc, icon }, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} className="flex gap-4 bg-cream rounded-card p-6 border border-border">
                  <div className="text-2xl flex-shrink-0">{icon || '🦷'}</div>
                  <div>
                    <h3 className="font-bold text-charcoal mb-2">{title}</h3>
                    <p className="text-charcoal-light text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-dark text-center">
        <div className="container-custom">
          <motion.div {...fadeUp()}>
            <h2 className="text-3xl font-extrabold text-white mb-5">جاهز لتغيير ابتسامتك؟</h2>
            <Link to={`${base}/book`} className="inline-flex items-center gap-2 px-8 py-3 bg-white text-charcoal font-bold rounded-btn hover:bg-cream transition-colors">
              احجز موعدك الآن <ArrowLeft size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

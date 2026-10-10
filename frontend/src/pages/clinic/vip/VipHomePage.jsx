import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';
import { createVipPublicApi } from '../../../services/vipPublicApi';
import { useCustomDomainSlug } from '../../../context/CustomDomainContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function VipHomePage() {
  const { slug: paramSlug } = useParams();
  const ctxSlug = useCustomDomainSlug();
  const slug = paramSlug || ctxSlug;
  const { settings, clinic } = useVipSettings() || {};
  const [gallery, setGallery] = useState([]);

  const base = ctxSlug ? '' : `/clinic/${slug}`;
  const doctorName    = clinic?.doctorName || settings?.clinicNameAr || '';
  const heroTitle     = settings?.heroTitle    || 'ابتسامتك تبدأ من أساس قوي';
  const heroSubtitle  = settings?.heroSubtitle || 'رعاية سنية متقدمة تجمع بين الدقة، الخبرة، والتقنيات الحديثة لابتسامة صحية تدوم.';
  const heroImageUrl  = settings?.heroImage || null;
  const heroBadge1    = settings?.heroBadge1 || 'تعقيم معتمد';
  const heroBadge2Label = settings?.heroBadge2Label || 'المواعيد المتاحة';
  const heroBadge2Sub = settings?.heroBadge2Sub || 'احجز الآن';
  const ctaTitle      = settings?.ctaTitle || 'جاهز لتغيير ابتسامتك؟';
  const ctaSubtitle   = settings?.ctaSubtitle || 'احجز استشارتك المجانية الآن ودعنا نضع لك الخطة المثالية لابتسامة صحية ومشرقة.';
  const whatsapp      = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g,'')}` : '#';
  const stats         = [{ num: '500+', label: 'مريض راضٍ' }, { num: '8+', label: 'سنوات خبرة' }, { num: '98%', label: 'نسبة الرضا' }];

  const services = (settings?.services || []).filter(s => s.isActive).slice(0, 3);

  useEffect(() => {
    if (!slug) return;
    createVipPublicApi(slug).getGallery(true)
      .then(r => setGallery((r.data.cases || []).slice(0, 4)))
      .catch(() => {});
  }, [slug]);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-cream overflow-hidden pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full bg-silver/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-silver-light/20 blur-3xl" />
        </div>
        <div className="container-custom relative z-10 py-20 md:py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp(0)}>
              <div className="inline-flex items-center gap-2 bg-silver-light/40 border border-silver rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-charcoal font-bold text-sm">عيادة {doctorName} للأسنان</span>
              </div>
              <h1 className="text-[58px] md:text-[44px] sm:text-[34px] font-extrabold text-charcoal leading-[1.12] tracking-tight mb-6">
                {heroTitle.includes('من') ? (
                  <>{heroTitle.split('من')[0]}<br /><span className="text-silver-dark">من {heroTitle.split('من').slice(1).join('من')}</span></>
                ) : heroTitle}
              </h1>
              <p className="text-[17px] text-charcoal-light leading-[1.85] mb-10 max-w-lg">{heroSubtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link to={`${base}/book`} className="btn-primary text-[15px] px-8">احجز موعدك الآن <ArrowLeft size={16} /></Link>
                <Link to={`${base}/gallery`} className="btn-secondary text-[15px] px-8">شاهد الأعمال</Link>
              </div>
              <div className="flex flex-wrap gap-10 mt-14">
                {stats.map(({ num, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-extrabold text-charcoal">{num}</p>
                    <p className="text-sm text-charcoal-light font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp(0.2)} className="relative hidden lg:block">
              <div className="w-full aspect-square max-w-[480px] mx-auto rounded-[40px] overflow-hidden border border-border shadow-card-hover">
                {heroImageUrl
                  ? <img src={heroImageUrl} alt={doctorName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-silver-light/30 to-cream-dark flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="text-9xl mb-6">🦷</div>
                        <p className="font-extrabold text-charcoal text-xl">{doctorName}</p>
                      </div>
                    </div>
                }
              </div>
              <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-card p-4 border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="text-sm font-bold text-charcoal">{heroBadge1}</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-card p-4 border border-border">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-silver-dark" />
                  <div>
                    <p className="text-xs text-charcoal-light">{heroBadge2Label}</p>
                    <p className="text-sm font-bold text-charcoal">{heroBadge2Sub}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="section-padding bg-cream">
          <div className="container-custom">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">خدماتنا</p>
              <h2 className="section-title">خدمات متكاملة لأسنانك</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {services.map(({ _id, name, description, icon }, i) => (
                <motion.div key={_id} {...fadeUp(i * 0.15)}>
                  <div className="group block bg-white rounded-card p-8 border border-border hover:border-silver-dark hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center text-3xl mb-6 border border-border">{icon || '🦷'}</div>
                    <h3 className="text-xl font-bold text-charcoal mb-3">{name}</h3>
                    <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp(0.3)} className="text-center mt-10">
              <Link to={`${base}/services`} className="btn-secondary">عرض جميع الخدمات</Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">قبل وبعد</p>
              <h2 className="section-title">نتائج حقيقية لمرضانا</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {gallery.map((item, i) => (
                <motion.div key={item._id} {...fadeUp(i * 0.1)} className="bg-white rounded-card overflow-hidden border border-border group hover:shadow-card-hover transition-all duration-300">
                  <div className="grid grid-cols-2 h-40">
                    <div className="relative overflow-hidden">
                      <img src={item.beforeImage} alt="قبل" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">قبل</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={item.afterImage} alt="بعد" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 left-2 bg-charcoal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">بعد</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-charcoal text-sm">{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp(0.4)} className="text-center mt-10">
              <Link to={`${base}/gallery`} className="btn-secondary">عرض جميع الأعمال</Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-dark relative overflow-hidden">
        <div className="container-custom relative z-10 text-center">
          <motion.div {...fadeUp()}>
            <p className="text-accent font-bold text-sm mb-4 tracking-widest uppercase">ابدأ رحلتك اليوم</p>
            <h2 className="text-[42px] md:text-[34px] font-extrabold text-white mb-5 leading-tight">{ctaTitle}</h2>
            <p className="text-white/55 text-[16px] mb-10 max-w-md mx-auto leading-relaxed">{ctaSubtitle}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={`${base}/book`} className="inline-flex items-center gap-2 px-8 py-3 rounded-btn bg-white text-charcoal font-bold text-[15px] hover:bg-cream transition-colors">
                احجز موعدك الآن <ArrowLeft size={16} />
              </Link>
              <a href={whatsapp} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-btn border-2 border-white/20 text-white font-bold text-[15px] hover:bg-white/10 transition-colors">
                تواصل عبر واتساب
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone, MessageCircle, Clock, MapPin, Star, ChevronDown,
  Send, CheckCircle, ArrowLeft, Stethoscope, Award, Shield,
  Calendar, Users, Heart
} from 'lucide-react';
import { clinicPublicApi } from '../../services/clinicApi';
import toast from 'react-hot-toast';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function ClinicPublicSite() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(null);
  const [bookForm, setBookForm] = useState({ patientName: '', phone: '', service: '', date: '', time: '', notes: '' });
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    clinicPublicApi.getClinic(slug).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-arabic)', background: '#F8F7F4' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#e5e5e5', borderTopColor: '#333' }} />
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-arabic)' }}>
      <div className="text-center">
        <div className="text-7xl mb-4">🦷</div>
        <h1 className="text-2xl font-bold mb-2">العيادة غير موجودة</h1>
        <p className="text-gray-400">تأكد من صحة الرابط</p>
      </div>
    </div>
  );

  const { clinic, settings } = data;
  const P = settings?.primaryColor || '#1a1a1a';
  const DARK = settings?.darkColor || '#18181B';
  const BG = settings?.bgColor || '#F8F7F4';
  const CARD = settings?.secondaryColor || '#FFFFFF';

  const clinicName = settings?.clinicNameAr || clinic.clinicName;
  const doctorName = clinic.doctorName;
  const services = settings?.services?.filter(s => s.isActive !== false) || [];
  const gallery = settings?.gallery?.filter(g => g.isActive !== false) || [];
  const hours = settings?.workingHours || [];
  const whatsappNum = settings?.whatsapp?.replace(/\D/g, '') || '';

  const openWhatsApp = (msg) => {
    if (!whatsappNum) return;
    const text = msg || settings?.whatsappBookingMessage || `مرحباً، أود حجز موعد في ${clinicName}`;
    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const book = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      await clinicPublicApi.bookAppointment(slug, bookForm);
      setBooked(true);
      toast.success('تم إرسال طلب الحجز!');
    } catch { toast.error('حدث خطأ، حاول مرة أخرى'); }
    finally { setBooking(false); }
  };

  if (settings?.metaTitle) document.title = settings.metaTitle;

  const TRUST = [
    { icon: Shield, label: 'تعقيم وسلامة', desc: 'معايير تعقيم عالمية بين كل موعد' },
    { icon: Award, label: 'خبرة متخصصة', desc: 'سنوات من الخبرة في طب الأسنان' },
    { icon: Heart, label: 'رعاية شاملة', desc: 'اهتمام شخصي بكل مريض' },
    { icon: CheckCircle, label: 'نتائج حقيقية', desc: 'ابتسامة طبيعية ومثالية' },
  ];

  const openDays = hours.filter(h => h.isOpen);

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-arabic)', background: BG, color: '#1a1a1a' }}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.06)' : 'none',
        }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.logo
              ? <img src={settings.logo} alt="logo" className="h-10 object-contain" />
              : <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                  style={{ background: P }}>🦷</div>
            }
            <div>
              <div className="font-extrabold text-sm leading-tight" style={{ color: scrolled ? '#1a1a1a' : '#fff' }}>{clinicName}</div>
              <div className="text-xs opacity-70" style={{ color: scrolled ? '#666' : 'rgba(255,255,255,0.8)' }}>{doctorName}</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {[{ label: 'الخدمات', href: '#services' }, { label: 'أوقات الدوام', href: '#hours' }, { label: 'معرض الأعمال', href: '#gallery' }, { label: 'تواصل معنا', href: '#booking' }].map(l => (
              <a key={l.href} href={l.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: scrolled ? '#555' : 'rgba(255,255,255,0.85)' }}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {whatsappNum && (
              <button onClick={() => openWhatsApp()} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: '#25D366' }}>
                <MessageCircle size={15} /> واتساب
              </button>
            )}
            <a href="#booking" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: P }}>
              احجز موعد
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${DARK} 0%, ${P}DD 60%, ${P}99 100%)` }}>
        {/* BG pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: P }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: '#fff' }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp(0)}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/90 text-sm font-semibold">{clinicName}</span>
            </div>

            <h1 className="text-5xl sm:text-4xl lg:text-6xl font-black text-white leading-[1.1] mb-6">
              {settings?.heroTitle || `مرحباً بك في ${clinicName}`}
            </h1>

            {settings?.tagline && (
              <p className="text-xl font-medium mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>{settings.tagline}</p>
            )}

            <p className="text-base sm:text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {settings?.heroSubtitle || 'نقدم أفضل خدمات طب وتجميل الأسنان بأيدي متخصصة وتقنيات حديثة لابتسامة صحية مثالية.'}
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#booking"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95"
                style={{ background: '#fff', color: P }}>
                احجز موعدك الآن <ArrowLeft size={18} />
              </a>
              {whatsappNum && (
                <button onClick={() => openWhatsApp()}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base text-white border border-white/30 hover:bg-white/10 transition-all">
                  <MessageCircle size={18} /> تواصل واتساب
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-10 mt-14">
              {[
                { num: '500+', label: 'مريض راضٍ' },
                { num: openDays.length, label: 'أيام في الأسبوع' },
                { num: services.length || '10+', label: 'خدمة متخصصة' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-4xl font-black text-white">{s.num}</div>
                  <div className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div {...fadeUp(0.2)} className="hidden lg:block">
            <div className="relative">
              {settings?.heroImage
                ? <img src={settings.heroImage} alt={clinicName}
                    className="w-full aspect-square max-w-md mx-auto rounded-3xl object-cover shadow-2xl" />
                : (
                  <div className="w-full aspect-square max-w-md mx-auto rounded-3xl bg-white/10 backdrop-blur border border-white/20 flex flex-col items-center justify-center gap-6 shadow-2xl">
                    <div className="text-8xl">🦷</div>
                    <div className="text-center">
                      <div className="text-white font-black text-2xl">{doctorName}</div>
                      <div className="text-white/60 text-sm mt-1">طبيب أسنان متخصص</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full px-8">
                      {[{ icon: '📅', label: 'حجز أونلاين' }, { icon: '💬', label: 'واتساب' }, { icon: '⭐', label: 'تقييم 5 نجوم' }, { icon: '✅', label: 'تعقيم معتمد' }].map((b, i) => (
                        <div key={i} className="rounded-xl p-3 text-center text-sm font-semibold text-white bg-white/10 border border-white/15">
                          <div className="text-xl mb-1">{b.icon}</div>
                          {b.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              {/* Floating appointment card */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border"
                style={{ borderColor: '#f0f0f0' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${P}15` }}>
                    <Calendar size={18} style={{ color: P }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-800">موعد جديد</div>
                    <div className="text-xs text-gray-400">احجز الآن مجاناً</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating rating */}
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border"
                style={{ borderColor: '#f0f0f0' }}>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" style={{ color: '#F59E0B' }} />)}
                  </div>
                  <span className="text-sm font-bold text-gray-800">5.0</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">من +100 مريض</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill={BG} />
          </svg>
        </div>
      </section>

      {/* ── Trust ───────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8" style={{ background: BG }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.div key={i} {...fadeUp(i * 0.08)}
                className="rounded-2xl p-6 border hover:shadow-lg transition-shadow"
                style={{ background: CARD, borderColor: '#EBEBEB' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${P}12` }}>
                  <Icon size={22} style={{ color: P }} />
                </div>
                <div className="font-bold text-base mb-1.5" style={{ color: '#1a1a1a' }}>{t.label}</div>
                <div className="text-sm leading-relaxed" style={{ color: '#777' }}>{t.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────── */}
      {services.length > 0 && (
        <section id="services" className="py-20 px-5 sm:px-8" style={{ background: CARD }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                style={{ background: `${P}12`, color: P }}>
                <Stethoscope size={14} /> خدماتنا
              </div>
              <h2 className="text-4xl font-black mb-4" style={{ color: '#1a1a1a' }}>ما نقدمه لك</h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: '#777' }}>
                خدمات طب أسنان متكاملة بأعلى معايير الجودة
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc, i) => (
                <motion.div key={i} {...fadeUp(i * 0.07)}
                  className="group rounded-2xl border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ background: BG, borderColor: '#EBEBEB' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform"
                    style={{ background: `${P}12` }}>
                    🦷
                  </div>
                  <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1a1a1a' }}>{svc.name}</h3>
                  {svc.description && (
                    <p className="text-sm leading-relaxed mb-4" style={{ color: '#777' }}>{svc.description}</p>
                  )}
                  {svc.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black" style={{ color: P }}>{svc.price}</span>
                      {svc.duration && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${P}12`, color: P }}>{svc.duration}</span>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Working Hours ───────────────────────────────────── */}
      {hours.length > 0 && (
        <section id="hours" className="py-20 px-5 sm:px-8" style={{ background: BG }}>
          <div className="max-w-2xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                style={{ background: `${P}12`, color: P }}>
                <Clock size={14} /> أوقات العمل
              </div>
              <h2 className="text-4xl font-black" style={{ color: '#1a1a1a' }}>أوقات الدوام</h2>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="rounded-3xl border overflow-hidden shadow-sm"
              style={{ background: CARD, borderColor: '#EBEBEB' }}>
              {hours.map((h, i) => (
                <div key={i}
                  className="flex items-center justify-between px-7 py-4 border-b last:border-0"
                  style={{ borderColor: '#F4F4F4', background: h.isOpen ? 'transparent' : '#FAFAFA' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: h.isOpen ? '#22C55E' : '#E5E7EB' }} />
                    <span className="font-bold text-sm" style={{ color: h.isOpen ? '#1a1a1a' : '#aaa' }}>{h.day}</span>
                  </div>
                  {h.isOpen
                    ? <span className="text-sm font-semibold" style={{ color: '#555' }} dir="ltr">{h.openTime} — {h.closeTime}</span>
                    : <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>مغلق</span>
                  }
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Gallery ─────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-20 px-5 sm:px-8" style={{ background: CARD }}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-5"
                style={{ background: `${P}12`, color: P }}>
                معرض الأعمال
              </div>
              <h2 className="text-4xl font-black" style={{ color: '#1a1a1a' }}>نتائج حقيقية</h2>
              <p className="text-base mt-3" style={{ color: '#777' }}>قبل وبعد — نتائج مرضانا تتحدث عن نفسها</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.map((item, i) => (
                <motion.div key={i} {...fadeUp(i * 0.06)}
                  className="rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
                  style={{ background: BG, borderColor: '#EBEBEB' }}>
                  <div className="grid grid-cols-2 relative">
                    <div className="aspect-square bg-gray-100">
                      {item.beforeImage
                        ? <img src={item.beforeImage} className="w-full h-full object-cover" alt="قبل" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-bold">قبل</div>}
                    </div>
                    <div className="aspect-square bg-gray-100">
                      {item.afterImage
                        ? <img src={item.afterImage} className="w-full h-full object-cover" alt="بعد" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-bold">بعد</div>}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <ArrowLeft size={14} style={{ color: P }} />
                      </div>
                    </div>
                    <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">قبل</span>
                    <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">بعد</span>
                  </div>
                  {item.title && (
                    <div className="px-4 py-3">
                      <div className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{item.title}</div>
                      {item.description && <div className="text-xs mt-0.5" style={{ color: '#999' }}>{item.description}</div>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Booking ─────────────────────────────────────────── */}
      <section id="booking" className="py-24 px-5 sm:px-8"
        style={{ background: `linear-gradient(135deg, ${DARK} 0%, ${P}CC 100%)` }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-3">احجز موعدك الآن</h2>
            <p className="text-white/65 text-lg">أرسل طلب الحجز وسيتم التواصل معك للتأكيد</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Info */}
            <motion.div {...fadeUp(0.1)} className="lg:col-span-2 space-y-5">
              {whatsappNum && (
                <div className="rounded-2xl p-5 border border-white/10 bg-white/10 backdrop-blur">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">تواصل واتساب</div>
                      <div className="text-white/60 text-xs">رد سريع</div>
                    </div>
                  </div>
                  <button onClick={() => openWhatsApp()}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: '#25D366' }}>
                    <MessageCircle size={15} className="inline ml-2" />
                    ابدأ المحادثة
                  </button>
                </div>
              )}

              {settings?.phone && (
                <div className="rounded-2xl p-5 border border-white/10 bg-white/10 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: P }}>
                      <Phone size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">رقم الهاتف</div>
                      <div className="font-bold text-white text-sm" dir="ltr">{settings.phone}</div>
                    </div>
                  </div>
                </div>
              )}

              {settings?.address && (
                <div className="rounded-2xl p-5 border border-white/10 bg-white/10 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20">
                      <MapPin size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">العنوان</div>
                      <div className="font-semibold text-white text-sm">{settings.address}</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Form */}
            <motion.div {...fadeUp(0.15)} className="lg:col-span-3">
              {booked ? (
                <div className="rounded-3xl bg-white p-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={36} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-black mb-2" style={{ color: '#1a1a1a' }}>تم إرسال طلبك!</h3>
                  <p className="mb-6" style={{ color: '#777' }}>سيتم التواصل معك قريباً لتأكيد الموعد</p>
                  {whatsappNum && (
                    <button onClick={() => openWhatsApp(`مرحباً، أرسلت طلب حجز للمتابعة`)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
                      style={{ background: '#25D366' }}>
                      <MessageCircle size={16} /> متابعة عبر واتساب
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={book} className="rounded-3xl bg-white p-8 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>الاسم الكامل *</label>
                      <input required className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                        style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                        onFocus={e => e.target.style.borderColor = P}
                        onBlur={e => e.target.style.borderColor = '#E8E8E8'}
                        placeholder="محمد أحمد" value={bookForm.patientName}
                        onChange={e => setBookForm(p => ({ ...p, patientName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>رقم الهاتف *</label>
                      <input required className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                        style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                        onFocus={e => e.target.style.borderColor = P}
                        onBlur={e => e.target.style.borderColor = '#E8E8E8'}
                        placeholder="+963..." dir="ltr" value={bookForm.phone}
                        onChange={e => setBookForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>

                  {services.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>الخدمة المطلوبة</label>
                      <select className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                        value={bookForm.service} onChange={e => setBookForm(p => ({ ...p, service: e.target.value }))}>
                        <option value="">اختر الخدمة</option>
                        {services.map((s, i) => <option key={i} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>التاريخ المفضل</label>
                      <input type="date" className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                        value={bookForm.date} onChange={e => setBookForm(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>الوقت المفضل</label>
                      <input type="time" className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                        value={bookForm.time} onChange={e => setBookForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5" style={{ color: '#888' }}>ملاحظات إضافية</label>
                    <textarea className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                      style={{ borderColor: '#E8E8E8', background: '#FAFAFA' }}
                      rows={3} placeholder="أي تفاصيل تريد إضافتها..."
                      value={bookForm.notes} onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>

                  <button type="submit" disabled={booking}
                    className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                    style={{ background: P }}>
                    <Send size={18} />
                    {booking ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-12 px-5 sm:px-8" style={{ background: DARK }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 pb-10 border-b border-white/10">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                {settings?.logo
                  ? <img src={settings.logo} alt="logo" className="h-10 object-contain" />
                  : <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black" style={{ background: P }}>🦷</div>
                }
                <span className="font-black text-white text-lg">{clinicName}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {settings?.footerText || `${clinicName} — نسعى دائماً لابتسامتك`}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-6">
              {settings?.phone && (
                <div>
                  <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>هاتف</div>
                  <div className="text-sm font-semibold text-white" dir="ltr">{settings.phone}</div>
                </div>
              )}
              {settings?.email && (
                <div>
                  <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>بريد</div>
                  <div className="text-sm font-semibold text-white" dir="ltr">{settings.email}</div>
                </div>
              )}
              {settings?.address && (
                <div>
                  <div className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>عنوان</div>
                  <div className="text-sm font-semibold text-white">{settings.address}</div>
                </div>
              )}
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} {clinicName} — جميع الحقوق محفوظة
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              مشغّل بواسطة <span style={{ color: P }}>Prootech Agency</span>
            </p>
          </div>
        </div>
      </footer>

      {/* WhatsApp sticky */}
      {whatsappNum && (
        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: 'spring' }}
          onClick={() => openWhatsApp()} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50"
          style={{ background: '#25D366' }}>
          <MessageCircle size={26} fill="white" color="white" />
        </motion.button>
      )}
    </div>
  );
}

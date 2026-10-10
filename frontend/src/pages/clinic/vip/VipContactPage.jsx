import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { useVipSettings } from '../../../context/VipSettingsContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

export default function VipContactPage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};

  const phone     = settings?.phone || '';
  const address   = settings?.address || '';
  const whatsapp  = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g,'')}` : '#';
  const instagram = settings?.instagram || '#';
  const facebook  = settings?.facebook || '#';
  const workingHours = (settings?.workingHours || []).filter(h => h.isOpen);
  const mapUrl    = settings?.mapUrl || '';

  const contacts = [
    phone && { icon: Phone, label: 'الهاتف', value: phone, href: `tel:${phone.replace(/\s/g,'')}` },
    address && { icon: MapPin, label: 'العنوان', value: address, href: mapUrl || '#' },
  ].filter(Boolean);

  return (
    <>
      <section className="pt-32 pb-16 bg-cream">
        <div className="container-custom text-center">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">تواصل</p>
            <h1 className="section-title mb-4">تواصل معنا</h1>
            <p className="text-charcoal-light text-lg max-w-xl mx-auto">
              نحن هنا للإجابة على استفساراتك وحجز مواعيدك.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Contact info */}
            <motion.div {...fadeUp(0.1)} className="space-y-5">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                  className="flex items-center gap-4 bg-cream rounded-card p-6 border border-border hover:shadow-card transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-silver-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-charcoal-light font-bold mb-0.5">{label}</p>
                    <p className="text-charcoal font-semibold">{value}</p>
                  </div>
                </a>
              ))}

              {/* Whatsapp */}
              <a href={whatsapp} target="_blank" rel="noreferrer"
                className="flex items-center gap-4 bg-emerald-700 text-white rounded-card p-6 hover:bg-emerald-600 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-bold mb-0.5">واتساب</p>
                  <p className="font-semibold">تواصل عبر واتساب</p>
                </div>
              </a>

              {/* Social */}
              <div className="flex gap-4">
                <a href={instagram} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-cream border border-border rounded-card py-4 text-charcoal-light hover:text-charcoal hover:border-silver-dark transition-all font-semibold text-sm">
                  <Instagram size={18} /> إنستقرام
                </a>
                <a href={facebook} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-cream border border-border rounded-card py-4 text-charcoal-light hover:text-charcoal hover:border-silver-dark transition-all font-semibold text-sm">
                  <Facebook size={18} /> فيسبوك
                </a>
              </div>
            </motion.div>

            {/* Working hours */}
            <motion.div {...fadeUp(0.2)}>
              <div className="bg-cream rounded-card p-8 border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <Clock size={22} className="text-silver-dark" />
                  <h2 className="text-xl font-bold text-charcoal">ساعات العمل</h2>
                </div>
                {workingHours.length > 0 ? (
                  <ul className="space-y-3">
                    {workingHours.map(h => (
                      <li key={h.dayEn} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="font-semibold text-charcoal">{h.day}</span>
                        <span className="text-charcoal-light text-sm">{h.openTime} – {h.closeTime}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-charcoal-light text-sm">يرجى التواصل معنا للاستفسار عن أوقات العمل.</p>
                )}
              </div>

              {mapUrl && (
                <div className="mt-5 bg-cream rounded-card overflow-hidden border border-border h-64">
                  <iframe src={mapUrl} className="w-full h-full" loading="lazy" allowFullScreen title="location" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link, useParams } from 'react-router-dom';
import { Phone, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useVipSettings } from '../../context/VipSettingsContext';

export default function VipFooter() {
  const { slug } = useParams();
  const { settings, clinic } = useVipSettings() || {};
  const phone      = settings?.phone || '';
  const location   = settings?.address || '';
  const whatsapp   = settings?.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g,'')}` : '#';
  const instagram  = settings?.instagram || '#';
  const facebook   = settings?.facebook || '#';
  const clinicName = settings?.clinicNameAr || clinic?.clinicName || '';
  const logoUrl    = settings?.logo || '';
  const base = `/clinic/${slug}`;

  const workingHours = settings?.workingHours?.filter(h => h.isOpen) || [];

  return (
    <footer className="bg-dark text-white">
      <div className="bg-dark-2 border-t border-white/10 py-5">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center gap-3 text-white/80 hover:text-white transition-colors">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Phone size={15} className="text-silver" />
              </div>
              <span className="font-semibold text-sm">{phone}</span>
            </a>
          )}
          {location && (
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <MapPin size={15} className="text-silver flex-shrink-0" />
              <span>{location}</span>
            </div>
          )}
          <a href={whatsapp} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 transition-colors px-5 py-2 rounded-full text-sm font-bold">
            <MessageCircle size={15} />
            واتساب
          </a>
        </div>
      </div>

      <div className="container-custom py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="mb-5">
            {logoUrl
              ? <img src={logoUrl} alt={clinicName} className="h-12 w-auto object-contain brightness-0 invert opacity-90" />
              : <span className="text-lg font-bold text-white/90">{clinicName}</span>
            }
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            {settings?.tagline || 'رعاية سنية متقدمة تجمع بين الدقة، الخبرة، والتقنيات الحديثة لابتسامة صحية تدوم.'}
          </p>
        </div>

        <div>
          <h3 className="font-bold text-white/80 mb-4 text-sm tracking-wide">روابط سريعة</h3>
          <ul className="space-y-2">
            {[
              { to: `${base}/services`, label: 'خدماتنا' },
              { to: `${base}/gallery`,  label: 'معرض الأعمال' },
              { to: `${base}/book`,     label: 'احجز موعد' },
              { to: `${base}/about`,    label: 'عن العيادة' },
              { to: `${base}/faq`,      label: 'الأسئلة الشائعة' },
              { to: `${base}/contact`,  label: 'تواصل معنا' },
            ].map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-white/45 hover:text-white/80 text-sm transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-white/80 mb-4 text-sm tracking-wide">ساعات العمل</h3>
          <ul className="space-y-2 text-sm text-white/45">
            {workingHours.length > 0
              ? workingHours.map(h => (
                  <li key={h.dayEn} className="flex justify-between">
                    <span>{h.day}</span>
                    <span className="text-white/65">{h.openTime} – {h.closeTime}</span>
                  </li>
                ))
              : <li className="text-white/40">يرجى التواصل للاستفسار عن المواعيد</li>
            }
          </ul>
          <div className="flex gap-3 mt-5">
            <a href={instagram} target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/20 transition-colors flex items-center justify-center">
              <Instagram size={16} className="text-white/60" />
            </a>
            <a href={facebook} target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/20 transition-colors flex items-center justify-center">
              <Facebook size={16} className="text-white/60" />
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-emerald-700 transition-colors flex items-center justify-center">
              <MessageCircle size={16} className="text-white/60" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 py-5">
        <div className="container-custom text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {clinicName}. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

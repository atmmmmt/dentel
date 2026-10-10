import { Link } from 'react-router-dom';
import { Instagram, Facebook, Linkedin, MessageCircle, Phone, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandMark } from './Navbar';

const PRODUCT = ['موقع العيادة والحجز', 'ملف المريض ومخطط 3D', 'المالية والفواتير', 'تذكير واتساب', 'شاشة غرفة الانتظار', 'تطبيق يعمل أوفلاين'];
const LINKS = [['/', 'الرئيسية'], ['/features', 'الميزات'], ['/pricing', 'الاشتراك'], ['/demo', 'الديمو'], ['/contact', 'تواصل معنا']];

export default function Footer() {
  const { settings, landing } = useApp();
  const year = new Date().getFullYear();
  const socials = [[settings?.instagram, Instagram], [settings?.facebook, Facebook], [settings?.linkedin, Linkedin]].filter(([u]) => u);

  return (
    <footer className="bg-[#061626] text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <BrandMark light settings={settings} />
            <p className="max-w-xs text-sm leading-7 text-white/55">
              {landing?.footer?.description || 'نظام متكامل لعيادات الأسنان — موقع، حجز، مرضى، مالية، واتساب وشاشة انتظار. نجهّزه لعيادتك خلال 48 ساعة.'}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-2">
                {socials.map(([url, I]) => <a key={url} href={url} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-xl bg-white/[.06] ring-1 ring-white/10 transition hover:bg-white/10"><I size={17} /></a>)}
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold">روابط</h4>
            <ul className="space-y-3">{LINKS.map(([to, l]) => <li key={to}><Link to={to} className="text-[15px] text-white/60 transition hover:text-white">{l}</Link></li>)}</ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold">المنتج</h4>
            <ul className="space-y-3">{PRODUCT.map(l => <li key={l} className="text-[15px] text-white/60">{l}</li>)}</ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-bold">تواصل معنا</h4>
            <ul className="space-y-3 text-sm text-white/65">
              {settings?.whatsappNumber && <li className="flex items-center gap-2"><MessageCircle size={15} className="text-[#5FD6CF]" /><span dir="ltr">+{settings.whatsappNumber}</span></li>}
              {settings?.phone && <li className="flex items-center gap-2"><Phone size={15} className="text-[#5FD6CF]" /><span dir="ltr">{settings.phone}</span></li>}
              {settings?.email && <li className="flex items-center gap-2"><Mail size={15} className="text-[#5FD6CF]" /><span dir="ltr">{settings.email}</span></li>}
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
          <p>{settings?.copyrightText || `© ${year} Prootech Agency. جميع الحقوق محفوظة.`}</p>
          <p>صُنع بعناية لأطباء الأسنان</p>
        </div>
      </div>
    </footer>
  );
}

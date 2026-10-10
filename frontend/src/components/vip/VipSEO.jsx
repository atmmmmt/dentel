import { useEffect } from 'react';
import { useVipSettings } from '../../context/VipSettingsContext';

/* حقن وسوم SEO ديناميكياً لكل عيادة على موقعها العام:
   عنوان الصفحة، وصف، Open Graph، وبيانات منظّمة (Dentist / LocalBusiness)
   تساعد جوجل على فهم العيادة وإظهارها في نتائج البحث والخرائط. */

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

export default function VipSEO() {
  const { settings, clinic } = useVipSettings() || {};

  useEffect(() => {
    if (!settings && !clinic) return;
    const name = settings?.clinicNameAr || clinic?.clinicName || 'عيادة أسنان';
    const doctor = clinic?.doctorName || '';
    const tagline = settings?.tagline || 'عيادة أسنان متخصصة';
    const title = settings?.metaTitle || `${name}${doctor ? ' — ' + doctor : ''} | ${tagline}`;
    const desc = settings?.metaDescription || settings?.description ||
      `${name} — خدمات طب وتجميل الأسنان: زراعة، تقويم، ابتسامة هوليوود، وتنظيف. احجز موعدك الآن.`;
    const url = window.location.href.split('?')[0];
    const image = settings?.heroImage || settings?.logo || '';

    document.title = title;
    document.documentElement.lang = 'ar';

    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'robots', 'index,follow');
    upsertMeta('name', 'theme-color', settings?.primaryColor || '#2D6BEB');
    if (settings?.city || settings?.address) upsertMeta('name', 'geo.placename', settings?.city || settings?.address);

    // Open Graph
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:site_name', name);
    upsertMeta('property', 'og:locale', 'ar_AR');
    if (image) upsertMeta('property', 'og:image', image);

    // Twitter
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    if (image) upsertMeta('name', 'twitter:image', image);

    upsertLink('canonical', url);

    // بيانات منظّمة — Dentist (نوع فرعي من LocalBusiness)
    const sameAs = [settings?.instagram, settings?.facebook].filter(Boolean);
    const openingHours = (settings?.workingHours || [])
      .filter(h => h.isOpen)
      .map(h => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ({
          sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
          thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
        })[h.dayEn] || h.dayEn,
        opens: h.openTime, closes: h.closeTime,
      }));

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Dentist',
      name,
      description: desc,
      url,
      ...(image ? { image } : {}),
      ...(settings?.logo ? { logo: settings.logo } : {}),
      ...(settings?.phone ? { telephone: settings.phone } : {}),
      ...(doctor ? { founder: { '@type': 'Person', name: doctor } } : {}),
      ...(settings?.address ? {
        address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: settings?.city || '', addressCountry: settings?.country || 'IQ' },
      } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
      medicalSpecialty: 'Dentistry',
      priceRange: '$$',
    };

    let script = document.getElementById('vip-jsonld');
    if (!script) { script = document.createElement('script'); script.id = 'vip-jsonld'; script.type = 'application/ld+json'; document.head.appendChild(script); }
    script.textContent = JSON.stringify(jsonLd);
  }, [settings, clinic]);

  return null;
}

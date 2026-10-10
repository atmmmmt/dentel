import { useEffect, useState } from 'react';
import { Globe, ShieldCheck, Zap, Clock } from 'lucide-react';
import { clinicDashApi } from '../../services/clinicApi';
import { publicApi } from '../../services/api';
import DomainWizard from '../../components/domain/DomainWizard';

export default function DomainPage({ clinic }) {
  const slug = clinic?.slug;
  const [info, setInfo] = useState(null);
  const [support, setSupport] = useState('');

  const load = () => clinicDashApi.getDomain(slug).then(r => setInfo(r.data)).catch(() => setInfo({ domain: '', records: [] }));

  useEffect(() => { if (slug) load(); }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { publicApi.getSettings().then(r => setSupport(r.data.settings?.whatsappNumber || '')).catch(() => {}); }, []);

  const api = {
    save: async (domain) => (await clinicDashApi.saveDomain(slug, { domain })).data,
    verify: async () => (await clinicDashApi.verifyDomain(slug)).data,
    requestHelp: async (note) => (await clinicDashApi.requestDomainHelp(slug, { note })).data,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">دومين عيادتك</h1>
        <p className="mt-1 text-[15px] leading-7 text-[var(--color-muted)]">اجعل موقعك على اسمك — مثل <span className="font-english font-semibold" dir="ltr">dr-ahmed.com</span> — في ثلاث خطوات.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[[Zap, 'سجلّ واحد فقط', 'نعطيك القيمة جاهزة للنسخ'], [Clock, '5–30 دقيقة', 'مدة التفعيل المعتادة'], [ShieldCheck, 'SSL تلقائي', 'قفل الأمان بدون إعداد']].map(([I, t, d]) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E3F6F5] text-[#137F7F]"><I size={18} /></span>
            <span><b className="block text-sm text-[#0B2A40]">{t}</b><span className="text-[13px] text-slate-500">{d}</span></span>
          </div>
        ))}
      </div>

      {info ? <DomainWizard initial={info} api={api} supportWhatsApp={support} audience="doctor" onChange={load} />
        : <div className="grid h-60 place-items-center"><Globe className="animate-pulse text-slate-300" size={32} /></div>}
    </div>
  );
}

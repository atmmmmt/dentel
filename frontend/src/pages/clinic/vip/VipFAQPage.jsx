import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { createVipPublicApi } from '../../../services/vipPublicApi';
import { useVipSettings } from '../../../context/VipSettingsContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-border rounded-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 p-6 text-right bg-cream hover:bg-cream-dark transition-colors">
        <span className="font-bold text-charcoal text-base leading-snug">{question}</span>
        <ChevronDown size={20} className={`text-silver-dark flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="px-6 pb-6 text-charcoal-light text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VipFAQPage() {
  const { slug } = useParams();
  const { settings } = useVipSettings() || {};
  const [faqs, setFaqs] = useState([]);
  const [openIdx, setOpenIdx] = useState(0);
  const base = `/clinic/${slug}`;

  useEffect(() => {
    if (!slug) return;
    createVipPublicApi(slug).getFAQ()
      .then(r => setFaqs(r.data.faqItems || []))
      .catch(() => setFaqs(settings?.faqItems || []));
  }, [slug]);

  const display = faqs.length > 0 ? faqs : (settings?.faqItems || []);

  return (
    <>
      <section className="pt-32 pb-16 bg-cream">
        <div className="container-custom text-center">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">الأسئلة الشائعة</p>
            <h1 className="section-title mb-4">الأسئلة الشائعة</h1>
            <p className="text-charcoal-light text-lg max-w-xl mx-auto">
              إجابات على أكثر الأسئلة شيوعاً حول خدماتنا ومواعيدنا.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          {display.length === 0 ? (
            <div className="text-center py-20 text-charcoal-light">لا توجد أسئلة متاحة حالياً.</div>
          ) : (
            <motion.div {...fadeUp(0.1)} className="space-y-3">
              {display.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer}
                  isOpen={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
              ))}
            </motion.div>
          )}

          <motion.div {...fadeUp(0.3)} className="mt-14 text-center bg-cream rounded-card p-10 border border-border">
            <h3 className="text-xl font-bold text-charcoal mb-3">لم تجد إجابة لسؤالك؟</h3>
            <p className="text-charcoal-light mb-6">لا تتردد في التواصل معنا مباشرة وسنجيب على جميع استفساراتك.</p>
            <Link to={`${base}/contact`} className="btn-primary">تواصل معنا <ArrowLeft size={16} /></Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

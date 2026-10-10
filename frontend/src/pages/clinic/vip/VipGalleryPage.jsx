import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createVipPublicApi } from '../../../services/vipPublicApi';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay },
});

export default function VipGalleryPage() {
  const { slug } = useParams();
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!slug) return;
    createVipPublicApi(slug).getGallery()
      .then(r => setCases(r.data.cases || []))
      .catch(() => {});
  }, [slug]);

  return (
    <>
      <section className="pt-32 pb-16 bg-cream">
        <div className="container-custom text-center">
          <motion.div {...fadeUp()}>
            <p className="text-silver-dark font-bold text-sm mb-3 tracking-widest uppercase">قبل وبعد</p>
            <h1 className="section-title mb-4">معرض الأعمال</h1>
            <p className="text-charcoal-light text-lg max-w-xl mx-auto">
              نتائج حقيقية لمرضانا — ابتسامات تحولت بفضل الدقة والاحترافية.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          {cases.length === 0 ? (
            <div className="text-center py-20 text-charcoal-light">جاري تحميل الأعمال...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((item, i) => (
                <motion.div key={item._id} {...fadeUp(i * 0.07)}
                  className="bg-white rounded-card overflow-hidden border border-border group hover:shadow-card-hover transition-all duration-300 cursor-pointer"
                  onClick={() => setSelected(item)}>
                  <div className="grid grid-cols-2 h-52">
                    <div className="relative overflow-hidden">
                      <img src={item.beforeImage} alt="قبل" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 right-2 bg-black/55 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">قبل</span>
                    </div>
                    <div className="relative overflow-hidden">
                      <img src={item.afterImage} alt="بعد" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className="absolute bottom-2 left-2 bg-charcoal text-white text-[10px] font-bold px-2 py-0.5 rounded-full">بعد</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-bold text-charcoal">{item.title}</p>
                    {item.description && <p className="text-charcoal-light text-sm mt-1">{item.description}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-card overflow-hidden max-w-2xl w-full"
              onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-2">
                <div className="relative">
                  <img src={selected.beforeImage} alt="قبل" className="w-full h-64 object-cover" />
                  <span className="absolute bottom-3 right-3 bg-black/55 text-white text-xs font-bold px-3 py-1 rounded-full">قبل</span>
                </div>
                <div className="relative">
                  <img src={selected.afterImage} alt="بعد" className="w-full h-64 object-cover" />
                  <span className="absolute bottom-3 left-3 bg-charcoal text-white text-xs font-bold px-3 py-1 rounded-full">بعد</span>
                </div>
              </div>
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-charcoal text-lg">{selected.title}</h3>
                  {selected.description && <p className="text-charcoal-light text-sm mt-1">{selected.description}</p>}
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-cream-dark transition-colors">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

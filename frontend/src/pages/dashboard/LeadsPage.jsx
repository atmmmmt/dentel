import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trash2, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import ConfirmModal from '../../components/shared/ConfirmModal';
import toast from 'react-hot-toast';

const STATUS = {
  new: { label: 'جديد', color: '#3B82F6' },
  contacted: { label: 'تم التواصل', color: '#F59E0B' },
  demo_sent: { label: 'أُرسل ديمو', color: '#8B5CF6' },
  proposal_sent: { label: 'عرض سعر', color: '#EC4899' },
  won: { label: 'تم الفوز', color: '#10B981' },
  lost: { label: 'خسارة', color: '#6B7280' },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [delId, setDelId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const load = () => {
    adminApi.getLeads({ page, search, status: filterStatus }).then(r => {
      setLeads(r.data.leads || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [page, search, filterStatus]);

  const openLead = (lead) => {
    setSelected(lead);
    setNotes(lead.internalNotes || '');
    setPaidAmount(lead.actualPaidAmount || '');
    setPaymentNotes(lead.paymentNotes || '');
  };

  const updateStatus = async (id, status) => {
    await adminApi.updateLead(id, { status });
    toast.success('تم تحديث الحالة');
    load();
    if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await adminApi.updateLead(selected._id, {
        internalNotes: notes,
        actualPaidAmount: Number(paidAmount) || 0,
        paymentNotes,
        ...(paidAmount > 0 ? { paymentDate: new Date() } : {}),
      });
      toast.success('تم الحفظ');
    }
    catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const remove = async () => {
    setSaving(true);
    try { await adminApi.deleteLead(delId); toast.success('تم الحذف'); setDelId(null); load(); }
    catch { toast.error('فشل الحذف'); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageTitle title="العملاء المحتملون" subtitle={`${total} عميل إجمالاً`} />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 right-3" style={{ color: 'var(--color-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث بالاسم أو الهاتف..." className="input-base pr-9 text-sm" />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="input-base text-sm w-auto">
          <option value="">جميع الحالات</option>
          {Object.entries(STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                {['الطبيب', 'الهاتف', 'الباقة', 'التواصل', 'الحالة', 'التاريخ', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-right font-medium" style={{ color: 'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0
                ? <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--color-muted)' }}>لا يوجد نتائج</td></tr>
                : leads.map(lead => (
                  <tr key={lead._id} className="border-b table-row cursor-pointer" style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => openLead(lead)}>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{lead.doctorName}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{lead.clinicName}</div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted)' }} dir="ltr">{lead.phone}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted)' }}>{lead.selectedPackage || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge text-xs">{lead.preferredContactMethod === 'whatsapp' ? 'واتساب' : lead.preferredContactMethod === 'phone' ? 'هاتف' : 'بريد'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                        style={{ background: STATUS[lead.status]?.color || '#999' }}>
                        {STATUS[lead.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                      {new Date(lead.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); setDelId(lead._id); }}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>صفحة {page} من {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}><ChevronRight size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}><ChevronLeft size={16} /></button>
            </div>
          </div>
        )}
      </Card>

      {/* Lead Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="relative h-full w-full max-w-md border-r overflow-y-auto p-6"
            style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>{selected.doctorName}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>{selected.clinicName} — {selected.city}، {selected.country}</p>

            <div className="space-y-3 mb-6">
              {[
                ['الهاتف', selected.phone],
                ['واتساب', selected.whatsapp],
                ['البريد', selected.email],
                ['الباقة', selected.selectedPackage],
                ['دورة الفاتورة', selected.billingCycle === 'monthly' ? 'شهري' : selected.billingCycle === 'yearly' ? 'سنوي' : null],
                ['الديمو', selected.wantsDemo ? 'نعم' : null],
                ['التواصل المفضل', selected.preferredContactMethod],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--color-text)' }}>{val}</span>
                </div>
              ) : null)}

              {selected.preferredTheme && (
                <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(201,184,154,0.08)', border: '1px solid var(--color-primary)' }}>
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>🎨 التصميم المختار</div>
                  <div style={{ color: 'var(--color-text)' }}>
                    {{ royal: 'رويال داكن 🌙', ocean: 'أوشن أزرق 🔵', mint: 'مينت أخضر 🌿' }[selected.preferredTheme]}
                  </div>
                </div>
              )}

              {selected.wantsDomain && (
                <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(201,184,154,0.1)', border: '1px solid var(--color-primary)' }}>
                  <div className="font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>🌐 يريد شراء دومين</div>
                  {selected.domainName && <div style={{ color: 'var(--color-text)' }} dir="ltr">{selected.domainName}</div>}
                </div>
              )}

              {selected.actualPaidAmount > 0 && (
                <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid #10B981' }}>
                  <div className="font-semibold mb-1" style={{ color: '#10B981' }}>💰 مدفوعات</div>
                  <div style={{ color: 'var(--color-text)' }}>${selected.actualPaidAmount?.toLocaleString()}</div>
                  {selected.paymentNotes && <div className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{selected.paymentNotes}</div>}
                </div>
              )}
            </div>

            {selected.message && (
              <div className="mb-6 p-3 rounded-xl text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                {selected.message}
              </div>
            )}

            <div className="mb-5">
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-muted)' }}>الحالة</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS).map(([v, { label, color }]) => (
                  <button key={v} onClick={() => updateStatus(selected._id, v)}
                    className={`px-3 py-1 rounded-full text-xs font-medium text-white transition-opacity ${selected.status === v ? 'opacity-100' : 'opacity-40'}`}
                    style={{ background: color }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment tracking */}
            <div className="mb-5 rounded-xl p-4 space-y-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <label className="text-xs font-medium block" style={{ color: 'var(--color-muted)' }}>💰 تسجيل دفعة ($)</label>
              <input type="number" min="0" className="input-base text-sm" placeholder="0"
                value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              <input className="input-base text-sm" placeholder="ملاحظة الدفع (اختياري)"
                value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-muted)' }}>ملاحظات داخلية</label>
              <textarea className="input-base resize-none text-sm" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
              <button onClick={saveNotes} disabled={saving} className="mt-2 px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: 'var(--color-primary)' }}>
                {saving ? '...' : 'حفظ'}
              </button>
            </div>

            <div className="flex gap-3">
              {selected.whatsapp && (
                <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={15} /> واتساب
                </a>
              )}
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--color-border)' }}>إغلاق</button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal open={!!delId} onConfirm={remove} onCancel={() => setDelId(null)} loading={saving} />
    </div>
  );
}

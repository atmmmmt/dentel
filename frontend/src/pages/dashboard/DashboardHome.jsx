import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Play, Package, ArrowLeft, TrendingUp, DollarSign, Globe, Building2, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { adminClinicApi } from '../../services/clinicApi';
import Card from '../../components/shared/Card';
import PageTitle from '../../components/shared/PageTitle';

const STATUS_LABELS = {
  new: 'جديد', contacted: 'تم التواصل', demo_sent: 'أُرسل ديمو',
  proposal_sent: 'عرض سعر', won: 'تم الفوز', lost: 'خسارة',
};
const STATUS_COLORS = {
  new: '#3B82F6', contacted: '#F59E0B', demo_sent: '#8B5CF6',
  proposal_sent: '#EC4899', won: '#10B981', lost: '#6B7280',
};

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    adminApi.getDashboardStats().then(r => {
      setStats(r.data.stats);
      setRecentLeads(r.data.recentLeads || []);
    }).catch(() => {});

    adminClinicApi.getRevenue().then(r => setRevenue(r.data)).catch(() => {});
  }, []);

  const fmtRevenue = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;

  const cards = [
    { label: 'إجمالي العملاء المحتملين', value: stats?.totalLeads ?? '—', icon: Users, color: '#3B82F6' },
    { label: 'إجمالي الإيرادات', value: stats != null ? fmtRevenue(stats.totalRevenue) : '—', icon: DollarSign, color: '#10B981' },
    { label: 'الصفقات المكسوبة', value: stats?.wonLeads ?? '—', icon: TrendingUp, color: '#F59E0B' },
    { label: 'طلبات الدومين', value: stats?.domainRequests ?? '—', icon: Globe, color: 'var(--color-primary)' },
    { label: 'طلبات الديمو', value: stats?.demoRequests ?? '—', icon: Play, color: '#8B5CF6' },
    { label: 'الباقة الأكثر طلباً', value: stats?.topPackage ?? '—', icon: Package, color: '#EC4899' },
  ];

  return (
    <div>
      <PageTitle title="الرئيسية" subtitle="نظرة عامة على أداء المنصة" />

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${c.color}18` }}>
                    <Icon size={18} style={{ color: c.color }} />
                  </div>
                </div>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--color-text)' }}>{c.value}</div>
                <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{c.label}</div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Leads */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--color-text)' }}>آخر العملاء المحتملين</h2>
          <Link to="/product-admin/leads" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
            عرض الكل <ArrowLeft size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                {['الطبيب', 'العيادة', 'الهاتف', 'الباقة', 'الحالة', 'التاريخ'].map(h => (
                  <th key={h} className="px-5 py-3 text-right font-medium" style={{ color: 'var(--color-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--color-muted)' }}>لا يوجد عملاء بعد</td></tr>
              ) : recentLeads.map(lead => (
                <tr key={lead._id} className="border-b table-row" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--color-text)' }}>{lead.doctorName}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{lead.clinicName || '—'}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }} dir="ltr">{lead.phone}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--color-muted)' }}>{lead.selectedPackage || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ background: STATUS_COLORS[lead.status] }}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                    {new Date(lead.createdAt).toLocaleDateString('ar')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Clinics Revenue Section */}
      {revenue && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>💰 إيرادات العيادات</h3>
            <Link to="/product-admin/clinics" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
              إدارة العيادات <ArrowLeft size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'إجمالي الإيرادات', value: `$${(revenue.stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: '#10B981' },
              { label: 'إيرادات هذا الشهر', value: `$${(revenue.stats?.monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: '#3B82F6' },
              { label: 'عيادات نشطة', value: revenue.stats?.activeCount ?? '—', icon: Building2, color: 'var(--color-primary)' },
              { label: 'ستنتهي قريباً', value: revenue.stats?.expiringSoon ?? '—', icon: AlertTriangle, color: '#F59E0B' },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color}18` }}>
                      <Icon size={16} style={{ color: c.color }} />
                    </div>
                    <div className="text-2xl font-black mb-0.5" style={{ color: 'var(--color-text)' }}>{c.value}</div>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{c.label}</div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Recent payments */}
          {revenue.recentPayments?.length > 0 && (
            <Card padding={false}>
              <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>آخر المدفوعات</h4>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {revenue.recentPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>{p.clinicName}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.doctorName} · {p.package} · {p.plan === 'yearly' ? 'سنوي' : 'شهري'}</div>
                    </div>
                    <div className="font-bold text-green-500">${p.amount?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="font-bold mb-4" style={{ color: 'var(--color-text)' }}>إجراءات سريعة</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { to: '/product-admin/clinics', label: 'إدارة العيادات', icon: '🏥' },
            { to: '/product-admin/landing', label: 'تعديل الهيرو', icon: '✏️' },
            { to: '/product-admin/pricing', label: 'تعديل الباقات', icon: '📦' },
            { to: '/product-admin/leads', label: 'مشاهدة العملاء', icon: '👥' },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium hover:shadow-sm transition-all"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

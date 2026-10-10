import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import SaveBar from '../../components/forms/SaveBar';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, RefreshCw, Send, QrCode, Phone } from 'lucide-react';

// ── WhatsApp Session Card ────────────────────────────────────────────
// The QR comes live from VAYRO and rotates every ~20–60 s, so we poll the live status
// and always display the newest code until the phone is linked.
function WaSessionCard() {
  const [info, setInfo]           = useState({ waStatus: 'disconnected', waConnected: false, waPhone: '', waQr: '' });
  const [loading, setLoading]     = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sending, setSending]     = useState(false);
  const [countdown, setCountdown] = useState(0); // seconds since the current QR appeared
  const pollRef  = useRef(null);
  const countRef = useRef(null);
  const lastQr   = useRef('');

  const clearAll = () => { clearInterval(pollRef.current); clearInterval(countRef.current); };

  const apply = (d, { notify = false } = {}) => {
    if (!d) return;
    if (d.qr && d.qr !== lastQr.current) { lastQr.current = d.qr; setCountdown(0); }
    setInfo(prev => ({
      ...prev,
      waStatus: d.status || prev.waStatus,
      waConnected: d.status === 'ready',
      waQr: d.status === 'ready' ? '' : (d.qr || prev.waQr),
      waPhone: d.phone || prev.waPhone,
    }));
    if (d.status === 'ready') {
      clearAll();
      if (notify) toast.success('✅ تم ربط الواتساب بنجاح!');
    }
  };

  const startPolling = () => {
    clearAll();
    countRef.current = setInterval(() => setCountdown(c => c + 1), 1000);
    pollRef.current = setInterval(async () => {
      try { const r = await adminApi.waStatus(); apply(r.data, { notify: true }); } catch {}
    }, 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi.waStatus();
        apply(r.data);
        if (r.data.status === 'qr') startPolling();
      } catch {}
    })();
    return () => clearAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await adminApi.waStart();
      apply(r.data, { notify: true });
      if (r.data.status !== 'ready') startPolling();
      if (!r.data.qr && r.data.status !== 'ready') toast('⏳ جاري تحضير الـ QR…');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الاتصال بخادم الواتساب');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the newest QR without restarting the session.
  const handleForceRefreshQr = async () => {
    setLoading(true);
    try {
      const r = await adminApi.waStatus();
      apply(r.data, { notify: true });
      if (r.data.status === 'disconnected') await handleStart();
      else toast.success('تم تحديث الـ QR');
    } catch {
      toast.error('فشل تحديث الـ QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    clearAll();
    setLoading(true);
    try {
      await adminApi.waDisconnect();
      lastQr.current = '';
      setInfo({ waStatus: 'disconnected', waConnected: false, waPhone: '', waQr: '' });
      toast.success('تم فصل الجلسة');
    } catch {
      toast.error('فشل الفصل');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const r = await adminApi.waStatus();
      apply(r.data, { notify: true });
      if (r.data.status !== 'ready') toast(`الحالة الحالية: ${r.data.status === 'qr' ? 'بانتظار المسح' : 'غير متصل'}`);
    } catch {
      toast.error('فشل التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone) return toast.error('أدخل رقم الهاتف');
    setSending(true);
    try {
      await adminApi.waTest({ phoneNumber: testPhone });
      toast.success('✅ تم إرسال رسالة الاختبار');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSending(false);
    }
  };

  const statusColor = { ready: '#10B981', qr: '#F59E0B', disconnected: '#EF4444', connecting: '#6366F1', failed: '#EF4444' };
  const statusLabel = { ready: 'متصل ✅', qr: 'في انتظار المسح...', disconnected: 'غير متصل', connecting: 'تم المسح — جاري الربط…', failed: 'فشل الربط' };

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>ربط الواتساب — VAYRO</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
            ربط رقم واتساب Prootech لإرسال الرسائل التلقائية والتنبيهات
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: (statusColor[info.waStatus] || '#999') + '18', color: statusColor[info.waStatus] || '#999' }}>
          {info.waConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {statusLabel[info.waStatus] || 'غير معروف'}
        </div>
      </div>

      {info.waConnected && info.waPhone && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm"
          style={{ background: '#10B98118', color: '#10B981' }}>
          <Phone size={14} />
          <span dir="ltr" className="font-mono">{info.waPhone}</span>
        </div>
      )}

      {/* QR Code */}
      {info.waStatus === 'connecting' && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm" style={{ borderColor: '#6366F1', color: '#4F46E5', background: '#6366F10D' }}>
          <RefreshCw size={16} className="animate-spin" />
          تم مسح الكود — انتظر حتى يكتمل الربط على الموبايل (عادةً أقل من دقيقة). لا تغلق واتساب على الموبايل.
        </div>
      )}
      {info.waStatus === 'failed' && (
        <div className="mb-5 rounded-2xl border p-4 text-sm leading-7" style={{ borderColor: '#EF4444', color: '#B91C1C', background: '#EF44440D' }}>
          رفض واتساب الربط (غالباً بسبب جلسة قديمة على الرقم). اضغط <b>«بدء الجلسة / الحصول على QR»</b> — سيتم تنظيف الجلسة القديمة وإظهار كود جديد، ثم امسحه مرة واحدة.
        </div>
      )}
      {info.waQr && info.waStatus === 'qr' && (
        <div className="flex flex-col items-center mb-5 p-5 rounded-2xl border-2 border-dashed"
          style={{ borderColor: '#F59E0B', background: '#FEF3C708' }}>

          {/* Instructions */}
          <p className="text-sm font-semibold mb-1" style={{ color: '#F59E0B' }}>
            📱 افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
            امسح الكود بالكاميرا مباشرة من هذه الشاشة
          </p>

          {/* QR Image */}
          <div className="relative">
            {info.waQr.startsWith('data:') || info.waQr.startsWith('http') ? (
              <img src={info.waQr} alt="QR Code" className="h-64 w-64 rounded-xl bg-white p-2 shadow-lg" style={{ imageRendering: "pixelated" }} />
            ) : (
              <img src={`data:image/png;base64,${info.waQr}`} alt="QR Code" className="h-64 w-64 rounded-xl bg-white p-2 shadow-lg" style={{ imageRendering: "pixelated" }} />
            )}
          </div>

          {/* Live indicator: the code refreshes from VAYRO automatically */}
          <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ background: '#10B981' }} />
            كود مباشر — يتحدّث تلقائياً كل بضع ثوانٍ{countdown > 0 ? ` (آخر تحديث قبل ${countdown} ث)` : ''}
          </p>

          {/* Buttons under QR */}
          <div className="flex gap-2 mt-4">
            <button onClick={handleCheckStatus} disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold text-white"
              style={{ background: '#10B981' }}>
              <Wifi size={12} /> تحقق من الربط
            </button>
            <button onClick={handleForceRefreshQr} disabled={loading}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              تجديد QR
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-5">
        {!info.waConnected ? (
          <button onClick={handleStart} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--color-primary)', opacity: loading ? 0.7 : 1 }}>
            <QrCode size={15} className={loading ? 'animate-pulse' : ''} />
            {loading ? 'جاري...' : info.waStatus === 'qr' ? 'إظهار الكود' : 'بدء الجلسة / الحصول على QR'}
          </button>
        ) : (
          <button onClick={handleDisconnect} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#EF4444', opacity: loading ? 0.7 : 1 }}>
            <WifiOff size={15} />
            {loading ? 'جاري...' : 'فصل الجلسة'}
          </button>
        )}
        {info.waStatus !== 'qr' && !info.waConnected && (
          <button onClick={handleCheckStatus} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحقق من الحالة
          </button>
        )}
      </div>

      {/* Test message */}
      {info.waConnected && (
        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>اختبار الإرسال</p>
          <div className="flex gap-2">
            <input value={testPhone} onChange={e => setTestPhone(e.target.value)}
              className="input-base flex-1 text-sm" dir="ltr"
              placeholder="+9639xxxxxxxx" />
            <button onClick={handleTest} disabled={sending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#10B981', opacity: sending ? 0.7 : 1 }}>
              <Send size={13} />
              {sending ? '...' : 'إرسال'}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function GeneralSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(r => setSettings(r.data.settings)).catch(() => {});
  }, []);

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success('تم الحفظ');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;

  return (
    <div>
      <PageTitle title="الإعدادات العامة" subtitle="المعلومات الأساسية للمنتج" />
      <SaveBar onSave={save} saving={saving} onPreview />

      <div className="space-y-6">
        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>هوية المنتج</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="اسم المنتج بالعربية">
              <input className="input-base" value={settings.productNameAr || ''} onChange={e => set('productNameAr', e.target.value)} />
            </FormField>
            <FormField label="اسم المنتج بالإنجليزية">
              <input className="input-base" dir="ltr" value={settings.productNameEn || ''} onChange={e => set('productNameEn', e.target.value)} />
            </FormField>
            <FormField label="اسم الوكالة">
              <input className="input-base" value={settings.brandName || ''} onChange={e => set('brandName', e.target.value)} />
            </FormField>
            <FormField label="رابط الشعار" hint="رابط صورة الشعار">
              <input className="input-base" dir="ltr" value={settings.logo || ''} onChange={e => set('logo', e.target.value)} />
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>الألوان</h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              ['اللون الرئيسي', 'primaryColor'],
              ['لون التمييز', 'accentColor'],
              ['اللون الداكن', 'darkColor'],
            ].map(([label, key]) => (
              <FormField key={key} label={label}>
                <div className="flex gap-2 items-center">
                  <input type="color" value={settings[key] || '#C9B89A'} onChange={e => set(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--color-border)', padding: '2px' }} />
                  <input className="input-base text-sm font-mono flex-1" dir="ltr" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
                </div>
              </FormField>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>التواصل</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="رقم الواتساب" hint="بدون + أو مسافات">
              <input className="input-base" dir="ltr" value={settings.whatsappNumber || ''} onChange={e => set('whatsappNumber', e.target.value)} />
            </FormField>
            <FormField label="رقم الهاتف">
              <input className="input-base" dir="ltr" value={settings.phone || ''} onChange={e => set('phone', e.target.value)} />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <input className="input-base" dir="ltr" value={settings.email || ''} onChange={e => set('email', e.target.value)} />
            </FormField>
            <FormField label="إنستغرام">
              <input className="input-base" dir="ltr" value={settings.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/..." />
            </FormField>
            <FormField label="فيسبوك">
              <input className="input-base" dir="ltr" value={settings.facebook || ''} onChange={e => set('facebook', e.target.value)} />
            </FormField>
            <FormField label="لينكدإن">
              <input className="input-base" dir="ltr" value={settings.linkedin || ''} onChange={e => set('linkedin', e.target.value)} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label="رسالة واتساب الافتراضية">
              <textarea className="input-base resize-none" rows={3} value={settings.whatsappMessage || ''} onChange={e => set('whatsappMessage', e.target.value)} />
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>شاشة التحميل</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.loadingEnabled} onChange={e => set('loadingEnabled', e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>تفعيل شاشة التحميل</span>
            </label>
            <FormField label="نص شاشة التحميل">
              <input className="input-base" value={settings.loadingText || ''} onChange={e => set('loadingText', e.target.value)} />
            </FormField>
          </div>
        </Card>

        {/* WhatsApp Session */}
        <WaSessionCard />

        {/* WhatsApp Auto-Reply */}
        <Card>
          <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>رد واتساب تلقائي</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--color-muted)' }}>يُرسل فور تقديم طلب جديد من الفورم — استخدم {'{name}'} لاسم الطبيب</p>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.autoReplyEnabled || false}
                onChange={e => set('autoReplyEnabled', e.target.checked)}
                className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-primary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text)' }}>تفعيل الرد التلقائي</span>
            </label>
            <FormField label="API Key — واتساب Prootech" hint="مفتاح session الواتساب الخاص بـ Prootech">
              <input className="input-base font-mono text-sm" dir="ltr"
                value={settings.whatsappApiKey || ''} onChange={e => set('whatsappApiKey', e.target.value)}
                placeholder="sk-..." />
            </FormField>
            <FormField label="نص الرد التلقائي">
              <textarea className="input-base resize-none text-sm" rows={5}
                value={settings.autoReplyMessage || ''} onChange={e => set('autoReplyMessage', e.target.value)} />
            </FormField>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold mb-5" style={{ color: 'var(--color-text)' }}>الفوتر</h3>
          <div className="space-y-4">
            <FormField label="وصف الفوتر">
              <textarea className="input-base resize-none" rows={3} value={settings.footerDescription || ''} onChange={e => set('footerDescription', e.target.value)} />
            </FormField>
            <FormField label="نص حقوق النشر">
              <input className="input-base" value={settings.copyrightText || ''} onChange={e => set('copyrightText', e.target.value)} />
            </FormField>
          </div>
        </Card>
      </div>
    </div>
  );
}

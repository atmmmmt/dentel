import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/api';
import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import FormField from '../../components/forms/FormField';
import SaveBar from '../../components/forms/SaveBar';
import toast from 'react-hot-toast';
import { Wifi, WifiOff, RefreshCw, Send, QrCode, Phone } from 'lucide-react';

// ── WhatsApp Session Card ────────────────────────────────────────────
const QR_LIFETIME = 600; // seconds before QR expires (10 minutes)

function WaSessionCard() {
  const [info, setInfo]           = useState({ waStatus: 'disconnected', waConnected: false, waPhone: '', waQr: '' });
  const [loading, setLoading]     = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sending, setSending]     = useState(false);
  const [countdown, setCountdown] = useState(0); // QR expiry countdown
  const pollRef    = useRef(null);
  const qrTimerRef = useRef(null);
  const countRef   = useRef(null);

  const clearAll = () => {
    clearInterval(pollRef.current);
    clearTimeout(qrTimerRef.current);
    clearInterval(countRef.current);
  };

  const loadInfo = async () => {
    try {
      const r = await adminApi.waGetInfo();
      setInfo(r.data);
    } catch {}
  };

  useEffect(() => {
    loadInfo();
    return () => clearAll();
  }, []);

  // Poll DB every 3s — fast, no timeout risk
  // Also triggers a background API check via waStatus (non-blocking)
  const startStatusPoll = () => {
    clearInterval(pollRef.current);
    let tick = 0;
    pollRef.current = setInterval(async () => {
      tick++;
      try {
        // Every 3 ticks (~9s) trigger a background API refresh
        if (tick % 3 === 0) {
          adminApi.waStatus().catch(() => {}); // fire-and-forget
        }
        // Always read from DB (fast)
        const r = await adminApi.waGetInfo();
        const newStatus = r.data.waStatus;
        setInfo(prev => ({
          ...prev,
          ...r.data,
          waQr: r.data.waQr || prev.waQr, // keep QR if DB cleared it temporarily
        }));
        if (newStatus === 'ready') {
          clearAll();
          setCountdown(0);
          toast.success('✅ تم ربط الواتساب بنجاح!');
        }
      } catch {}
    }, 3000);
  };

  // Auto-refresh QR before it expires (every 18s)
  const startQrRefresh = () => {
    // Countdown timer
    setCountdown(QR_LIFETIME);
    clearInterval(countRef.current);
    countRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Refresh QR before expiry
    clearTimeout(qrTimerRef.current);
    qrTimerRef.current = setTimeout(async () => {
      try {
        const r = await adminApi.waStart();
        if (r.data.qr) {
          setInfo(prev => ({ ...prev, waQr: r.data.qr, waStatus: 'qr' }));
          startQrRefresh(); // restart countdown
        }
      } catch {}
    }, 570000); // refresh at 9.5 minutes
  };

  const handleStart = async () => {
    clearAll();
    setLoading(true);
    try {
      const r = await adminApi.waStart();
      setInfo(prev => ({ ...prev, waStatus: r.data.status, waQr: r.data.qr, waConnected: false }));
      if (r.data.qr) {
        startStatusPoll();
        startQrRefresh();
      } else {
        toast('⏳ جاري تحضير الـ QR، اضغط "تحديث QR" بعد ثانية');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefreshQr = async () => {
    clearAll();
    setLoading(true);
    try {
      const r = await adminApi.waStart();
      if (r.data.qr) {
        setInfo(prev => ({ ...prev, waQr: r.data.qr, waStatus: 'qr' }));
        startStatusPoll();
        startQrRefresh();
        toast.success('تم تجديد الـ QR');
      } else {
        // try status
        const r2 = await adminApi.waStatus();
        setInfo(prev => ({ ...prev, ...r2.data }));
        if (r2.data.qr) startQrRefresh();
      }
    } catch {
      toast.error('فشل تجديد الـ QR');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    clearAll();
    setCountdown(0);
    setLoading(true);
    try {
      await adminApi.waDisconnect();
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
    // Trigger background API check
    adminApi.waStatus().catch(() => {});
    // Wait a moment then read from DB
    await new Promise(r => setTimeout(r, 2500));
    try {
      const r = await adminApi.waGetInfo();
      setInfo(prev => ({ ...prev, ...r.data, waQr: r.data.waQr || prev.waQr }));
      if (r.data.waStatus === 'ready') {
        clearAll(); setCountdown(0);
        toast.success('✅ الواتساب متصل!');
      } else {
        toast(`الحالة الحالية: ${r.data.waStatus || 'غير معروف'}`);
      }
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

  const statusColor = { ready: '#10B981', qr: '#F59E0B', disconnected: '#EF4444', connecting: '#6366F1' };
  const statusLabel = { ready: 'متصل ✅', qr: 'في انتظار المسح...', disconnected: 'غير متصل', connecting: 'جاري الاتصال...' };

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
      {info.waQr && info.waStatus === 'qr' && (
        <div className="flex flex-col items-center mb-5 p-5 rounded-2xl border-2 border-dashed"
          style={{ borderColor: '#F59E0B', background: '#FEF3C708' }}>

          {/* Instructions */}
          <p className="text-sm font-semibold mb-1" style={{ color: '#F59E0B' }}>
            📱 افتح واتساب ← الأجهزة المرتبطة ← ربط جهاز
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--color-muted)' }}>
            امسح الكود بالكاميرا — يتجدد تلقائياً قبل انتهاء الصلاحية
          </p>

          {/* QR Image */}
          <div className="relative">
            {info.waQr.startsWith('data:') || info.waQr.startsWith('http') ? (
              <img src={info.waQr} alt="QR Code" className="w-52 h-52 rounded-xl shadow-lg" />
            ) : (
              <img src={`data:image/png;base64,${info.waQr}`} alt="QR Code" className="w-52 h-52 rounded-xl shadow-lg" />
            )}
            {/* Countdown overlay */}
            {countdown > 0 && countdown <= 60 && (
              <div className="absolute inset-0 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="text-center text-white">
                  <div className="text-4xl font-black">{countdown}</div>
                  <div className="text-xs">يتجدد قريباً</div>
                </div>
              </div>
            )}
          </div>

          {/* Countdown bar */}
          {countdown > 0 && (
            <div className="w-52 mt-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                <span>صلاحية الكود</span>
                <span style={{ color: countdown <= 60 ? '#EF4444' : '#F59E0B' }}>
                  {countdown >= 60 ? `${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,'0')}` : `${countdown}ث`}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${(countdown / QR_LIFETIME) * 100}%`,
                    background: countdown <= 5 ? '#EF4444' : '#F59E0B',
                  }} />
              </div>
            </div>
          )}

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
            {loading ? 'جاري...' : info.waStatus === 'qr' ? 'إعادة بدء الجلسة' : 'بدء الجلسة / الحصول على QR'}
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

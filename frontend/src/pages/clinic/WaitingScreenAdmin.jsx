import { useState, useEffect, useCallback } from 'react';
import { Monitor, ExternalLink, Plus, Trash2, Save, Bell, CheckCircle, Video, Tag } from 'lucide-react';
import { clinicDashApi } from '../../services/clinicApi';
import toast from 'react-hot-toast';

/* لوحة التحكم بشاشة غرفة الانتظار:
   • فتح الشاشة على تلفزيون العيادة
   • التحكم المباشر بالطابور (نادِ / التالي / وصل)
   • إعدادات المحتوى (رسالة ترحيب، فيديوهات، عروض، خيارات العرض)  */
export default function WaitingScreenAdmin({ slug, settings }) {
  const P = settings?.primaryColor || '#123B57';
  const today = new Date().toISOString().split('T')[0];

  const [ws, setWs] = useState({
    enabled: true, welcomeMessage: 'أهلاً وسهلاً بكم في عيادتنا',
    showQueue: true, showVideos: true, showOffers: true, showInfo: true,
    callSound: true, maskNames: false, videos: [], offers: [],
  });
  const [appts, setAppts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    clinicDashApi.getSettings(slug).then(r => {
      if (r.data.settings?.waitingScreen) setWs(prev => ({ ...prev, ...r.data.settings.waitingScreen }));
    }).catch(() => {});
  }, [slug]);

  const loadQueue = useCallback(() => {
    clinicDashApi.getAppointments(slug, { date: today }).then(r => {
      const list = (r.data.appointments || [])
        .filter(a => ['pending', 'confirmed'].includes(a.status))
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      setAppts(list);
    }).catch(() => {});
  }, [slug, today]);

  useEffect(() => { loadQueue(); const t = setInterval(loadQueue, 8000); return () => clearInterval(t); }, [loadQueue]);

  const nowServingId = appts.filter(a => a.calledAt)
    .sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt))[0]?._id;

  const call = async (id) => {
    await clinicDashApi.callAppointment(slug, id).catch(() => {});
    toast.success('تمت المناداة على الشاشة');
    loadQueue();
  };
  const callNext = async () => {
    const next = appts.find(a => !a.arrived && a._id !== nowServingId) || appts.find(a => a._id !== nowServingId);
    if (!next) return toast('لا يوجد مريض تالٍ');
    await call(next._id);
  };
  const toggleArrived = async (a) => {
    await clinicDashApi.setArrived(slug, a._id, !a.arrived).catch(() => {});
    loadQueue();
  };

  const save = async () => {
    setSaving(true);
    try {
      await clinicDashApi.updateSettings(slug, { waitingScreen: ws });
      toast.success('تم حفظ إعدادات الشاشة');
    } catch { toast.error('تعذّر الحفظ'); }
    setSaving(false);
  };

  const openScreen = () => window.open(`/clinic/${slug}/waiting`, '_blank', 'noopener');

  const Toggle = ({ label, k }) => (
    <label className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 cursor-pointer">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input type="checkbox" checked={!!ws[k]} onChange={e => setWs({ ...ws, [k]: e.target.checked })}
        className="h-5 w-9 appearance-none rounded-full bg-gray-300 checked:bg-[color:var(--p)] transition relative cursor-pointer
          before:content-[''] before:absolute before:top-0.5 before:right-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:-translate-x-4"
        style={{ '--p': P }} />
    </label>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl grid place-items-center text-white" style={{ background: P }}>
            <Monitor size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-800">شاشة غرفة الانتظار</h1>
            <p className="text-sm text-gray-400">اعرضها على تلفزيون العيادة ونظّم دور المرضى</p>
          </div>
        </div>
        <button onClick={openScreen}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-bold shadow-lg"
          style={{ background: P }}>
          <ExternalLink size={18} /> افتح الشاشة الآن
        </button>
      </div>

      {/* التحكم المباشر بالطابور */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-gray-800 flex items-center gap-2"><Bell size={18} /> طابور اليوم — تحكّم مباشر</h2>
          <button onClick={callNext} className="px-4 py-2 rounded-xl font-bold text-white text-sm" style={{ background: P }}>
            نادِ التالي ⏭
          </button>
        </div>
        {appts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا توجد مواعيد اليوم</p>
        ) : (
          <div className="space-y-2">
            {appts.map((a, i) => (
              <div key={a._id}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${a._id === nowServingId ? 'border-transparent text-white' : 'border-gray-100 bg-gray-50'}`}
                style={a._id === nowServingId ? { background: P } : {}}>
                <div className="h-9 w-9 rounded-full grid place-items-center font-black bg-white/20">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{a.patientName}</div>
                  <div className={`text-xs truncate ${a._id === nowServingId ? 'opacity-80' : 'text-gray-400'}`}>
                    {a.time} {a.service ? `· ${a.service}` : ''}
                  </div>
                </div>
                <button onClick={() => toggleArrived(a)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold ${a.arrived ? 'bg-green-100 text-green-700' : 'bg-white text-gray-500 border border-gray-200'}`}>
                  {a.arrived ? '✓ حاضر' : 'وصل؟'}
                </button>
                <button onClick={() => call(a._id)}
                  className={`text-xs px-4 py-1.5 rounded-lg font-bold ${a._id === nowServingId ? 'bg-white/25' : 'text-white'}`}
                  style={a._id === nowServingId ? {} : { background: P }}>
                  {a._id === nowServingId ? 'يُنادى الآن' : 'نادِ'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* الإعدادات */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-5">
        <h2 className="font-extrabold text-gray-800">إعدادات المحتوى</h2>

        <div>
          <label className="block text-sm font-bold text-gray-600 mb-1.5">رسالة الترحيب</label>
          <input value={ws.welcomeMessage} onChange={e => setWs({ ...ws, welcomeMessage: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          <Toggle label="عرض طابور المواعيد" k="showQueue" />
          <Toggle label="عرض فيديوهات الأعمال" k="showVideos" />
          <Toggle label="عرض العروض والإعلانات" k="showOffers" />
          <Toggle label="عرض معلومات العيادة" k="showInfo" />
          <Toggle label="صوت تنبيه عند المناداة" k="callSound" />
          <Toggle label="إخفاء اسم العائلة (خصوصية)" k="maskNames" />
        </div>

        {/* الفيديوهات */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Video size={16} /> فيديوهات الأعمال</h3>
            <button onClick={() => setWs({ ...ws, videos: [...ws.videos, { url: '', title: '' }] })}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800"><Plus size={14} /> إضافة</button>
          </div>
          <p className="text-xs text-gray-400 mb-2">الصق رابط يوتيوب أو رابط فيديو مباشر (mp4). تُعرض بالتناوب تلقائياً.</p>
          <div className="space-y-2">
            {ws.videos.map((v, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="رابط الفيديو" value={v.url}
                  onChange={e => { const n = [...ws.videos]; n[i] = { ...n[i], url: e.target.value }; setWs({ ...ws, videos: n }); }}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" dir="ltr" />
                <input placeholder="العنوان" value={v.title}
                  onChange={e => { const n = [...ws.videos]; n[i] = { ...n[i], title: e.target.value }; setWs({ ...ws, videos: n }); }}
                  className="w-40 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <button onClick={() => setWs({ ...ws, videos: ws.videos.filter((_, j) => j !== i) })}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            ))}
            {ws.videos.length === 0 && <p className="text-xs text-gray-300 py-2">لا توجد فيديوهات — ستظهر رسالة الترحيب.</p>}
          </div>
        </div>

        {/* العروض */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Tag size={16} /> العروض والإعلانات</h3>
            <button onClick={() => setWs({ ...ws, offers: [...ws.offers, { text: '', active: true }] })}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-800"><Plus size={14} /> إضافة</button>
          </div>
          <div className="space-y-2">
            {ws.offers.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input placeholder="نص العرض — مثال: خصم 20% على تبييض الأسنان" value={o.text}
                  onChange={e => { const n = [...ws.offers]; n[i] = { ...n[i], text: e.target.value }; setWs({ ...ws, offers: n }); }}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <button onClick={() => setWs({ ...ws, offers: ws.offers.filter((_, j) => j !== i) })}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            ))}
            {ws.offers.length === 0 && <p className="text-xs text-gray-300 py-2">لا توجد عروض بعد.</p>}
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold disabled:opacity-60"
          style={{ background: P }}>
          <Save size={18} /> {saving ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}

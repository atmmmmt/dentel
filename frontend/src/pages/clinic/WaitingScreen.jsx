import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { clinicPublicApi } from '../../services/clinicApi';

/* ─────────────────────────────────────────────────────────────
   شاشة غرفة الانتظار — عرض ملء الشاشة على تلفزيون العيادة
   عامة (بدون تسجيل دخول)، تُحدّث نفسها كل 6 ثوانٍ:
   • طابور مواعيد اليوم + "دورك الآن"
   • فيديوهات أعمال الدكتور (تشغيل تلقائي متتابع)
   • عروض ومعلومات العيادة
   • مناداة المريض بصوت تنبيه عند تغيّر الدور
   ───────────────────────────────────────────────────────────── */

const POLL_MS = 6000;

/* تحويل رابط يوتيوب إلى رابط تضمين مع تشغيل تلقائي صامت */
function toEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return { type: 'youtube', src: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0` };
  }
  return { type: 'file', src: url };
}

/* جرس تنبيه لطيف بدون ملف صوتي (Web Audio) */
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1174.66, 1567.98]; // A5, D6, G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.75);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch { /* الصوت غير متاح */ }
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="text-left">
      <div className="text-4xl font-bold tabular-nums leading-none">{time}</div>
      <div className="text-lg opacity-80 mt-1">{date}</div>
    </div>
  );
}

export default function WaitingScreen() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [videoIdx, setVideoIdx] = useState(0);
  const [callOverlay, setCallOverlay] = useState(null); // مريض تتم مناداته الآن
  const lastCallId = useRef(null);
  const soundEnabled = useRef(false);
  const videoRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await clinicPublicApi.getWaitingScreen(slug);
      const d = res.data;
      setData(d);
      setError('');
      // كشف مناداة جديدة
      const ns = d.nowServing;
      if (ns && String(ns._id) !== String(lastCallId.current)) {
        if (lastCallId.current !== null) { // ليس أول تحميل
          setCallOverlay(ns);
          if (d.waitingScreen?.callSound && soundEnabled.current) playChime();
          setTimeout(() => setCallOverlay(null), 9000);
        }
        lastCallId.current = ns._id;
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'تعذّر تحميل البيانات');
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, POLL_MS);
    return () => clearInterval(t);
  }, [fetchData]);

  const ws = data?.waitingScreen;
  const videos = ws?.showVideos ? (ws.videos || []) : [];

  // تدوير الفيديوهات (لروابط يوتيوب فقط — ملفات mp4 تنتقل عند الانتهاء)
  useEffect(() => {
    if (videos.length < 2) return;
    const cur = toEmbed(videos[videoIdx]?.url);
    if (cur?.type === 'youtube') {
      const t = setTimeout(() => setVideoIdx(i => (i + 1) % videos.length), 40000);
      return () => clearTimeout(t);
    }
  }, [videos, videoIdx]);

  const nextVideo = () => setVideoIdx(i => (i + 1) % Math.max(videos.length, 1));

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-2xl" dir="rtl">
        {error}
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-2xl" dir="rtl">جارٍ التحميل…</div>;
  }

  const { clinic, queue = [], nowServing } = data;
  const primary = clinic.primaryColor || '#2D6BEB';
  const accent = clinic.accentColor || '#1A3A7C';
  const activeOffers = ws?.showOffers ? (ws.offers || []) : [];
  const curVideo = videos.length ? toEmbed(videos[videoIdx % videos.length]?.url) : null;

  return (
    <div dir="rtl" className="min-h-screen w-full text-white overflow-hidden flex flex-col"
      style={{ background: `linear-gradient(135deg, ${accent} 0%, #0b1220 60%)` }}>

      {/* طلب تفعيل الصوت (متصفحات تمنع الصوت التلقائي) */}
      {!soundEnabled.current && (
        <button
          onClick={() => { soundEnabled.current = true; playChime(); setData(d => ({ ...d })); }}
          className="fixed bottom-4 left-4 z-50 bg-white/15 hover:bg-white/25 backdrop-blur px-4 py-2 rounded-full text-sm">
          🔊 تفعيل صوت المناداة
        </button>
      )}

      {/* الترويسة */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10 shrink-0"
        style={{ background: 'rgba(0,0,0,0.15)' }}>
        <div className="flex items-center gap-4">
          {clinic.logo
            ? <img src={clinic.logo} alt="" className="h-16 w-16 object-contain rounded-xl bg-white/90 p-1" />
            : <div className="h-16 w-16 rounded-xl grid place-items-center text-3xl font-black" style={{ background: primary }}>🦷</div>}
          <div>
            <h1 className="text-3xl font-black leading-tight">{clinic.clinicName}</h1>
            <p className="text-lg opacity-80">{clinic.doctorName}</p>
          </div>
        </div>
        <Clock />
      </header>

      {/* المحتوى */}
      <main className="flex-1 grid grid-cols-12 gap-5 p-5 min-h-0">
        {/* يمين: الطابور */}
        {ws?.showQueue && (
          <section className="col-span-4 flex flex-col min-h-0">
            {/* دورك الآن */}
            <div className="rounded-3xl p-6 mb-4 shrink-0 shadow-2xl relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
              <div className="text-lg font-bold opacity-90 mb-1">🔔 دورك الآن</div>
              {nowServing ? (
                <>
                  <div className="text-4xl font-black truncate">{nowServing.name}</div>
                  {nowServing.service && <div className="text-lg opacity-90 mt-1 truncate">{nowServing.service}</div>}
                </>
              ) : (
                <div className="text-2xl font-bold opacity-80">— بانتظار المناداة —</div>
              )}
            </div>
            {/* قائمة الانتظار */}
            <div className="rounded-3xl bg-white/8 backdrop-blur flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="px-5 py-3 text-xl font-bold border-b border-white/10 shrink-0">قائمة الانتظار اليوم</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {queue.filter(q => !q.isServing).length === 0 && (
                  <div className="text-center opacity-60 py-10 text-lg">لا توجد مواعيد قادمة</div>
                )}
                {queue.filter(q => !q.isServing).map((q) => (
                  <div key={q._id} className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/8">
                    <div className="h-10 w-10 rounded-full grid place-items-center font-black text-lg shrink-0"
                      style={{ background: q.arrived ? primary : 'rgba(255,255,255,0.15)' }}>{q.order}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-bold truncate">{q.name}</div>
                      {q.service && <div className="text-sm opacity-70 truncate">{q.service}</div>}
                    </div>
                    <div className="text-left shrink-0">
                      <div className="text-lg font-bold tabular-nums">{q.time}</div>
                      {q.arrived && <div className="text-xs" style={{ color: '#4ade80' }}>✓ حاضر</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* يسار: فيديو + عروض */}
        <section className={`${ws?.showQueue ? 'col-span-8' : 'col-span-12'} flex flex-col min-h-0 gap-5`}>
          <div className="flex-1 rounded-3xl overflow-hidden bg-black/40 relative min-h-0 grid place-items-center">
            {curVideo ? (
              curVideo.type === 'youtube' ? (
                <iframe key={curVideo.src} className="w-full h-full" src={curVideo.src}
                  title="عرض" frameBorder="0" allow="autoplay; encrypted-media" />
              ) : (
                <video key={curVideo.src} ref={videoRef} className="w-full h-full object-cover"
                  src={curVideo.src} autoPlay muted playsInline onEnded={nextVideo}
                  {...(videos.length < 2 ? { loop: true } : {})} />
              )
            ) : (
              <div className="text-center px-8">
                <div className="text-6xl mb-4">🦷</div>
                <div className="text-4xl font-black mb-3">{ws?.welcomeMessage}</div>
                <div className="text-xl opacity-70">نتمنى لكم إقامة مريحة</div>
              </div>
            )}
            {curVideo && videos[videoIdx]?.title && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <div className="text-2xl font-bold">{videos[videoIdx].title}</div>
              </div>
            )}
          </div>

          {/* شريط العروض المتحرك */}
          {activeOffers.length > 0 && (
            <div className="rounded-2xl overflow-hidden shrink-0 py-3 relative"
              style={{ background: primary }}>
              <div className="whitespace-nowrap animate-[marquee_28s_linear_infinite] text-2xl font-bold flex gap-16">
                {[...activeOffers, ...activeOffers].map((o, i) => (
                  <span key={i} className="inline-flex items-center gap-3">✨ {o.text}</span>
                ))}
              </div>
            </div>
          )}

          {/* معلومات العيادة */}
          {ws?.showInfo && (
            <div className="rounded-2xl bg-white/8 backdrop-blur px-6 py-4 shrink-0 flex items-center justify-around text-lg flex-wrap gap-4">
              {clinic.phone && <span className="flex items-center gap-2">📞 {clinic.phone}</span>}
              {clinic.address && <span className="flex items-center gap-2">📍 {clinic.address}</span>}
              {clinic.whatsapp && <span className="flex items-center gap-2">💬 {clinic.whatsapp}</span>}
            </div>
          )}
        </section>
      </main>

      {/* طبقة المناداة (تظهر عند مناداة مريض جديد) */}
      {callOverlay && (
        <div className="fixed inset-0 z-40 grid place-items-center animate-[fadeIn_.3s_ease]"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="text-center px-10 animate-[pop_.5s_ease]">
            <div className="text-3xl opacity-80 mb-4">🔔 نُنادي على</div>
            <div className="text-8xl font-black mb-6" style={{ color: '#fff', textShadow: `0 0 40px ${primary}` }}>
              {callOverlay.name}
            </div>
            <div className="text-3xl font-bold px-8 py-3 rounded-full inline-block" style={{ background: primary }}>
              تفضّل لغرفة الطبيب
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop { 0% { transform: scale(.7); opacity: 0 } 60% { transform: scale(1.05) } 100% { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  );
}

/*
 * طبقة العمل الأوفلاين — Offline-first layer
 * ─────────────────────────────────────────────
 * 1. كاش لكل استجابات GET في IndexedDB (يبقى بعد إغلاق الجهاز).
 * 2. صندوق صادر (Outbox): أي عملية إضافة/تعديل/حذف أثناء انقطاع النت
 *    تُحفظ محلياً وتُطبَّق على الكاش فوراً (تحديث متفائل)،
 *    ثم تُرفَع للسيرفر تلقائياً عند عودة الاتصال بنفس الترتيب.
 * 3. الكيانات المنشأة أوفلاين تأخذ معرّف مؤقت (tmp_...) يُستبدل
 *    بالمعرّف الحقيقي أثناء المزامنة.
 */
import localforage from 'localforage';

const cacheStore = localforage.createInstance({ name: 'clinic-offline', storeName: 'api_cache' });
const outboxStore = localforage.createInstance({ name: 'clinic-offline', storeName: 'outbox' });

/* ─── status pub/sub ─────────────────────────────────────────────── */
const status = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pending: 0,
  syncing: false,
  lastSyncCount: 0,
};
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn({ ...status }));

export const subscribeOffline = (fn) => { listeners.add(fn); fn({ ...status }); return () => listeners.delete(fn); };
export const getOfflineStatus = () => ({ ...status });

export const newTempId = () => `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const isTempId = (id) => typeof id === 'string' && id.startsWith('tmp_');

/* ─── GET cache ──────────────────────────────────────────────────── */
export const cacheKey = (url, params) => `GET:${url}:${JSON.stringify(params || {})}`;
export const cacheSet = (key, data) => cacheStore.setItem(key, data).catch(() => {});
export const cacheGet = (key) => cacheStore.getItem(key).catch(() => null);

// كل مفاتيح الكاش التي تبدأ بـ prefix معيّن (لتحديث القوائم المتفائلة)
const cacheKeysByPrefix = async (prefix) => {
  const keys = await cacheStore.keys().catch(() => []);
  return keys.filter(k => k.startsWith(prefix));
};
const patchCacheByPrefix = async (prefix, patchFn) => {
  const keys = await cacheKeysByPrefix(prefix);
  for (const k of keys) {
    const data = await cacheGet(k);
    if (data) await cacheSet(k, patchFn(data) || data);
  }
};

/* ─── Outbox ─────────────────────────────────────────────────────── */
const outboxItems = async () => {
  const keys = await outboxStore.keys().catch(() => []);
  const items = [];
  for (const k of keys) items.push(await outboxStore.getItem(k));
  return items.filter(Boolean).sort((a, b) => a.seq - b.seq);
};

const refreshPending = async () => {
  const keys = await outboxStore.keys().catch(() => []);
  status.pending = keys.length;
  notify();
};

let seqCounter = Date.now();

/**
 * أضف عملية للصندوق الصادر.
 * لو كانت العملية تعديل/حذف على كيان أُنشئ أوفلاين (معرّف مؤقت)،
 * نُدمج التعديل في طلب الإنشاء المنتظر بدل إضافة طلب جديد —
 * هكذا لا نحتاج ربط المعرّفات المؤقتة بالحقيقية لهذه الحالات.
 */
export const queueMutation = async ({ method, url, data, tempId }) => {
  const tmpInUrl = url.match(/tmp_[0-9]+_[a-z0-9]+/g) || [];

  if ((method === 'put' || method === 'delete') && tmpInUrl.length) {
    const lastTmp = tmpInUrl[tmpInUrl.length - 1];
    const items = await outboxItems();
    const creator = items.find(it => it.tempId === lastTmp);
    if (creator) {
      if (method === 'delete') {
        await outboxStore.removeItem(creator.key);
      } else {
        creator.data = { ...creator.data, ...data };
        await outboxStore.setItem(creator.key, creator);
      }
      await refreshPending();
      return creator.key;
    }
  }

  const key = `ob_${++seqCounter}`;
  await outboxStore.setItem(key, { key, seq: seqCounter, method, url, data, tempId, at: new Date().toISOString() });
  await refreshPending();
  return key;
};

/* ─── مزامنة الصندوق الصادر عند عودة النت ────────────────────────── */
let flushing = false;

export const flushOutbox = async (axiosInstance) => {
  if (flushing) return;
  flushing = true;
  status.syncing = true;
  notify();

  const idMap = {}; // tempId → real id
  let flushed = 0;

  try {
    const items = await outboxItems();
    for (const item of items) {
      // استبدل المعرفات المؤقتة في الرابط بالحقيقية
      let url = item.url;
      Object.entries(idMap).forEach(([tmp, real]) => { url = url.split(tmp).join(real); });
      if (/tmp_[0-9]+_[a-z0-9]+/.test(url)) {
        // معرف مؤقت لم يُحل — أنشئه طلب سابق فشل؛ تخطَّ العنصر
        await outboxStore.removeItem(item.key);
        continue;
      }
      try {
        const res = await axiosInstance.request({ method: item.method, url, data: item.data, _skipOffline: true });
        // خرائط المعرفات: استخرج الـ id الحقيقي للكيان المنشأ
        if (item.tempId && res?.data) {
          const real = res.data.patient?._id || res.data.appointment?._id || res.data.entity?._id;
          if (real) idMap[item.tempId] = real;
        }
        await outboxStore.removeItem(item.key);
        flushed++;
      } catch (err) {
        const unreachable = !err.response
          || [502, 503, 504].includes(err.response.status)
          || (err.response.status === 500 && (err.response.data === '' || err.response.data == null));
        if (unreachable) throw err;             // ما زلنا أوفلاين — أوقف وحاول لاحقاً
        await outboxStore.removeItem(item.key); // رفض من السيرفر (4xx) — لا تسدّ الطابور
      }
    }
  } catch { /* لا يوجد اتصال — سنحاول عند عودة النت */ }

  status.syncing = false;
  status.lastSyncCount = flushed;
  await refreshPending();
  flushing = false;
  return flushed;
};

/* ─── التحديث المتفائل للكاش (حسب نوع الرابط) ────────────────────── */
/**
 * يطبّق العملية على الكاش المحلي فوراً ويعيد جسم استجابة اصطناعي
 * بنفس شكل استجابة السيرفر حتى تعمل الواجهة بشكل طبيعي.
 */
export const applyOptimistic = async (method, url, data, tempId) => {
  const now = new Date().toISOString();

  // ── الجلسات: /patients/:pid/sessions[/:sid] ──
  let m = url.match(/^(.*\/dash\/patients)\/([^/]+)\/sessions(?:\/([^/]+))?$/);
  if (m) {
    const [, base, pid, sid] = m;
    const detailKey = cacheKey(`${base}/${pid}`, {});
    const cached = await cacheGet(detailKey);
    if (!cached?.patient) return { success: true, queued: true };
    const patient = { ...cached.patient };
    let sessions = [...(patient.sessions || [])];
    if (method === 'post') sessions.push({ ...data, _id: tempId, createdAt: now });
    if (method === 'put') sessions = sessions.map(s => s._id === sid ? { ...s, ...data } : s);
    if (method === 'delete') sessions = sessions.filter(s => s._id !== sid);
    patient.sessions = sessions;
    await cacheSet(detailKey, { ...cached, patient });
    await patchCacheByPrefix(`GET:${base}:`, (d) => d.patients
      ? { ...d, patients: d.patients.map(p => p._id === pid ? { ...p, sessions } : p) } : d);
    return { success: true, queued: true, patient };
  }

  // ── المرضى: /patients[/:id] ──
  m = url.match(/^(.*\/dash\/patients)(?:\/([^/]+))?$/);
  if (m) {
    const [, base, id] = m;
    let entity = null;
    if (method === 'post') {
      entity = { ...data, _id: tempId, sessions: [], createdAt: now, updatedAt: now };
      await cacheSet(cacheKey(`${base}/${tempId}`, {}), { success: true, patient: entity });
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.patients
        ? { ...d, patients: [entity, ...d.patients], total: (d.total || 0) + 1 } : d);
    } else if (method === 'put') {
      const detailKey = cacheKey(`${base}/${id}`, {});
      const cached = await cacheGet(detailKey);
      entity = { ...(cached?.patient || {}), ...data, _id: id };
      if (cached) await cacheSet(detailKey, { ...cached, patient: entity });
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.patients
        ? { ...d, patients: d.patients.map(p => p._id === id ? { ...p, ...data } : p) } : d);
    } else if (method === 'delete') {
      await cacheStore.removeItem(cacheKey(`${base}/${id}`, {})).catch(() => {});
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.patients
        ? { ...d, patients: d.patients.filter(p => p._id !== id), total: Math.max(0, (d.total || 1) - 1) } : d);
    }
    return { success: true, queued: true, patient: entity };
  }

  // ── المواعيد: /appointments[/:id] ──
  m = url.match(/^(.*\/dash\/appointments)(?:\/([^/]+))?$/);
  if (m) {
    const [, base, id] = m;
    let entity = null;
    if (method === 'post') {
      entity = { ...data, _id: tempId, status: data.status || 'pending', createdAt: now };
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.appointments
        ? { ...d, appointments: [entity, ...d.appointments], total: (d.total || 0) + 1 } : d);
    } else if (method === 'put') {
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.appointments
        ? { ...d, appointments: d.appointments.map(a => a._id === id ? { ...a, ...data } : a) } : d);
      entity = { _id: id, ...data };
    } else if (method === 'delete') {
      await patchCacheByPrefix(`GET:${base}:`, (d) => d.appointments
        ? { ...d, appointments: d.appointments.filter(a => a._id !== id), total: Math.max(0, (d.total || 1) - 1) } : d);
    }
    return { success: true, queued: true, appointment: entity };
  }

  // ── الخدمات: /services[/:id] (تُخزَّن ضمن settings) ──
  m = url.match(/^(.*\/dash\/services)(?:\/([^/]+))?$/);
  if (m) {
    const [, base, id] = m;
    const listKey = cacheKey(base, {});
    const cached = (await cacheGet(listKey)) || { success: true, services: [] };
    let services = [...(cached.services || [])];
    if (method === 'post') services.push({ ...data, _id: tempId });
    if (method === 'put') services = services.map(s => s._id === id ? { ...s, ...data } : s);
    if (method === 'delete') services = services.filter(s => s._id !== id);
    await cacheSet(listKey, { ...cached, services });
    return { success: true, queued: true, services };
  }

  // ── معرض الأعمال: /gallery[/:id] ──
  m = url.match(/^(.*\/dash\/gallery)(?:\/([^/]+))?$/);
  if (m) {
    const [, base, id] = m;
    const listKey = cacheKey(base, {});
    const cached = (await cacheGet(listKey)) || { success: true, gallery: [] };
    let gallery = [...(cached.gallery || [])];
    if (method === 'post') gallery.push({ ...data, _id: tempId });
    if (method === 'delete') gallery = gallery.filter(g => g._id !== id);
    await cacheSet(listKey, { ...cached, gallery });
    return { success: true, queued: true, gallery };
  }

  // ── أوقات الدوام ──
  if (/\/dash\/working-hours$/.test(url) && method === 'put') {
    const key = cacheKey(url, {});
    const cached = (await cacheGet(key)) || { success: true };
    await cacheSet(key, { ...cached, workingHours: data.workingHours });
    return { success: true, queued: true, workingHours: data.workingHours };
  }

  // ── إعدادات الموقع ──
  if (/\/dash\/settings$/.test(url) && method === 'put') {
    const key = cacheKey(url, {});
    const cached = (await cacheGet(key)) || { success: true, settings: {} };
    const settings = { ...(cached.settings || {}), ...data };
    await cacheSet(key, { ...cached, settings });
    return { success: true, queued: true, settings };
  }

  return { success: true, queued: true };
};

/* ─── مراقبة حالة الاتصال ────────────────────────────────────────── */
let flushHook = null;
export const setFlushHook = (fn) => { flushHook = fn; };

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    status.online = true;
    notify();
    if (flushHook) flushHook();
  });
  window.addEventListener('offline', () => {
    status.online = false;
    notify();
  });
  refreshPending();
}

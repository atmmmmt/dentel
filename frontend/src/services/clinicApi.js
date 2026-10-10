import axios from 'axios';
import {
  cacheKey, cacheSet, cacheGet, queueMutation, applyOptimistic,
  newTempId, flushOutbox, setFlushHook, getOfflineStatus,
} from './offlineStore';

// For clinic doctors (uses clinic_token)
const _BASE = import.meta.env.VITE_API_URL || '/api';
const clinicApi = axios.create({ baseURL: _BASE, timeout: 15000 });

clinicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ─── Offline-first layer ──────────────────────────────────────────
   GET   → يُخزَّن في IndexedDB؛ عند انقطاع النت يُقرأ من الكاش.
   POST/PUT/DELETE → عند الانقطاع تُحفَظ في صندوق صادر وتُطبَّق
   على الكاش فوراً، ثم تُرفَع تلقائياً عند عودة الاتصال.        */
const OFFLINE_CACHEABLE = (url) => url && (url.includes('/dash/') || url.includes('/auth/me') || url.includes('/public'));
const OFFLINE_QUEUEABLE = (url) => url && url.includes('/dash/')
  && !url.includes('/whatsapp/') && !url.includes('/upload') && !url.includes('/onboarding');

clinicApi.interceptors.response.use(
  (res) => {
    const { method, url, params, _skipOffline } = res.config || {};
    if (!_skipOffline && method === 'get' && OFFLINE_CACHEABLE(url)) {
      cacheSet(cacheKey(url, params), res.data);
    }
    return res;
  },
  async (err) => {
    const cfg = err.config || {};
    // السيرفر غير قابل للوصول: انقطاع شبكة حقيقي، أو بوابة عاطلة (nginx 502/504)،
    // أو 500 بجسم فارغ (vite proxy أثناء التطوير عندما يكون الباكيند مطفأ)
    const isNetworkError = !err.response
      || [502, 503, 504].includes(err.response.status)
      || (err.response.status === 500 && (err.response.data === '' || err.response.data == null));
    if (isNetworkError && !cfg._skipOffline) {
      const method = (cfg.method || 'get').toLowerCase();
      const url = cfg.url || '';

      if (method === 'get' && OFFLINE_CACHEABLE(url)) {
        const cached = await cacheGet(cacheKey(url, cfg.params));
        if (cached) return { data: cached, status: 200, fromCache: true, config: cfg };
      }

      if (['post', 'put', 'delete'].includes(method) && OFFLINE_QUEUEABLE(url)) {
        const data = cfg.data ? (typeof cfg.data === 'string' ? JSON.parse(cfg.data) : cfg.data) : undefined;
        const tempId = method === 'post' ? newTempId() : undefined;
        await queueMutation({ method, url, data, tempId });
        const synthetic = await applyOptimistic(method, url, data, tempId);
        return { data: synthetic, status: 200, queued: true, config: cfg };
      }
    }
    return Promise.reject(err);
  }
);

// مزامنة تلقائية: عند عودة الاتصال، عند فتح التطبيق، ومحاولة دورية كل 30 ثانية
setFlushHook(() => flushOutbox(clinicApi));
if (typeof window !== 'undefined') {
  setTimeout(() => flushOutbox(clinicApi), 2500);
  setInterval(() => {
    const st = getOfflineStatus();
    if (navigator.onLine && st.pending > 0 && !st.syncing) flushOutbox(clinicApi);
  }, 30000);
}

// For Prootech admin managing clinics (uses prootech_token)
const prootechApi = axios.create({ baseURL: _BASE, timeout: 15000 });

prootechApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('prootech_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

clinicApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_slug');
    }
    return Promise.reject(err);
  }
);

export const clinicPublicApi = {
  getClinic: (slug) => clinicApi.get(`/clinic/${slug}/public`),
  bookAppointment: (slug, data) => clinicApi.post(`/clinic/${slug}/public/book`, data),
  getWaitingScreen: (slug) => clinicApi.get(`/clinic/${slug}/public/waiting`),
};

export const clinicAuthApi = {
  login: (slug, data) => clinicApi.post(`/clinic/${slug}/auth/login`, data),
  getMe: (slug) => clinicApi.get(`/clinic/${slug}/auth/me`),
  updatePassword: (slug, data) => clinicApi.put(`/clinic/${slug}/auth/password`, data),
};

export const clinicDashApi = {
  getStats: (slug) => clinicApi.get(`/clinic/${slug}/dash/stats`),
  getSettings: (slug) => clinicApi.get(`/clinic/${slug}/dash/settings`),
  updateSettings: (slug, data) => clinicApi.put(`/clinic/${slug}/dash/settings`, data),
  completeOnboardingStep: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/onboarding/step`, data),
  getServices: (slug) => clinicApi.get(`/clinic/${slug}/dash/services`),
  addService: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/services`, data),
  updateService: (slug, id, data) => clinicApi.put(`/clinic/${slug}/dash/services/${id}`, data),
  deleteService: (slug, id) => clinicApi.delete(`/clinic/${slug}/dash/services/${id}`),
  getWorkingHours: (slug) => clinicApi.get(`/clinic/${slug}/dash/working-hours`),
  updateWorkingHours: (slug, data) => clinicApi.put(`/clinic/${slug}/dash/working-hours`, data),
  getGallery: (slug) => clinicApi.get(`/clinic/${slug}/dash/gallery`),
  addGalleryItem: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/gallery`, data),
  deleteGalleryItem: (slug, id) => clinicApi.delete(`/clinic/${slug}/dash/gallery/${id}`),
  getAppointments: (slug, params) => clinicApi.get(`/clinic/${slug}/dash/appointments`, { params }),
  createAppointment: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/appointments`, data),
  updateAppointment: (slug, id, data) => clinicApi.put(`/clinic/${slug}/dash/appointments/${id}`, data),
  callAppointment: (slug, id) => clinicApi.post(`/clinic/${slug}/dash/appointments/${id}/call`),
  setArrived: (slug, id, arrived) => clinicApi.post(`/clinic/${slug}/dash/appointments/${id}/arrived`, { arrived }),
  deleteAppointment: (slug, id) => clinicApi.delete(`/clinic/${slug}/dash/appointments/${id}`),
  uploadImage: (slug, formData) => clinicApi.post(`/clinic/${slug}/dash/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDomain: (slug) => clinicApi.get(`/clinic/${slug}/dash/domain`),
  saveDomain: (slug, data) => clinicApi.put(`/clinic/${slug}/dash/domain`, data),
  verifyDomain: (slug) => clinicApi.get(`/clinic/${slug}/dash/domain/verify`, { timeout: 45000 }),
  requestDomainHelp: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/domain/help`, data),
};

// Patient files with dental chart (Premium+)
export const clinicPatientsApi = {
  getPatients: (slug, params) => clinicApi.get(`/clinic/${slug}/dash/patients`, { params }),
  createPatient: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/patients`, data),
  getPatient: (slug, id) => clinicApi.get(`/clinic/${slug}/dash/patients/${id}`),
  updatePatient: (slug, id, data) => clinicApi.put(`/clinic/${slug}/dash/patients/${id}`, data),
  deletePatient: (slug, id) => clinicApi.delete(`/clinic/${slug}/dash/patients/${id}`),
  addSession: (slug, id, data) => clinicApi.post(`/clinic/${slug}/dash/patients/${id}/sessions`, data),
  updateSession: (slug, id, sessionId, data) => clinicApi.put(`/clinic/${slug}/dash/patients/${id}/sessions/${sessionId}`, data),
  deleteSession: (slug, id, sessionId) => clinicApi.delete(`/clinic/${slug}/dash/patients/${id}/sessions/${sessionId}`),
  addMedia: (slug, id, data) => clinicApi.post(`/clinic/${slug}/dash/patients/${id}/media`, data),
  deleteMedia: (slug, id, mediaId) => clinicApi.delete(`/clinic/${slug}/dash/patients/${id}/media/${mediaId}`),
  addPeriodontalExam: (slug, id, data) => clinicApi.post(`/clinic/${slug}/dash/patients/${id}/periodontal-exams`, data),
  deletePeriodontalExam: (slug, id, examId) => clinicApi.delete(`/clinic/${slug}/dash/patients/${id}/periodontal-exams/${examId}`),
  addEndodonticCase: (slug, id, data) => clinicApi.post(`/clinic/${slug}/dash/patients/${id}/endodontic-cases`, data),
  updateEndodonticCase: (slug, id, caseId, data) => clinicApi.put(`/clinic/${slug}/dash/patients/${id}/endodontic-cases/${caseId}`, data),
  deleteEndodonticCase: (slug, id, caseId) => clinicApi.delete(`/clinic/${slug}/dash/patients/${id}/endodontic-cases/${caseId}`),
};

export const clinicFinanceApi = {
  getSummary: (slug) => clinicApi.get(`/clinic/${slug}/dash/finance/summary`),
  getInvoices: (slug, params) => clinicApi.get(`/clinic/${slug}/dash/finance/invoices`, { params }),
  createInvoice: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/finance/invoices`, data),
  updateInvoice: (slug, id, data) => clinicApi.put(`/clinic/${slug}/dash/finance/invoices/${id}`, data),
  addPayment: (slug, id, data) => clinicApi.post(`/clinic/${slug}/dash/finance/invoices/${id}/payments`, data),
  voidInvoice: (slug, id) => clinicApi.post(`/clinic/${slug}/dash/finance/invoices/${id}/void`),
  getCollections: (slug) => clinicApi.get(`/clinic/${slug}/dash/finance/collections`),
};

export const clinicStaffApi = {
  getAll: (slug) => clinicApi.get(`/clinic/${slug}/dash/staff`),
  create: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/staff`, data),
  update: (slug, id, data) => clinicApi.put(`/clinic/${slug}/dash/staff/${id}`, data),
  delete: (slug, id) => clinicApi.delete(`/clinic/${slug}/dash/staff/${id}`),
};

// Prootech admin manages clinics — uses prootechApi (prootech_token)
export const adminClinicApi = {
  getStats: () => prootechApi.get('/product/admin/clinics/stats'),
  getRevenue: () => prootechApi.get('/product/admin/clinics/revenue'),
  getClinics: (params) => prootechApi.get('/product/admin/clinics', { params }),
  getClinic: (id) => prootechApi.get(`/product/admin/clinics/${id}`),
  createClinic: (data) => prootechApi.post('/product/admin/clinics', data),
  updateClinic: (id, data) => prootechApi.put(`/product/admin/clinics/${id}`, data),
  resetPassword: (id) => prootechApi.post(`/product/admin/clinics/${id}/reset-password`),
  renewSubscription: (id, data) => prootechApi.post(`/product/admin/clinics/${id}/renew`, data),
  deleteClinic: (id) => prootechApi.delete(`/product/admin/clinics/${id}`),
  verifyDomain: (id) => prootechApi.get(`/product/admin/clinics/${id}/verify-domain`, { timeout: 45000 }),
  checkSlug: (slug) => prootechApi.get('/product/admin/clinics/slug-check', { params: { slug } }),
  getWelcomeKit: (id) => prootechApi.get(`/product/admin/clinics/${id}/welcome-kit`),
};

// Clinic WhatsApp (clinic dashboard)
export const clinicWaApi = {
  getInfo: (slug) => clinicApi.get(`/clinic/${slug}/dash/whatsapp/info`),
  getQR: (slug) => clinicApi.get(`/clinic/${slug}/dash/whatsapp/qr`),
  getStatus: (slug) => clinicApi.get(`/clinic/${slug}/dash/whatsapp/status`),
  sendTest: (slug, data) => clinicApi.post(`/clinic/${slug}/dash/whatsapp/send-test`, data),
  updatePhone: (slug, data) => clinicApi.put(`/clinic/${slug}/dash/whatsapp/phone`, data),
};

export default clinicApi;

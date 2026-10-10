import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: `${BASE}/product`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prootech_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('prootech_token');
      if (window.location.pathname.startsWith('/product-admin') && window.location.pathname !== '/product-admin/login') {
        window.location.href = '/product-admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// Public
export const publicApi = {
  getSettings: () => api.get('/public/settings'),
  getLanding: () => api.get('/public/landing'),
  getPricing: () => api.get('/public/pricing'),
  getTestimonials: () => api.get('/public/testimonials'),
  getFAQs: () => api.get('/public/faqs'),
  submitLead: (data) => api.post('/public/leads', data),
};

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Admin
export const adminApi = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),

  getLanding: () => api.get('/admin/landing'),
  updateLanding: (data) => api.put('/admin/landing', data),

  getPricing: () => api.get('/admin/pricing'),
  createPricing: (data) => api.post('/admin/pricing', data),
  updatePricing: (id, data) => api.put(`/admin/pricing/${id}`, data),
  deletePricing: (id) => api.delete(`/admin/pricing/${id}`),

  getTestimonials: () => api.get('/admin/testimonials'),
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`),

  getFAQs: () => api.get('/admin/faqs'),
  createFAQ: (data) => api.post('/admin/faqs', data),
  updateFAQ: (id, data) => api.put(`/admin/faqs/${id}`, data),
  deleteFAQ: (id) => api.delete(`/admin/faqs/${id}`),

  getLeads: (params) => api.get('/admin/leads', { params }),
  getLead: (id) => api.get(`/admin/leads/${id}`),
  updateLead: (id, data) => api.put(`/admin/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/admin/leads/${id}`),
  getDashboardStats: () => api.get('/admin/dashboard-stats'),

  getMedia: () => api.get('/admin/media'),
  uploadMedia: (formData) => api.post('/admin/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMedia: (id) => api.delete(`/admin/media/${id}`),

  // WhatsApp session (WaOTP)
  waGetInfo:    ()     => api.get('/admin/wa/info'),
  waStart:      ()     => api.post('/admin/wa/start'),
  waStatus:     ()     => api.get('/admin/wa/status'),
  waDisconnect: ()     => api.post('/admin/wa/disconnect'),
  waTest:       (data) => api.post('/admin/wa/test', data),
};

export default api;

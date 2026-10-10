import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const vipApi = (slug) => axios.create({ baseURL: `${BASE}/clinic/${slug}/public`, timeout: 15000 });

export const createVipPublicApi = (slug) => {
  const api = vipApi(slug);
  return {
    getSettings:    ()                    => api.get('/'),
    getServices:    ()                    => api.get('/services'),
    getGallery:     (featured)            => api.get('/gallery', { params: { featured } }),
    getFAQ:         ()                    => api.get('/faq'),
    getAvailability:(date, serviceId)     => api.get('/availability', { params: { date, serviceId } }),
    createBooking:  (data)                => api.post('/book', data),
  };
};

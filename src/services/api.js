import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('1sol_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('1sol_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: (data) => api.post('/api/auth/signup', data).then(r => r.data),
  login: (data) => api.post('/api/auth/login', data).then(r => r.data),
  me: () => api.get('/api/me').then(r => r.data),
};

export const dreams = {
  list: (params) => api.get('/api/dreams', { params }).then(r => r.data),
  top: () => api.get('/api/dreams/top').then(r => r.data),
  hall: () => api.get('/api/dreams/hall').then(r => r.data),
  graveyard: () => api.get('/api/dreams/graveyard').then(r => r.data),
  post: (data) => api.post('/api/dreams', data).then(r => r.data),
  edit: (id, data) => api.put(`/api/dreams/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/api/dreams/${id}`).then(r => r.data),
};

export const beliefs = {
  my: () => api.get('/api/beliefs/me').then(r => r.data),
  place: (dreamId) => api.post(`/api/beliefs/${dreamId}`).then(r => r.data),
  remove: (dreamId) => api.delete(`/api/beliefs/${dreamId}`).then(r => r.data),
};

export const profile = {
  get: (wallet) => api.get(`/api/profile/${wallet}`).then(r => r.data),
  update: (data) => api.put('/api/profile', data).then(r => r.data),
};

export const wallet = {
  verify: (addr) => api.get(`/api/verify-wallet?wallet=${addr}`).then(r => r.data),
};

export default api;

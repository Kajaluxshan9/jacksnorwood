import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// AuthContext registers its logout function here so the axios interceptor can
// trigger a proper React state reset rather than just wiping localStorage.
let _logoutHandler = null;
export const setLogoutHandler = (fn) => { _logoutHandler = fn; };

// Resolve uploaded file paths (e.g. "/uploads/file.jpg") to full backend URLs
const BACKEND_ORIGIN = BASE_URL.replace(/\/api$/, '');
export const resolveImageUrl = (url, fallback = "") => {
  if (!url) return fallback;
  if (url.startsWith("http")) return url;
  return BACKEND_ORIGIN + url;
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (_logoutHandler) {
        _logoutHandler();
      } else {
        // Fallback before AuthContext mounts (e.g. very early requests)
        localStorage.removeItem('jn_token');
        localStorage.removeItem('jn_user');
      }
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// File Upload
export const uploadAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
};

// Menu
export const menuAPI = {
  getCategories: () => api.get('/menu/categories'),
  getAll: () => api.get('/menu'),
  getAllAdmin: () => api.get('/menu/all'),
  getPopular: () => api.get('/menu/popular'),
  getByCategory: (id) => api.get(`/menu/category/${id}`),
  create: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (id, data) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
  // Subcategories
  getSubcategories: () => api.get('/menu/subcategories'),
  getSubcategoriesByCategory: (catId) => api.get(`/menu/subcategories/category/${catId}`),
  createSubcategory: (data) => api.post('/menu/subcategories', data),
  updateSubcategory: (id, data) => api.put(`/menu/subcategories/${id}`, data),
  deleteSubcategory: (id) => api.delete(`/menu/subcategories/${id}`),
};

// Promotions
export const promotionAPI = {
  getActive: () => api.get('/promotions'),
  getAll: () => api.get('/promotions/all'),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  delete: (id) => api.delete(`/promotions/${id}`),
};

// Events
export const eventAPI = {
  getUpcoming: () => api.get('/events'),
  getAll: () => api.get('/events/all'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

// Gallery
export const galleryAPI = {
  getAll: (category) => api.get('/gallery', { params: category ? { category } : {} }),
  create: (data) => api.post('/gallery', data),
  delete: (id) => api.delete(`/gallery/${id}`),
};

// Reservations
export const reservationAPI = {
  create: (data) => api.post('/reservations', data),
  getAll: () => api.get('/reservations'),
  updateStatus: (id, status) => api.put(`/reservations/${id}/status`, { status }),
};

// Contact
export const contactAPI = {
  send: (data) => api.post('/contact', data),
  getAll: () => api.get('/contact'),
  markRead: (id) => api.put(`/contact/${id}/read`),
};

// Newsletter
export const newsletterAPI = {
  subscribe: (email, name) => api.post('/newsletter/subscribe', { email, name }),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  getSubscribers: () => api.get('/newsletter/subscribers'),
  send: (subject, body, imageUrl) => api.post('/newsletter/send', { subject, body, imageUrl }),
};

// Hero Images
export const heroImageAPI = {
  getActive: () => api.get('/hero-images'),
  getAll: () => api.get('/hero-images/all'),
  create: (data) => api.post('/hero-images', data),
  delete: (id) => api.delete(`/hero-images/${id}`),
};

// Team Members
export const teamAPI = {
  getAll: () => api.get('/team'),
  create: (data) => api.post('/team', data),
  update: (id, data) => api.put(`/team/${id}`, data),
  delete: (id) => api.delete(`/team/${id}`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

// Site Settings
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  updateAll: (data) => api.put('/settings', data),
};

export default api;

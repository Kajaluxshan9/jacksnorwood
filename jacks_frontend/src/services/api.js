import axios from 'axios';
import { LS_TOKEN_KEY, LS_USER_KEY } from '../config/constants';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]', ''];

const getDefaultApiBaseUrl = () => {
  const host = window.location.hostname;

  if (host === 'jacksnorwoodpub.ca' || host === 'www.jacksnorwoodpub.ca') {
    return 'https://api.jacksnorwoodpub.ca/api';
  }

  // Only fall back to a local backend when we are genuinely running locally.
  // Any other host (a preview/staging deploy, a custom domain) previously fell
  // through to localhost:8080 and silently failed every request, so point it at
  // the production API instead and surface the misconfiguration in the console.
  if (LOCAL_HOSTNAMES.includes(host)) {
    return 'http://localhost:8080/api';
  }

  console.warn(
    `[api] No VITE_API_BASE_URL set and "${host}" is not a known host. ` +
    'Falling back to the production API.',
  );
  return 'https://api.jacksnorwoodpub.ca/api';
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

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
  const token = localStorage.getItem(LS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout when the session is no longer usable.
//
// Two things were wrong here before:
//  - only 401 was handled, but Spring Security answered 403 for an expired
//    token, so the admin was left on a dead session with every panel failing;
//  - the redirect also fired on the login page itself, so a wrong password
//    triggered a full page reload that wiped the error toast before it showed.
//
// The backend now returns 401 for "not authenticated", but 403 is still treated
// as a dead session when a token is present, so an older backend keeps working.
const isLoginRequest = (config) => (config?.url || '').includes('/auth/login');

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hadToken = Boolean(localStorage.getItem(LS_TOKEN_KEY));
    const sessionExpired = status === 401 || (status === 403 && hadToken);

    // A failed sign-in attempt is a form error, not an expired session.
    if (sessionExpired && !isLoginRequest(error.config)) {
      if (_logoutHandler) {
        _logoutHandler();
      } else {
        // Fallback before AuthContext mounts (e.g. very early requests)
        localStorage.removeItem(LS_TOKEN_KEY);
        localStorage.removeItem(LS_USER_KEY);
      }
      // Never redirect away from the login page - that reload is what used to
      // destroy the "Invalid username or password" message.
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Pulls a human-readable message out of an API error.
 * The backend now returns { message } for 400/404 responses.
 */
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

// File Upload
const postFile = (path, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(path, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const uploadAPI = {
  /** Admin-only: site imagery. */
  upload: (file) => postFile('/upload', file),
  /**
   * Public: CV/resume for the careers contact form.
   * The admin image endpoint requires ROLE_ADMIN, so anonymous applicants were
   * getting a permission error on every attempt.
   */
  uploadCv: (file) => postFile('/upload/cv', file),
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
  /** Atomically turns a category into a subcategory of another category. */
  convertCategory: (data) => api.post('/menu/categories/convert', data),
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
  update: (id, data) => api.put(`/gallery/${id}`, data),
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
  delete: (id) => api.delete(`/contact/${id}`),
};

// Newsletter
export const newsletterAPI = {
  subscribe: (email, name) => api.post('/newsletter/subscribe', { email, name }),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  getSubscribers: () => api.get('/newsletter/subscribers'),
  deleteSubscriber: (id) => api.delete(`/newsletter/subscribers/${id}`),
  send: (subject, body, imageUrl) => api.post('/newsletter/send', { subject, body, imageUrl }),
};

// Hero Images
export const heroImageAPI = {
  getActive: () => api.get('/hero-images'),
  getAll: () => api.get('/hero-images/all'),
  create: (data) => api.post('/hero-images', data),
  update: (id, data) => api.put(`/hero-images/${id}`, data),
  reorder: (ids) => api.put('/hero-images/reorder', { ids }),
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

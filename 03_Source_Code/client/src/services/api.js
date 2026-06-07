import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyOTP: (tempToken, code) => api.post('/auth/verify-otp', { tempToken, code }),
  resendOTP: (tempToken) => api.post('/auth/resend-otp', { tempToken }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Articles API
export const articlesAPI = {
  getPublished: () => api.get('/articles'),
  getAll: () => api.get('/articles/all'),
  getById: (id) => api.get(`/articles/${id}`),
  create: (data) => api.post('/articles', data),
  update: (id, data) => api.put(`/articles/${id}`, data),
  delete: (id) => api.delete(`/articles/${id}`),
  // User submission
  submit: (data) => api.post('/articles/submit', data),
  getMySubmissions: () => api.get('/articles/my-submissions'),
  // Admin review
  getPending: () => api.get('/articles/pending'),
  review: (id, data) => api.put(`/articles/${id}/review`, data),
};

// Comments API
export const commentsAPI = {
  getByArticle: (articleId) => api.get(`/articles/${articleId}/comments`),
  create: (articleId, content) => api.post(`/articles/${articleId}/comments`, { content }),
  delete: (articleId, commentId) => api.delete(`/articles/${articleId}/comments/${commentId}`),
};

// Aspirations API
export const aspirationsAPI = {
  getPublic: () => api.get('/aspirations'),
  create: (data) => api.post('/aspirations', data),
  getMy: () => api.get('/aspirations/my'),
  getAll: () => api.get('/aspirations/all'),
  updateStatus: (id, data) => api.put(`/aspirations/${id}/status`, data),
  delete: (id) => api.delete(`/aspirations/${id}`),
};

// Documentation API
export const documentationAPI = {
  getAll: () => api.get('/documentation'),
  getById: (id) => api.get(`/documentation/${id}`),
  create: (data) => api.post('/documentation', data),
  update: (id, data) => api.put(`/documentation/${id}`, data),
  delete: (id) => api.delete(`/documentation/${id}`),
};

// Operations API
export const operationsAPI = {
  getAll: () => api.get('/operations'),
  update: (data) => api.put('/operations', data),
};

// Security API
export const securityAPI = {
  getSummary: () => api.get('/security/summary'),
  getAuthStats: () => api.get('/security/auth-stats'),
  getAuthzStats: () => api.get('/security/authz-stats'),
  getAuditLogs: (page = 1, limit = 25, search = '') =>
    api.get(`/security/audit-logs?page=${page}&limit=${limit}&search=${search}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;

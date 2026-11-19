import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const register = (name, email, password) => api.post('/api/auth/register', { name, email, password });
export const getMe = () => api.get('/api/auth/me');

// Dashboard
export const getDashboardSummary = () => api.get('/api/dashboard/summary');

// Receipts
export const uploadReceipts = (formData) => api.post('/api/receipts/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getReceipts = (params) => api.get('/api/receipts/', { params });
export const getReceipt = (id) => api.get(`/api/receipts/${id}`);
export const deleteReceipt = (id) => api.delete(`/api/receipts/${id}`);
export const processReceipt = (id) => api.post(`/api/receipts/${id}/process`);
export const getReceiptFileUrl = (id) => `${API_URL}/api/receipts/${id}/file`;

// Expenses
export const getExpenses = (params) => api.get('/api/expenses/', { params });
export const getExpense = (id) => api.get(`/api/expenses/${id}`);
export const updateExpense = (id, data) => api.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/api/expenses/${id}`);
export const exportExpenses = (params) => api.get('/api/expenses/export', { params, responseType: 'blob' });
export const getCategories = () => api.get('/api/expenses/categories');

// Reports
export const getTaxSummary = (params) => api.get('/api/reports/tax-summary', { params });
export const exportTaxSummary = (params) => api.get('/api/reports/tax-summary/export', { params, responseType: 'blob' });

export default api;

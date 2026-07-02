import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  error => {
    console.error('[API Error]', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;

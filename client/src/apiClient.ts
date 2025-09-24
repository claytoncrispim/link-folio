import axios from 'axios';

// Vite exposes environment variables on the `import.meta.env` object.
// VITE_API_BASE_URL will be undefined in development, but will be set on Vercel.
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL 
    ? VITE_API_BASE_URL // In production, use the full URL from Vercel's env variables.
    : '/',          // In development, use the relative path for the proxy.
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

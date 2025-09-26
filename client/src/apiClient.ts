import axios from 'axios';

// --- CONFIGURATION ---
// This part remains the same. It determines the base URL for our requests.
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL ? VITE_API_BASE_URL : '/',
});

// --- JWT INTERCEPTOR ---
// This request interceptor adds the Authorization token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- NEW: AUTO-RETRY INTERCEPTOR for Cold Starts ---
// This response interceptor will catch errors and automatically retry a failed request once.
apiClient.interceptors.response.use(
  // If the response is successful, just return it.
  (response) => response,
  // If the response fails, this function runs.
  async (error) => {
    const originalRequest = error.config;

    // THE LOGIC:
    // 1. Check if the error is a network error (server didn't respond).
    // 2. Check a custom flag '_retry' to ensure we only try this ONCE.
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true; // Mark this request so we don't retry it again.
      
      // Wait for 2 seconds to give the server a moment to wake up.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return the original request, which axios will try again.
      return apiClient(originalRequest);
    }
    
    // For all other errors (like 404, 401, etc.), just reject the promise.
    return Promise.reject(error);
  }
);

export default apiClient;
// apiClient.js
import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

// Sanitize production base URL to correct common deployment environment typos (e.g. indian_railways_prod..ay..app)
if (typeof API_BASE_URL === 'string') {
  const originalUrl = API_BASE_URL;
  if (API_BASE_URL.includes('indian_railways_prod..ay..app') || API_BASE_URL.includes('indian_railways_prod')) {
    API_BASE_URL = 'https://indian-railways-prod.up.railway.app';
  } else if (API_BASE_URL.includes('..ay..app')) {
    API_BASE_URL = API_BASE_URL.replace('..ay..app', '.up.railway.app').replace(/_/g, '-');
  }
  if (originalUrl !== API_BASE_URL) {
    console.log(`[API Client] Sanitized API Base URL from "${originalUrl}" to "${API_BASE_URL}"`);
  }
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Check for 401 unauthorized errors (token expired/invalid)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // If we are not already on the login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

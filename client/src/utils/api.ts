import axios from 'axios';

// Debug: Log the API URL being used
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Window location:', window.location.origin);

// Determine API URL - Railway production vs local development
const getApiUrl = () => {
  // If deployed on Railway, use the same domain
  if (window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  // Local development
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

const apiUrl = getApiUrl();
console.log('Using API URL:', apiUrl);

// Create axios instance with base configuration
const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

// Debug: Log the API URL being used
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Window location:', window.location.origin);

// Determine API URL - Railway production vs local development
const getApiUrl = () => {
  // Always use VITE_API_URL if it's set (production or custom configuration)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Local development fallback
  return 'http://localhost:8080';
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

// Calendar API functions
export const getMemoriesByDate = (date: string) => {
  return api.get(`/api/memories/date/${date}`);
};

export const getMemoriesForMonth = (year: number, month: number) => {
  return api.get(`/api/memories/month/${year}/${month}`);
};

// Export the API URL for use in image sources
export const API_BASE_URL = apiUrl;

export default api;
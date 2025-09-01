import axios from 'axios';

// Base URL configurable via variable d'environnement VITE_API_BASE_URL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://printalma-back-dep.onrender.com';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

// Interceptor de logging (dev uniquement)
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    console.log('🚀 [API] Request', config.method?.toUpperCase(), config.url, config.data);
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => {
      console.log('✅ [API] Response', response.status, response.data);
      return response;
    },
    (error) => {
      console.error('❌ [API] Error', error.response?.status, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
} 
 
 
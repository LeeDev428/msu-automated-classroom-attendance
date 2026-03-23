import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend: run  php -S 0.0.0.0:8000  inside the /backend folder
// Web (same machine):  http://localhost:8000/
// Physical device / Expo Go on phone: use your machine's LAN IP (ipconfig), e.g. http://192.168.0.31:8000/
export const API_BASE_URL = 'http://192.168.0.31:8000/'; // default fallback
const API_BASE_URL_STORAGE_KEY = 'apiBaseUrl';

const normalizeBaseUrl = (value) => {
  if (!value) return API_BASE_URL;
  let url = String(value).trim();
  if (!url) return API_BASE_URL;

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  if (!url.endsWith('/')) {
    url = `${url}/`;
  }

  return url;
};

export const getApiBaseUrl = async () => {
  const stored = await AsyncStorage.getItem(API_BASE_URL_STORAGE_KEY);
  return normalizeBaseUrl(stored || API_BASE_URL);
};

export const setApiBaseUrl = async (value) => {
  const normalized = normalizeBaseUrl(value);
  await AsyncStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
  return normalized;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const [token, dynamicBaseUrl] = await Promise.all([
      AsyncStorage.getItem('authToken'),
      getApiBaseUrl(),
    ]);

    config.baseURL = dynamicBaseUrl;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = `${error.config?.baseURL || api.defaults.baseURL || ''}${error.config?.url || ''}`;

    if (error.response) {
      // Server responded with an error status code
      console.error('API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: requestUrl,
        method: error.config?.method,
        responseData: error.response.data,
      });
    } else if (error.request) {
      // Request sent but no response received
      console.error('Network Error Details:', {
        code: error.code,
        message: error.message,
        url: requestUrl,
        method: error.config?.method,
        timeoutMs: error.config?.timeout,
      });
    } else {
      // Request setup issue before sending
      console.error('Request Setup Error:', {
        message: error.message,
        url: requestUrl,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

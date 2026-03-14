// ============================================================
// CLIENT LAPTOP VERSION — copy content into src/config/api.js
// and change the IP to match the client's LAN IP (ipconfig)
// ============================================================
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Run: C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe -S 0.0.0.0:8000 router.php
// inside the /backend folder on client's laptop
export const API_BASE_URL = 'http://192.168.110.208:8000/'; // <-- client's LAN IP

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Inject auth token into every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

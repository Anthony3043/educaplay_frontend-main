import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleUnauthorized } from '../utils/authState';

const API_URL = 'https://backend-educaplay.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 s — necessário para o cold start do Render (free tier dorme após 15 min)
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token em toda requisição
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@educaplay_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;

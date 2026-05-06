import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api'; // Web / iOS Simulator
// Para Android Emulator use: 'http://10.0.2.2:3000/api'
// Para dispositivo físico use o IP da sua máquina: 'http://192.168.x.x:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
      AsyncStorage.removeItem('@educaplay_token');
      AsyncStorage.removeItem('@educaplay_user');
    }
    return Promise.reject(error);
  }
);

export default api;

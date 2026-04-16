/**
 * Serviço de API - Axios Configuration
 * Centraliza toda a configuração de requisições HTTP
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants';

// Criar instância do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Requisição
api.interceptors.request.use(
  (config) => {
    // Aqui você pode adicionar token de autenticação
    // const token = AsyncStorage.getItem('@educaplay_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros centralizado
    if (error.response) {
      // Erro da API
      console.error('Erro na resposta:', error.response.status);
    } else if (error.request) {
      // Requisição feita mas sem resposta
      console.error('Nenhuma resposta recebida');
    } else {
      // Erro ao preparar a requisição
      console.error('Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Índice de Constantes
 * Exporta todas as constantes da aplicação
 */

export { COLORS, default as COLORS_DEFAULT } from './colors';
export { TYPOGRAPHY, default as TYPOGRAPHY_DEFAULT } from './typography';
export { SPACING, default as SPACING_DEFAULT } from './spacing';

// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
export const API_TIMEOUT = 10000;

// Storage Keys
export const STORAGE_KEYS = {
  userToken: '@educaplay_token',
  userData: '@educaplay_user',
  appSettings: '@educaplay_settings',
};

// Chat Topics
export const CHAT_TOPICS = {
  MOVIES: { id: 'movies', label: 'Filmes', emoji: '🎬' },
  GAMES: { id: 'games', label: 'Jogos', emoji: '🎮' },
  SERIES: { id: 'series', label: 'Séries', emoji: '📺' },
};

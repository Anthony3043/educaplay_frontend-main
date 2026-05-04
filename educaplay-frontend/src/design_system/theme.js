/**
 * Design System - Tema Principal
 * Centraliza todas as variáveis de design da aplicação
 */

import { COLORS, SPACING, TYPOGRAPHY } from "../constants";

export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,

  // Tamanhos de Border Radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  // Shadows
  shadows: {
    none: {
      elevation: 0,
    },
    sm: {
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
    },
    md: {
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    lg: {
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
  },

  // Transições
  transitions: {
    fast: 200,
    medium: 300,
    slow: 500,
  },
};

export default THEME;

export const Palette = {
  // Verdes (cor principal do PlanejaEdu)
  green900: '#1a3d22',
  green800: '#2a5c32',
  green700: '#3a7d44',   // ← verde principal
  green600: '#4a9655',
  green500: '#5aad6a',
  green400: '#7dc48a',
  green300: '#a8d9b0',
  green200: '#cfecd4',
  green100: '#e8f5ea',
  green50:  '#f0faf1',

  // Neutros
  gray900: '#111827',
  gray800: '#1f2937',
  gray700: '#374151',
  gray600: '#4b5563',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray300: '#d1d5db',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50:  '#f9fafb',

  // Feedback
  red500:    '#ef4444',
  red100:    '#fee2e2',
  yellow500: '#f59e0b',
  yellow200: '#FFE0A0',  // borda de aviso / warning border
  yellow100: '#fef3c7',
  blue500:   '#3b82f6',
  blue100:   '#dbeafe',

  // Laranja (usado em Salas como cor de destaque secundária)
  orange500: '#FF8C00',
  orange100: '#FFF3E0',

  // Âmbar (texto sobre fundo de aviso)
  amber800: '#92400e',

  // Absolutos
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Tema Light ─────────────────────────────────────────────────────────────

export const LightColors = {
  // Marca
  primary:        Palette.green700,
  primaryLight:   Palette.green500,
  primaryDark:    Palette.green800,
  primaryPale:    Palette.green100,
  primarySurface: Palette.green50,

  // Superfícies
  background:     Palette.green50,
  surface:        Palette.white,
  surfaceAlt:     Palette.gray100,
  border:         Palette.gray200,
  borderFocus:    Palette.green700,

  // Textos
  textPrimary:    Palette.gray900,
  textSecondary:  Palette.gray600,
  textMuted:      Palette.gray400,
  textOnPrimary:  Palette.white,
  textLink:       Palette.green700,

  // Estados de feedback
  success:        Palette.green700,
  successBg:      Palette.green100,
  error:          Palette.red500,
  errorBg:        Palette.red100,
  warning:        Palette.yellow500,
  warningBg:      Palette.yellow100,
  warningBorder:  Palette.yellow200,
  warningText:    Palette.amber800,
  info:           Palette.blue500,
  infoBg:         Palette.blue100,

  // Destaque secundário (laranja — usado em Salas)
  accent:         Palette.orange500,
  accentBg:       Palette.orange100,

  // Sombras
  shadow:         Palette.black,
} as const;

// ─── Tema Dark ───────────────────────────────────────────────────────────────

export const DarkColors = {
  // Marca
  primary:        Palette.green500,
  primaryLight:   Palette.green400,
  primaryDark:    Palette.green600,
  primaryPale:    Palette.green900,
  primarySurface: Palette.green900,

  // Superfícies
  background:     Palette.gray900,
  surface:        Palette.gray800,
  surfaceAlt:     Palette.gray700,
  border:         Palette.gray700,
  borderFocus:    Palette.green500,

  // Textos
  textPrimary:    Palette.gray50,
  textSecondary:  Palette.gray400,
  textMuted:      Palette.gray500,
  textOnPrimary:  Palette.white,
  textLink:       Palette.green400,

  // Estados de feedback
  success:        Palette.green400,
  successBg:      Palette.green900,
  error:          Palette.red500,
  errorBg:        '#3b0f0f',
  warning:        Palette.yellow500,
  warningBg:      '#3b2a0a',
  warningBorder:  Palette.yellow500,
  warningText:    Palette.yellow500,
  info:           Palette.blue500,
  infoBg:         '#0f1f3b',

  // Destaque secundário (laranja — dark mode)
  accent:         '#FFA040',
  accentBg:       '#2D1800',

  // Sombras
  shadow:         Palette.black,
} as const;

// ─── Export padrão (light) ───────────────────────────────────────────────────

export const Colors = LightColors;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type ColorScheme = typeof LightColors;
export type DarkColorScheme = typeof DarkColors;
export type ColorKey = keyof ColorScheme;

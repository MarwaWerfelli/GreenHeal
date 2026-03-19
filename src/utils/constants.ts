// Healing Journey Light Theme - calm, modern recovery aesthetic
export const COLORS = {
  // Base backgrounds - bright, clinical-calm surfaces
  bgBase: '#f4f7f9',
  bgSurface: '#ffffff',
  bgElevated: '#fbfdff',
  
  // Glass & overlays
  glassOverlay: 'rgba(255,255,255,0.82)',
  glassBorder: 'rgba(255,255,255,0.94)',
  borderSubtle: '#d9e5e4',
  borderStrong: '#bfd2d1',
  
  // Primary - confident healing teal
  primary: '#2a6b5f',
  primaryDim: '#2a6b5f',
  primaryGlow: 'rgba(42,107,95,0.16)',
  primaryLight: '#74a99c',
  primaryDark: '#1b4c43',
  primaryPale: '#e7f3ef',
  primaryGradient: ['#4c8b7c', '#2a6b5f'],
  
  // Accent - warm recovery highlights
  accentGold: '#d59a57',
  accentGoldDim: 'rgba(213,154,87,0.16)',
  accentGoldGradient: ['#d59a57', '#bb7d3f'],
  accentWarm: '#d59a57',
  accentWarmPale: '#fbf3e8',
  accentRose: '#d78696',
  accentRoseSoft: '#f7e7ec',
  accentLavender: '#ebeafe',
  
  // Accent - soft sky blue for clarity
  accentBlue: '#eaf3fb',
  accentBlueIcon: '#5c93b7',
  
  // Secondary - balanced slate green
  secondary: '#617784',
  secondaryLight: '#9aaab4',
  secondaryDark: '#41515a',
  
  // Text - softer, modern contrast
  textPrimary: '#1c2f2f',
  textSecondary: '#66757d',
  textDisabled: '#9aa7ae',
  textMuted: '#9aa7ae',
  textLight: '#8fa0a8',
  
  // Status colors
  success: '#5e9f7f',
  warning: '#d59a57',
  error: '#de5b67',
  info: '#5c93b7',
  
  // Gradients
  heroGradient: ['#f6f8fb', '#e5f0ea'],
  cardGradient: ['#ffffff', '#f8fbfd'],
  
  // Healing theme colors
  healing: {
    calm: '#7ca6bc',
    energy: '#2a6b5f',
    balance: '#8d95c8',
    growth: '#7daa8c',
    wisdom: '#617784',
  },

  moodScale: ['#d96e74', '#e5a161', '#d7bb63', '#84a87d', '#4f9075'],
  
  // Shadows & effects
  shadow: 'rgba(28,47,47,0.08)',
  shadowGlow: 'rgba(42,107,95,0.24)',
  glowPrimary: 'rgba(42,107,95,0.24)',
  
  // Legacy compatibility
  background: '#f4f7f9',
  backgroundLight: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#fbfdff',
  surfaceMuted: '#f0f5f7',
  text: '#1c2f2f',
  white: '#ffffff',
  darkGreen: '#2a6b5f',
  mediumGreen: '#74a99c',
  accent: '#2a6b5f',
  accentGreen: '#74a99c',
  accentCool: '#5c93b7',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  warmBeige: '#fbf3e8',
  lightCream: '#f4f7f9',
};

// Typography system
export const TYPOGRAPHY = {
  // Headers: 24-32px bold
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 48,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 42,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  // Body: 16px regular
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: 'normal' as const,
    lineHeight: 27,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 21,
  },
  // Captions: 12-14px medium
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 21,
  },
  captionSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
};

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const BORDER_RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  circle: '50%' as const,
};

// Shadow styles - soft recovery-themed elevation
export const SHADOWS = {
  small: {
    shadowColor: 'rgba(28,47,47,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: 'rgba(28,47,47,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: 'rgba(28,47,47,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: 'rgba(42,107,95,0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  glowSubtle: {
    shadowColor: 'rgba(42,107,95,0.14)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Storage keys
export const STORAGE_KEYS = {
  LANGUAGE: '@greenheal:language',
  ONBOARDING: '@greenheal:onboarding',
  AI_REQUEST_COUNT: '@greenheal:ai_request_count',
};

// API limits
export const API_LIMITS = {
  DAILY_AI_REQUESTS: 5,
};

// Cache duration
export const CACHE_DURATION_DAYS = 7;

// Healing journey tips
export const HEALING_TIPS = [
  'A short daily reflection can make changes in mood and energy easier to notice.',
  'Keeping calming plants nearby can support a more grounded healing space.',
  'Small routines often feel more sustainable than trying to change everything at once.',
  'Noting symptoms, sleep, and emotions weekly can help prepare care-team conversations.',
  'Gentle moments of light, water, and greenery can make a room feel safer and softer.',
  'Progress is not always linear; tracking small wins can still show real movement.',
  'A healing space works best when it supports both emotional comfort and practical care needs.',
];

// Organized Design System Export
export const DESIGN_SYSTEM = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

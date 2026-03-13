// Fresh Botanical Light Theme - Clean, airy wellness aesthetic
export const COLORS = {
  // Base backgrounds - Soft whites with botanical depth
  bgBase: '#f6fbf8',
  bgSurface: '#ffffff',
  bgElevated: '#fcfffd',
  
  // Glass & overlays
  glassOverlay: 'rgba(255,255,255,0.74)',
  glassBorder: 'rgba(255,255,255,0.92)',
  borderSubtle: '#dbe9df',
  
  // Primary - Deep confident forest green
  primary: '#255b43',
  primaryDim: '#255b43',
  primaryGlow: 'rgba(37,91,67,0.16)',
  primaryLight: '#5ca47d',
  primaryDark: '#163729',
  primaryPale: '#e7f2eb',
  
  // Accent - Warm botanical gold
  accentGold: '#d9a44d',
  accentGoldDim: 'rgba(217,164,77,0.16)',
  accentGoldGradient: ['#d9a44d', '#be8833'],
  accentWarm: '#d9a44d',
  accentWarmPale: '#fbf4e8',
  
  // Accent - Soft sky blue for water
  accentBlue: '#eaf5fb',
  accentBlueIcon: '#4f9fc4',
  
  // Secondary - Natural green-grey
  secondary: '#62796b',
  secondaryLight: '#93aa9a',
  secondaryDark: '#425447',
  
  // Text - Deep forest tones
  textPrimary: '#173126',
  textSecondary: '#617568',
  textDisabled: '#95ab9d',
  textMuted: '#95ab9d',
  textLight: '#95ab9d',
  
  // Status colors
  success: '#58a47b',
  warning: '#d9a44d',
  error: '#ef4444',
  info: '#4f9fc4',
  
  // Gradients
  heroGradient: ['#eef7f1', '#d8ecdf'],
  cardGradient: ['#ffffff', '#ffffff'],
  
  // Healing theme colors (adjusted for light mode)
  healing: {
    calm: '#5ca47d',
    energy: '#255b43',
    balance: '#62796b',
    growth: '#5ca47d',
    wisdom: '#255b43',
  },
  
  // Shadows & effects
  shadow: 'rgba(23,49,38,0.08)',
  shadowGlow: 'rgba(37,91,67,0.24)',
  glowPrimary: 'rgba(37,91,67,0.24)',
  
  // Legacy compatibility
  background: '#f6fbf8',
  backgroundLight: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#fcfffd',
  text: '#173126',
  white: '#ffffff',
  darkGreen: '#255b43',
  mediumGreen: '#5ca47d',
  accent: '#255b43',
  accentGreen: '#5ca47d',
  accentCool: '#4f9fc4',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  warmBeige: '#fbf4e8',
  lightCream: '#f6fbf8',
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

// Shadow styles - Fresh light theme with soft green shadows
export const SHADOWS = {
  small: {
    shadowColor: 'rgba(23,49,38,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: 'rgba(23,49,38,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: 'rgba(23,49,38,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: 'rgba(37,91,67,0.24)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  glowSubtle: {
    shadowColor: 'rgba(37,91,67,0.14)',
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

// Plant healing tips
export const HEALING_TIPS = [
  'Plants can reduce stress levels by up to 37% according to research.',
  'Indoor plants improve air quality by removing toxins like formaldehyde.',
  'Caring for plants releases endorphins and promotes mindfulness.',
  'Green spaces have been shown to speed up physical recovery.',
  'Plants in your bedroom can improve sleep quality naturally.',
  'The color green has a calming effect on the nervous system.',
  'Touching soil releases serotonin, nature\'s antidepressant.',
];

// Organized Design System Export
export const DESIGN_SYSTEM = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
};

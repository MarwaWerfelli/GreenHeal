// Fresh Botanical Light Theme - Clean, airy wellness aesthetic
export const COLORS = {
  // Base backgrounds - Soft whites with breath of green
  bgBase: '#f4faf6', // Soft white with breath of green
  bgSurface: '#ffffff', // Pure white cards
  bgElevated: '#ffffff', // Elevated cards
  
  // Glass & overlays
  glassOverlay: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(255,255,255,0.9)',
  borderSubtle: '#e2efe7', // Very subtle green-tinted border
  
  // Primary - Deep confident forest green
  primary: '#2e7d51', // Deep confident forest green
  primaryDim: '#2e7d51', // Same as primary
  primaryGlow: 'rgba(46,125,81,0.15)',
  primaryLight: '#4caf78', // Fresh mid green for icons/accents
  primaryDark: '#1f5a39',
  primaryPale: '#e6f4ec', // Very soft green for backgrounds
  
  // Accent - Warm honey gold
  accentGold: '#f0a500',
  accentGoldDim: 'rgba(240,165,0,0.15)',
  accentGoldGradient: ['#f0a500', '#d89400'],
  accentWarm: '#f0a500', // Warm honey gold
  accentWarmPale: '#fef6e4', // Soft gold background
  
  // Accent - Soft sky blue for water
  accentBlue: '#e8f4fb', // Soft sky blue
  accentBlueIcon: '#4da6d6', // Water drop icon
  
  // Secondary - Natural green-grey
  secondary: '#5a7a65',
  secondaryLight: '#8aab94',
  secondaryDark: '#3d5a4a',
  
  // Text - Deep forest tones
  textPrimary: '#1a2e22', // Deep forest, almost black
  textSecondary: '#5a7a65', // Muted natural green-grey
  textDisabled: '#8aab94', // Placeholder / disabled
  textMuted: '#8aab94',
  textLight: '#8aab94',
  
  // Status colors
  success: '#4caf78',
  warning: '#f0a500',
  error: '#ef4444',
  info: '#4da6d6',
  
  // Gradients
  heroGradient: ['#e8f5ee', '#d0eddc'], // Soft green hero
  cardGradient: ['#ffffff', '#ffffff'],
  
  // Healing theme colors (adjusted for light mode)
  healing: {
    calm: '#4caf78',
    energy: '#2e7d51',
    balance: '#5a7a65',
    growth: '#4caf78',
    wisdom: '#2e7d51',
  },
  
  // Shadows & effects
  shadow: 'rgba(46,125,81,0.08)', // Soft green shadow
  shadowGlow: 'rgba(46,125,81,0.35)',
  glowPrimary: 'rgba(46,125,81,0.35)',
  
  // Legacy compatibility
  background: '#f4faf6',
  backgroundLight: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#1a2e22',
  white: '#ffffff',
  darkGreen: '#2e7d51',
  mediumGreen: '#4caf78',
  accent: '#2e7d51',
  accentGreen: '#4caf78',
  accentCool: '#4da6d6',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  warmBeige: '#fef6e4',
  lightCream: '#f4faf6',
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
    shadowColor: 'rgba(46,125,81,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: 'rgba(46,125,81,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: 'rgba(46,125,81,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: 'rgba(46,125,81,0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  glowSubtle: {
    shadowColor: 'rgba(46,125,81,0.15)',
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

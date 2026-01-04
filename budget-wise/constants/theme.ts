import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Brand colors - basati sul logo FinanzaMi.pro (gradiente viola/magenta)
export const brandColors = {
  primary: '#8B5A7A', // Viola/Magenta - colore principale del logo
  primaryLight: '#B98A9A',
  primaryDark: '#5D3A52',
  secondary: '#6B4F73', // Viola più scuro
  secondaryLight: '#9A7FA2',
  secondaryDark: '#4A3550',
  accent: '#D4A5B9', // Rosa chiaro per accenti
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#EF5350',
  info: '#29B6F6',
  // Colori aggiuntivi per gradienti
  gradientStart: '#A86B8C', // Rosa/viola chiaro (top del logo)
  gradientEnd: '#5D4263', // Viola scuro (bottom del logo)
};

// Budget status colors
export const budgetStatusColors = {
  safe: '#4CAF50', // Verde - sotto 70%
  warning: '#FF9800', // Arancione - 70-85%
  danger: '#EF5350', // Rosso - 85-100%
  exceeded: '#C62828', // Rosso scuro - oltre 100%
};

// Category default colors - palette moderna
export const categoryColors = [
  '#8B5A7A', // Viola/Magenta (brand)
  '#E91E63', // Rosa
  '#9C27B0', // Viola
  '#673AB7', // Viola profondo
  '#3F51B5', // Indaco
  '#2196F3', // Blu
  '#03A9F4', // Azzurro
  '#00BCD4', // Ciano
  '#009688', // Teal
  '#4CAF50', // Verde
  '#8BC34A', // Verde chiaro
  '#CDDC39', // Lime
  '#FFEB3B', // Giallo
  '#FFC107', // Ambra
  '#FF9800', // Arancione
  '#FF5722', // Arancione profondo
  '#795548', // Marrone
  '#607D8B', // Grigio blu
];

// Light theme - Design moderno e pulito
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: '#F3E5F0', // Viola molto chiaro
    onPrimaryContainer: brandColors.primaryDark,
    secondary: brandColors.secondary,
    secondaryContainer: '#EDE7F0',
    onSecondaryContainer: brandColors.secondaryDark,
    tertiary: brandColors.accent,
    error: brandColors.error,
    errorContainer: '#FFEBEE',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F5F7', // Leggera tinta viola
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#5F5F5F',
    outline: '#D0D0D0',
    outlineVariant: '#E8E8E8',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FAFAFA',
      level3: '#F5F5F5',
      level4: '#F0F0F0',
      level5: '#EBEBEB',
    },
  },
  custom: {
    income: '#4CAF50',
    expense: '#EF5350',
    neutral: '#78909C',
    cardBackground: '#FFFFFF',
    divider: '#EEEEEE',
    gradient: [brandColors.gradientStart, brandColors.gradientEnd],
  },
};

// Dark theme - Design moderno e elegante
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primaryLight,
    primaryContainer: '#3D2A35', // Viola scuro per container
    onPrimaryContainer: '#E8D0DF',
    secondary: brandColors.secondaryLight,
    secondaryContainer: '#352D38',
    onSecondaryContainer: '#DDD5E0',
    tertiary: brandColors.accent,
    error: '#FF8A80',
    errorContainer: '#4A2020',
    background: '#0F0F12', // Nero con leggera tinta viola
    surface: '#1A1A1F',
    surfaceVariant: '#252528',
    onSurface: '#F5F5F5',
    onSurfaceVariant: '#A0A0A5',
    outline: '#3D3D42',
    outlineVariant: '#2D2D32',
    elevation: {
      level0: 'transparent',
      level1: '#1A1A1F',
      level2: '#1F1F24',
      level3: '#242429',
      level4: '#29292E',
      level5: '#2E2E33',
    },
  },
  custom: {
    income: '#81C784',
    expense: '#FF8A80',
    neutral: '#90A4AE',
    cardBackground: '#1A1A1F',
    divider: '#2D2D32',
    gradient: [brandColors.primaryLight, brandColors.primary],
  },
};

// Typography
export const typography = {
  displayLarge: {
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

// Spacing - valori più generosi per un look moderno
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius - angoli più arrotondati per un look moderno
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Shadows - ombre moderne e morbide
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export type AppTheme = typeof lightTheme;

// Utility function to get contrasting text color for a given background
export const getContrastTextColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance > 0.5 ? '#212121' : '#FFFFFF';
};

export const lightColors = {
  background: '#f8fafc',
  backgroundSecondary: '#ffffff',
  backgroundCard: '#ffffff',
  backgroundInput: '#ffffff',
  backgroundHover: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHover: 'rgba(0, 0, 0, 0.15)',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  gray: '#64748b',
  lightGray: '#e2e8f0',
  dark: '#1e293b',
  light: '#f8fafc',
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
};

export const darkColors = {
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  backgroundCard: '#1e293b',
  backgroundInput: '#334155',
  backgroundHover: '#334155',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textWhite: '#ffffff',
  border: '#334155',
  borderLight: '#1e293b',
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowHover: 'rgba(0, 0, 0, 0.4)',
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  gray: '#94a3b8',
  lightGray: '#334155',
  dark: '#0f172a',
  light: '#1e293b',
  primary: {
    50: '#1e3a5f',
    100: '#1e4974',
    200: '#1e5889',
    300: '#2563eb',
    400: '#3b82f6',
    500: '#60a5fa',
    600: '#7bb8fc',
    700: '#93c5fd',
    800: '#bfdbfe',
    900: '#dbeafe',
  },
};

export const getColors = (isDark) => {
  return isDark ? darkColors : lightColors;
};

// Default export for backward compatibility
const Colors = {
  primary: lightColors.primary,
  danger: lightColors.danger,
  warning: lightColors.warning,
  success: lightColors.success,
  gray: lightColors.gray,
  lightGray: lightColors.lightGray,
  dark: lightColors.dark,
  light: lightColors.light,
};

export default Colors;
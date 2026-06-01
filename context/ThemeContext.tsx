import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@nearby_finder_theme';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    cardElevated: string;
    primary: string;
    primaryLight: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBackground: string;
    success: string;
    successLight: string;
    danger: string;
    dangerLight: string;
    warning: string;
    warningLight: string;
    overlay: string;
    headerBackground: string;
    headerText: string;
    chipBackground: string;
    chipBorder: string;
    chipText: string;
    chipSelectedBackground: string;
    chipSelectedBorder: string;
    chipSelectedText: string;
  };
}

const LIGHT: AppTheme['colors'] = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  primary: '#0D9488',
  primaryLight: '#CCFBF1',
  textPrimary: '#020617',
  textSecondary: '#1E293B',
  textMuted: '#334155',
  border: '#E2E8F0',
  inputBackground: '#F1F5F9',
  success: '#15803D',
  successLight: '#DCFCE7',
  danger: '#B91C1C',
  dangerLight: '#FEF2F2',
  warning: '#B45309',
  warningLight: '#FFFBEB',
  overlay: 'rgba(15,23,42,0.4)',
  headerBackground: '#FFFFFF',
  headerText: '#020617',
  chipBackground: '#FFFFFF',
  chipBorder: '#CBD5E1',
  chipText: '#1E293B',
  chipSelectedBackground: '#F0FDFA',
  chipSelectedBorder: '#0D9488',
  chipSelectedText: '#115E59',
};

const DARK: AppTheme['colors'] = {
  background: '#0B1120',
  card: '#151F32',
  cardElevated: '#1C2942',
  primary: '#2DD4BF',
  primaryLight: '#134E4A',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  inputBackground: '#152032',
  success: '#4ADE80',
  successLight: '#052E16',
  danger: '#F87171',
  dangerLight: '#2D0C0C',
  warning: '#FCD34D',
  warningLight: '#2D1B02',
  overlay: 'rgba(0,0,0,0.65)',
  headerBackground: '#151F32',
  headerText: '#F8FAFC',
  chipBackground: '#1C2942',
  chipBorder: '#334155',
  chipText: '#CBD5E1',
  chipSelectedBackground: '#1A3330',
  chipSelectedBorder: '#2DD4BF',
  chipSelectedText: '#99F6E4',
};

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === 'dark' || saved === 'light') setMode(saved);
      })
      .catch(() => {/* ignore — AsyncStorage unavailable on old builds */});
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const theme: AppTheme = {
    mode,
    colors: mode === 'dark' ? DARK : LIGHT,
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
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
  background: '#F0F4F8',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  primary: '#0a7ea4',
  primaryLight: '#E0F2FE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  inputBackground: '#F8FAFC',
  success: '#166534',
  successLight: '#DCFCE7',
  danger: '#991B1B',
  dangerLight: '#FEF2F2',
  warning: '#92400E',
  warningLight: '#FFFBEB',
  overlay: 'rgba(0,0,0,0.45)',
  headerBackground: '#0a7ea4',
  headerText: '#FFFFFF',
  chipBackground: '#F1F5F9',
  chipBorder: '#CBD5E1',
  chipText: '#475569',
  chipSelectedBackground: '#E0F2FE',
  chipSelectedBorder: '#0a7ea4',
  chipSelectedText: '#0a7ea4',
};

const DARK: AppTheme['colors'] = {
  background: '#0F172A',
  card: '#1E293B',
  cardElevated: '#253347',
  primary: '#38BDF8',
  primaryLight: '#0C2A3A',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  border: '#334155',
  inputBackground: '#152032',
  success: '#4ADE80',
  successLight: '#052E16',
  danger: '#F87171',
  dangerLight: '#2D0C0C',
  warning: '#FCD34D',
  warningLight: '#2D1B02',
  overlay: 'rgba(0,0,0,0.65)',
  headerBackground: '#1E293B',
  headerText: '#F1F5F9',
  chipBackground: '#1E293B',
  chipBorder: '#475569',
  chipText: '#CBD5E1',
  chipSelectedBackground: '#38BDF8',
  chipSelectedBorder: '#38BDF8',
  chipSelectedText: '#0F172A',
};

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

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

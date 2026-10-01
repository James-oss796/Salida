import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeTokens, ThemeMode, ThemeName } from './tokens';
import { palettes } from './palettes';
import { getAutoThemeForDate } from './rotation';

const THEME_STORAGE_KEY = '@salida_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ThemeTokens;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [activeThemeName, setActiveThemeName] = useState<ThemeName>('red'); // Fallback

  // Calculate the actual theme to display
  const updateActiveTheme = (currentMode: ThemeMode) => {
    if (currentMode === 'auto') {
      setActiveThemeName(getAutoThemeForDate());
    } else {
      setActiveThemeName(currentMode);
    }
  };

  // Load saved preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode) {
          setModeState(savedMode as ThemeMode);
          updateActiveTheme(savedMode as ThemeMode);
        } else {
          updateActiveTheme('auto');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        updateActiveTheme('auto');
      }
    };
    loadTheme();
  }, []);

  // Listen for AppState changes to re-evaluate the 'auto' theme when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateActiveTheme(mode);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [mode]);

  const setMode = async (newMode: ThemeMode) => {
    try {
      setModeState(newMode);
      updateActiveTheme(newMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value: ThemeContextValue = {
    mode,
    theme: palettes[activeThemeName],
    setMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

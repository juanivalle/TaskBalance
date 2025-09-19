import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { lightTheme, darkTheme, Theme } from '@/constants/themes';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isLoading: boolean;
}

// Cross-platform storage utility for theme
const getStoredTheme = async (): Promise<ThemeMode | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('theme_mode') as ThemeMode | null;
      }
    } else {
      return await AsyncStorage.getItem('theme_mode') as ThemeMode | null;
    }
    return null;
  } catch {
    return null;
  }
};

const setStoredTheme = async (mode: ThemeMode): Promise<void> => {
  if (!mode || (mode !== 'light' && mode !== 'dark')) {
    return;
  }
  
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('theme_mode', mode);
      }
    } else {
      await AsyncStorage.setItem('theme_mode', mode);
    }
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextType>(() => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  const theme = useMemo(() => themeMode === 'dark' ? darkTheme : lightTheme, [themeMode]);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await getStoredTheme();
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    if (!mode || (mode !== 'light' && mode !== 'dark')) {
      console.error('Invalid theme mode:', mode);
      return;
    }
    
    try {
      setThemeModeState(mode);
      await setStoredTheme(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }, [themeMode, setThemeMode]);

  return useMemo(() => ({
    theme,
    themeMode,
    toggleTheme,
    setThemeMode,
    isLoading,
  }), [theme, themeMode, toggleTheme, setThemeMode, isLoading]);
});
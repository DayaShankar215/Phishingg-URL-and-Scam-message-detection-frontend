// context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { 
      isDark: false, 
      currentTheme: 'light', 
      theme: 'light', 
      toggleTheme: () => {},
      isLoading: false 
    };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState('system');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateThemeBasedOnSystem();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      updateThemeBasedOnSystem();
    }
  }, [systemScheme]);

  const updateThemeBasedOnSystem = () => {
    const newTheme = systemScheme === 'dark' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
  };

  const resolveThemeForSystem = () => (systemScheme === 'dark' ? 'dark' : 'light');

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('appTheme');
      if (saved && (saved === 'system' || saved === 'light' || saved === 'dark')) {
        setTheme(saved);
        setCurrentTheme(saved === 'system' ? resolveThemeForSystem() : saved);
      } else {
        setTheme('system');
        setCurrentTheme(resolveThemeForSystem());
        await AsyncStorage.setItem('appTheme', 'system');
      }
    } catch (error) {
      console.warn('Failed to load theme:', error);
      setTheme('system');
      setCurrentTheme(resolveThemeForSystem());
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (themeValue) => {
    try {
      await AsyncStorage.setItem('appTheme', themeValue);
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  };

  const toggleTheme = async (mode) => {
    setTheme(mode);
    setCurrentTheme(mode === 'system' ? resolveThemeForSystem() : mode);
    await saveTheme(mode);
  };

  const value = {
    theme,
    currentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
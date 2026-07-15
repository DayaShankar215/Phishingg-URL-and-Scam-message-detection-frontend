import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
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
    if (theme === 'system') {
      setCurrentTheme(systemScheme === 'dark' ? 'dark' : 'light');
    } else {
      setCurrentTheme(theme);
    }
    saveTheme(theme);
  }, [theme, systemScheme]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('appTheme');
      if (saved) {
        setTheme(saved);
        if (saved === 'system') {
          setCurrentTheme(systemScheme === 'dark' ? 'dark' : 'light');
        } else {
          setCurrentTheme(saved);
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTheme = async (themeValue) => {
    try {
      await AsyncStorage.setItem('appTheme', themeValue);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const toggleTheme = (mode) => {
    setTheme(mode);
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
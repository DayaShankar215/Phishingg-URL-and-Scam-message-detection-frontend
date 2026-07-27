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

  // Load saved theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Re-check system theme when app becomes active
        updateThemeBasedOnSystem();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Update theme when system scheme changes
  useEffect(() => {
    if (theme === 'system') {
      updateThemeBasedOnSystem();
    }
  }, [systemScheme]);

  const updateThemeBasedOnSystem = () => {
    const newTheme = systemScheme === 'dark' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
  };

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
      } else {
        // Default to system theme if no saved preference
        setTheme('system');
        setCurrentTheme(systemScheme === 'dark' ? 'dark' : 'light');
        await AsyncStorage.setItem('appTheme', 'system');
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Fallback to system theme
      setTheme('system');
      setCurrentTheme(systemScheme === 'dark' ? 'dark' : 'light');
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
    saveTheme(mode);
    if (mode === 'system') {
      setCurrentTheme(systemScheme === 'dark' ? 'dark' : 'light');
    } else {
      setCurrentTheme(mode);
    }
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
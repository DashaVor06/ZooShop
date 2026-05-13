import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createContext, useEffect, useState } from 'react';
import i18n from '../i18nConst';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadTheme();
  }, []);
  
  const getThemeObject = (name) => {
    const baseTheme = name === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        surface: name === 'dark' ? '#1E1E1E' : '#FFFFFF',
        secondaryText: name === 'dark' ? '#AAAAAA' : '#666666',
        inputBackground: name === 'dark' ? '#2C2C2C' : '#F5F5F5',
        placeholder: name === 'dark' ? '#777777' : '#999999',
        error: '#FF3B30',
        success: '#34C759',
      }
    };
  };

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('userTheme');
      if (savedTheme && savedTheme !== theme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const changeTheme = async (newTheme) => {
    if (theme === newTheme) return;
    
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('userTheme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const tTheme = (key) => i18n.t(key);

  const value = {
    themeObject: getThemeObject(theme),
    changeTheme,
    tTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createContext, useEffect, useState } from 'react';
import i18n from '../localization/i18nConst';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadTheme();
  }, []);
  
  const getThemeObject = (name) => {
    return name === 'dark' ? DarkTheme : DefaultTheme;
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from './localization';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(i18n.locale);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage && savedLanguage !== i18n.locale) {
        // Меняем язык, если сохраненный отличается от текущего
        i18n.locale = savedLanguage;
        setLocale(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      // ВАЖНО: устанавливаем isLoading в false после загрузки
      setIsLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    if (lang === locale) return; // Не делаем ничего, если язык не изменился
    
    try {
      i18n.locale = lang;
      setLocale(lang);
      await AsyncStorage.setItem('userLanguage', lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
    // НЕ меняем isLoading здесь!
  };

  const t = (key) => i18n.t(key);

  const value = {
    locale,
    changeLanguage,
    t,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
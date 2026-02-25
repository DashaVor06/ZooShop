import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useState } from 'react';
import i18n from './i18nConst';

export const LanguageContext = createContext();

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
        i18n.locale = savedLanguage;
        setLocale(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    if (lang === locale) return;
    
    try {
      i18n.locale = lang;
      setLocale(lang);
      await AsyncStorage.setItem('userLanguage', lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const tLang = (key) => i18n.t(key);

  const value = {
    locale,
    changeLanguage,
    tLang,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};


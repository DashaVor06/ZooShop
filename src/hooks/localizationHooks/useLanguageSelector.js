import { useContext, useEffect, useState } from 'react';
import { LanguageContext } from '../../localization/languageProvider';

export const useLanguageSelector = () => {
  const { locale, changeLanguage, tLang } = useContext(LanguageContext);
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  
  const languageOptions = [
    { label: tLang('languages.russian'), value: 'ru' },
    { label: tLang('languages.english'), value: 'en' }
  ];
 
  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    changeLanguage(lang);
  };

  return {
    selectedLanguage,
    languageOptions,
    handleLanguageChange,
    tLang
  };
}
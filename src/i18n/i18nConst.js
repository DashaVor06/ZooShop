import { I18n } from 'i18n-js';

const i18n = new I18n({
  en: { 
    themes: {
      dark: 'Dark',
      light: 'Light'
    },
    theme: 'Theme',
    languages: {
      russian: 'Russian',
      english: 'English'
    },
    language: 'Language',
    tabBar: {
      home: 'Home',
      settings: 'Settings',
      basket: 'Basket',
      catalog: 'Catalog'
    }, 
  },
  ru: {
    themes: {
      dark: 'Тёмная',
      light: 'Светлая'
    },
    theme: 'Тема',
    languages: {
      russian: 'Русский',
      english: 'Английский'
    },
    language: 'Язык',
    tabBar: {
      home: 'Главная',
      settings: 'Настройки',
      basket: 'Корзина',
      catalog: 'Каталог'
    }, 
  }
});

export default i18n;
import { I18n } from 'i18n-js';

const i18n = new I18n({
  en: { 
    common: {
      cancel: 'Cancel',
      save: 'Save',
      add: 'Add',
      delete: 'Delete',
      loading: 'Loading...'
    },
    catalog: {
      price: 'Price',
      readMore: 'Read more',
      editTitle: 'Edit item',
      addTitle: 'Add item',
      namePlaceholder: 'Name *',
      descriptionPlaceholder: 'Description *',
      pricePlaceholder: 'Price (Br)',
      imagePlaceholder: 'Image URL',
      fillRequired: 'Please fill in all required fields',
      addSuccess: 'Item added successfully',
      addError: 'Failed to add item',
      updateSuccess: 'Item updated successfully',
      updateError: 'Failed to update item',
      deleteSuccess: 'Item deleted successfully',
      deleteError: 'Failed to delete item',
      errorLoad: 'Error loading data',
      empty: 'No items found',
      confirmDelete: 'Confirm deletion',
      confirmDeleteMessage: 'Are you sure you want to delete this item?'
    },
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
    }
  },
  ru: {
    common: {
      cancel: 'Отмена',
      save: 'Сохранить',
      add: 'Добавить',
      delete: 'Удалить',
      loading: 'Загрузка...'
    },
    catalog: {
      price: 'Цена',
      readMore: 'Читать далее',
      editTitle: 'Редактировать товар',
      addTitle: 'Добавить товар',
      namePlaceholder: 'Название *',
      descriptionPlaceholder: 'Описание *',
      pricePlaceholder: 'Цена (Br)',
      imagePlaceholder: 'URL картинки',
      fillRequired: 'Заполните обязательные поля',
      addSuccess: 'Товар успешно добавлен',
      addError: 'Не удалось добавить товар',
      updateSuccess: 'Товар успешно обновлен',
      updateError: 'Не удалось обновить товар',
      deleteSuccess: 'Товар успешно удален',
      deleteError: 'Не удалось удалить товар',
      errorLoad: 'Ошибка загрузки данных',
      empty: 'Товары не найдены',
      confirmDelete: 'Подтверждение удаления',
      confirmDeleteMessage: 'Вы уверены, что хотите удалить этот товар?'
    },
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
    }
  }
});

export default i18n;
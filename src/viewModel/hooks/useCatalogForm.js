import { useState } from 'react';

export const useCatalogForm = () => {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(null);
  const [formPicture, setFormPicture] = useState(null);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(null);
    setFormPicture(null);
  };

  return {
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    formCategory,
    setFormCategory,
    formPicture,
    setFormPicture,
    resetForm,
  };
};
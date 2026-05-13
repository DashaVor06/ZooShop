import { useState } from 'react';

export const useCatalogForm = () => {
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(null);
  const [formPicture, setFormPicture] = useState(null);
  const [formBrand, setFormBrand] = useState(null);
  const [formStorage, setFormStorage] = useState(null);
  const [formAmount, setFormAmount] = useState('100');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(null);
    setFormPicture(null);
    setFormBrand(null);
    setFormStorage(null);
    setFormAmount('100');
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
    formBrand, 
    setFormBrand,
    formStorage,
    setFormStorage,
    formAmount,
    setFormAmount
  };
};
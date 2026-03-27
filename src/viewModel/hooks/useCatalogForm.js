import { useState } from "react";

export const useCatalogForm = () => {
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPicture, setFormPicture] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormPicture("");
  };

  return {
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    formPicture,
    setFormPicture,
    resetForm,
  };
};
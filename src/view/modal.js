import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./catalogStyles";
import { SimplePicker } from "./simplePicker";

export const RenderModal = (props) => {
  const {
    isEdit,
    modalVisible,
    editModalVisible,
    themeObject,
    tLang,
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
    setModalVisible,
    setEditModalVisible,
    handleAddItem,
    handleUpdateItem,
    addAnimal,
    addBrand,
    loadImage,
    showNotification,
    currentItem,
    animalsList = [],
    brandsList = [],
    formBrand,
    setFormBrand,
  } = props;

  const [categoryItems, setCategoryItems] = useState([]);
  const [brandItems, setBrandItems] = useState([]);
  const [isManualCategory, setIsManualCategory] = useState(false);
  const [isManualBrand, setIsManualBrand] = useState(false);
  const isVisible = isEdit ? editModalVisible : modalVisible;

  useEffect(() => {
    if (isVisible) {
      if (animalsList?.length > 0) {
        setCategoryItems(animalsList.map(a => ({ label: a.an_name, value: a.an_id })));
      }
      if (brandsList?.length > 0) { // Подготовка списка брендов
        setBrandItems(brandsList.map(b => ({ label: b.br_name, value: b.br_id })));
      }
    }
  }, [animalsList, brandsList, isVisible]);

  if (!isVisible) return null;

  // Функция-посредник для обработки ручного ввода перед основным сохранением
  const handleSaveWithManualCheck = async () => {
    let finalCategoryId = formCategory;
    let finalBrandId = formBrand;

    // Валидация обязательных полей
    if (!formName?.trim()) {
      Alert.alert(tLang("common.error") || "Ошибка", tLang("catalog.error_name_required") || "Введите название товара");
      return;
    }
    if (!formCategory) {
      Alert.alert(tLang("common.error") || "Ошибка", tLang("catalog.error_category_required") || "Выберите категорию");
      return;
    }
    if (!formBrand) {
      Alert.alert(tLang("common.error") || "Ошибка", tLang("catalog.error_brand_required") || "Выберите бренд");
      return;
    }
    if (!formPrice || parseFloat(formPrice) <= 0) {
      Alert.alert(tLang("common.error") || "Ошибка", tLang("catalog.error_price_required") || "Введите корректную цену");
      return;
    }

    try {
      // 1. Если включен ручной ввод категории и введено имя
      if (isManualCategory && typeof formCategory === 'string' && formCategory.trim() !== '') {
        // Вызываем сервис добавления (должен вернуть ID новой записи или объект с ID)
        const newAnimal = await props.addAnimal({ an_name: formCategory.trim() });
        finalCategoryId = newAnimal.an_id;
      }

      // 2. Если включен ручной ввод бренда
      if (isManualBrand && typeof formBrand === 'string' && formBrand.trim() !== '') {
        const newBrand = await props.addBrand({ br_name: formBrand.trim() });
        finalBrandId = newBrand.br_id;
      }

      // 3. Вызываем основное сохранение с полученными ID
      if (isEdit) {
        await handleUpdateItem(finalCategoryId, finalBrandId);
      } else {
        await handleAddItem(finalCategoryId, finalBrandId);
      }
      
      // Сбрасываем флаги ручного ввода после успеха
      setIsManualCategory(false);
      setIsManualBrand(false);
    } catch (error) {
      console.error("Ошибка при создании новых категорий:", error);
      if (showNotification) showNotification(tLang("catalog.saveError"), "error");
    }
  };

  const onPickImage = async (sourceType) => {
    try {
      let resultUri;
      if (isEdit && currentItem?.it_image_file_id) {
        resultUri = await loadImage(true, currentItem.it_image_file_id, sourceType);
      } else {
        resultUri = await loadImage(false, null, sourceType);
      }

      if (resultUri) {
        setFormPicture(resultUri);
      }
    } catch (error) {
      if (showNotification) {
        showNotification(tLang(error.message) || error.message, "error");
      }
    }
  };

  const handleImagePickerPress = () => {
    Alert.alert(
      tLang("catalog.selectImageSource") || "Изображение товара",
      tLang("catalog.selectImageMessage") || "Выберите способ загрузки",
      [
        {
          text: tLang("catalog.camera") || "Сделать фото",
          onPress: () => onPickImage("camera"),
        },
        {
          text: tLang("catalog.gallery") || "Выбрать из галереи",
          onPress: () => onPickImage("library"),
        },
        {
          text: tLang("common.cancel") || "Отмена",
          style: "cancel",
        },
      ]
    );
  };

  const handleRemoveImage = () => setFormPicture(null);

  const handleClose = () => {
    if (isEdit) {
      setEditModalVisible(false);
    } else {
      setModalVisible(false);
    }
    resetForm();
  };

  const getImageSource = () => {
    if (!formPicture) return null;
    const uri = formPicture.url || formPicture.uri || (typeof formPicture === "string" ? formPicture : null);
    return uri ? { uri } : null;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeObject.colors.background }]}>
          
          {/* Заголовок */}
          <Text style={[styles.modalTitle, { color: themeObject.colors.text }]}>
            {isEdit ? tLang("catalog.editTitle") : tLang("catalog.addTitle")}
          </Text>

          {/* Поле: Название */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground, 
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border 
            }]}
            placeholder={tLang("catalog.namePlaceholder")}
            placeholderTextColor={themeObject.colors.placeholder}
            value={formName}
            onChangeText={setFormName}
          />

          {/* Поле: Категория (Picker) */}
          {categoryItems.length > 0 ? (
            <SimplePicker
              selectedValue={formCategory}
              onValueChange={setFormCategory}
              placeholder={tLang("catalog.categoryPlaceholder")}
              themeObject={themeObject}
              isManual={isManualCategory}
              setIsManual={setIsManualCategory}
              items={categoryItems}
            />
          ) : (
            <Text style={{ color: themeObject.colors.error || "red", marginBottom: 10 }}>
              {tLang("catalog.noCategoriesAvailable")}
            </Text>
          )}

          {brandItems.length > 0 ? (
            <SimplePicker
              selectedValue={formBrand} // Добавьте formBrand в пропсы модалки
              onValueChange={setFormBrand}
              placeholder={tLang("catalog.brandPlaceholder")}
              themeObject={themeObject}
              isManual={isManualBrand}
              setIsManual={setIsManualBrand}
              items={brandItems}
            />
          ) : (
            <Text style={{ color: themeObject.colors.error || "red", marginBottom: 10 }}>
              {tLang("catalog.noCategoriesAvailable")}
            </Text>
          )}

          {/* Поле: Описание */}
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: themeObject.colors.inputBackground, 
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border 
            }]}
            placeholder={tLang("catalog.descriptionPlaceholder")}
            placeholderTextColor={themeObject.colors.placeholder}
            value={formDescription}
            onChangeText={setFormDescription}
            multiline
            numberOfLines={4}
          />

          {/* Поле: Цена */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground, 
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border 
            }]}
            placeholder={tLang("catalog.pricePlaceholder")}
            placeholderTextColor={themeObject.colors.placeholder}
            value={formPrice}
            onChangeText={setFormPrice}
            keyboardType="numeric"
          />

          {/* Кнопка выбора изображения */}
          <TouchableOpacity
            style={[styles.imagePickerButton, { 
              backgroundColor: themeObject.colors.inputBackground, 
              borderColor: themeObject.colors.border 
            }]}
            onPress={handleImagePickerPress}
          >
            <Text style={[styles.imagePickerText, { color: themeObject.colors.primary }]}>
              {formPicture ? tLang("catalog.changeImage") : tLang("catalog.selectImage")}
            </Text>
          </TouchableOpacity>

          {/* Превью выбранного изображения */}
          {formPicture && (
            <View style={styles.imagePreviewContainer}>
              <Image source={getImageSource()} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Кнопки управления */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>{tLang("common.cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: themeObject.colors.primary }]}
              onPress={handleSaveWithManualCheck}
            >
              <Text style={styles.saveButtonText}>
                {isEdit ? tLang("common.save") : tLang("common.add")}
              </Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
};
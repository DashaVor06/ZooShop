import React from "react";
import {
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./catalogStyles";

export const renderModal = ({
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
  formPicture,
  setFormPicture,
  resetForm,
  setModalVisible,
  setEditModalVisible, // Убедитесь, что передаете это в CatalogScreen
  handleAddItem,
  handleUpdateItem,
  loadImage,
  showNotification,
  currentItem,
}) => {

    // Выбор правильного стейта видимости
  const isVisible = isEdit ? editModalVisible : modalVisible;
  if (!isVisible) return null;
  
  const handlePickImage = async () => {
    try {
      let imageUrl;
      
      // Логика выбора картинки
      if (isEdit && currentItem && currentItem.image_file_id) {
        imageUrl = await loadImage(true, currentItem.image_file_id);
      } else {
        imageUrl = await loadImage(false);
      }
      
      if (imageUrl) {
        setFormPicture(imageUrl);
      }
    } catch (error) {
      // Защита на случай, если showNotification не передан
      if (showNotification) {
        showNotification(tLang(error.message) || "Ошибка выбора изображения", "error");
      }
    }
  };

  const handleRemoveImage = () => {
    setFormPicture(null);
  };
  
  const onClose = () => {
    // Исправлено: корректный вызов функций закрытия
    if (isEdit) {
      if (typeof setEditModalVisible === 'function') {
        setEditModalVisible(false);
      }
    } else {
      if (typeof setModalVisible === 'function') {
        setModalVisible(false);
      }
    }
    resetForm();
  };

  // Хелпер для определения URI картинки
  const getImageSource = () => {
    if (!formPicture) return null;
    // Если это объект (из ImageKit или галереи Expo) берем url/uri, если строка — используем напрямую
    const uri = formPicture.url || formPicture.uri || (typeof formPicture === 'string' ? formPicture : null);
    return uri ? { uri } : null;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeObject.colors.background }]}>
          <Text style={[styles.modalTitle, { color: themeObject.colors.text }]}>
            {isEdit ? tLang('catalog.editTitle') : tLang('catalog.addTitle')}
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground,
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border
            }]}
            placeholder={tLang('catalog.namePlaceholder')}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={formName}
            onChangeText={setFormName}
          />

          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: themeObject.colors.inputBackground,
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border
            }]}
            placeholder={tLang('catalog.descriptionPlaceholder')}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={formDescription}
            onChangeText={setFormDescription}
            multiline
            numberOfLines={4}
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground,
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border
            }]}
            placeholder={tLang('catalog.pricePlaceholder')}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={formPrice}
            onChangeText={setFormPrice}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.imagePickerButton, { 
              backgroundColor: themeObject.colors.inputBackground,
              borderColor: themeObject.colors.border
            }]}
            onPress={handlePickImage}
          >
            <Text style={[styles.imagePickerText, { color: themeObject.colors.primary }]}>
              {formPicture ? tLang('catalog.changeImage') : tLang('catalog.selectImage')}
            </Text>
          </TouchableOpacity>

          {formPicture ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={getImageSource()} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>
                {tLang('common.cancel') || "Отмена"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={isEdit ? handleUpdateItem : handleAddItem}
            >
              <Text style={styles.saveButtonText}>
                {isEdit ? tLang('common.save') : tLang('common.add')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
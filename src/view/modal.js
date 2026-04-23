import React, { useEffect, useState } from "react";
import {
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
    loadImage,
    showNotification,
    currentItem,
    animalsList = [],
  } = props;

  const [categoryItems, setCategoryItems] = useState([]);

  const isVisible = isEdit ? editModalVisible : modalVisible;
  
  useEffect(() => {    
    if (!animalsList || animalsList.length === 0) {
      setCategoryItems([]);
      return;
    }
    
    const formatted = animalsList.map(animal => ({
      label: animal.an_name || 'Без названия', 
      value: animal.an_id,
    }));
    
    setCategoryItems(formatted);
  }, [animalsList, isVisible, isEdit]);

  if (!isVisible) return null;
  
  const handlePickImage = async () => {
    try {
      let imageUrl;
      
      if (isEdit && currentItem && currentItem.it_image_file_id) {
        imageUrl = await loadImage(true, currentItem.it_image_file_id);
      } else {
        imageUrl = await loadImage(false);
      }
      
      if (imageUrl) {
        setFormPicture(imageUrl);
      }
    } catch (error) {
      if (showNotification) {
        showNotification(tLang(error.message), "error");
      }
    }
  };

  const handleRemoveImage = () => {
    setFormPicture(null);
  };
  
  const onClose = () => {
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

  const getImageSource = () => {
    if (!formPicture) return null;
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

          {categoryItems.length > 0 ? (
            <SimplePicker
              selectedValue={formCategory}
              onValueChange={setFormCategory}
              items={categoryItems}
              placeholder={tLang('catalog.selectCategory') || 'Выберите категорию'}
              themeObject={themeObject}
            />
          ) : (
            <Text style={{ color: 'red', padding: 10 }}>
              Нет доступных категорий. Проверьте загрузку данных.
            </Text>
          )}

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
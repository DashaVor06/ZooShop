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
    loadImage,
    showNotification,
    currentItem,
    animalsList = [],
  } = props;

  const [categoryItems, setCategoryItems] = useState([]);

  const isVisible = isEdit ? editModalVisible : modalVisible;

  useEffect(() => {
    if (isVisible && animalsList?.length > 0) {
      const formatted = animalsList.map((animal) => ({
        label: animal.an_name || "---",
        value: animal.an_id,
      }));
      setCategoryItems(formatted);
    }
  }, [animalsList, isVisible]);

  if (!isVisible) return null;

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
              items={categoryItems}
              placeholder={tLang("catalog.selectCategory")}
              themeObject={themeObject}
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
              onPress={isEdit ? handleUpdateItem : handleAddItem}
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
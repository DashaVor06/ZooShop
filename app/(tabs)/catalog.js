import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../../src/view/catalogStyles";
import { renderConfirmModal } from "../../src/view/confirmModal";
import { renderItem } from "../../src/view/item";
import { renderModal } from "../../src/view/modal";
import { useCatalogForm } from "../../src/viewModel/hooks/useCatalogForm";
import { useLanguageSelector } from "../../src/viewModel/hooks/useLanguageSelector";
import { useNetworkStatus } from "../../src/viewModel/hooks/useNetworkStatus";
import { ThemeContext } from "../../src/viewModel/providers/themeProvider";
import { imagekitService } from "../../src/viewModel/services/imagekitService";
import { supabaseService } from "../../src/viewModel/services/supabaseService";

export default function CatalogScreen() {
  const db = useSQLiteContext();
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();

  const {
    items,
    loading,
    refreshing,
    pendingSync,
    loadItems,
    onRefresh,
    addItem,
    updateItem,
    deleteItem,
  } = supabaseService(db);

  const { loadImage } = imagekitService();

  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: "", type: "" });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const {
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    formPicture,
    setFormPicture,
    resetForm,
  } = useCatalogForm();

  const showNotification = (message, type = "success") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openAddModal} style={{ marginRight: 16 }}>
          <Ionicons name="add" size={24} color={themeObject.colors.primary || "#007AFF"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, themeObject]);

  const handleAddItem = async () => {
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.uri;
      
      await addItem({
        name: formName,
        description: formDescription,
        price: formPrice ? parseFloat(formPrice) : null,
        image_url: uri || null,
        image_file_id: null,
      });

      resetForm();
      setModalVisible(false);
      showNotification(tLang("catalog.addSuccess"));
    } catch (error) {
      showNotification(tLang("catalog.addError"), "error");
    }
  };

  const handleUpdateItem = async () => {
    if (!currentItem) return;
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.url || formPicture?.uri;

      await updateItem({
        id: currentItem.id,
        name: formName,
        description: formDescription,
        price: formPrice ? parseFloat(formPrice) : null,
        image_url: uri || null,
        image_file_id: (uri === currentItem.image_url) ? currentItem.image_file_id : null,
      });

      resetForm();
      setEditModalVisible(false);
      setCurrentItem(null);
      showNotification(tLang("catalog.updateSuccess"));
    } catch (error) {
      showNotification(tLang("catalog.updateError"), "error");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await deleteItem(itemToDelete);
      setConfirmModalVisible(false);
      setItemToDelete(null);
      showNotification(tLang('catalog.deleteSuccess'));
    } catch (error) {
      showNotification(tLang('catalog.deleteError'), "error");
    }
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price ? item.price.toString() : "");
    setFormPicture(item.image_url ? { url: item.image_url, fileId: item.image_file_id } : null);
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeObject.colors.background }]}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      {isConnected == false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{tLang('network.offlineMode')}</Text>
        </View>
      )}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeObject.colors.primary} />
        </View>
      ) : (
      <FlatList
        data={items}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => renderItem({
          item, expandedId, themeObject, tLang, toggleExpand, openEditModal, confirmDelete,
        })}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeObject.colors.primary} />
        }
      />)}

      {renderModal({
        isEdit: false,
        modalVisible: modalVisible,
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
        setModalVisible: setModalVisible,
        handleAddItem,
        loadImage,
        showNotification,
      })}

      {renderModal({
        isEdit: true,
        editModalVisible: editModalVisible,
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
        setEditModalVisible: setEditModalVisible,
        handleUpdateItem,
        loadImage,
        showNotification,
        currentItem
      })}

      {renderConfirmModal({ 
        confirmModalVisible, 
        themeObject, 
        tLang, 
        setConfirmModalVisible, 
        handleDeleteItem })}
    </View>
  );
}
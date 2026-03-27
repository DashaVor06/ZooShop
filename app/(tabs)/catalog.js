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
import { Notification } from "../../src/view/notification";
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
  const { isConnected, isOnline, networkType } = useNetworkStatus();
  
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

  const {
    loadImage,
    uploadToImageKit,
    deleteImageFromImageKit
  } = imagekitService();

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
    if (isConnected) {
      loadItems();
    }
  }, [isConnected]);

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
      let imageData = null;

      if (formPicture) {
        if (typeof formPicture === "string") {
          const uploaded = await uploadToImageKit(formPicture);
          if (uploaded) {
            imageData = {
              image_url: uploaded.url,
              image_file_id: uploaded.fileId
            };
          }
        } else if (formPicture.url) {
          imageData = {
            image_url: formPicture.url,
            image_file_id: formPicture.fileId
          };
        }
      }

      await addItem({
        name: formName,
        description: formDescription,
        price: formPrice ? parseFloat(formPrice) : null,
        image_url: imageData?.image_url || null,
        image_file_id: imageData?.image_file_id || null
      });

      resetForm();
      setModalVisible(false);
      showNotification(tLang('catalog.addSuccess'), "success");
    } 
    catch (error) {
      console.error('Add error:', error);
      showNotification(tLang(error.message) || tLang('catalog.addError'), "error");
    }
  };

  const handleUpdateItem = async () => {
    if (!currentItem) return;
    
    try {
      let imageData = null;
      let shouldDeleteOld = false;

      if (formPicture) {
        if (typeof formPicture === "string") {
          const uploaded = await uploadToImageKit(formPicture);
          if (uploaded) {
            imageData = {
              image_url: uploaded.url,
              image_file_id: uploaded.fileId
            };
            shouldDeleteOld = true;
          }
        } else if (formPicture.url) {
          imageData = {
            image_url: formPicture.url,
            image_file_id: formPicture.fileId
          };
          if (currentItem.image_file_id && currentItem.image_file_id !== formPicture.fileId) {
            shouldDeleteOld = true;
          }
        }
      } else if (currentItem?.image_url && !formPicture) {
        shouldDeleteOld = true;
      }

      await updateItem({
        id: currentItem.id,
        name: formName,
        description: formDescription,
        price: formPrice ? parseFloat(formPrice) : null,
        image_url: imageData?.image_url || null,
        image_file_id: imageData?.image_file_id || null
      });

      if (shouldDeleteOld && currentItem?.image_file_id) {
        await deleteImageFromImageKit(currentItem.image_file_id);
      }

      resetForm();
      setEditModalVisible(false);
      setCurrentItem(null);
      showNotification(tLang('catalog.updateSuccess'), "success");
    } 
    catch (error) {
      console.error('Update error:', error);
      showNotification(tLang(error.message) || tLang('catalog.updateError'), "error");
    }
  };

  const handleDeleteItem = async () => {
    try {
      const deletedItem = await deleteItem(itemToDelete);
      setConfirmModalVisible(false);
      setItemToDelete(null);
      
      if (deletedItem?.image_file_id) {
        await deleteImageFromImageKit(deletedItem.image_file_id);
      }
      
      showNotification(tLang('catalog.deleteSuccess'), "success");
    } 
    catch (error) {
      console.error('Delete error:', error);
      showNotification(tLang(error.message) || tLang('catalog.deleteError'), "error");
      setConfirmModalVisible(false);
    }
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price ? item.price.toString() : "");
    
    if (item.image_url) {
      setFormPicture({
        url: item.image_url,
        fileId: item.image_file_id
      });
    } else {
      setFormPicture(null);
    }
    
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeObject.colors.background }]}>
        <ActivityIndicator size="large" color={themeObject.colors.primary || "#0000ff"} />
        <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
          {tLang('common.loading')}
        </Text>
      </View>
    );
  }

  const renderItemComponent = ({ item }) => 
  renderItem({
    item,
    expandedId,
    themeObject,
    tLang,
    toggleExpand,
    openEditModal,
    confirmDelete,
  });

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            {tLang('network.offlineMode')}
          </Text>
        </View>
      )}    
      {isConnected && pendingSync && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.syncText}> {tLang('network.syncing')} </Text>
        </View>
      )}
      <FlatList
        data={items}
        renderItem={renderItemComponent} 
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeObject.colors.primary || "#0000ff"]}
            tintColor={themeObject.colors.primary || "#0000ff"}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeObject.colors.text }]}>
              {tLang('catalog.empty')}
            </Text>
          </View>
        }
      />

      <Notification 
        notification={notification}
        insets={insets}
      />
      
      {renderModal({
        isEdit: false,
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
        setEditModalVisible,
        handleAddItem,
        handleUpdateItem,
        loadImage,
        showNotification,
        currentItem: null,
        uploadToImageKit,
        deleteImageFromImageKit
      })}
      
      {renderModal({
        isEdit: true,
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
        setEditModalVisible,
        handleAddItem,
        handleUpdateItem,
        loadImage,
        showNotification,
        currentItem,
        uploadToImageKit,
        deleteImageFromImageKit
      })}
      
      {renderConfirmModal({
        confirmModalVisible,
        themeObject,
        tLang,
        setConfirmModalVisible,
        handleDeleteItem
      })}
    </View>
  );
}
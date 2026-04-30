import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import Fuse from 'fuse.js';
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../src/view/catalogStyles";

import { supabase } from '../../src/model/supabase';
import { renderConfirmModal } from "../../src/view/confirmModal";
import { renderItem } from "../../src/view/item";
import { RenderModal } from "../../src/view/modal";
import { SortModal } from "../../src/view/sortModal";

import { initAnimalsTable } from '../../src/model/animalModel';
import { useCatalogForm } from "../../src/viewModel/hooks/useCatalogForm";
import { useLanguageSelector } from "../../src/viewModel/hooks/useLanguageSelector";
import { useNetworkStatus } from "../../src/viewModel/hooks/useNetworkStatus";
import { ThemeContext } from "../../src/viewModel/providers/themeProvider";
import { imagekitService } from "../../src/viewModel/services/imagekitService";
import { supabaseAnimalService } from "../../src/viewModel/services/supabaseAnimalService";
import { supabaseService } from "../../src/viewModel/services/supabaseService";

const ADMIN_ID = '6f4d907f-b751-48da-b434-0ebb68792299';

export default function CatalogScreen() {
  const db = useSQLiteContext();
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();

  // Состояние прав
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    items, loading, refreshing, pendingSync, loadItems, onRefresh,
    addItem, updateItem, deleteItem,
  } = supabaseService(db);

  const { loadImage } = imagekitService();
  const { animals } = supabaseAnimalService(db);

  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: "", type: "" });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState('name_asc');

  const {
    formName, setFormName, formDescription, setFormDescription,
    formPrice, setFormPrice, formPicture, setFormPicture,
    formCategory, setFormCategory, resetForm,
  } = useCatalogForm();

  // 1. ПРОВЕРКА ПРАВ
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(session?.user?.id === ADMIN_ID);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.id === ADMIN_ID);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. ИНИЦИАЛИЗАЦИЯ
  useEffect(() => {
    const init = async () => {
      await initAnimalsTable(db);
      loadItems();
    };
    init();
  }, []);

  // 3. КНОПКА В ХЕДЕРЕ
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => isAdmin ? (
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={{ marginRight: 16 }}>
          <Ionicons name="add" size={24} color={themeObject.colors.primary || "#007AFF"} />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, themeObject, isAdmin]);

  // --- ФУНКЦИИ ОБРАБОТКИ (ВОССТАНОВЛЕНО) ---

  const showNotification = (message, type = "success") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => setNotification({ visible: false, message: "", type: "" }), 3000);
  };

  const handleAddItem = async () => {
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.uri;
      await addItem({
        it_name: formName,
        it_description: formDescription,
        it_price: formPrice ? parseFloat(formPrice) : null,
        it_image_url: uri || null,
        it_image_file_id: null,
        it_an_id: formCategory,
      });
      resetForm();
      setModalVisible(false);
      showNotification(tLang("catalog.addSuccess"));
    } catch (error) {
      console.error(error);
      showNotification(tLang("catalog.addError"), "error");
    }
  };

  const handleUpdateItem = async () => {
    if (!currentItem) return;
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.url || formPicture?.uri;
      await updateItem({
        it_id: currentItem.it_id,
        it_name: formName,
        it_description: formDescription,
        it_price: formPrice ? parseFloat(formPrice) : null,
        it_image_url: uri || null,
        it_image_file_id: (uri === currentItem.it_image_url) ? currentItem.it_image_file_id : null,
        it_an_id: formCategory,
      });
      resetForm();
      setEditModalVisible(false);
      setCurrentItem(null);
      showNotification(tLang("catalog.updateSuccess"));
    } catch (error) {
      console.error(error);
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
      console.error(error);
      showNotification(tLang('catalog.deleteError'), "error");
    }
  };

  // --- ЛОГИКА ПОИСКА И СОРТИРОВКИ ---

  const itemsWithCategory = useMemo(() => {
    return items.map(item => ({
      ...item,
      categoryName: animals.find(a => a.an_id === item.it_an_id)?.an_name || '',
    }));
  }, [items, animals]);

  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return itemsWithCategory;
    const fuse = new Fuse(itemsWithCategory, {
      keys: [{ name: 'it_name', weight: 0.5 }, { name: 'it_description', weight: 0.3 }, { name: 'categoryName', weight: 0.2 }],
      threshold: 0.4,
    });
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, itemsWithCategory]);

  const sortedAndFilteredItems = useMemo(() => {
    const sorted = [...searchedItems];
    switch (sortOption) {
      case 'name_asc': sorted.sort((a, b) => (a.it_name || '').localeCompare(b.it_name || '')); break;
      case 'name_desc': sorted.sort((a, b) => (b.it_name || '').localeCompare(a.it_name || '')); break;
      case 'price_asc': sorted.sort((a, b) => (a.it_price || 0) - (b.it_price || 0)); break;
      case 'price_desc': sorted.sort((a, b) => (b.it_price || 0) - (a.it_price || 0)); break;
    }
    return sorted;
  }, [searchedItems, sortOption]);

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      {isConnected === false && <View style={styles.offlineBanner}><Text style={styles.offlineText}>{tLang('network.offlineMode')}</Text></View>}
      {pendingSync && <View style={styles.syncBanner}><Text style={styles.syncText}>{tLang('network.syncing')}</Text></View>}
      
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: themeObject.colors.inputBackground || themeObject.colors.card, borderColor: themeObject.colors.border }]}>
          <Ionicons name="search" size={20} color={themeObject.colors.placeholder || "#888888"} />
          <TextInput
            style={[styles.searchInput, { color: themeObject.colors.text }]}
            placeholder={tLang('catalog.searchPlaceholder') || "Поиск..."}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={themeObject.colors.placeholder || "#888888"} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.sortButton, { borderColor: themeObject.colors.border, backgroundColor: themeObject.colors.inputBackground || themeObject.colors.card }]}
          onPress={() => setSortModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={20} color={themeObject.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedAndFilteredItems}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => renderItem({
          item, expandedId, themeObject, tLang, toggleExpand: (id) => setExpandedId(expandedId === id ? null : id), 
          openEditModal: (item) => {
            setCurrentItem(item);
            setFormName(item.it_name);
            setFormDescription(item.it_description);
            setFormPrice(item.it_price ? item.it_price.toString() : "");
            setFormPicture(item.it_image_url ? { url: item.it_image_url, fileId: item.it_image_file_id } : null);
            setFormCategory(item.it_an_id);
            setEditModalVisible(true);
          }, 
          confirmDelete: (id) => { setItemToDelete(id); setConfirmModalVisible(true); }, 
          animalsList: animals, isAdmin 
        })}
        keyExtractor={(item) => item.it_id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeObject.colors.primary} />}
      />

      {isAdmin && (
        <>
          <RenderModal
            isEdit={false}
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            themeObject={themeObject}
            tLang={tLang}
            formName={formName} setFormName={setFormName}
            formDescription={formDescription} setFormDescription={setFormDescription}
            formPrice={formPrice} setFormPrice={setFormPrice}
            formCategory={formCategory} setFormCategory={setFormCategory}
            formPicture={formPicture} setFormPicture={setFormPicture}
            handleAddItem={handleAddItem}
            animalsList={animals}
            loadImage={loadImage}
            resetForm={resetForm}
          />
          <RenderModal
            isEdit={true}
            editModalVisible={editModalVisible}
            setEditModalVisible={setEditModalVisible}
            themeObject={themeObject}
            tLang={tLang}
            formName={formName} setFormName={setFormName}
            formDescription={formDescription} setFormDescription={setFormDescription}
            formPrice={formPrice} setFormPrice={setFormPrice}
            formCategory={formCategory} setFormCategory={setFormCategory}
            formPicture={formPicture} setFormPicture={setFormPicture}
            handleUpdateItem={handleUpdateItem}
            animalsList={animals}
            loadImage={loadImage}
            currentItem={currentItem}
            resetForm={resetForm}
          />
          {renderConfirmModal({ 
            confirmModalVisible, 
            themeObject, 
            tLang, 
            setConfirmModalVisible, 
            handleDeleteItem 
          })}
        </>
      )}

      <SortModal 
        visible={sortModalVisible} 
        onClose={() => setSortModalVisible(false)} 
        sortOption={sortOption} 
        onSortSelect={(opt) => { setSortOption(opt); setSortModalVisible(false); }} 
        themeObject={themeObject} 
        tLang={tLang} 
      />
    </View>
  );
}
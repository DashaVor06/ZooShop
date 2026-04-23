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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "../../src/view/catalogStyles";

import { renderConfirmModal } from "../../src/view/confirmModal";
import { renderItem } from "../../src/view/item";
import { RenderModal } from "../../src/view/modal";
import { SortModal } from "../../src/view/sortModal"; // Импортируем компонент сортировки

import { useCatalogForm } from "../../src/viewModel/hooks/useCatalogForm";
import { useLanguageSelector } from "../../src/viewModel/hooks/useLanguageSelector";

import { useNetworkStatus } from "../../src/viewModel/hooks/useNetworkStatus";
import { ThemeContext } from "../../src/viewModel/providers/themeProvider";
import { imagekitService } from "../../src/viewModel/services/imagekitService";
import { supabaseService } from "../../src/viewModel/services/supabaseService";

import { initAnimalsTable } from '../../src/model/animalModel';
import { supabaseAnimalService } from "../../src/viewModel/services/supabaseAnimalService";

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
  
  const { animals, loading: animalsLoading } = supabaseAnimalService(db);

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
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formPrice,
    setFormPrice,
    formPicture,
    setFormPicture,
    formCategory,
    setFormCategory,
    resetForm,
  } = useCatalogForm();

  const showNotification = (message, type = "success") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const initAnimals = async () => {
      await initAnimalsTable(db);
    };
    initAnimals();
  }, [db]);

  // ========== НЕЧЕТКИЙ ПОИСК С FUSE.JS ==========
  
  const itemsWithCategory = useMemo(() => {
    return items.map(item => ({
      ...item,
      categoryName: animals.find(a => a.an_id === item.it_an_id)?.an_name || '',
      searchableText: `${item.it_name} ${item.it_description} ${animals.find(a => a.an_id === item.it_an_id)?.an_name || ''}`
    }));
  }, [items, animals]);

  const fuseOptions = {
    keys: [
      { name: 'it_name', weight: 0.5 },
      { name: 'it_description', weight: 0.3 },
      { name: 'categoryName', weight: 0.2 },
      { name: 'searchableText', weight: 0.1 }
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    ignoreLocation: false,
    minMatchCharLength: 2,
    useExtendedSearch: true,
  };

  const fuse = useMemo(() => {
    return new Fuse(itemsWithCategory, fuseOptions);
  }, [itemsWithCategory]);

  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return itemsWithCategory;
    }
    
    const results = fuse.search(searchQuery);
    return results.map(result => result.item);
  }, [searchQuery, fuse]);

  // ========== СОРТИРОВКА ==========
  
  const sortItems = (itemsToSort, option) => {
    const sorted = [...itemsToSort];
    
    switch (option) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.it_name || '').localeCompare(b.it_name || ''));
      case 'name_desc':
        return sorted.sort((a, b) => (b.it_name || '').localeCompare(a.it_name || ''));
      case 'price_asc':
        return sorted.sort((a, b) => (a.it_price || 0) - (b.it_price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.it_price || 0) - (a.it_price || 0));
      default:
        return sorted;
    }
  };
  
  const sortedAndFilteredItems = useMemo(() => {
    return sortItems(searchedItems, sortOption);
  }, [searchedItems, sortOption]);

  // ========== ОСТАЛЬНЫЕ ФУНКЦИИ ==========

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

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormName(item.it_name);
    setFormDescription(item.it_description);
    setFormPrice(item.it_price ? item.it_price.toString() : "");
    setFormPicture(item.it_image_url ? { url: item.it_image_url, fileId: item.it_image_file_id } : null);
    setFormCategory(item.it_an_id);
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleSortSelect = (option) => {
    setSortOption(option);
    setSortModalVisible(false);
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getSortButtonLabel = () => {
    const sortOptionsList = [
      { value: 'name_asc', label: 'По названию (А-Я)' },
      { value: 'name_desc', label: 'По названию (Я-А)' },
      { value: 'price_asc', label: 'По цене (сначала дешевые)' },
      { value: 'price_desc', label: 'По цене (сначала дорогие)' },
    ];
    const option = sortOptionsList.find(opt => opt.value === sortOption);
    return option ? option.label.split(' ')[0] : 'Сорт';
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      {isConnected == false && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{tLang('network.offlineMode')}</Text>
        </View>
      )}
      {pendingSync && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>{tLang('network.syncing')}</Text>
        </View>
      )}
      
      {/* Панель поиска и сортировки */}
      <View style={styles.searchSection}>
        <View style={[
          styles.searchContainer,
          { 
            backgroundColor: themeObject.colors.inputBackground || themeObject.colors.card,
            borderColor: themeObject.colors.border
          }
        ]}>
          <Ionicons name="search" size={20} color={themeObject.colors.placeholder || "#888888"} />
          <TextInput
            style={[styles.searchInput, { color: themeObject.colors.text }]}
            placeholder={tLang('catalog.searchPlaceholder') || "Поиск товаров..."}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={themeObject.colors.placeholder || "#888888"} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.sortButton,
            { 
              borderColor: themeObject.colors.border,
              backgroundColor: themeObject.colors.inputBackground || themeObject.colors.card
            }
          ]}
          onPress={() => setSortModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={20} color={themeObject.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Модальное окно сортировки */}
      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        sortOption={sortOption}
        onSortSelect={handleSortSelect}
        themeObject={themeObject}
        tLang={tLang}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
            {tLang('common.loading')}
          </Text>
        </View>
      ) : (
        <>
          {sortedAndFilteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={themeObject.colors.placeholder || "#888888"} />
              <Text style={[styles.emptyText, { color: themeObject.colors.text }]}>
                {searchQuery ? tLang('catalog.noSearchResults') || "Ничего не найдено" : tLang('catalog.noItems') || "Товаров пока нет"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedAndFilteredItems}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => renderItem({
                item, expandedId, themeObject, tLang, toggleExpand, openEditModal, confirmDelete, animalsList: animals,
              })}
              keyExtractor={(item) => item.it_id?.toString() || Math.random().toString()}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeObject.colors.primary} />
              }
            />
          )}
        </>
      )}

      <RenderModal
        isEdit={false}
        modalVisible={modalVisible}
        editModalVisible={editModalVisible}
        themeObject={themeObject}
        tLang={tLang}
        formName={formName}
        setFormName={setFormName}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPrice={formPrice}
        setFormPrice={setFormPrice}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formPicture={formPicture}
        setFormPicture={setFormPicture}
        resetForm={resetForm}
        setModalVisible={setModalVisible} 
        setEditModalVisible={setEditModalVisible}
        handleAddItem={handleAddItem}
        handleUpdateItem={handleUpdateItem}
        loadImage={loadImage}
        showNotification={showNotification}
        animalsList={animals}
        currentItem={currentItem}
      />

      <RenderModal
        isEdit={true}
        modalVisible={modalVisible}
        editModalVisible={editModalVisible}
        themeObject={themeObject}
        tLang={tLang}
        formName={formName}
        setFormName={setFormName}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formPrice={formPrice}
        setFormPrice={setFormPrice}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formPicture={formPicture}
        setFormPicture={setFormPicture}
        resetForm={resetForm}
        setModalVisible={setModalVisible}
        setEditModalVisible={setEditModalVisible}
        handleAddItem={handleAddItem}
        handleUpdateItem={handleUpdateItem}
        loadImage={loadImage}
        showNotification={showNotification}
        animalsList={animals}
        currentItem={currentItem}
      />

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
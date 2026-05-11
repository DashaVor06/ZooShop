import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
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
import { styles } from "../../../src/view/catalogStyles";

import { renderConfirmModal } from "../../../src/view/confirmModal";
import { RenderItem } from "../../../src/view/item";
import { RenderModal } from "../../../src/view/modal";
import { SortModal } from "../../../src/view/sortModal";

import { initAnimalsTable } from '../../../src/model/animalModel';
import { useCatalogForm } from "../../../src/viewModel/hooks/useCatalogForm";
import { useLanguageSelector } from "../../../src/viewModel/hooks/useLanguageSelector";
import { useNetworkStatus } from "../../../src/viewModel/hooks/useNetworkStatus";
import { useUserRole } from "../../../src/viewModel/hooks/useUserRole";
import { ThemeContext } from "../../../src/viewModel/providers/themeProvider";
import { imagekitService } from "../../../src/viewModel/services/imagekitService";
import { supabaseAnimalService } from "../../../src/viewModel/services/supabaseAnimalService";
import { supabaseBrandService } from "../../../src/viewModel/services/supabaseBrandService";
import { supabaseService } from "../../../src/viewModel/services/supabaseService";
import { supabaseCharacteristicService } from "../../../src/viewModel/services/supabaseCharacteristicService";

import { useCart } from "../../../src/viewModel/providers/cartProvider";

export default function CatalogScreen() {
  const db = useSQLiteContext();
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const navigation = useNavigation();
  const router = useRouter(); 
  const { isConnected } = useNetworkStatus();

  const { cart } = useCart();
  
  // Состояние прав
  const { userProfile } = useUserRole();
  const isAdmin = userProfile?.acc_r_id === 1;
  const userId = userProfile?.acc_id;

  const {
    items, loading, refreshing, pendingSync, loadItems, onRefresh,
    addItem, updateItem, deleteItem,
  } = supabaseService(db);

  const { loadImage } = imagekitService();
  const { animals, addAnimal } = supabaseAnimalService(db);
  const { brands, addBrand } = supabaseBrandService(db); 
  const { characteristicValues, m2mCharacteristics } = supabaseCharacteristicService(db);

  const [selectedFilterId, setSelectedFilterId] = useState(null); // Для брендов или финала
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);

  const [filterType, setFilterType] = useState('animals'); 
  const [isListVisible, setIsListVisible] = useState(false);

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
    formCategory, setFormCategory, resetForm, formBrand, setFormBrand
  } = useCatalogForm();

  const handleItemPress = (item) => {
    router.push(`/catalog/${item.it_id}`);
  };

  // 2. ИНИЦИАЛИЗАЦИЯ
  useEffect(() => {
    const init = async () => {
      await initAnimalsTable(db);
      loadItems();
    };
    init();
  }, []);

  // 3. КНОПКА В ХЕДЕРЕ (Исправленная версия)
  useEffect(() => {
    // Определяем целевой объект навигации (текущий экран или его родитель-стек)
    const targetNav = navigation.getParent()?.setOptions ? navigation.getParent() : navigation;

    targetNav.setOptions({
      headerRight: () => isAdmin ? (
        <TouchableOpacity 
          onPress={() => { 
            resetForm(); 
            setModalVisible(true); 
          }} 
          style={{ 
            marginRight: 15, 
            padding: 5,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons 
            name="add" 
            size={30} 
            color={themeObject.colors.primary || "#007AFF"} 
          />
        </TouchableOpacity>
      ) : null,
    });
  }, [navigation, themeObject, isAdmin]);

  // --- ФУНКЦИИ ОБРАБОТКИ (ВОССТАНОВЛЕНО) ---

  const showNotification = (message, type = "success") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => setNotification({ visible: false, message: "", type: "" }), 3000);
  };

  const handleAddItem = async (finalCatId, finalBrId) => {
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.uri;
      
      const catId = finalCatId !== undefined ? finalCatId : formCategory;
      const brId = finalBrId !== undefined ? finalBrId : formBrand;

      await addItem({
        it_name: formName,
        it_description: formDescription,
        it_price: formPrice ? parseFloat(formPrice) : null,
        it_image_url: uri || null,
        it_image_file_id: null,
        it_an_id: catId,
        it_br_id: brId,
      });

      resetForm();
      setModalVisible(false);
      showNotification(tLang("catalog.addSuccess"));
    } catch (error) {
      console.error(error);
      showNotification(tLang("catalog.addError"), "error");
    }
  };

  const handleUpdateItem = async (finalCatId, finalBrId) => {
    if (!currentItem) return;
    try {
      const uri = typeof formPicture === "string" ? formPicture : formPicture?.url || formPicture?.uri;
      
      const catId = finalCatId !== undefined ? finalCatId : formCategory;
      const brId = finalBrId !== undefined ? finalBrId : formBrand;

      await updateItem({
        it_id: currentItem.it_id,
        it_name: formName,
        it_description: formDescription,
        it_price: formPrice ? parseFloat(formPrice) : null,
        it_image_url: uri || null,
        it_image_file_id: (uri === currentItem.it_image_url) ? currentItem.it_image_file_id : null,
        it_an_id: catId,
        it_br_id: brId,
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
    return (items || []).map(item => ({
      ...item,
      categoryName: (animals || []).find(a => String(a.an_id) === String(item.it_an_id))?.an_name || '',
    }));
  }, [items, animals]);

  const searchedItems = useMemo(() => {
    const baseItems = itemsWithCategory || [];
    if (!searchQuery.trim()) return baseItems;
    const fuse = new Fuse(baseItems, {
      keys: [{ name: 'it_name', weight: 0.5 }, { name: 'it_description', weight: 0.3 }, { name: 'categoryName', weight: 0.2 }],
      threshold: 0.4,
    });
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, itemsWithCategory]);

  const sortedAndFilteredItems = useMemo(() => {
    let filtered = [...(searchedItems || [])];

    if (filterType === 'brands') {
      if (selectedFilterId !== null) {
        filtered = filtered.filter(item => String(item.it_br_id) === String(selectedFilterId));
      }
    } else {
      // Иерархия: Животные -> Подкатегории
      if (selectedAnimalId !== null) {
        filtered = filtered.filter(item => String(item.it_an_id) === String(selectedAnimalId));
        
        if (selectedSubcategoryId !== null) {
          const itemIdsWithSubcat = (m2mCharacteristics || [])
            .filter(m2m => String(m2m.icv_cv_id) === String(selectedSubcategoryId))
            .map(m2m => String(m2m.icv_it_id));
          
          filtered = filtered.filter(item => itemIdsWithSubcat.includes(String(item.it_id)));
        }
      }
    }

    // Затем сортировка
    switch (sortOption) {
      case 'name_asc': filtered.sort((a, b) => (a.it_name || '').localeCompare(b.it_name || '')); break;
      case 'name_desc': filtered.sort((a, b) => (b.it_name || '').localeCompare(a.it_name || '')); break;
      case 'price_asc': filtered.sort((a, b) => (a.it_price || 0) - (b.it_price || 0)); break;
      case 'price_desc': filtered.sort((a, b) => (b.it_price || 0) - (a.it_price || 0)); break;
    }
    return filtered;
  }, [searchedItems, sortOption, selectedFilterId, filterType, selectedAnimalId, selectedSubcategoryId, m2mCharacteristics]);

  const availableSubcategories = useMemo(() => {
    if (!selectedAnimalId) return [];
    
    // Возвращаем только те характеристики, которые относятся к выбранному животному
    return (characteristicValues || [])
      .filter(cv => String(cv.cv_an_id) === String(selectedAnimalId))
      .sort((a, b) => (a.cv_value || '').localeCompare(b.cv_value || ''));
  }, [selectedAnimalId, characteristicValues]);

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
        numColumns={2}
        data={sortedAndFilteredItems}
        ListHeaderComponent={
          <View style={{ marginBottom: 15 }}>
            {/* Радиокнопки выбора типа */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
              {['animals', 'brands'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => { 
                    setFilterType(type); 
                    setSelectedFilterId(null);
                    setSelectedAnimalId(null);
                    setSelectedSubcategoryId(null);
                  }}
                  style={{ marginHorizontal: 15, alignItems: 'center' }}
                >
                  <Text style={{ 
                    fontWeight: filterType === type ? 'bold' : 'normal',
                    color: filterType === type ? themeObject.colors.primary : themeObject.colors.text 
                  }}>
                    {type === 'animals' ? 'Животные' : 'Бренды'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Хлебные крошки для иерархии животных */}
            {filterType === 'animals' && selectedAnimalId && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 10 }}>
                <TouchableOpacity onPress={() => { setSelectedAnimalId(null); setSelectedSubcategoryId(null); }}>
                  <Text style={{ color: themeObject.colors.primary }}>{tLang('catalog.animalsLabel') || "Животные"}</Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={14} color={themeObject.colors.text} style={{ marginHorizontal: 5 }} />
                <Text style={{ color: themeObject.colors.text, fontWeight: 'bold' }}>
                  {(animals || []).find(a => String(a.an_id) === String(selectedAnimalId))?.an_name}
                </Text>
              </View>
            )}

            {/* Вертикальный список категорий/брендов/подкатегорий */}
            <View>
              {(filterType === 'brands' 
                ? [{ id: null, name: tLang('common.all') || "Все" }, ...(brands || []).map(b => ({ id: b.br_id, name: b.br_name }))]
                : selectedAnimalId 
                  ? [{ id: null, name: tLang('catalog.allSubcategories') || "Все подкатегории" }, ...(availableSubcategories || []).map(cv => ({ id: cv.cv_id, name: cv.cv_value }))]
                  : [{ id: null, name: tLang('catalog.allAnimals') || "Все животные" }, ...(animals || []).map(a => ({ id: a.an_id, name: a.an_name }))]
              ).map((item, index, array) => {
                const isSelected = filterType === 'brands' 
                  ? String(selectedFilterId) === String(item.id)
                  : selectedAnimalId 
                    ? String(selectedSubcategoryId) === String(item.id)
                    : String(selectedAnimalId) === String(item.id);

                return (
                  <TouchableOpacity 
                    key={String(item.id || index)}
                    style={{ 
                      paddingVertical: 12, 
                      paddingHorizontal: 20,
                      backgroundColor: isSelected ? themeObject.colors.primary : 'transparent',
                      borderBottomWidth: index < array.length - 1 ? 0.5 : 0,
                      borderColor: themeObject.colors.border
                    }}
                    onPress={() => {
                      if (filterType === 'brands') {
                        setSelectedFilterId(item.id);
                      } else {
                        if (!selectedAnimalId) {
                          setSelectedAnimalId(item.id);
                        } else {
                          setSelectedSubcategoryId(item.id);
                        }
                      }
                    }}
                  >
                    <Text style={{ 
                      color: isSelected ? '#FFFFFF' : themeObject.colors.text,
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        extraData={cart}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={{ justifyContent: 'space-between' }} 
        renderItem={({ item }) => (
          <RenderItem
            item={item}
            expandedId={expandedId}
            themeObject={themeObject}
            tLang={tLang}
            toggleExpand={(id) =>
              setExpandedId(expandedId === id ? null : id)
            }
            openEditModal={(item) => {
              setCurrentItem(item);
              setFormName(item.it_name);
              setFormDescription(item.it_description);
              setFormPrice(item.it_price ? item.it_price.toString() : "");
              setFormPicture(
                item.it_image_url
                  ? {
                      url: item.it_image_url,
                      fileId: item.it_image_file_id,
                    }
                  : null
              );
              setFormCategory(item.it_an_id);
              setFormBrand(item.it_br_id);
              setEditModalVisible(true);
            }}
            confirmDelete={(id) => {
              setItemToDelete(id);
              setConfirmModalVisible(true);
            }}
            animalsList={animals}
            brandsList={brands}
            isAdmin={isAdmin}
            onPress={handleItemPress}
            userId={userId}
          />
        )}
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
            addAnimal={addAnimal}
            addBrand={addBrand}
            handleAddItem={handleAddItem}
            animalsList={animals}
            loadImage={loadImage}
            resetForm={resetForm}
            brandsList={brands}       // Передаем список брендов из сервиса
            formBrand={formBrand}     // Нужен новый хук useCatalogForm (см. ниже)
            setFormBrand={setFormBrand}
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
            addAnimal={addAnimal}
            addBrand={addBrand}
            animalsList={animals}
            loadImage={loadImage}
            currentItem={currentItem}
            resetForm={resetForm}
            brandsList={brands}       // Передаем список брендов из сервиса
            formBrand={formBrand}     // Нужен новый хук useCatalogForm (см. ниже)
            setFormBrand={setFormBrand}
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
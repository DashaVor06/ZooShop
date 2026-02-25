import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguageSelector } from "../../src/hooks/localizationHooks/useLanguageSelector";
import { ThemeContext } from "../../src/theme/themeProvider";

export default function CatalogScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const navigation = useNavigation();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const [notification, setNotification] = useState({ visible: false, message: "", type: "" });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPicture, setFormPicture] = useState("");

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openAddModal} style={{ marginRight: 16 }}>
          <Ionicons name="add" size={24} color={themeObject.colors.primary || "#007AFF"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, themeObject]);

  const loadItems = useCallback(async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT * FROM items 
        ORDER BY name
      `);
      setItems(result);
    } catch (error) {
      console.error("Error loading items:", error);
      showNotification(tLang('catalog.errorLoad') || "Ошибка загрузки данных", "error");
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const showNotification = (message, type = "success") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: "", type: "" });
    }, 3000);
  };

  const addItem = async () => {
    if (!formName.trim() || !formDescription.trim()) {
      showNotification(tLang('catalog.fillRequired') || "Заполните обязательные поля", "error");
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO items (name, description, price, picture) VALUES (?, ?, ?, ?)',
        formName,
        formDescription,
        formPrice ? parseFloat(formPrice) : null,
        formPicture || null
      );
      
      resetForm();
      setModalVisible(false);
      await loadItems();
      
      showNotification(tLang('catalog.addSuccess') || "Товар успешно добавлен", "success");
    } catch (error) {
      console.error("Error adding item:", error);
      showNotification(tLang('catalog.addError') || "Не удалось добавить товар", "error");
    }
  };

  const updateItem = async () => {
    if (!formName.trim() || !formDescription.trim()) {
      showNotification(tLang('catalog.fillRequired') || "Заполните обязательные поля", "error");
      return;
    }

    try {
      await db.runAsync(
        'UPDATE items SET name = ?, description = ?, price = ?, picture = ? WHERE id = ?',
        formName,
        formDescription,
        formPrice ? parseFloat(formPrice) : null,
        formPicture || null,
        currentItem.id
      );
      
      resetForm();
      setEditModalVisible(false);
      setCurrentItem(null);
      await loadItems();
      
      showNotification(tLang('catalog.updateSuccess') || "Товар успешно обновлен", "success");
    } catch (error) {
      console.error("Error updating item:", error);
      showNotification(tLang('catalog.updateError') || "Не удалось обновить товар", "error");
    }
  };

  const confirmDelete = (id) => {
    setItemToDelete(id);
    setConfirmModalVisible(true);
  };

  const deleteItem = async () => {
    try {
      await db.runAsync('DELETE FROM items WHERE id = ?', itemToDelete);
      await loadItems();
      setConfirmModalVisible(false);
      setItemToDelete(null);
      showNotification(tLang('catalog.deleteSuccess') || "Товар успешно удален", "success");
    } catch (error) {
      console.error("Error deleting item:", error);
      showNotification(tLang('catalog.deleteError') || "Не удалось удалить товар", "error");
      setConfirmModalVisible(false);
    }
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price ? item.price.toString() : "");
    setFormPicture(item.picture || "");
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormPicture("");
    setCurrentItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return "";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return Number(price).toFixed(2).replace('.', ',');
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const displayDescription = isExpanded 
      ? item.description 
      : truncateDescription(item.description, 80);

    return (
      <View style={[
        styles.productCard,
        { backgroundColor: themeObject.colors.card || "#ffffff" }
      ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.id)}
        >
          {item.picture && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.picture }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={[styles.productName, { color: themeObject.colors.text }]}>
              {item.name}
            </Text>
            
            <View style={styles.divider} />
            
            <Text 
              style={[styles.productDescription, { color: themeObject.colors.secondaryText || "#666666" }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {displayDescription}
            </Text>
            
            {item.price && (
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, { color: themeObject.colors.secondaryText || "#999999" }]}>
                  {tLang('catalog.price') || "Цена:"}
                </Text>
                <Text style={[styles.priceValue, { color: themeObject.colors.primary || "#2ecc71" }]}>
                  {formatPrice(item.price)} Br
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderConfirmModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={confirmModalVisible}
      onRequestClose={() => setConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: themeObject.colors.background }]}>
          <Ionicons name="warning" size={50} color="#f44336" style={styles.warningIcon} />
          <Text style={[styles.confirmTitle, { color: themeObject.colors.text }]}>
            {tLang('catalog.confirmDelete') || "Подтверждение удаления"}
          </Text>
          <Text style={[styles.confirmText, { color: themeObject.colors.secondaryText || "#666666" }]}>
            {tLang('catalog.confirmDeleteMessage') || "Вы уверены, что хотите удалить этот товар?"}
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelConfirmButton]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.cancelConfirmText}>
                {tLang('common.cancel') || "Отмена"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.deleteConfirmButton]}
              onPress={deleteItem}
            >
              <Text style={styles.deleteConfirmText}>
                {tLang('common.delete') || "Удалить"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const Notification = () => {
    if (!notification.visible) return null;
    
    return (
      <View style={[
        styles.notification,
        { 
          backgroundColor: notification.type === "success" ? "#4CAF50" : "#f44336",
          top: insets.top + 10,
        }
      ]}>
        <Text style={styles.notificationText}>{notification.message}</Text>
      </View>
    );
  };

  const renderModal = (isEdit = false) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEdit ? editModalVisible : modalVisible}
      onRequestClose={() => {
        isEdit ? setEditModalVisible(false) : setModalVisible(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeObject.colors.background }]}>
          <Text style={[styles.modalTitle, { color: themeObject.colors.text }]}>
            {isEdit 
              ? (tLang('catalog.editTitle') || "Редактировать товар")
              : (tLang('catalog.addTitle') || "Добавить товар")
            }
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground,
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border
            }]}
            placeholder={tLang('catalog.namePlaceholder') || "Название *"}
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
            placeholder={tLang('catalog.descriptionPlaceholder') || "Описание *"}
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
            placeholder={tLang('catalog.pricePlaceholder') || "Цена (Br)"}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={formPrice}
            onChangeText={setFormPrice}
            keyboardType="numeric"
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground,
              color: themeObject.colors.text,
              borderColor: themeObject.colors.border
            }]}
            placeholder={tLang('catalog.imagePlaceholder') || "URL изображения"}
            placeholderTextColor={themeObject.colors.placeholder || "#888888"}
            value={formPicture}
            onChangeText={setFormPicture}
          />

          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                isEdit ? setEditModalVisible(false) : setModalVisible(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>
                {tLang('common.cancel') || "Отмена"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={isEdit ? updateItem : addItem}
            >
              <Text style={styles.saveButtonText}>
                {isEdit 
                  ? (tLang('common.save') || "Сохранить")
                  : (tLang('common.add') || "Добавить")
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: themeObject.colors.background }]}>
        <ActivityIndicator size="large" color={themeObject.colors.primary || "#0000ff"} />
        <Text style={[styles.loadingText, { color: themeObject.colors.text }]}>
          {tLang('common.loading') || "Загрузка..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: themeObject.colors.background,
      }
    ]}>
      <FlatList
        data={items}
        renderItem={renderItem}
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
              {tLang('catalog.empty') || "Товары не найдены"}
            </Text>
          </View>
        }
      />

      <Notification />

      {renderModal(false)}
      {renderModal(true)}
      {renderConfirmModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notification: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteConfirmButton: {
    backgroundColor: '#f44336',
  },
  cancelConfirmText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
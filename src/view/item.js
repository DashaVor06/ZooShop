import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Share, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./catalogStyles";

export const renderItem = ({
  item,
  themeObject,
  tLang,
  openEditModal,
  confirmDelete,
  animalsList = [],
  isAdmin,
  onPress, // Добавили onPress
}) => {
    
  const handleAddToCart = () => {
    // Здесь будет ваша логика добавления в корзину
    // Например: basketStore.add(item);
    console.log("Добавлено в корзину:", item.it_name);
  };
    const handleShare = async () => {
      try {
        const animalName = getAnimalName(item.it_an_id, animalsList);
        const price = item.it_price ? `${formatPrice(item.it_price)} Br` : '';
        const message = `${animalName} - ${item.it_name || ''}\n\n${item.it_description || ''}\n\n${tLang('catalog.price') || 'Цена'}: ${price}`;
        await Share.share({ message, title: item.it_name || 'Item' });
      } catch (error) { console.error(error); }
    };
  
    const formatPrice = (price) => {
      if (!price) return "";
      return Number(price).toFixed(2).replace('.', ',');
    };

    const getAnimalName = (animalId, list) => {
      if (!animalId) return 'Без категории';
      const animal = list.find(a => (a.an_id === animalId || a.id === animalId));
      return animal ? String(animal.an_name) : 'Без категории';
    };

    return (
      <View style={[styles.productCard, { backgroundColor: themeObject.colors.card || "#ffffff" }]}>
        {/* При нажатии на карточку вызываем переданный onPress */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => onPress && onPress(item)}>
          {item.it_image_url ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.it_image_url }} style={styles.productImage} resizeMode="contain" />
            </View>
          ) : null}
          
          <View style={styles.cardContent}>
            <Text style={[styles.itemCategory, { color: themeObject.colors.primary, fontWeight: '700', fontSize: 11, marginBottom: 2 }]}>
              {String(getAnimalName(item.it_an_id, animalsList)).toUpperCase()}
            </Text>
            
            <Text style={[styles.productName, { color: themeObject.colors.text, fontSize: 14 }]} numberOfLines={2}>
              {String(item.it_name || 'Без названия')}
            </Text>
            
            {/* Описание удалено */}
            
            {item.it_price ? (
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, { color: themeObject.colors.secondaryText || "#999999", fontSize: 12 }]}>
                  {String(tLang('catalog.price') || "Цена:")}
                </Text>
                <Text style={[styles.priceValue, { color: themeObject.colors.primary || "#2ecc71", fontSize: 14 }]}>
                  {formatPrice(item.it_price)} Br
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {/* Кнопка Корзины */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={22} color={themeObject.colors.primary || "#2196F3"} />
          </TouchableOpacity>

          {isAdmin ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={22} color="#4CAF50" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(item.it_id)}>
                <Ionicons name="trash" size={22} color="#f44336" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    );
};
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { styles } from "./catalogStyles";

export const renderItem = ({
  item,
  expandedId,
  themeObject,
  tLang,
  toggleExpand,
  openEditModal,
  confirmDelete,
  animalsList = [],
}) => {
    const truncateDescription = (description, maxLength = 100) => {
      if (!description) return "";
      if (description.length <= maxLength) return description;
      return description.substring(0, maxLength) + "...";
    };
  
    const formatPrice = (price) => {
      if (!price) return "";
      return Number(price).toFixed(2).replace('.', ',');
    };
    
    const isExpanded = expandedId === item.it_id;
    const displayDescription = isExpanded 
      ? item.it_description
      : truncateDescription(item.it_description, 80);

    const getAnimalName = (animalId, animalsList) => {
      if (!animalId) 
        return 'Без категории';
      const animal = animalsList.find(a => (a.an_id === animalId || a.id === animalId));
      return animal ? animal.an_name : 'Без категории';
    };

    return (
      <View style={[
        styles.productCard,
        { backgroundColor: themeObject.colors.card || "#ffffff" }
      ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(item.it_id)}
        >
          {item.it_image_url ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.it_image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          ) : null}
          
          <View style={styles.cardContent}>
            {/* Категория жирным шрифтом перед названием */}
            <Text style={[styles.itemCategory, { 
              color: themeObject.colors.primary,
              fontWeight: '700',
              fontSize: 14,
              marginBottom: 4,
            }]}>
              {getAnimalName(item.it_an_id, animalsList)}
            </Text>
            
            {/* Название товара */}
            <Text style={[styles.productName, { color: themeObject.colors.text }]}>
              {item.it_name}
            </Text>
            
            <View style={styles.divider} />
            
            <Text 
              style={[styles.productDescription, { color: themeObject.colors.secondaryText || "#666666" }]}
              numberOfLines={isExpanded ? undefined : 3}
            >
              {displayDescription}
            </Text>
            
            {item.it_price && (
              <View style={styles.priceContainer}>
                <Text style={[styles.priceLabel, { color: themeObject.colors.secondaryText || "#999999" }]}>
                  {tLang('catalog.price') || "Цена:"}
                </Text>
                <Text style={[styles.priceValue, { color: themeObject.colors.primary || "#2ecc71" }]}>
                  {formatPrice(item.it_price)} Br
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
            onPress={() => confirmDelete(item.it_id)}
          >
            <Ionicons name="trash" size={24} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
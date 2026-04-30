import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Share, Text, TouchableOpacity, View } from "react-native";
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
  isAdmin,
}) => {
    
    const handleShare = async () => {
      try {
        const animalName = getAnimalName(item.it_an_id, animalsList);
        const price = item.it_price ? `${formatPrice(item.it_price)} Br` : '';
        const message = `${animalName} - ${item.it_name}\n\n${item.it_description}\n\n${tLang('catalog.price')}: ${price}`;
        await Share.share({ message, title: item.it_name });
      } catch (error) { console.error(error); }
    };

    const truncateDescription = (description, maxLength = 100) => {
      if (!description) return "";
      return description.length <= maxLength ? description : description.substring(0, maxLength) + "...";
    };
  
    const formatPrice = (price) => {
      if (!price) return "";
      return Number(price).toFixed(2).replace('.', ',');
    };

    const getAnimalName = (animalId, list) => {
      if (!animalId) return 'Без категории';
      const animal = list.find(a => (a.an_id === animalId || a.id === animalId));
      return animal ? animal.an_name : 'Без категории';
    };
    
    const isExpanded = expandedId === item.it_id;
    const displayDescription = isExpanded 
      ? item.it_description
      : truncateDescription(item.it_description, 80);

    return (
      <View style={[styles.productCard, { backgroundColor: themeObject.colors.card || "#ffffff" }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(item.it_id)}>
          {item.it_image_url && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: item.it_image_url }} style={styles.productImage} resizeMode="contain" />
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={[styles.itemCategory, { color: themeObject.colors.primary, fontWeight: '700', fontSize: 14, marginBottom: 4 }]}>
              {getAnimalName(item.it_an_id, animalsList)}
            </Text>
            
            <Text style={[styles.productName, { color: themeObject.colors.text }]}>{item.it_name}</Text>
            
            <View style={styles.divider} />
            
            <Text style={[styles.productDescription, { color: themeObject.colors.secondaryText || "#666666" }]} numberOfLines={isExpanded ? undefined : 3}>
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
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={themeObject.colors.primary || "#2196F3"} />
          </TouchableOpacity>

          {isAdmin && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={24} color="#4CAF50" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(item.it_id)}>
                <Ionicons name="trash" size={24} color="#f44336" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
};
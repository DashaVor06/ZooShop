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
          {item.image_url ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            </View>
          ) : null}
          
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
// SortModal.js
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { styles } from "./catalogStyles";

export const SortModal = ({
  visible,
  onClose,
  sortOption,
  onSortSelect,
  themeObject,
  tLang,
}) => {
  const sortOptionsList = [
    { value: 'name_asc', label: 'По названию (А-Я)', icon: 'text' },
    { value: 'name_desc', label: 'По названию (Я-А)', icon: 'text' },
    { value: 'price_asc', label: 'По цене (сначала дешевые)', icon: 'cash' },
    { value: 'price_desc', label: 'По цене (сначала дорогие)', icon: 'cash' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[
          styles.sortModalContent,
          { backgroundColor: themeObject.colors.background }
        ]}>
          <Text style={[styles.sortModalTitle, { color: themeObject.colors.text }]}>
            {tLang('catalog.sortBy') || "Сортировка"}
          </Text>
          {sortOptionsList.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortOption === option.value && styles.sortOptionActive,
                { borderBottomColor: themeObject.colors.border }
              ]}
              onPress={() => onSortSelect(option.value)}
            >
              <Ionicons 
                name={option.icon === 'text' ? 'document-text-outline' : 'cash-outline'} 
                size={20} 
                color={sortOption === option.value ? themeObject.colors.primary : themeObject.colors.text} 
              />
              <Text style={[
                styles.sortOptionText,
                { color: sortOption === option.value ? themeObject.colors.primary : themeObject.colors.text }
              ]}>
                {option.label}
              </Text>
              {sortOption === option.value && (
                <Ionicons name="checkmark" size={20} color={themeObject.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
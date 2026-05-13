import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const SimplePicker = ({ 
  selectedValue, 
  onValueChange, 
  items, 
  placeholder = 'Выберите...',
  themeObject,
  isManual, // Проп: режим ручного ввода
  setIsManual // Функция для переключения режима
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => item.value === selectedValue);
  
  return (
    <View style={{ marginBottom: 12 }}>
      {/* Кнопка переключения режима */}
      {setIsManual && (
        <TouchableOpacity onPress={() => setIsManual(!isManual)} style={{ marginBottom: 5 }}>
          <Text style={{ color: themeObject.colors.primary, fontSize: 12 }}>
            {isManual ? "Выбрать из списка" : "Ввести новое значение"}
          </Text>
        </TouchableOpacity>
      )}

      {isManual ? (
        <TextInput
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: themeObject.colors.border,
            backgroundColor: themeObject.colors.background,
            color: themeObject.colors.text,
            fontSize: 16,
            minHeight: 48,
          }}
          placeholder={placeholder}
          placeholderTextColor={themeObject.colors.placeholder}
          value={selectedValue}
          onChangeText={onValueChange}
        />
      ) : (
        <TouchableOpacity
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            borderColor: themeObject.colors.border,
            backgroundColor: themeObject.colors.background,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 48,
          }}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={{
            color: selectedItem ? themeObject.colors.text : (themeObject.colors.placeholder || "#888888"),
            fontSize: 16,
          }}>
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
          <Text style={{ color: themeObject.colors.text, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      )}

      {isOpen && !isManual && (
        <View style={{
          borderWidth: 1,
          borderColor: themeObject.colors.border,
          borderRadius: 8,
          marginTop: 4,
          maxHeight: 200,
          backgroundColor: themeObject.colors.background,
        }}>
          <ScrollView nestedScrollEnabled={true}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.value || index}
                style={{
                  padding: 12,
                  borderBottomWidth: index < items.length - 1 ? 1 : 0,
                  borderBottomColor: themeObject.colors.border,
                }}
                onPress={() => {
                  onValueChange(item.value);
                  setIsOpen(false);
                }}
              >
                <Text style={{ color: themeObject.colors.text }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
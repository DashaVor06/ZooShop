// SimplePicker.js - цвет фона как у опций изначально
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export const SimplePicker = ({ 
  selectedValue, 
  onValueChange, 
  items, 
  placeholder = 'Выберите...',
  themeObject 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(item => item.value === selectedValue);
  
  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        style={{
          padding: 12,
          borderWidth: 1,
          borderRadius: 8,
          borderColor: themeObject.colors.border,
          backgroundColor: themeObject.colors.background, // такой же как у опций
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
        <Text style={{ 
          color: themeObject.colors.text, 
          fontSize: 12 
        }}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={{
          borderWidth: 1,
          borderColor: themeObject.colors.border,
          borderRadius: 8,
          marginTop: 4,
          maxHeight: 200,
          backgroundColor: themeObject.colors.background, // такой же как у кнопки
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}>
          <ScrollView nestedScrollEnabled={true}>
            {items.map((item, index) => {
              const isSelected = selectedValue === item.value;
              
              return (
                <TouchableOpacity
                  key={item.value || index}
                  style={{
                    padding: 12,
                    borderBottomWidth: index < items.length - 1 ? 1 : 0,
                    borderBottomColor: themeObject.colors.border,
                    backgroundColor: 'transparent',
                  }}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={{
                    color: isSelected ? themeObject.colors.primary : themeObject.colors.text,
                    fontWeight: isSelected ? '600' : '400',
                    fontSize: 16,
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
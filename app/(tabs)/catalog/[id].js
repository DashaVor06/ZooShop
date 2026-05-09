import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLanguageSelector } from '../../../src/viewModel/hooks/useLanguageSelector';
import { ThemeContext } from '../../../src/viewModel/providers/themeProvider';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const db = useSQLiteContext();
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);
const loadProduct = async () => {
    try {
      setLoading(true);
      // ПРИВОДИМ ID К ЧИСЛУ. Если id это строка "123", Number(id) превратит её в 123
      const numericId = Number(id);
      
      if (isNaN(numericId)) {
        console.error('Invalid ID provided:', id);
        return;
      }

      // Используем массив параметров [numericId]
      const product = await db.getFirstAsync(
        'SELECT * FROM items WHERE it_id = ?', 
        [numericId]
      );
      
      setItem(product);
    } catch (error) {
      console.error('Ошибка при выполнении SQL запроса:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "";
    return Number(price).toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeObject.colors.background }}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeObject.colors.background }}>
        <Text style={{ color: themeObject.colors.text }}>Товар не найден</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: themeObject.colors.primary }}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: themeObject.colors.background }}>
      {/* Кнопка закрытия модального окна */}
      <TouchableOpacity 
        style={{ padding: 20, paddingTop: 50 }} 
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={32} color={themeObject.colors.text} />
      </TouchableOpacity>

      {item.it_image_url && (
        <Image 
          source={{ uri: item.it_image_url }} 
          style={{ width: '100%', height: 300 }} 
          resizeMode="contain" 
        />
      )}
      
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: themeObject.colors.text }}>
          {item.it_name}
        </Text>
        
        {item.it_price && (
          <Text style={{ fontSize: 20, color: themeObject.colors.primary, marginVertical: 10 }}>
            {formatPrice(item.it_price)} Br
          </Text>
        )}
        
        <Text style={{ fontSize: 16, color: themeObject.colors.secondaryText || '#666' }}>
          {item.it_description || 'Нет описания'}
        </Text>
      </View>
    </ScrollView>
  );
}
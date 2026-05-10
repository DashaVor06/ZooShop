import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useContext, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/model/supabase';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useUserRole } from '../../src/viewModel/hooks/useUserRole';
import { useCart } from '../../src/viewModel/providers/cartProvider';
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';

export default function BasketScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const { userProfile } = useUserRole();
  
  const { cart, updateCartItem, fetchCart } = useCart();
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketItems, setBasketItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchBasket(); // Перезагружаем корзину при каждом открытии экрана
    }, [userProfile])
  );

  const fetchBasket = async () => {
    if (!userProfile?.acc_id) return;
    const { data } = await supabase
      .from('accounts_m2m_items')
      .select('ai_acc_id, ai_it_id, ai_amount, items(it_name, it_price, it_id, it_image_url)')
      .eq('ai_acc_id', userProfile.acc_id);
    if (data) setBasketItems(data);
  };

  const updateQuantity = async (item, newAmount) => {
    await updateCartItem(item.ai_it_id, newAmount);

    // обновляем данные корзины с item details
    await fetchBasket();

    // если удалили товар
    if (newAmount < 1) {
      setSelectedIds(prev =>
        prev.filter(id => id !== getItemKey(item))
      );
    }
  };

  const getItemKey = (item) => `${item.ai_acc_id}_${item.ai_it_id}`;

  const toggleSelect = (item) => {
    const key = getItemKey(item);
    setSelectedIds(prev => prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]);
  };

  const totalSum = basketItems
    .filter(item => selectedIds.includes(getItemKey(item)))
    .reduce((sum, item) => sum + (item.items?.it_price || 0) * (item.ai_amount || 1), 0);

  const renderBasketItem = ({ item }) => {
    const key = getItemKey(item);
    return (
      <View style={[styles.card, { backgroundColor: themeObject.colors.card }]}>
        <TouchableOpacity onPress={() => toggleSelect(item)} style={styles.checkbox}>
          <Ionicons name={selectedIds.includes(key) ? "checkbox" : "square-outline"} size={24} color={themeObject.colors.primary} />
        </TouchableOpacity>
        
        {item.items?.it_image_url && (
          <Image source={{ uri: item.items.it_image_url }} style={styles.image} />
        )}

        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={{ color: themeObject.colors.text, fontWeight: 'bold' }}>{item.items?.it_name}</Text>
          {/* ОБНОВЛЕННЫЙ БЛОК ЦЕНЫ */}
          <View>
            <Text style={{ color: themeObject.colors.primary, fontSize: 16, fontWeight: '600' }}>
              {( (item.items?.it_price || 0) * item.ai_amount ).toFixed(2)} Br
            </Text>
          </View>
        </View>

        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item, item.ai_amount - 1)}>
            <Ionicons name="remove-circle-outline" size={24} color={themeObject.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.amount, { color: themeObject.colors.text }]}>{item.ai_amount}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item, item.ai_amount + 1)}>
            <Ionicons name="add-circle-outline" size={24} color={themeObject.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <FlatList data={basketItems} keyExtractor={getItemKey} renderItem={renderBasketItem} />
      <View style={[styles.footer, { borderTopColor: themeObject.colors.border }]}>
        <Text style={{ color: themeObject.colors.text, fontSize: 18 }}>
          {tLang('basket.total')}: {totalSum.toFixed(2)} Br
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: themeObject.colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tLang('basket.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 8 },
  image: { width: 50, height: 50, borderRadius: 8 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  amount: { marginHorizontal: 10, fontSize: 16 },
  checkbox: { marginRight: 10 },
  footer: { padding: 20, alignItems: 'center', borderTopWidth: 1 },
  button: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 10 }
});
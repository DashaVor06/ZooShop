import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { useCallback, useContext, useState, useMemo } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/model/supabase';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useUserRole } from '../../src/viewModel/hooks/useUserRole';
import { useCart } from '../../src/viewModel/providers/cartProvider';
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';
import { supabaseOrderService } from '../../src/viewModel/services/supabaseOrderService';

export default function BasketScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const { userProfile, isAdmin } = useUserRole();
  const router = useRouter();
  const { fetchAllOrders, fetchStatuses, updateOrderStatus } = supabaseOrderService();
  
  const { cart, updateCartItem, fetchCart } = useCart();
  const [selectedIds, setSelectedIds] = useState([]);
  const [basketItems, setBasketItems] = useState([]);
  
  // ADMIN STATE
  const [allOrders, setAllOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  // PROMOTIONS STATE
  const [promotions, setPromotions] = useState([]);
  const [m2mChars, setM2mChars] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        loadAdminData();
      } else {
        fetchBasket();
        loadPromos();
      }
    }, [userProfile, isAdmin])
  );

  const loadPromos = async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from("promotions").select("*"),
      supabase.from("items_m2m_characteristic_values").select("*")
    ]);
    setPromotions(pRes.data || []);
    setM2mChars(cRes.data || []);
  };

  const loadAdminData = async () => {
    setLoading(true);
    const [ordersData, statusesData] = await Promise.all([
      fetchAllOrders(),
      fetchStatuses()
    ]);
    setAllOrders(ordersData);
    setStatuses(statusesData);
    setLoading(false);
  };

  const fetchBasket = async () => {
    if (!userProfile?.acc_id) return;
    const { data } = await supabase
      .from('accounts_m2m_items')
      .select('ai_acc_id, ai_it_id, ai_amount, items(*)')
      .eq('ai_acc_id', userProfile.acc_id);
    if (data) setBasketItems(data);
  };

  const handleStatusChange = async (orderId, newStatusId) => {
    const { success } = await updateOrderStatus(orderId, newStatusId);
    if (success) {
      loadAdminData(); // Refresh list
    } else {
      Alert.alert(tLang("common.error"), tLang("catalog.updateError"));
    }
  };

  const handleCheckout = () => {
    const selectedItems = basketItems.filter(item => selectedIds.includes(getItemKey(item)));
    if (selectedItems.length === 0) {
      Alert.alert(tLang("common.error"), tLang("basket.empty")); 
      return;
    }
    
    router.push({
      pathname: "/order-placement",
      params: { items: JSON.stringify(selectedItems) }
    });
  };

  const updateQuantity = async (item, newAmount) => {
    await updateCartItem(item.ai_it_id, newAmount);
    await fetchBasket();
    if (newAmount < 1) {
      setSelectedIds(prev => prev.filter(id => id !== getItemKey(item)));
    }
  };

  const getItemKey = (item) => `${item.ai_acc_id}_${item.ai_it_id}`;

  const toggleSelect = (item) => {
    const key = getItemKey(item);
    setSelectedIds(prev => prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]);
  };

  const itemsWithPricing = useMemo(() => {
    const { calculateDiscountedPrice } = require('../../src/viewModel/services/discountService');
    return basketItems.map(item => {
      const { price, discount } = calculateDiscountedPrice(item.items, promotions, m2mChars);
      return {
        ...item,
        finalPrice: price,
        discount: discount
      };
    });
  }, [basketItems, promotions, m2mChars]);

  const totalSum = itemsWithPricing
    .filter(item => selectedIds.includes(getItemKey(item)))
    .reduce((sum, item) => sum + item.finalPrice * (item.ai_amount || 1), 0);

  const renderBasketItem = ({ item }) => {
    const key = getItemKey(item);
    const hasDiscount = item.discount > 0;

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {hasDiscount && (
               <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 12, textDecorationLine: 'line-through', marginRight: 5 }}>
                {Number(item.items?.it_price).toFixed(2)}
               </Text>
            )}
            <Text style={{ color: themeObject.colors.primary, fontSize: 16, fontWeight: '600' }}>
              {( item.finalPrice * item.ai_amount ).toFixed(2)} Br
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

  const renderAdminOrder = ({ item }) => {
    const statusId = Array.isArray(item.orders_m2m_statuses) 
      ? item.orders_m2m_statuses[0]?.os_stat_id 
      : item.orders_m2m_statuses?.os_stat_id;

    return (
      <View style={[styles.card, { backgroundColor: themeObject.colors.card, flexDirection: 'column', alignItems: 'stretch' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: themeObject.colors.text, fontWeight: 'bold' }}>#{item.ord_id}</Text>
          <Text style={{ color: themeObject.colors.primary, fontWeight: 'bold' }}>{Number(item.ord_final_sum).toFixed(2)} Br</Text>
        </View>
        
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: themeObject.colors.text, fontSize: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{tLang('order.customer')}:</Text> {item.accounts?.acc_email}
          </Text>
          <Text style={{ color: themeObject.colors.text, fontSize: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{tLang('order.shop')}:</Text> {item.shops?.cities?.c_name}, {item.shops?.sh_address}
          </Text>
        </View>

        <View style={[styles.pickerContainer, { backgroundColor: themeObject.colors.surface || '#eee', borderColor: themeObject.colors.border }]}>
          <Picker
            selectedValue={statusId}
            onValueChange={(val) => handleStatusChange(item.ord_id, val)}
            style={{ color: themeObject.colors.text, height: 50 }}
            dropdownIconColor={themeObject.colors.primary}
          >
            {statuses.map(s => (
              <Picker.Item key={s.stat_id} label={s.stat_name} value={s.stat_id} />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  if (!userProfile) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeObject.colors.background }]}>
        <Ionicons name="lock-closed-outline" size={64} color={themeObject.colors.primary} />
        <Text style={{ color: themeObject.colors.text, fontSize: 18, textAlign: 'center', marginTop: 20 }}>
          {tLang('basket.authorize')}
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: themeObject.colors.primary, marginTop: 20 }]}
          onPress={() => router.push('/app-settings')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tLang('auth.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: themeObject.colors.border }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: themeObject.colors.text }}>{tLang('order.management')}</Text>
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={themeObject.colors.primary} /></View>
        ) : (
          <FlatList
            data={allOrders}
            keyExtractor={item => item.ord_id.toString()}
            renderItem={renderAdminOrder}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: themeObject.colors.text, marginTop: 50 }}>{tLang('order.noOrders')}</Text>}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <FlatList 
        data={itemsWithPricing} 
        keyExtractor={getItemKey} 
        renderItem={renderBasketItem}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: themeObject.colors.text, marginTop: 50 }}>{tLang('basket.empty')}</Text>
          </View>
        }
      />
      <View style={[styles.footer, { borderTopColor: themeObject.colors.border }]}>
        <Text style={{ color: themeObject.colors.text, fontSize: 18 }}>
          {tLang('basket.total')}: {totalSum.toFixed(2)} Br
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: themeObject.colors.primary }]}
          onPress={handleCheckout}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{tLang('basket.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: 8, marginHorizontal: 16 },
  image: { width: 50, height: 50, borderRadius: 8 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  amount: { marginHorizontal: 10, fontSize: 16 },
  checkbox: { marginRight: 10 },
  footer: { padding: 20, alignItems: 'center', borderTopWidth: 1 },
  button: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 10 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginTop: 5 }
});
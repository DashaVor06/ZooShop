import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useContext, useEffect, useState, useMemo } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../src/model/supabase";
import { useLanguageSelector } from "../src/viewModel/hooks/useLanguageSelector";
import { useUserRole } from "../src/viewModel/hooks/useUserRole";
import { ThemeContext } from "../src/viewModel/providers/themeProvider";
import { supabaseOrderService } from "../src/viewModel/services/supabaseOrderService";
import { calculateDiscountedPrice } from "../src/viewModel/services/discountService";
import { useCart } from "../src/viewModel/providers/cartProvider";

export default function OrderPlacementScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const { userProfile } = useUserRole();
  const { fetchCart } = useCart();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchShops, fetchPaymentMethods, createOrder, fetchCities } = supabaseOrderService();

  const [cities, setCities] = useState([]);
  const [shops, setShops] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [m2mChars, setM2mChars] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Starting to load order placement data...");
      
      const [citiesData, shopsData, pmData, promoRes, charsRes] = await Promise.all([
        fetchCities(),
        fetchShops(),
        fetchPaymentMethods(),
        supabase.from("promotions").select("*"),
        supabase.from("items_m2m_characteristic_values").select("*"),
      ]);

      console.log("Cities fetched:", citiesData?.length || 0);
      console.log("Shops fetched:", shopsData?.length || 0);
      console.log("Payment methods fetched:", pmData?.length || 0);
      
      if (promoRes.error) console.error("Promotions error:", promoRes.error);
      if (charsRes.error) console.error("M2M Chars error:", charsRes.error);

      setCities(citiesData || []);
      setShops(shopsData || []);
      setPaymentMethods(pmData || []);
      setPromotions(promoRes.data || []);
      setM2mChars(charsRes.data || []);

      if (params.items) {
        const parsedItems = JSON.parse(params.items);
        console.log("Items to order:", parsedItems.length);
        setItems(parsedItems);
      }
    } catch (error) {
      console.error("Critical error in loadData:", error);
      Alert.alert(tLang("common.error"), tLang("catalog.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = useMemo(() => {
    if (!selectedCity) return [];
    return shops.filter(shop => String(shop.sh_c_id) === String(selectedCity));
  }, [selectedCity, shops]);

  const itemsWithDiscounts = useMemo(() => {
    return items.map(item => {
      const { price, discount } = calculateDiscountedPrice(item.items, promotions, m2mChars);
      return {
        ...item,
        finalPrice: price,
        discountPercentage: discount,
      };
    });
  }, [items, promotions, m2mChars]);

  const totalSum = useMemo(() => {
    return itemsWithDiscounts.reduce((sum, item) => sum + item.finalPrice * item.ai_amount, 0);
  }, [itemsWithDiscounts]);

  const handlePlaceOrder = async () => {
    if (!selectedCity) {
      Alert.alert(tLang("common.error"), tLang("order.selectCity"));
      return;
    }
    if (!selectedShop) {
      Alert.alert(tLang("common.error"), tLang("order.selectShop"));
      return;
    }
    if (!selectedPayment) {
      Alert.alert(tLang("common.error"), tLang("order.selectPayment"));
      return;
    }

    setSubmitting(true);
    const orderData = {
      ord_acc_id: userProfile.acc_id,
      ord_sh_id: selectedShop,
      ord_pm_id: selectedPayment,
      ord_final_sum: totalSum,
      ord_st_id: 1, // Default storage or handle logic
    };

    const { error } = await createOrder(orderData, itemsWithDiscounts.map(i => ({ it_id: i.ai_it_id, amount: i.ai_amount, price: i.finalPrice })));

    if (error) {
      Alert.alert(tLang("common.error"), tLang("order.error"));
    } else {
      Alert.alert(tLang("common.success"), tLang("order.success"), [
        { text: "OK", onPress: () => {
          fetchCart(); // Update cart context
          router.replace("/(tabs)/basket");
        }}
      ]);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeObject.colors.background }]}>
        <ActivityIndicator size="large" color={themeObject.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeObject.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeObject.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeObject.colors.text }]}>{tLang("order.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CITY SELECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>{tLang("order.city")}</Text>
          <View style={[styles.pickerContainer, { backgroundColor: themeObject.colors.card, borderColor: themeObject.colors.border }]}>
            <Picker
              selectedValue={selectedCity}
              onValueChange={(itemValue) => {
                setSelectedCity(itemValue);
                setSelectedShop(null); // Reset shop when city changes
              }}
              style={{ color: themeObject.colors.text }}
              dropdownIconColor={themeObject.colors.primary}
            >
              <Picker.Item label={tLang("order.selectCity")} value={null} />
              {cities.map(city => (
                <Picker.Item key={city.c_id} label={city.c_name} value={city.c_id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* SHOP SELECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>{tLang("order.shop")}</Text>
          <View style={[styles.pickerContainer, { backgroundColor: themeObject.colors.card, borderColor: themeObject.colors.border, opacity: selectedCity ? 1 : 0.5 }]}>
            <Picker
              selectedValue={selectedShop}
              onValueChange={(itemValue) => setSelectedShop(itemValue)}
              style={{ color: themeObject.colors.text }}
              dropdownIconColor={themeObject.colors.primary}
              enabled={!!selectedCity}
            >
              <Picker.Item label={tLang("order.selectShop")} value={null} />
              {filteredShops.map(shop => (
                <Picker.Item 
                  key={shop.sh_id} 
                  label={shop.sh_address} 
                  value={shop.sh_id} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>{tLang("order.paymentMethod")}</Text>
          <View style={[styles.pickerContainer, { backgroundColor: themeObject.colors.card, borderColor: themeObject.colors.border }]}>
            <Picker
              selectedValue={selectedPayment}
              onValueChange={(itemValue) => setSelectedPayment(itemValue)}
              style={{ color: themeObject.colors.text }}
              dropdownIconColor={themeObject.colors.primary}
            >
              <Picker.Item label={tLang("order.selectPayment")} value={null} />
              {paymentMethods.map(pm => (
                <Picker.Item key={pm.pm_id} label={pm.pm_name} value={pm.pm_id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* ITEMS SUMMARY */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>{tLang("order.summary")}</Text>
          {itemsWithDiscounts.map(item => (
            <View key={item.ai_it_id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: themeObject.colors.text }}>{item.items.it_name}</Text>
                <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 12 }}>
                  {item.ai_amount} x {item.finalPrice.toFixed(2)} Br
                </Text>
              </View>
              <Text style={{ color: themeObject.colors.primary, fontWeight: 'bold' }}>
                {(item.ai_amount * item.finalPrice).toFixed(2)} Br
              </Text>
            </View>
          ))}
        </View>

        {/* TOTAL */}
        <View style={[styles.totalContainer, { borderTopColor: themeObject.colors.border }]}>
          <Text style={[styles.totalLabel, { color: themeObject.colors.text }]}>{tLang("order.total")}:</Text>
          <Text style={[styles.totalValue, { color: themeObject.colors.primary }]}>{totalSum.toFixed(2)} Br</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, { backgroundColor: themeObject.colors.primary }]}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>{tLang("order.placeOrder")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 50, 
    paddingBottom: 16,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 16, 
    borderTopWidth: 1,
    marginTop: 8
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  footer: { padding: 16, paddingBottom: 32 },
  placeOrderButton: { 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
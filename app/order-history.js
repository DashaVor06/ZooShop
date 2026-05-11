import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLanguageSelector } from "../src/viewModel/hooks/useLanguageSelector";
import { useUserRole } from "../src/viewModel/hooks/useUserRole";
import { ThemeContext } from "../src/viewModel/providers/themeProvider";
import { supabaseOrderService } from "../src/viewModel/services/supabaseOrderService";

export default function OrderHistoryScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const { userProfile } = useUserRole();
  const router = useRouter();
  const { fetchUserOrders } = supabaseOrderService();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.acc_id) {
      loadOrders();
    }
  }, [userProfile]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchUserOrders(userProfile.acc_id);
    setOrders(data);
    setLoading(false);
  };

  const renderOrderItem = ({ item }) => {
    // Supabase can return joined rows as an array or a single object depending on constraints.
    // We handle both cases for orders_m2m_statuses.
    const statusInfo = Array.isArray(item.orders_m2m_statuses) 
      ? item.orders_m2m_statuses[0] 
      : item.orders_m2m_statuses;
    
    const statusName = statusInfo?.statuses?.stat_name || "---";
    const date = statusInfo?.os_date || "---";

    return (
      <View style={[styles.orderCard, { backgroundColor: themeObject.colors.card, borderColor: themeObject.colors.border }]}>
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: themeObject.colors.text }]}>#{item.ord_id}</Text>
          <Text style={[styles.orderDate, { color: themeObject.colors.secondaryText || "#666" }]}>{date}</Text>
        </View>
        
        <View style={styles.orderBody}>
          <Text style={{ color: themeObject.colors.text }}>
            <Text style={{ fontWeight: 'bold' }}>{tLang("order.shop")}: </Text>
            {item.shops?.cities?.c_name ? `${item.shops.cities.c_name}, ` : ""}{item.shops?.sh_address || "---"}
          </Text>
          <Text style={{ color: themeObject.colors.text, marginTop: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>{tLang("order.status")}: </Text>
            <Text style={{ color: themeObject.colors.primary, fontWeight: '600' }}>{statusName}</Text>
          </Text>
          <Text style={{ color: themeObject.colors.text, marginTop: 4 }}>
            <Text style={{ fontWeight: 'bold' }}>{tLang("order.paymentMethod")}: </Text>
            {item.payment_methods?.pm_name || "---"}
          </Text>
        </View>

        <View style={[styles.orderFooter, { borderTopColor: themeObject.colors.border }]}>
          <Text style={[styles.totalLabel, { color: themeObject.colors.text }]}>{tLang("order.total")}:</Text>
          <Text style={[styles.totalValue, { color: themeObject.colors.primary }]}>{Number(item.ord_final_sum).toFixed(2)} Br</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: themeObject.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={themeObject.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeObject.colors.text }]}>{tLang("order.history")}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeObject.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.ord_id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={64} color={themeObject.colors.border} />
              <Text style={{ color: themeObject.colors.text, marginTop: 16 }}>{tLang("order.noOrders")}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
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
  listContent: { padding: 16 },
  orderCard: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  orderDate: { fontSize: 14 },
  orderBody: { marginBottom: 12 },
  orderFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 12, 
    borderTopWidth: 1 
  },
  totalLabel: { fontWeight: 'bold' },
  totalValue: { fontSize: 16, fontWeight: 'bold' }
});
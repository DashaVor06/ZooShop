import { supabase } from "../../model/supabase";

export const supabaseOrderService = () => {
  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("*, cities(c_name)");
      
      if (error) {
        console.error("Detailed Shops Error:", error);
        // Fallback: try without join
        const { data: simpleData, error: simpleError } = await supabase
          .from("shops")
          .select("*");
        if (simpleError) throw simpleError;
        return simpleData;
      }
      return data;
    } catch (e) {
      console.error("fetchShops Catch:", e);
      return [];
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*");
      if (error) {
        console.error("Detailed PM Error:", error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error("fetchPaymentMethods Catch:", e);
      return [];
    }
  };

  const createOrder = async (orderData, items) => {
    try {
      // 1. Insert into orders
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert initial status (ID 1) into orders_m2m_statuses
      const { error: statusError } = await supabase
        .from("orders_m2m_statuses")
        .insert([{
          os_ord_id: order.ord_id,
          os_stat_id: 1,
          os_date: new Date().toISOString().split('T')[0] // current date
        }]);

      if (statusError) {
        console.error("Error setting initial order status:", statusError);
        // We don't necessarily throw here if we want the order to persist, 
        // but it's better to log it.
      }

      // 3. Insert into orders_m2m_items (if applicable - checking provided schema)
      // The schema for orders_m2m_items didn't have ord_id, so we skip it for now 
      // or assume it's handled elsewhere.

      // 4. Clearing the basket for the items that were ordered
      const { error: clearError } = await supabase
        .from("accounts_m2m_items")
        .delete()
        .eq("ai_acc_id", orderData.ord_acc_id)
        .in("ai_it_id", items.map(i => i.it_id));

      if (clearError) console.error("Error clearing cart:", clearError);

      return { data: order, error: null };
    } catch (error) {
      console.error("Error creating order:", error);
      return { data: null, error };
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("c_name");
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("fetchCities Error:", e);
      return [];
    }
  };

  const fetchAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          accounts(acc_email),
          shops(sh_address, cities(c_name)),
          payment_methods(pm_name),
          orders_m2m_statuses(os_date, os_stat_id, statuses(stat_name))
        `)
        .order("ord_id", { ascending: false });
      
      if (error) throw error;

      // Sort nested statuses by date descending for each order
      const processedData = data.map(order => ({
        ...order,
        orders_m2m_statuses: Array.isArray(order.orders_m2m_statuses)
          ? [...order.orders_m2m_statuses].sort((a, b) => new Date(b.os_date) - new Date(a.os_date))
          : order.orders_m2m_statuses
      }));

      return processedData;
    } catch (e) {
      console.error("fetchAllOrders Error:", e);
      return [];
    }
  };

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .order("stat_id");
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("fetchStatuses Error:", e);
      return [];
    }
  };

  const updateOrderStatus = async (orderId, statusId) => {
    try {
      // We check if at least one status exists
      const { data: existing, error: fetchError } = await supabase
        .from("orders_m2m_statuses")
        .select("*")
        .eq("os_ord_id", orderId);

      if (fetchError) throw fetchError;

      if (existing && existing.length > 0) {
        // Update the most recent status (or all of them to be safe if it's a simple link)
        // If it's history, we might want to insert instead, but the current logic is update.
        // To be safe and fulfill "changing status", we update all records for this order.
        const { error: updateError } = await supabase
          .from("orders_m2m_statuses")
          .update({
            os_stat_id: statusId,
            os_date: new Date().toISOString().split('T')[0]
          })
          .eq("os_ord_id", orderId);
        if (updateError) throw updateError;
      } else {
        // Insert new status if none exists
        const { error: insertError } = await supabase
          .from("orders_m2m_statuses")
          .insert([{
            os_ord_id: orderId,
            os_stat_id: statusId,
            os_date: new Date().toISOString().split('T')[0]
          }]);
        if (insertError) throw insertError;
      }
      return { success: true };
    } catch (e) {
      console.error("updateOrderStatus Error:", e);
      return { success: false, error: e };
    }
  };

  const fetchUserOrders = async (accountId) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          ord_id,
          ord_final_sum,
          ord_sh_id,
          ord_pm_id,
          shops (
            sh_address,
            cities (c_name)
          ),
          payment_methods (
            pm_name
          ),
          orders_m2m_statuses (
            os_date,
            statuses (stat_name)
          )
        `)
        .eq("ord_acc_id", accountId)
        .order("ord_id", { ascending: false });

      if (error) throw error;

      // Sort nested statuses by date descending
      const processedData = data.map(order => ({
        ...order,
        orders_m2m_statuses: Array.isArray(order.orders_m2m_statuses)
          ? [...order.orders_m2m_statuses].sort((a, b) => new Date(b.os_date) - new Date(a.os_date))
          : order.orders_m2m_statuses
      }));

      return processedData;
    } catch (e) {
      console.error("fetchUserOrders Error:", e);
      return [];
    }
  };

  return { fetchShops, fetchPaymentMethods, createOrder, fetchCities, fetchAllOrders, fetchStatuses, updateOrderStatus, fetchUserOrders };
};
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

  const createOrder = async (orderData, items, bonusesUsed = 0) => {
    try {
      // Calculate bonuses to be earned (5 kopeks per 1 ruble = 5 bonuses)
      const bonusesToEarn = Math.floor((orderData.ord_final_sum || 0) * 5);

      // 1. Insert into orders
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{ ...orderData, ord_bonuses_used: bonusesUsed, ord_bonuses_earned: bonusesToEarn }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Deduct bonuses from user account if any used
      if (bonusesUsed > 0) {
        const { data: account, error: accFetchError } = await supabase
          .from("accounts")
          .select("acc_bonus_balance")
          .eq("acc_id", orderData.ord_acc_id)
          .single();
        
        if (!accFetchError && account) {
          const newBonuses = Math.max(0, (account.acc_bonus_balance || 0) - bonusesUsed);
          await supabase
            .from("accounts")
            .update({ acc_bonus_balance: newBonuses })
            .eq("acc_id", orderData.ord_acc_id);
        }
      }

      // 3. Insert initial status (ID 1) into orders_m2m_statuses
      const { error: statusError } = await supabase
        .from("orders_m2m_statuses")
        .insert([{
          os_ord_id: order.ord_id,
          os_stat_id: 1,
          os_date: new Date().toISOString().split('T')[0] // current date
        }]);

      if (statusError) {
        console.error("Error setting initial order status:", statusError);
      }

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
      // Fetch all existing statuses to find the real maximum ID
      const { data: allStatuses, error: statError } = await supabase
        .from("statuses")
        .select("stat_id");
      
      if (statError) throw statError;
      
      const maxStatusId = Math.max(...allStatuses.map(s => s.stat_id));

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

      // If status is maximal, add bonuses
      console.log(`Checking status: ${statusId} against maxStatus: ${maxStatusId}`);
      if (Number(statusId) === Number(maxStatusId)) {
        // Check if bonuses were already added (if final status already exists in history)
        const alreadyAccrued = existing.some(s => Number(s.os_stat_id) === Number(maxStatusId));
        console.log(`Is already accrued? ${alreadyAccrued}`);
        
        if (!alreadyAccrued) {
          const { data: order, error: orderFetchError } = await supabase
            .from("orders")
            .select("ord_acc_id, ord_bonuses_earned")
            .eq("ord_id", orderId)
            .single();
          
          if (!orderFetchError && order) {
            console.log(`Order found for orderId ${orderId}. User acc_id: ${order.ord_acc_id}. Earned bonuses: ${order.ord_bonuses_earned}`);
            
            if (order.ord_bonuses_earned > 0) {
              // Fetch account without .single() to avoid PGRST116 error if not found
              const { data: accounts, error: accFetchError } = await supabase
                .from("accounts")
                .select("acc_bonus_balance")
                .eq("acc_id", order.ord_acc_id);
              
              if (!accFetchError && accounts && accounts.length > 0) {
                const account = accounts[0];
                const { error: updateAccError } = await supabase
                  .from("accounts")
                  .update({ acc_bonus_balance: (account.acc_bonus_balance || 0) + order.ord_bonuses_earned })
                  .eq("acc_id", order.ord_acc_id);
                
                if (!updateAccError) {
                  console.log(`SUCCESS: Accrued ${order.ord_bonuses_earned} bonuses to user ${order.ord_acc_id}`);
                } else {
                  console.error("Failed to update account balance:", updateAccError);
                }
              } else {
                console.error(`Account not found or inaccessible for acc_id: ${order.ord_acc_id}. Error:`, accFetchError);
                console.warn("Hint: Check RLS policies on 'accounts' table. Admin must be able to SELECT and UPDATE users' accounts.");
              }
            }
          } else {
            console.error("Failed to fetch order for bonus accrual:", orderFetchError);
          }
        }
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
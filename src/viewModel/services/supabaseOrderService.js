import { supabase } from "../../model/supabase";

export const supabaseOrderService = () => {
  // Helper to parse 'POINT(lng lat)' into {lat, lng}
  const parsePoint = (pointStr) => {
    if (!pointStr) return { lat: null, lng: null };
    // Format is "POINT(longitude latitude)"
    const match = pointStr.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (match) {
      return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
    }
    return { lat: null, lng: null };
  };

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("*, cities(c_name)");
      
      if (error) throw error;
      
      return data.map(shop => ({
        ...shop,
        ...parsePoint(shop.sh_location)
      }));
    } catch (e) {
      console.error("fetchShops Error:", e);
      return [];
    }
  };

  const createShop = async (shopData) => {
    const { lat, lng, ...rest } = shopData;
    const payload = {
      ...rest,
      sh_location: lat && lng ? `POINT(${lng} ${lat})` : null
    };
    const { data, error } = await supabase.from("shops").insert([payload]).select().single();
    if (error) throw error;
    return data;
  };

  const updateShop = async (id, shopData) => {
    const { lat, lng, ...rest } = shopData;
    const payload = {
      ...rest,
      sh_location: lat && lng ? `POINT(${lng} ${lat})` : null
    };
    const { error } = await supabase.from("shops").update(payload).eq("sh_id", id);
    if (error) throw error;
    return { success: true };
  };

  const deleteShop = async (id) => {
    const { error } = await supabase.from("shops").delete().eq("sh_id", id);
    if (error) {
      if (error.code === '23503') {
        alert("Невозможно удалить магазин: на него ссылаются другие данные (например, заказы).");
      } else {
        alert(`Ошибка удаления: ${error.message}`);
      }
      throw error;
    }
    return { success: true };
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*");
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("fetchPaymentMethods Error:", e);
      return [];
    }
  };

  // Haversine formula to calculate distance between two points in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchStorages = async () => {
    try {
      const { data, error } = await supabase
        .from("storages")
        .select("*");
      if (error) throw error;
      return data.map(s => ({
        ...s,
        ...parsePoint(s.st_location)
      }));
    } catch (e) {
      console.error("fetchStorages Error:", e);
      return [];
    }
  };

  const createStorage = async (storageData) => {
    const { lat, lng, ...rest } = storageData;
    const payload = {
      ...rest,
      st_location: lat && lng ? `POINT(${lng} ${lat})` : null
    };
    const { data, error } = await supabase.from("storages").insert([payload]).select().single();
    if (error) throw error;
    return data;
  };

  const updateStorage = async (id, storageData) => {
    const { lat, lng, ...rest } = storageData;
    const payload = {
      ...rest,
      st_location: lat && lng ? `POINT(${lng} ${lat})` : null
    };
    const { error } = await supabase.from("storages").update(payload).eq("st_d", id);
    if (error) throw error;
    return { success: true };
  };

  const deleteStorage = async (id) => {
    const { error } = await supabase.from("storages").delete().eq("st_d", id);
    if (error) {
      if (error.code === '23503') {
        alert("Невозможно удалить склад: на нем числятся товары или он привязан к заказам.");
      } else {
        alert(`Ошибка удаления: ${error.message}`);
      }
      throw error;
    }
    return { success: true };
  };

  const createOrder = async (orderData, items, bonusesUsed = 0) => {
    try {
      // 1. Find the nearest storage for the selected shop that has ALL items
      const { data: shop, error: shopErr } = await supabase
        .from("shops")
        .select("sh_location")
        .eq("sh_id", orderData.ord_sh_id)
        .single();
      
      if (shopErr) throw shopErr;
      const shopCoords = parsePoint(shop.sh_location);

      // Fetch storages and their items
      const { data: storages, error: storErr } = await supabase
        .from("storages")
        .select("st_d, st_location");
      
      if (storErr) throw storErr;

      const { data: stockData, error: stockErr } = await supabase
        .from("storages_m2m_items")
        .select("si_it_id, si_st_id, si_amount");
      
      if (stockErr) {
        console.warn("Could not fetch stock data:", stockErr);
      }

      // 1. Фильтруем склады, на которых физически есть ВСЕ нужные товары в нужном количестве
      const validStorages = storages.filter(storage => {
        const storageItems = stockData 
          ? stockData.filter(s => String(s.si_st_id) === String(storage.st_d))
          : [];
        
        return items.every(neededItem => {
          const stock = storageItems.find(s => String(s.si_it_id) === String(neededItem.it_id));
          return stock && Number(stock.si_amount) >= Number(neededItem.amount);
        });
      });

      if (validStorages.length === 0) {
        throw new Error("Нет склада с достаточным количеством всех товаров для выполнения заказа.");
      }

      // 2. Из доступных складов выбираем ближайший (если есть координаты) или просто первый
      let selectedStorageId = validStorages[0].st_d;
      let minDistance = Infinity;

      if (shopCoords.lat && shopCoords.lng) {
        validStorages.forEach(storage => {
          const storCoords = parsePoint(storage.st_location);
          if (storCoords.lat && storCoords.lng) {
            const dist = calculateDistance(shopCoords.lat, shopCoords.lng, storCoords.lat, storCoords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              selectedStorageId = storage.st_d;
            }
          }
        });
      }

      const finalStorageId = selectedStorageId;

      // 2. Calculate bonuses to be earned (5% of final sum)
      const bonusesToEarn = Math.floor((orderData.ord_final_sum || 0) * 0.05 * 100); // 5% in bonus units

      // 3. Insert into orders
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{ 
          ...orderData, 
          ord_st_id: finalStorageId,
          ord_bonuses_used: bonusesUsed, 
          ord_bonuses_earned: bonusesToEarn,
          ord_items_sum: orderData.ord_final_sum + (bonusesUsed / 100)
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Insert items into orders_m2m_items
      const orderItemsToInsert = items.map(item => ({
        oi_ord_id: order.ord_id,
        oi_it_id: item.it_id,
        oi_amount: item.amount
      }));

      const { error: itemsError } = await supabase
        .from("orders_m2m_items")
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error("Error inserting order items:", itemsError);
        throw itemsError;
      }

      // ВЫЗОВ ФУНКЦИИ (RPC): Уменьшаем остатки на складе автоматически в БД
      const { error: stockError } = await supabase.rpc('reduce_storage_after_checkout', { 
        p_order_id: order.ord_id 
      });

      if (stockError) {
        console.error("Stock reduction error:", stockError);
        alert(`Ошибка списания остатков: ${stockError.message}`);
        throw stockError;
      }

      // 5. Deduct bonuses from user account if any used
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

      // 6. Insert initial status (ID 1) into orders_m2m_statuses
      const { error: statusError } = await supabase
        .from("orders_m2m_statuses")
        .insert([{
          os_ord_id: order.ord_id,
          os_stat_id: 1,
          os_date: new Date().toISOString()
        }]);

      if (statusError) {
        console.error("Error setting initial order status:", statusError);
      }

      // 7. Clearing the basket for the items that were ordered
      const { error: clearError } = await supabase
        .from("accounts_m2m_items")
        .delete()
        .eq("ai_acc_id", orderData.ord_acc_id)
        .in("ai_it_id", items.map(i => i.it_id));

      if (clearError) console.error("Error clearing cart:", clearError);

      return { data: order, error: null };
    } catch (error) {
      console.error("Error creating order:", error);
      alert(`Ошибка при формировании заказа: ${error.message}`);
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

  const createCity = async (cityName) => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .insert([{ c_name: cityName }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("createCity Error:", e);
      throw e;
    }
  };

  const fetchAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          accounts(acc_email),
          shops(sh_address, sh_location, cities(c_name)),
          payment_methods(pm_name),
          storages(st_d, st_address, st_location),
          orders_m2m_statuses(os_date, os_stat_id, statuses(stat_name)),
          orders_m2m_items(oi_amount, items(it_name, it_price))
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

  const updateOrderStorage = async (orderId, storageId) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ ord_st_id: storageId })
        .eq("ord_id", orderId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error("updateOrderStorage Error:", e);
      return { success: false, error: e };
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
      const { data: allStatuses, error: statError } = await supabase
        .from("statuses")
        .select("stat_id");
      
      if (statError) throw statError;
      
      const maxStatusId = Math.max(...allStatuses.map(s => s.stat_id));

      const { error: insertError } = await supabase
        .from("orders_m2m_statuses")
        .insert([{
          os_ord_id: orderId,
          os_stat_id: statusId,
          os_date: new Date().toISOString()
        }]);
      
      if (insertError) throw insertError;

      // Update current status in orders table too
      await supabase.from("orders").update({ ord_st_id: statusId }).eq("ord_id", orderId);

      if (Number(statusId) === Number(maxStatusId)) {
        const { error: bonusError } = await supabase.rpc('accrue_bonuses_after_success', { 
          p_order_id: orderId 
        });
        if (bonusError) {
          console.error("Bonus accrual error:", bonusError);
          alert(`Ошибка начисления бонусов: ${bonusError.message}`);
        }
      }

      return { success: true };
    } catch (e) {
      console.error("updateOrderStatus Error:", e);
      alert(`Ошибка обновления статуса: ${e.message}`);
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

  const cancelOrder = async (orderId) => {
    try {
      // Вызываем функцию RPC, которая теперь корректно реализована в БД
      const { error } = await supabase.rpc('cancel_order', { 
        p_order_id: orderId 
      });

      if (error) {
        alert(`Ошибка отмены заказа: ${error.message}`);
        throw error;
      }
      
      return { success: true };
    } catch (e) {
      console.error("Cancel order error:", e.message);
      throw e;
    }
  };

  const completeOrder = async (orderId) => {
    try {
      // 1. Устанавливаем финальный статус (например, 5 - Выполнен)
      const { error: statusError } = await supabase
        .from('orders')
        .update({ ord_st_id: 5 })
        .eq('ord_id', orderId);

      if (statusError) throw statusError;

      // 2. Добавляем запись в историю статусов
      await supabase.from('orders_m2m_statuses').insert([{
        os_ord_id: orderId,
        os_stat_id: 5,
        os_date: new Date().toISOString()
      }]);

      // 3. Начисляем бонусы через RPC функцию
      const { error: bonusError } = await supabase.rpc('accrue_bonuses_after_success', { 
        p_order_id: orderId 
      });

      if (bonusError) {
        alert(`Ошибка начисления бонусов: ${bonusError.message}`);
        throw bonusError;
      }

      return { success: true };
    } catch (e) {
      console.error("Complete order error:", e.message);
      alert(`Ошибка завершения заказа: ${e.message}`);
      throw e;
    }
  };

  return { 
    fetchShops, createShop, updateShop, deleteShop,
    fetchPaymentMethods, createOrder, fetchCities, createCity,
    fetchAllOrders, fetchStatuses, updateOrderStatus, 
    fetchUserOrders, fetchStorages, updateOrderStorage, 
    createStorage, updateStorage, deleteStorage,
    cancelOrder, completeOrder
  };
};
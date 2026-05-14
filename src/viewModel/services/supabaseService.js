import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteItemById,
  getItemById,
  getItems,
  insertItem,
  updateItemById
} from "../../model/itemModel";
import { supabase } from "../../model/supabase";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { imagekitService } from "./imagekitService";

export const supabaseService = (db) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  const { isConnected } = useNetworkStatus();
  const syncLock = useRef(false);

  const { uploadToImageKit, deleteImageFromImageKit } = imagekitService();

  const loadItems = useCallback(async () => {
    const cachedItems = await getItems(db);
    setItems(cachedItems.filter((i) => Number(i.it_deleted) !== 1));
    setLoading(false);
  }, [db]);

  // --- УМНЫЙ PULL: Строго игнорирует локально измененные данные ---
  const pullFromServer = useCallback(async () => {
    if (!isConnected || syncLock.current) return;
    try {
      const { data: serverItems, error } = await supabase.from("items").select("*");
      if (error) throw error;

      const localItems = await getItems(db);
      const localMap = new Map(localItems.map(i => [i.it_id.toString(), i]));

      for (const sItem of serverItems || []) {
        const local = localMap.get(sItem.it_id.toString());
        
        if (local && (Number(local.it_deleted) === 1 || Number(local.it_synced) === 0)) {
          continue; 
        }

        await insertItem(db, { ...sItem, it_synced: 1, it_deleted: 0 });
      }

      const serverIds = new Set(serverItems.map(i => i.it_id.toString()));
      for (const local of localItems) {
        if (!local.it_id.toString().startsWith("local_") && !serverIds.has(local.it_id.toString())) {
          if (Number(local.it_synced) === 1) {
            await deleteItemById(db, local.it_id);
          }
        }
      }
      await loadItems();
    } catch (e) {
      console.error("Pull error:", e);
    }
  }, [db, isConnected, loadItems]);

  // --- SYNC (PUSH + PULL) ---
  const syncWithServer = useCallback(async (targetStorageId = null, targetAmount = null) => {
    if (!isConnected || syncLock.current) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Current Sync User Session:", session?.user?.id || "No session");

    syncLock.current = true;
    setPendingSync(true);

    try {
      let localItems = await getItems(db);

      const toDelete = localItems.filter((i) => Number(i.it_deleted) === 1);
      for (const item of toDelete) {
        if (!item.it_id.toString().startsWith("local_")) {
          // Cleanup m2m storage before deleting item
          await supabase.from("storages_m2m_items").delete().eq("si_it_id", item.it_id);
          await supabase.from("items").delete().eq("it_id", item.it_id);
          if (item.it_image_file_id) await deleteImageFromImageKit(item.it_image_file_id).catch(() => {});
        }
        await deleteItemById(db, item.it_id);
      }

      localItems = await getItems(db);
      const toSync = localItems.filter(i => Number(i.it_synced) === 0 && Number(i.it_deleted) !== 1);

      for (const item of toSync) {
        try {
          let imageUrl = item.it_image_url;
          let fileId = item.it_image_file_id;

          if (imageUrl?.startsWith("file://")) {
            const uploaded = await uploadToImageKit(imageUrl);
            imageUrl = uploaded.url;
            fileId = uploaded.fileId;
          }

          const payload = {
            it_name: item.it_name,
            it_description: item.it_description,
            it_price: item.it_price,
            it_image_url: imageUrl,
            it_image_file_id: fileId,
            it_an_id: item.it_an_id,
            it_br_id: item.it_br_id
          };

          let finalItId = item.it_id;

          if (item.it_id.toString().startsWith("local_")) {
            console.log("Attempting insert for admin:", item.it_name);
            const { data, error, status } = await supabase.from("items").insert([payload]).select();
            
            if (error) throw error;
            
            if (data?.[0]) {
              finalItId = data[0].it_id;
              await deleteItemById(db, item.it_id);
              await insertItem(db, { ...item, it_id: finalItId, it_image_url: imageUrl, it_image_file_id: fileId, it_synced: 1 });
              console.log("Successfully synced & replaced local ID:", finalItId);
            }
          } else {
            const { error } = await supabase.from("items").update(payload).eq("it_id", item.it_id);
            if (error) {
              alert(`Ошибка обновления "${item.it_name}": ${error.message}`);
              throw error;
            }
            await updateItemById(db, { ...item, it_image_url: imageUrl, it_image_file_id: fileId, it_synced: 1 });
          }

          // Handle storage link if provided
          if (targetStorageId) {
            const amountToSave = targetAmount !== null ? parseInt(targetAmount) : 0;
            
            // First check if already exists
            const { data: existingStock } = await supabase
              .from("storages_m2m_items")
              .select("*")
              .eq("si_it_id", finalItId)
              .eq("si_st_id", targetStorageId);
            
            if (!existingStock || existingStock.length === 0) {
              await supabase
                .from("storages_m2m_items")
                .insert([{ 
                  si_it_id: finalItId, 
                  si_st_id: targetStorageId, 
                  si_amount: amountToSave 
                }]);
            } else {
              await supabase
                .from("storages_m2m_items")
                .update({ si_amount: amountToSave })
                .eq("si_it_id", finalItId)
                .eq("si_st_id", targetStorageId);
            }
          }
        } catch (itemError) {
          console.error(`Failed to sync item ${item.it_id}:`, itemError);
        }
      }

      syncLock.current = false;
      await pullFromServer();

    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      syncLock.current = false;
      setPendingSync(false);
      loadItems();
    }
  }, [isConnected, db, loadItems, uploadToImageKit, deleteImageFromImageKit, pullFromServer]);

  const fetchItemStorages = async (itemId) => {
    try {
      const { data, error } = await supabase
        .from("storages_m2m_items")
        .select("si_st_id, si_amount")
        .eq("si_it_id", itemId);
      if (error) throw error;
      return data.map(d => ({ st_id: d.si_st_id, amount: d.si_amount }));
    } catch (e) {
      console.error("fetchItemStorages Error:", e);
      return [];
    }
  };

  // --- REAL-TIME: Мгновенные обновления ---
  useEffect(() => {
    if (!isConnected) return;

    const channel = supabase
      .channel('realtime_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, async (payload) => {
        if (syncLock.current) return;

        if (payload.eventType === 'DELETE') {
          await deleteItemById(db, payload.old.it_id);
        } else {
          const local = await getItemById(db, payload.new.it_id);
          if (!local || (Number(local.it_synced) === 1 && Number(local.it_deleted) === 0)) {
            await insertItem(db, { ...payload.new, it_synced: 1, it_deleted: 0 });
          }
        }
        loadItems();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isConnected, db, loadItems]);

  useEffect(() => {
    if (isConnected) {
      syncWithServer();
    } else {
      loadItems();
    }
  }, [isConnected]);

  // --- Методы UI ---
  const addItem = async (item, storageId, amount) => {
    const newItem = { it_id: `local_${Date.now()}`, ...item, it_synced: 0, it_deleted: 0 };
    await insertItem(db, newItem);
    
    // If we have a storage selection, we might want to store it locally too or just push to supabase
    // For now, since local DB doesn't have m2m_storages, we'll rely on syncWithServer to handle it if possible.
    // Or we just pass it to syncWithServer.
    
    await loadItems();
    if (isConnected) syncWithServer(storageId, amount);
  };

  const updateItem = async (item, storageId, amount) => {
    await updateItemById(db, { ...item, it_synced: 0 });
    await loadItems();
    if (isConnected) syncWithServer(storageId, amount);
  };

  const deleteItem = async (id) => {
    const existing = await getItemById(db, id);
    if (!existing) return;
    await updateItemById(db, { ...existing, it_deleted: 1, it_synced: 0 });
    await loadItems();
    if (isConnected) syncWithServer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isConnected) await syncWithServer();
    else await loadItems();
    setRefreshing(false);
  }, [isConnected, syncWithServer, loadItems]);

  return { items, loading, refreshing, pendingSync, loadItems, onRefresh, addItem, updateItem, deleteItem, fetchItemStorages };
};
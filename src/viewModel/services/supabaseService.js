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
  const syncWithServer = useCallback(async () => {
    if (!isConnected || syncLock.current) return;
    syncLock.current = true;
    setPendingSync(true);

    try {
      let localItems = await getItems(db);

      const toDelete = localItems.filter((i) => Number(i.it_deleted) === 1);
      for (const item of toDelete) {
        if (!item.it_id.toString().startsWith("local_")) {
          await supabase.from("items").delete().eq("it_id", item.it_id);
          if (item.it_image_file_id) await deleteImageFromImageKit(item.it_image_file_id).catch(() => {});
        }
        await deleteItemById(db, item.it_id);
      }

      localItems = await getItems(db);
      const toSync = localItems.filter(i => Number(i.it_synced) === 0 && Number(i.it_deleted) !== 1);

      for (const item of toSync) {
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
          it_an_id: item.it_an_id
        };

        if (item.it_id.toString().startsWith("local_")) {
          const { data, error } = await supabase.from("items").insert([payload]).select();
          if (!error && data?.[0]) {
            await deleteItemById(db, item.it_id);
            await insertItem(db, { ...item, it_id: data[0].it_id, it_image_url: imageUrl, it_image_file_id: fileId, it_synced: 1 });
          }
        } else {
          const { error } = await supabase.from("items").update(payload).eq("it_id", item.it_id);
          if (!error) {
            await updateItemById(db, { ...item, it_image_url: imageUrl, it_image_file_id: fileId, it_synced: 1 });
          }
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
  const addItem = async (item) => {
    const newItem = { it_id: `local_${Date.now()}`, ...item, it_synced: 0, it_deleted: 0 };
    await insertItem(db, newItem);
    await loadItems();
    if (isConnected) syncWithServer();
  };

  const updateItem = async (item) => {
    await updateItemById(db, { ...item, it_synced: 0 });
    await loadItems();
    if (isConnected) syncWithServer();
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

  return { items, loading, refreshing, pendingSync, loadItems, onRefresh, addItem, updateItem, deleteItem };
};
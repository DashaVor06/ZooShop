import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearItems,
  deleteItemById,
  getItemById,
  getItems,
  insertItem,
  updateItemById,
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
  const wasOffline = useRef(false);

  const { uploadToImageKit, deleteImageFromImageKit } = imagekitService();

  const loadItems = useCallback(async () => {
    setLoading(true);
    const cachedItems = await getItems(db);
    setItems(cachedItems.filter((i) => Number(i.it_deleted) !== 1));
    setLoading(false);
  }, [db]);

  const pullFromServer = useCallback(async () => {
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;

      await clearItems(db);
      for (const item of data || []) {
        await insertItem(db, { 
          it_id: item.it_id,
          it_name: item.it_name,
          it_description: item.it_description,
          it_price: item.it_price,
          it_image_url: item.it_image_url,
          it_image_file_id: item.it_image_file_id,
          it_an_id: item.it_an_id,
          it_synced: 1,
          it_deleted: 0
        });
      }
      const updated = await getItems(db);
      setItems(updated.filter(i => Number(i.it_deleted) !== 1));
    } catch (e) {
      console.error("Pull error:", e);
    }
  }, [db, isConnected]);

  const pullAnimalsFromServer = useCallback(async () => {
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("animals").select("*");
      if (error) throw error;

      await db.runAsync('DELETE FROM animals;');
      for (const animal of data || []) {
        await db.runAsync(
          'INSERT INTO animals (an_id, an_name) VALUES (?, ?);',
          [animal.an_id, animal.an_name]
        );
      }
    } catch (e) {
      console.error("Pull animals error:", e);
    }
  }, [db, isConnected]);

  const syncWithServer = useCallback(async () => {
    if (!isConnected || syncLock.current) return;
    syncLock.current = true;
    setPendingSync(true);

    try {
      const localItems = await getItems(db);

      // Удаление помеченных на удаление
      const toDelete = localItems.filter((i) => Number(i.it_deleted) === 1);
      for (const item of toDelete) {
        if (!item.it_id.toString().startsWith("local_")) {
          const { error } = await supabase.from("items").delete().eq("it_id", item.it_id);
          if (!error) {
            if (item.it_image_file_id) {
              try { await deleteImageFromImageKit(item.it_image_file_id); } catch (e) { console.log("IK Delete fail", e); }
            }
          } else {
            continue;
          }
        }
        await deleteItemById(db, item.it_id);
      }

      // Получаем несинхронизированные элементы
      const unsynced = (await getItems(db)).filter(i => Number(i.it_synced) === 0 && Number(i.it_deleted) !== 1);

      for (const item of unsynced) {
        let imageUrl = item.it_image_url;
        let fileId = item.it_image_file_id;

        if (typeof imageUrl === "string" && imageUrl.startsWith("file://")) {
          try {
            const uploaded = await uploadToImageKit(imageUrl);
            imageUrl = uploaded.url;
            fileId = uploaded.fileId;
          } catch { 
            console.log("Upload to ImageKit failed");
            continue; 
          }
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
          // Вставка нового элемента на сервер
          const { data, error } = await supabase.from("items").insert([payload]).select();
          if (error || !data?.[0]) continue;

          // Удаляем локальную запись и создаем с серверным ID
          await deleteItemById(db, item.it_id);
          await insertItem(db, { 
            ...item, 
            it_id: data[0].it_id, 
            it_image_url: imageUrl, 
            it_image_file_id: fileId, 
            it_synced: 1,
            it_deleted: 0,
            it_an_id: item.it_an_id
          });
        } else {
          // Обновление существующего элемента
          const { error } = await supabase.from("items").update(payload).eq("it_id", item.it_id);
          if (!error) {
            await updateItemById(db, { 
              ...item, 
              it_image_url: imageUrl, 
              it_image_file_id: fileId, 
              it_an_id: item.it_an_id,
              it_synced: 1 
            });
          }
        }
      }
    } catch (e) {
      console.error("Sync Critical Error", e);
    } finally {
      syncLock.current = false;
      setPendingSync(false);
      loadItems();
    }
  }, [isConnected, db, loadItems, uploadToImageKit, deleteImageFromImageKit]);

  // addItem
  const addItem = async (item) => {
    await insertItem(db, { 
      it_id: `local_${Date.now()}`,
      it_name: item.it_name,
      it_description: item.it_description,
      it_price: item.it_price,
      it_image_url: item.it_image_url,
      it_image_file_id: item.it_image_file_id,
      it_an_id: item.it_an_id,
      it_synced: 0,
      it_deleted: 0
    });
    loadItems();
    if (isConnected) syncWithServer();
  };

  // updateItem
  const updateItem = async (item) => {
    const existing = await getItemById(db, item.it_id);
    await updateItemById(db, { 
      ...item, 
      it_synced: 0, 
      it_deleted: existing.it_deleted || 0
    });
    loadItems();
    if (isConnected) syncWithServer();
  };

  // deleteItem
  const deleteItem = async (id) => {
    const existing = await getItemById(db, id);
    await updateItemById(db, { 
      ...existing, 
      it_deleted: 1, 
      it_synced: 0 
    });
    loadItems();
    if (isConnected) syncWithServer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    if (isConnected) await syncWithServer();
    setRefreshing(false);
  }, [isConnected, loadItems, syncWithServer]);

  // Эффекты
  useEffect(() => {
    loadItems().then(() => { 
      if (isConnected) pullFromServer(); 
    });
  }, [loadItems, isConnected, pullFromServer]); // Добавлены зависимости

  useEffect(() => {
    if (isConnected && wasOffline.current) {
      syncWithServer().then(() => pullFromServer());
      wasOffline.current = false;
    } else if (!isConnected) {
      wasOffline.current = true;
    }
  }, [isConnected, syncWithServer, pullFromServer]); // Добавлен pullFromServer

  return { 
    items, 
    loading, 
    refreshing, 
    pendingSync, 
    loadItems, 
    onRefresh, 
    addItem, 
    updateItem, 
    deleteItem 
  };
};
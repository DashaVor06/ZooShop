import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearItems,
  deleteItemById,
  getItemById,
  getItems,
  insertItem,
  updateItemById,
} from "../../model/catalogModel";
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
    setItems(cachedItems.filter((i) => Number(i.deleted) !== 1));
    setLoading(false);
  }, [db]);

  const pullFromServer = useCallback(async () => {
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;

      await clearItems(db);
      for (const item of data || []) {
        await insertItem(db, { ...item, synced: 1, deleted: 0 });
      }
      const updated = await getItems(db);
      setItems(updated.filter(i => Number(i.deleted) !== 1));
    } catch (e) {
      console.error("Pull error:", e);
    }
  }, [db, isConnected]);

  const syncWithServer = useCallback(async () => {
    if (!isConnected || syncLock.current) return;
    syncLock.current = true;
    setPendingSync(true);

    try {
      const localItems = await getItems(db);

      const toDelete = localItems.filter((i) => Number(i.deleted) === 1);
      for (const item of toDelete) {
        if (!item.id.toString().startsWith("local_")) {
          const { error } = await supabase.from("items").delete().eq("id", item.id);
          if (!error) {
            if (item.image_file_id) {
              try { await deleteImageFromImageKit(item.image_file_id); } catch (e) { console.log("IK Delete fail", e); }
            }
          } else {
             continue;
          }
        }
        await deleteItemById(db, item.id);
      }

      const unsynced = (await getItems(db)).filter(i => Number(i.synced) === 0 && Number(i.deleted) !== 1);

      for (const item of unsynced) {
        let imageUrl = item.image_url;
        let fileId = item.image_file_id;

        if (typeof imageUrl === "string" && imageUrl.startsWith("file://")) {
          try {
            const uploaded = await uploadToImageKit(imageUrl);
            imageUrl = uploaded.url;
            fileId = uploaded.fileId;
          } catch { continue; }
        }

        const payload = {
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: imageUrl,
          image_file_id: fileId,
        };

        if (item.id.toString().startsWith("local_")) {
          const { data, error } = await supabase.from("items").insert([payload]).select();
          if (error || !data?.[0]) continue;

          await deleteItemById(db, item.id);
          await insertItem(db, { ...item, id: data[0].id, image_url: imageUrl, image_file_id: fileId, synced: 1 });
        } else {
          const { error } = await supabase.from("items").update(payload).eq("id", item.id);
          if (!error) {
            await updateItemById(db, { ...item, image_url: imageUrl, image_file_id: fileId, synced: 1 });
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
  }, [isConnected, db, loadItems]);

  useEffect(() => {
    loadItems().then(() => { if (isConnected) pullFromServer(); });
  }, []);

  useEffect(() => {
    if (isConnected && wasOffline.current) {
      syncWithServer().then(() => pullFromServer());
      wasOffline.current = false;
    } else if (!isConnected) {
      wasOffline.current = true;
    }
  }, [isConnected, syncWithServer, pullFromServer]);

  const addItem = async (item) => {
    await insertItem(db, { ...item, id: `local_${Date.now()}`, synced: 0, deleted: 0 });
    loadItems();
    if (isConnected) syncWithServer();
  };

  const updateItem = async (item) => {
    const existing = await getItemById(db, item.id);
    await updateItemById(db, { ...item, synced: 0, deleted: existing.deleted || 0 });
    loadItems();
    if (isConnected) syncWithServer();
  };

  const deleteItem = async (id) => {
    const existing = await getItemById(db, id);
    await updateItemById(db, { ...existing, deleted: 1, synced: 0 });
    loadItems();
    if (isConnected) syncWithServer();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    if (isConnected) await syncWithServer();
    setRefreshing(false);
  }, [isConnected, loadItems, syncWithServer]);

  return { items, loading, refreshing, pendingSync, loadItems, onRefresh, addItem, updateItem, deleteItem };
};
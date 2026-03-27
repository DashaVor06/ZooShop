import { useCallback, useEffect, useState } from "react";
import {
  deleteItemById,
  getItemById,
  getItems,
  insertItem,
  updateItemById,
} from "../../model/catalogModel";
import { supabase } from '../../model/supabase';
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const supabaseService = (db) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Загрузка из кэша при старте
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        setLoading(true);
        const localItems = await getItems(db);
        setItems(localItems);
      } catch (error) {
        console.error('Error loading from cache:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFromCache();
  }, [db]);

  // Синхронизация при появлении интернета
  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline]);

  const syncWithServer = async () => {
    try {
      setPendingSync(true);
      console.log('Syncing with server...');
      
      const { data: serverItems, error } = await supabase
        .from("items")
        .select("*");
      
      if (error) throw error;
      
      const localItems = await getItems(db);
      
      // Синхронизация: обновляем локальные данные из сервера
      for (const serverItem of serverItems) {
        const localItem = localItems.find(i => i.id === serverItem.id);
        
        if (!localItem) {
          // Товара нет в локальной БД - добавляем
          console.log('Adding new item from server:', serverItem.id);
          await insertItem(db, serverItem);
        } else if (localItem.updated_at < serverItem.updated_at) {
          // На сервере более новая версия - обновляем локальную
          console.log('Updating item from server:', serverItem.id);
          await updateItemById(db, serverItem);
        } else if (localItem.updated_at > serverItem.updated_at && !localItem.synced) {
          // В локальной БД есть несинхронизированные изменения - отправляем на сервер
          console.log('Sending local changes to server:', localItem.id);
          const { error: updateError } = await supabase
            .from("items")
            .update({
              name: localItem.name,
              description: localItem.description,
              price: localItem.price,
              image_url: localItem.image_url,
              image_file_id: localItem.image_file_id,
              updated_at: localItem.updated_at
            })
            .eq("id", localItem.id);
          
          if (!updateError) {
            await updateItemById(db, { ...localItem, synced: true });
          }
        }
      }
      
      // Проверяем, есть ли локальные товары, которых нет на сервере
      for (const localItem of localItems) {
        const serverItem = serverItems.find(s => s.id === localItem.id);
        if (!serverItem && localItem.synced) {
          // Товар удален на сервере - удаляем локально
          console.log('Removing item deleted on server:', localItem.id);
          await deleteItemById(db, localItem.id);
        }
      }
      
      const updatedLocalItems = await getItems(db);
      setItems(updatedLocalItems);
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setPendingSync(false);
    }
  };

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      
      // Загружаем из локальной БД
      const localItems = await getItems(db);
      setItems(localItems);
      
      // Если есть интернет, синхронизируем в фоне
      if (isOnline) {
        await syncWithServer();
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, db]);

  const addItem = async (item) => {
    try {
      const newItem = {
        ...item,
        id: Date.now().toString(), // Генерируем уникальный ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      };
      
      // Сначала сохраняем в локальную БД
      await insertItem(db, newItem);
      
      // Если есть интернет, отправляем на сервер
      if (isOnline) {
        const { data, error } = await supabase
          .from("items")
          .insert([{
            name: newItem.name,
            description: newItem.description,
            price: newItem.price,
            image_url: newItem.image_url,
            image_file_id: newItem.image_file_id
          }])
          .select();
        
        if (!error && data && data[0]) {
          // Удаляем старую запись с временным ID
          await deleteItemById(db, newItem.id);
          // Вставляем новую с ID от сервера
          await insertItem(db, {
            ...newItem,
            id: data[0].id,
            synced: true
          });
        }
      }
      
      // Обновляем состояние
      const updatedItems = await getItems(db);
      setItems(updatedItems);
    } catch (error) {
      console.error("Add error:", error);
      throw new Error("catalog.addError");
    }
  };

  const updateItem = async (item) => {
    try {
      // Проверяем существование товара
      const existingItem = await getItemById(db, item.id);
      if (!existingItem) {
        throw new Error("Item not found");
      }
      
      const updatedItem = {
        ...item,
        updated_at: new Date().toISOString(),
        synced: false
      };
      
      // Обновляем в локальной БД
      await updateItemById(db, updatedItem);
      
      // Если есть интернет, отправляем на сервер
      if (isOnline) {
        const { error } = await supabase
          .from("items")
          .update({
            name: updatedItem.name,
            description: updatedItem.description,
            price: updatedItem.price,
            image_url: updatedItem.image_url,
            image_file_id: updatedItem.image_file_id,
            updated_at: updatedItem.updated_at
          })
          .eq("id", updatedItem.id);
        
        if (!error) {
          await updateItemById(db, {
            ...updatedItem,
            synced: true
          });
        }
      }
      
      // Обновляем состояние
      const updatedItems = await getItems(db);
      setItems(updatedItems);
    } catch (error) {
      console.error("Update error:", error);
      throw new Error("catalog.updateError");
    }
  };

  const deleteItem = async (id) => {
    try {
      const itemToDelete = items.find(item => item.id === id);
      
      // Удаляем из локальной БД
      await deleteItemById(db, id);
      
      // Если есть интернет, удаляем на сервере
      if (isOnline && itemToDelete) {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", id);
        
        if (error) {
          console.error("Server delete error:", error);
        }
      }
      
      // Обновляем состояние
      const updatedItems = await getItems(db);
      setItems(updatedItems);
      return itemToDelete;
    } catch (error) {
      console.error("Delete error:", error);
      throw new Error("catalog.deleteError");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  return {
    items,
    loading,
    refreshing,
    pendingSync,
    loadItems,
    onRefresh,
    addItem,
    updateItem,
    deleteItem,
  };
};
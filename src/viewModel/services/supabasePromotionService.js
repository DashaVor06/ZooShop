import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../model/supabase";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { 
  getPromotions, 
  insertPromotion, 
  updatePromotionById, 
  deletePromotionById,
  clearPromotions
} from "../../model/promotionModel";

export const supabasePromotionService = (db) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetworkStatus();

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    const data = await getPromotions(db);
    setPromotions(data || []);
    setLoading(false);
  }, [db]);

  const pullPromotionsFromServer = useCallback(async () => {
    if (!isConnected || !db) return;
    try {
      const { data, error } = await supabase.from("promotions").select("*");
      if (error) throw error;
      
      // Очищаем и заполняем заново для синхронизации удалений
      await clearPromotions(db);
      
      if (data && data.length > 0) {
        for (const p of data) {
          await insertPromotion(db, p);
        }
      }
      
      // Всегда загружаем в стейт после попытки синхронизации
      const updated = await getPromotions(db);
      setPromotions(updated || []);
    } catch (e) {
      console.error("Pull promotions error:", e);
      // Если упало, хотя бы покажем что было в кэше
      const cached = await getPromotions(db);
      setPromotions(cached || []);
    } finally {
      setLoading(false);
    }
  }, [db, isConnected]);

  const addPromotion = useCallback(async (promoData) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");
      const { data, error } = await supabase
        .from("promotions")
        .insert(promoData)
        .select()
        .single();
      if (error) throw error;
      await insertPromotion(db, data);
      setPromotions((prev) => [...prev, data]);
      return data;
    } catch (e) {
      console.error("Add promotion error:", e);
      throw e;
    }
  }, [db, isConnected]);

  const updatePromotion = useCallback(async (promoData) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");
      const { data, error } = await supabase
        .from("promotions")
        .update(promoData)
        .eq("pr_id", promoData.pr_id)
        .select()
        .single();
      if (error) throw error;
      await updatePromotionById(db, data);
      setPromotions((prev) => prev.map(p => p.pr_id === data.pr_id ? data : p));
      return data;
    } catch (e) {
      console.error("Update promotion error:", e);
      throw e;
    }
  }, [db, isConnected]);

  const deletePromotion = useCallback(async (id) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");
      const { error } = await supabase.from("promotions").delete().eq("pr_id", id);
      if (error) throw error;
      await deletePromotionById(db, id);
      setPromotions((prev) => prev.filter(p => p.pr_id !== id));
    } catch (e) {
      console.error("Delete promotion error:", e);
      throw e;
    }
  }, [db, isConnected]);

  useEffect(() => {
    loadPromotions().then(() => {
      if (isConnected) pullPromotionsFromServer();
    });
  }, [loadPromotions, isConnected, pullPromotionsFromServer]);

  return { promotions, loading, addPromotion, updatePromotion, deletePromotion, loadPromotions };
};

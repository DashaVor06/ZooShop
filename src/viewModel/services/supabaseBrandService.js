import { useCallback, useEffect, useState } from "react";
import { clearBrands, getBrands, insertBrand } from "../../model/brandModel";
import { supabase } from "../../model/supabase";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const supabaseBrandService = (db) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetworkStatus();

  const loadBrands = useCallback(async () => {
    setLoading(true);
    const data = await getBrands(db);
    setBrands(data || []);
    setLoading(false);
  }, [db]);

  const pullBrandsFromServer = useCallback(async () => {
    if (!isConnected || !db) return;
    try {
      const { data, error } = await supabase.from("brands").select("*");
      if (error) throw error;
      
      await clearBrands(db);
      
      if (data && data.length > 0) {
        for (const b of data) {
          await insertBrand(db, { br_id: b.br_id, br_name: b.br_name });
        }
      }
      
      const updated = await getBrands(db);
      setBrands(updated || []);
    } catch (e) { 
      console.error("Pull brands error:", e);
      const cached = await getBrands(db);
      setBrands(cached || []);
    } finally {
      setLoading(false);
    }
  }, [db, isConnected]);

  
  const addBrand = useCallback(async (brandData) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");

      // 1. Вставляем в Supabase
      const { data, error } = await supabase
        .from("brands")
        .insert({ br_name: brandData.br_name })
        .select()
        .single();

      if (error) throw error;

      // 2. В локальную БД
      await insertBrand(db, {
        br_id: data.br_id,
        br_name: data.br_name,
      });

      // 3. В стейт
      setBrands((prev) => [...prev, data]);

      return data;
    } catch (e) {
      console.error("Add brand error:", e);
      throw e;
    }
  }, [db, isConnected]);

  const deleteBrand = useCallback(async (id) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");

      // Проверяем, есть ли товары этого бренда
      const { count, error: countError } = await supabase
        .from("items")
        .select("*", { count: 'exact', head: true })
        .eq("it_br_id", id);

      if (countError) throw countError;
      if (count > 0) {
        throw new Error("catalog.error_brand_has_items");
      }

      // Удаляем из Supabase
      const { error } = await supabase.from("brands").delete().eq("br_id", id);
      if (error) {
        if (error.code === '23503') {
          alert("Невозможно удалить бренд: он используется в товарах или акциях.");
        } else {
          alert(`Ошибка удаления: ${error.message}`);
        }
        throw error;
      }

      // Удаляем локально
      const { deleteBrandById } = require("../../model/brandModel");
      await deleteBrandById(db, id);

      // Обновляем стейт
      setBrands((prev) => prev.filter((b) => b.br_id !== id));
    } catch (e) {
      console.error("Delete brand error:", e);
      throw e;
    }
  }, [db, isConnected]);

  useEffect(() => { 
    loadBrands().then(() => isConnected && pullBrandsFromServer()); 
  }, [loadBrands, isConnected]);

  return { brands, loading, loadBrands, addBrand, deleteBrand };
};
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
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("brands").select("*");
      if (error) throw error;
      await clearBrands(db);
      for (const b of data || []) {
        await insertBrand(db, { br_id: b.br_id, br_name: b.br_name });
      }
      setBrands(await getBrands(db));
    } catch (e) { console.error("Pull brands error:", e); }
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

  useEffect(() => { 
    loadBrands().then(() => isConnected && pullBrandsFromServer()); 
  }, [loadBrands, isConnected]);

  return { brands, loading, loadBrands, addBrand };
};
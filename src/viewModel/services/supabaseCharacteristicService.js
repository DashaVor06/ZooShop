import { useCallback, useEffect, useState } from "react";
import {
  clearCharacteristicValues,
  clearM2MCharacteristics,
  getCharacteristicValues,
  getM2MCharacteristics,
  insertCharacteristicValue,
  insertM2MCharacteristic
} from "../../model/characteristicModel";
import { supabase } from "../../model/supabase";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const supabaseCharacteristicService = (db) => {
  const [characteristicValues, setCharacteristicValues] = useState([]);
  const [m2mCharacteristics, setM2mCharacteristics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNetworkStatus();

  const loadData = useCallback(async () => {
    setLoading(true);
    const cv = await getCharacteristicValues(db);
    const m2m = await getM2MCharacteristics(db);
    setCharacteristicValues(cv || []);
    setM2mCharacteristics(m2m || []);
    setLoading(false);
  }, [db]);

  const pullFromServer = useCallback(async () => {
    if (!isConnected || !db) return;
    try {
      const { data: cvData, error: cvError } = await supabase.from("characteristic_values").select("*");
      if (cvError) throw cvError;

      const { data: m2mData, error: m2mError } = await supabase.from("items_m2m_characteristic_values").select("*");
      if (m2mError) throw m2mError;

      await clearCharacteristicValues(db);
      if (cvData && cvData.length > 0) {
        for (const cv of cvData) {
          await insertCharacteristicValue(db, {
            cv_id: cv.cv_id,
            cv_value: cv.cv_value,
            cv_an_id: cv.cv_an_id
          });
        }
      }

      await clearM2MCharacteristics(db);
      if (m2mData && m2mData.length > 0) {
        for (const m2m of m2mData) {
          await insertM2MCharacteristic(db, {
            icv_id: m2m.icv_id,
            icv_it_id: m2m.icv_it_id,
            icv_cv_id: m2m.icv_cv_id
          });
        }
      }

      await loadData();
    } catch (e) {
      console.error("Pull characteristics error:", e);
      await loadData();
    }
  }, [db, isConnected, loadData]);

  const deleteSubcategory = useCallback(async (id) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");

      // Проверяем, есть ли товары с этой подкатегорией
      const { count, error: countError } = await supabase
        .from("items_m2m_characteristic_values")
        .select("*", { count: 'exact', head: true })
        .eq("icv_cv_id", id);

      if (countError) throw countError;
      if (count > 0) {
        throw new Error("catalog.error_subcategory_has_items");
      }

      // Удаляем из Supabase
      const { error } = await supabase.from("characteristic_values").delete().eq("cv_id", id);
      if (error) {
        if (error.code === '23503') {
          alert("Невозможно удалить характеристику: она привязана к товарам или акциям.");
        } else {
          alert(`Ошибка удаления: ${error.message}`);
        }
        throw error;
      }

      // Удаляем локально
      const { deleteCharacteristicValueById } = require("../../model/characteristicModel");
      await deleteCharacteristicValueById(db, id);

      // Обновляем стейт
      setCharacteristicValues((prev) => prev.filter((cv) => cv.cv_id !== id));
    } catch (e) {
      console.error("Delete subcategory error:", e);
      throw e;
    }
  }, [db, isConnected]);

  useEffect(() => {
    loadData().then(() => {
      if (isConnected) pullFromServer();
    });
  }, [loadData, isConnected, pullFromServer]);

  return { characteristicValues, m2mCharacteristics, loading, deleteSubcategory };
};

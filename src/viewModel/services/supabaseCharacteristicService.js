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
    if (!isConnected) return;
    try {
      const { data: cvData, error: cvError } = await supabase.from("characteristic_values").select("*");
      if (cvError) throw cvError;

      const { data: m2mData, error: m2mError } = await supabase.from("items_m2m_characteristic_values").select("*");
      if (m2mError) throw m2mError;

      await clearCharacteristicValues(db);
      for (const cv of cvData || []) {
        await insertCharacteristicValue(db, {
          cv_id: cv.cv_id,
          cv_value: cv.cv_value,
          cv_an_id: cv.cv_an_id
        });
      }

      await clearM2MCharacteristics(db);
      for (const m2m of m2mData || []) {
        await insertM2MCharacteristic(db, {
          icv_id: m2m.icv_id,
          icv_it_id: m2m.icv_it_id,
          icv_cv_id: m2m.icv_cv_id
        });
      }

      await loadData();
    } catch (e) {
      console.error("Pull characteristics error:", e);
    }
  }, [db, isConnected, loadData]);

  useEffect(() => {
    loadData().then(() => {
      if (isConnected) pullFromServer();
    });
  }, [loadData, isConnected, pullFromServer]);

  return { characteristicValues, m2mCharacteristics, loading };
};

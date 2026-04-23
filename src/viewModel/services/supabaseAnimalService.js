// src/viewModel/services/supabaseAnimalService.js
import { useCallback, useEffect, useState } from "react";
import {
    clearAnimals,
    getAnimals,
    insertAnimal
} from "../../model/animalModel";
import { supabase } from "../../model/supabase";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const supabaseAnimalService = (db) => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isConnected } = useNetworkStatus();

  const loadAnimals = useCallback(async () => {
    setLoading(true);
    const cachedAnimals = await getAnimals(db);
    setAnimals(cachedAnimals || []);
    setLoading(false);
  }, [db]);

  const pullAnimalsFromServer = useCallback(async () => {
    if (!isConnected) return;
    try {
      const { data, error } = await supabase.from("animals").select("*");
      if (error) throw error;

      await clearAnimals(db);
      for (const animal of data || []) {
        await insertAnimal(db, {
          an_id: animal.an_id,
          an_name: animal.an_name,
        });
      }
      const updated = await getAnimals(db);
      setAnimals(updated || []);
    } catch (e) {
      console.error("Pull animals error:", e);
    }
  }, [db, isConnected]);

  useEffect(() => {
    loadAnimals().then(() => {
      if (isConnected) pullAnimalsFromServer();
    });
  }, [loadAnimals, isConnected, pullAnimalsFromServer]);

  return { animals, loading, loadAnimals, pullAnimalsFromServer };
};
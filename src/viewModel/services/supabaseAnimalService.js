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
    if (!isConnected || !db) return;
    try {
      const { data, error } = await supabase.from("animals").select("*");
      if (error) throw error;

      await clearAnimals(db);
      if (data && data.length > 0) {
        for (const animal of data) {
          await insertAnimal(db, {
            an_id: animal.an_id,
            an_name: animal.an_name,
          });
        }
      }
      const updated = await getAnimals(db);
      setAnimals(updated || []);
    } catch (e) {
      console.error("Pull animals error:", e);
      const cached = await getAnimals(db);
      setAnimals(cached || []);
    } finally {
      setLoading(false);
    }
  }, [db, isConnected]);

  const addAnimal = useCallback(async (animalData) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");

      // 1. Отправляем в Supabase
      const { data, error } = await supabase
        .from("animals")
        .insert({ an_name: animalData.an_name })
        .select()
        .single();

      if (error) throw error;

      // 2. Сохраняем в локальную SQLite
      await insertAnimal(db, {
        an_id: data.an_id,
        an_name: data.an_name,
      });

      // 3. Обновляем локальный стейт, чтобы UI перерендерился
      setAnimals((prev) => [...prev, data]);

      return data; // Возвращаем созданный объект (там будет новый an_id)
    } catch (e) {
      console.error("Add animal error:", e);
      throw e;
    }
  }, [db, isConnected]);

  const deleteAnimal = useCallback(async (id) => {
    try {
      if (!isConnected) throw new Error("network.error_offline");

      // Проверяем, есть ли товары в этой категории
      const { count, error: countError } = await supabase
        .from("items")
        .select("*", { count: 'exact', head: true })
        .eq("it_an_id", id);

      if (countError) throw countError;
      if (count > 0) {
        throw new Error("catalog.error_category_has_items");
      }

      // Удаляем из Supabase
      const { error } = await supabase.from("animals").delete().eq("an_id", id);
      if (error) throw error;

      // Удаляем локально
      const { deleteAnimalById } = require("../../model/animalModel");
      await deleteAnimalById(db, id);

      // Обновляем стейт
      setAnimals((prev) => prev.filter((a) => a.an_id !== id));
    } catch (e) {
      console.error("Delete animal error:", e);
      throw e;
    }
  }, [db, isConnected]);

  useEffect(() => {
    loadAnimals().then(() => {
      if (isConnected) pullAnimalsFromServer();
    });
  }, [loadAnimals, isConnected, pullAnimalsFromServer]);

  return { animals, loading, loadAnimals, pullAnimalsFromServer, addAnimal, deleteAnimal };
};
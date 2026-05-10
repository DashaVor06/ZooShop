import { useEffect, useState } from 'react';
import { supabase } from '../../model/supabase';

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState(null); // { id: '...', role_id: '...' }
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('accounts') // Ваша таблица
        .select('acc_id, acc_r_id')
        .eq('acc_id', userId)
        .single();
      
      if (data) setUserProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Получаем текущего пользователя
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Слушаем изменения (логин/логаут)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userProfile, loading };
};
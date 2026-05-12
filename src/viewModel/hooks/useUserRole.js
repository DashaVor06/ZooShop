import { useEffect, useState } from 'react';
import { supabase } from '../../model/supabase';

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('accounts') 
        .select('acc_id, acc_r_id, acc_bonus_balance')
        .eq('acc_id', userId)
        .single();
      
      if (data) {
        setUserProfile(data);
        // Assuming role ID 1 is Administrator
        setIsAdmin(data.acc_r_id === 1);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check current session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userProfile, isAdmin, loading };
};
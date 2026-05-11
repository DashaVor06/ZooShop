import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    EXPO_PUBLIC_SUPABASE_KEY,
    EXPO_PUBLIC_SUPABASE_URL
} from '@env';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
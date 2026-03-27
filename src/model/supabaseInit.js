import { initialItems } from './initialItems';
import { supabase } from './supabase';

export const initializeSupabase = async () => {
  try {
    const { data: items, error, count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: false });
    
    if (error) {
      return false;
    }

    if (!items || items.length === 0) {      
      const itemsToInsert = initialItems.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        image_file_id: item.image_file_id || null
      }));
      
      const { data: insertedData, error: insertError } = await supabase
        .from('items')
        .insert(itemsToInsert)
        .select();
      
      if (insertError) {
        return false;
      }
      
      return true;
    } 
    else {
      return true;
    }
  } 
  catch (error) {
    return false;
  }
};
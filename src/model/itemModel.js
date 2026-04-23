export const insertItem = async (db, item) => {
  const existing = await db.getAllAsync('SELECT * FROM items WHERE it_id = ?', item.it_id);
  
  if (existing && existing.length > 0) {
    await updateItemById(db, item);
  } else {
    await db.runAsync(
      'INSERT INTO items (it_id, it_name, it_description, it_price, it_image_url, it_image_file_id, it_synced, it_deleted, it_an_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      item.it_id,
      item.it_name,
      item.it_description,
      item.it_price,
      item.it_image_url,
      item.it_image_file_id,
      item.it_synced ? 1 : 0,
      item.it_deleted ? 1 : 0,
      item.it_an_id
    );
  }
};

export const updateItemById = async (db, item) => {
  await db.runAsync(
    'UPDATE items SET it_name = ?, it_description = ?, it_price = ?, it_image_url = ?, it_image_file_id = ?, it_synced = ?, it_deleted = ?, it_an_id = ? WHERE it_id = ?',
    item.it_name,
    item.it_description,
    item.it_price,
    item.it_image_url,
    item.it_image_file_id,
    item.it_synced ? 1 : 0,
    item.it_deleted ? 1 : 0,
    item.it_an_id,
    item.it_id
  );
};

export const deleteItemById = async (db, id) => {
  await db.runAsync('DELETE FROM items WHERE it_id = ?', id);
};

export const getItems = async (db) => {
  const result = await db.getAllAsync('SELECT * FROM items ORDER BY it_id DESC');
  return result;
};

export const getItemById = async (db, id) => {
  const result = await db.getAllAsync('SELECT * FROM items WHERE it_id = ?', id);
  return result[0];
};

export const clearItems = async (db) => {
  try {
    await db.runAsync("DELETE FROM items");
  } catch (error) {
    console.error("Error clearing items:", error);
    throw error;
  }
};
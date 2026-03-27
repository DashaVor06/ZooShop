export const insertItem = async (db, item) => {
  const existing = await db.getAllAsync('SELECT * FROM items WHERE id = ?', item.id);
  
  if (existing && existing.length > 0) {
    await updateItemById(db, item);
  } else {
    await db.runAsync(
      'INSERT INTO items (id, name, description, price, image_url, image_file_id, created_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      item.id,
      item.name,
      item.description,
      item.price,
      item.image_url,
      item.image_file_id,
      item.created_at || new Date().toISOString(),
      item.updated_at || new Date().toISOString(),
      item.synced ? 1 : 0
    );
  }
};

export const updateItemById = async (db, item) => {
  await db.runAsync(
    'UPDATE items SET name = ?, description = ?, price = ?, image_url = ?, image_file_id = ?, updated_at = ?, synced = ? WHERE id = ?',
    item.name,
    item.description,
    item.price,
    item.image_url,
    item.image_file_id,
    item.updated_at || new Date().toISOString(),
    item.synced ? 1 : 0,
    item.id
  );
};

export const deleteItemById = async (db, id) => {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
};

export const getItems = async (db) => {
  const result = await db.getAllAsync('SELECT * FROM items ORDER BY created_at DESC');
  return result;
};

export const getItemById = async (db, id) => {
  const result = await db.getAllAsync('SELECT * FROM items WHERE id = ?', id);
  return result[0];
};
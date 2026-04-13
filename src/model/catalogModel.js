export const insertItem = async (db, item) => {
  const existing = await db.getAllAsync('SELECT * FROM items WHERE id = ?', item.id);
  
  if (existing && existing.length > 0) {
    await updateItemById(db, item);
  } else {
    await db.runAsync(
      'INSERT INTO items (id, name, description, price, image_url, image_file_id, synced, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      item.id,
      item.name,
      item.description,
      item.price,
      item.image_url,
      item.image_file_id,
      item.synced ? 1 : 0,
      item.deleted ? 1 : 0
    );
  }
};

export const updateItemById = async (db, item) => {
  await db.runAsync(
    'UPDATE items SET name = ?, description = ?, price = ?, image_url = ?, image_file_id = ?, synced = ?, deleted = ? WHERE id = ?',
    item.name,
    item.description,
    item.price,
    item.image_url,
    item.image_file_id,
    item.synced ? 1 : 0,
    item.deleted ? 1 : 0,
    item.id
  );
};

export const deleteItemById = async (db, id) => {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
};

export const getItems = async (db) => {
  const result = await db.getAllAsync('SELECT * FROM items ORDER BY id DESC');
  return result;
};

export const getItemById = async (db, id) => {
  const result = await db.getAllAsync('SELECT * FROM items WHERE id = ?', id);
  return result[0];
};

export const clearItems = async (db) => {
  await db.runAsync("DELETE FROM items");
};
export const getBrands = async (db) => {
  return await db.getAllAsync('SELECT br_id, br_name FROM brands ORDER BY br_name ASC;');
};

export const clearBrands = async (db) => {
  await db.runAsync('DELETE FROM brands;');
};

export const deleteBrandById = async (db, id) => {
  await db.runAsync('DELETE FROM brands WHERE br_id = ?;', [id]);
};

export const insertBrand = async (db, brand) => {
  await db.runAsync('INSERT OR REPLACE INTO brands (br_id, br_name) VALUES (?, ?);', [brand.br_id, brand.br_name]);
};
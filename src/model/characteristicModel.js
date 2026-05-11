export const getCharacteristicValues = async (db) => {
  return await db.getAllAsync('SELECT * FROM characteristic_values ORDER BY cv_value ASC;');
};

export const clearCharacteristicValues = async (db) => {
  await db.runAsync('DELETE FROM characteristic_values;');
};

export const insertCharacteristicValue = async (db, cv) => {
  await db.runAsync(
    'INSERT INTO characteristic_values (cv_id, cv_value, cv_an_id) VALUES (?, ?, ?);',
    [cv.cv_id, cv.cv_value, cv.cv_an_id]
  );
};

export const getM2MCharacteristics = async (db) => {
  return await db.getAllAsync('SELECT * FROM items_m2m_characteristic_values;');
};

export const clearM2MCharacteristics = async (db) => {
  await db.runAsync('DELETE FROM items_m2m_characteristic_values;');
};

export const insertM2MCharacteristic = async (db, m2m) => {
  await db.runAsync(
    'INSERT INTO items_m2m_characteristic_values (icv_id, icv_it_id, icv_cv_id) VALUES (?, ?, ?);',
    [m2m.icv_id, m2m.icv_it_id, m2m.icv_cv_id]
  );
};

export const getAnimals = async (db) => {
  try {
    if (!db) {
      return [];
    }  
    const result = await db.getAllAsync('SELECT an_id, an_name FROM animals ORDER BY an_name ASC;');
    return result || [];
  } catch (error) {
    console.error('Error in getAnimals:', error);
    return [];
  }
};

export const clearAnimals = async (db) => {
  try {
    await db.runAsync('DELETE FROM animals;');
  } catch (error) {
    console.error('Error clearing animals:', error);
  }
};

export const insertAnimal = async (db, animal) => {
  try {
    const result = await db.runAsync(
      'INSERT OR REPLACE INTO animals (an_id, an_name) VALUES (?, ?);',
      [animal.an_id, animal.an_name]
    );
    return result;
  } catch (error) {
    console.error('Error inserting animal:', error);
    throw error;
  }
};

export const updateAnimalById = async (db, animal) => {
  try {
    const result = await db.runAsync(
      'UPDATE animals SET an_name = ? WHERE an_id = ?;',
      [animal.an_name, animal.an_id]
    );
    return result;
  } catch (error) {
    console.error('Error updating animal:', error);
    throw error;
  }
};

export const getAnimalById = async (db, id) => {
  try {
    const result = await db.getAllAsync('SELECT * FROM animals WHERE an_id = ?;', [id]);
    return result?.[0] || null;
  } catch (error) {
    console.error('Error in getAnimalById:', error);
    return null;
  }
};

export const deleteAnimalById = async (db, id) => {
  try {
    await db.runAsync('DELETE FROM animals WHERE an_id = ?;', [id]);
  } catch (error) {
    console.error('Error deleting animal:', error);
    throw error;
  }
};

export const initAnimalsTable = async (db) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS animals (
        an_id INTEGER PRIMARY KEY,
        an_name TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('Error initializing animals table:', error);
  }
};
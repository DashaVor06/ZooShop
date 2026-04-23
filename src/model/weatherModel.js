export const saveWeatherCache = async (db, data) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO weather_cache (id, temp, description, icon, city, timestamp) VALUES (1, ?, ?, ?, ?, ?)',
    [data.temp, data.description, data.icon, data.city, Date.now()]
  );
};

export const getWeatherCache = async (db) => {
  return await db.getFirstAsync('SELECT * FROM weather_cache WHERE id = 1');
};
export async function migrateDbIfNeeded(db) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    
    CREATE TABLE IF NOT EXISTS items (
      it_id TEXT PRIMARY KEY,
      it_name TEXT NOT NULL, 
      it_description TEXT NOT NULL, 
      it_price DECIMAL(10,2), 
      it_image_url TEXT,
      it_image_file_id TEXT,
      it_synced INTEGER DEFAULT 0,
      it_deleted INTEGER DEFAULT 0,
      it_an_id TEXT
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS animals (
      an_id TEXT PRIMARY KEY,
      an_name TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      temp REAL,
      description TEXT,
      icon TEXT,
      city TEXT,
      timestamp INTEGER
    );
  `);
}
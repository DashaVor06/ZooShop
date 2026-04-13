export async function migrateDbIfNeeded(db) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL, 
      description TEXT NOT NULL, 
      price DECIMAL(10,2), 
      image_url TEXT,
      image_file_id TEXT,
      synced INTEGER DEFAULT 0
    );
  `);

  try {
    const columns = await db.getAllAsync('PRAGMA table_info(items)');
    const columnNames = columns.map(col => col.name);
    
    const columnsToAdd = [];
    if (!columnNames.includes('synced')) columnsToAdd.push('synced INTEGER DEFAULT 0');
    if (!columnNames.includes('deleted')) columnsToAdd.push('deleted INTEGER DEFAULT 0');
    
    for (const colDef of columnsToAdd) {
      await db.execAsync(`ALTER TABLE items ADD COLUMN ${colDef};`);
    }
  } 
  catch (error) {
    console.error('Error adding columns:', error);
  } 
}
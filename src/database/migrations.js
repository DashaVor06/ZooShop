import { initialItems } from "./initials";

export async function migrateDbIfNeeded(db) {
  await db.execAsync(`
    PRAGMA journal_mode = 'wal';
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL, 
      description TEXT NOT NULL, 
      price DECIMAL(10,2), 
      picture TEXT
    );
  `);

  const result = await db.getAllAsync('SELECT count(*) as count FROM items');

  if (result[0].count === 0) {
    for (const item of initialItems) {
      await db.runAsync(
        'INSERT INTO items (name, description, price, picture) VALUES (?, ?, ?, ?)', 
        item.name, 
        item.description,
        item.price,
        item.picture
      );
    }  
  }
}

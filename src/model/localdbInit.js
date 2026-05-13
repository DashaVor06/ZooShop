export async function migrateDbIfNeeded(db) {
  await db.execAsync(`
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
  
  const tableInfo = await db.getAllAsync("PRAGMA table_info(items);");
  const hasBrIdColumn = tableInfo.some(column => column.name === 'it_br_id');
  
  if (!hasBrIdColumn) {
    await db.execAsync(`ALTER TABLE items ADD COLUMN it_br_id TEXT;`);
  }

  // Создание таблицы брендов
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS brands (
      br_id TEXT PRIMARY KEY,
      br_name TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS animals (
      an_id TEXT PRIMARY KEY,
      an_name TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS characteristic_values (
      cv_id TEXT PRIMARY KEY,
      cv_value TEXT NOT NULL,
      cv_an_id TEXT
    );
  `);

  const cvTableInfo = await db.getAllAsync("PRAGMA table_info(characteristic_values);");
  const hasCvValueColumn = cvTableInfo.some(column => column.name === 'cv_value');
  const hasCvAnIdColumn = cvTableInfo.some(column => column.name === 'cv_an_id');

  if (!hasCvValueColumn) {
    // Если таблицы еще нет или в ней старая колонка cv_name
    const hasCvName = cvTableInfo.some(column => column.name === 'cv_name');
    if (hasCvName) {
      await db.execAsync(`ALTER TABLE characteristic_values RENAME COLUMN cv_name TO cv_value;`);
    } else {
      await db.execAsync(`ALTER TABLE characteristic_values ADD COLUMN cv_value TEXT NOT NULL DEFAULT '';`);
    }
  }

  if (!hasCvAnIdColumn) {
    await db.execAsync(`ALTER TABLE characteristic_values ADD COLUMN cv_an_id TEXT;`);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items_m2m_characteristic_values (
      icv_id TEXT PRIMARY KEY,
      icv_it_id TEXT,
      icv_cv_id TEXT
    );
  `);

  const m2mTableInfo = await db.getAllAsync("PRAGMA table_info(items_m2m_characteristic_values);");
  const hasIcvItId = m2mTableInfo.some(column => column.name === 'icv_it_id');

  if (!hasIcvItId) {
    // Если таблица была создана со старыми именами m2m_it_id, удалим и пересоздадим (так как данных там мало и они синхронизируются)
    await db.execAsync(`DROP TABLE IF EXISTS items_m2m_characteristic_values;`);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items_m2m_characteristic_values (
        icv_id TEXT PRIMARY KEY,
        icv_it_id TEXT,
        icv_cv_id TEXT
      );
      `);
      }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS promotions (
      pr_id INTEGER PRIMARY KEY,
      pr_start_date TEXT NOT NULL,
      pr_end_date TEXT,
      pr_discount_percentage INTEGER,
      pr_cv_id INTEGER,
      pr_br_id INTEGER,
      pr_an_id INTEGER
    );
  `);

  const promoTableInfo = await db.getAllAsync("PRAGMA table_info(promotions);");
  const hasPrAnIdColumn = promoTableInfo.some(column => column.name === 'pr_an_id');
  if (!hasPrAnIdColumn) {
    await db.execAsync(`ALTER TABLE promotions ADD COLUMN pr_an_id INTEGER;`);
  }
}
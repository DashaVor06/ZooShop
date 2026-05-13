export const getPromotions = async (db) => {
  return await db.getAllAsync('SELECT * FROM promotions;');
};

export const insertPromotion = async (db, promotion) => {
  await db.runAsync(
    'INSERT OR REPLACE INTO promotions (pr_id, pr_start_date, pr_end_date, pr_discount_percentage, pr_cv_id, pr_br_id, pr_an_id) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [promotion.pr_id, promotion.pr_start_date, promotion.pr_end_date, promotion.pr_discount_percentage, promotion.pr_cv_id, promotion.pr_br_id, promotion.pr_an_id]
  );
};

export const updatePromotionById = async (db, promotion) => {
  await db.runAsync(
    'UPDATE promotions SET pr_start_date = ?, pr_end_date = ?, pr_discount_percentage = ?, pr_cv_id = ?, pr_br_id = ?, pr_an_id = ? WHERE pr_id = ?;',
    [promotion.pr_start_date, promotion.pr_end_date, promotion.pr_discount_percentage, promotion.pr_cv_id, promotion.pr_br_id, promotion.pr_an_id, promotion.pr_id]
  );
};

export const deletePromotionById = async (db, id) => {
  await db.runAsync('DELETE FROM promotions WHERE pr_id = ?;', [id]);
};

export const clearPromotions = async (db) => {
  await db.runAsync('DELETE FROM promotions;');
};

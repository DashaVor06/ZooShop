export const calculateDiscountedPrice = (item, promotions, m2mCharacteristics) => {
  if (!promotions || promotions.length === 0) return { price: item.it_price, discount: 0 };
  
  const now = new Date();
  
  const suitablePromos = promotions.filter(p => {
    const start = new Date(p.pr_start_date);
    const end = p.pr_end_date ? new Date(p.pr_end_date) : null;
    
    if (now < start || (end && now > end)) return false;
    
    const brandMatch = p.pr_br_id ? String(p.pr_br_id) === String(item.it_br_id) : true;
    const animalMatch = p.pr_an_id ? String(p.pr_an_id) === String(item.it_an_id) : true;
    
    let subcatMatch = true;
    if (p.pr_cv_id) {
      subcatMatch = (m2mCharacteristics || [])
        .some(m => String(m.icv_it_id) === String(item.it_id) && String(m.icv_cv_id) === String(p.pr_cv_id));
    }
    
    return brandMatch && animalMatch && subcatMatch;
  });

  if (suitablePromos.length === 0) return { price: item.it_price, discount: 0 };
  
  const bestPromo = suitablePromos.reduce((prev, current) => 
    (prev.pr_discount_percentage > current.pr_discount_percentage) ? prev : current
  );

  return {
    price: item.it_price * (1 - bestPromo.pr_discount_percentage / 100),
    discount: bestPromo.pr_discount_percentage,
    promoId: bestPromo.pr_id
  };
};
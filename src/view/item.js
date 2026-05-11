import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Alert, Image, Share, Text, TouchableOpacity, View } from "react-native";
import { useCart } from "../viewModel/providers/cartProvider";
import { styles } from "./catalogStyles";

export const RenderItem = (props) => {
  const { 
    item, themeObject, tLang, openEditModal, confirmDelete, 
    animalsList, brandsList, promotions, m2mCharacteristics, isAdmin, onPress, userId 
  } = props;
    
  const { cart, updateCartItem } = useCart();
  
  const cartItem = cart?.find(c => Number(c.ai_it_id) === Number(item.it_id));

  // --- ЛОГИКА СКИДОК ---
  const activePromo = useMemo(() => {
    if (!promotions || promotions.length === 0) return null;
    const now = new Date();
    
    // Ищем подходящие акции
    const suitablePromos = promotions.filter(p => {
      const start = new Date(p.pr_start_date);
      const end = p.pr_end_date ? new Date(p.pr_end_date) : null;
      
      if (now < start || (end && now > end)) return false;
      
      // Проверка на соответствие бренду
      const brandMatch = p.pr_br_id ? String(p.pr_br_id) === String(item.it_br_id) : true;
      
      // Проверка на соответствие подкатегории (через M2M)
      let subcatMatch = true;
      if (p.pr_cv_id) {
        subcatMatch = (m2mCharacteristics || [])
          .some(m => String(m.icv_it_id) === String(item.it_id) && String(m.icv_cv_id) === String(p.pr_cv_id));
      }
      
      return brandMatch && subcatMatch;
    });

    // Берем максимальную скидку
    if (suitablePromos.length === 0) return null;
    return suitablePromos.reduce((prev, current) => 
      (prev.pr_discount_percentage > current.pr_discount_percentage) ? prev : current
    );
  }, [item, promotions, m2mCharacteristics]);

  const discountedPrice = activePromo 
    ? item.it_price * (1 - activePromo.pr_discount_percentage / 100) 
    : item.it_price;

  const handleUpdateCart = async (amount) => {
    if (!userId) { Alert.alert("Ошибка", "Авторизуйтесь"); return; }
    await updateCartItem(item.it_id, amount);
  };

  const handleShare = async () => {
    try {
      const categoryName = animalsList.find(a => a.an_id === item.it_an_id)?.an_name || '---';
      const priceText = activePromo 
        ? `${discountedPrice.toFixed(2)} Br (Скидка ${activePromo.pr_discount_percentage}%)` 
        : `${Number(item.it_price).toFixed(2)} Br`;
      const message = `${categoryName} - ${item.it_name}\n\n${item.it_description}\n\nЦена: ${priceText}`;
      await Share.share({ message, title: item.it_name });
    } catch (error) { 
      console.error(error); 
    }
  };

  return (
    <View style={[styles.productCard, { backgroundColor: themeObject.colors.card }]}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPress && onPress(item)}>
        {item.it_image_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.it_image_url }} style={styles.productImage} resizeMode="contain" />
            {activePromo && (
              <View style={{ 
                position: 'absolute', top: 5, right: 5, 
                backgroundColor: themeObject.colors.error || '#FF3B30', 
                borderRadius: 5, padding: 3 
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>-{activePromo.pr_discount_percentage}%</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={{ color: themeObject.colors.primary, fontWeight: '700', fontSize: 10 }}>
             {(animalsList || []).find(a => String(a.an_id) === String(item.it_an_id))?.an_name?.toUpperCase() || '---'}
             {' • '}
             {(brandsList || []).find(b => String(b.br_id) === String(item.it_br_id))?.br_name?.toUpperCase() || '---'}
          </Text>
          <Text style={{ color: themeObject.colors.text, fontSize: 14 }} numberOfLines={2}>{item.it_name}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ 
              color: activePromo ? (themeObject.colors.secondaryText || '#666') : themeObject.colors.primary, 
              fontSize: activePromo ? 12 : 14,
              textDecorationLine: activePromo ? 'line-through' : 'none',
              marginRight: activePromo ? 5 : 0
            }}>
              {Number(item.it_price).toFixed(2)} Br
            </Text>
            {activePromo && (
              <Text style={{ color: themeObject.colors.primary, fontSize: 14, fontWeight: 'bold' }}>
                {discountedPrice.toFixed(2)} Br
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        {isAdmin ? (
          // Интерфейс для АДМИНА
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <TouchableOpacity onPress={() => openEditModal(item)}>
                <Ionicons name="pencil" size={24} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.it_id)}>
                <Ionicons name="trash" size={24} color="#f44336" />
            </TouchableOpacity>
          </View>
        ) : (
          // Интерфейс для ПОЛЬЗОВАТЕЛЯ
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color={themeObject.colors.text} />
            </TouchableOpacity>
            
            {userId && (
              cartItem ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: themeObject.colors.border, borderRadius: 15, paddingHorizontal: 5 }}>
                  <TouchableOpacity onPress={() => handleUpdateCart(cartItem.ai_amount - 1)}>
                    <Ionicons name="remove" size={20} color={themeObject.colors.text} />
                  </TouchableOpacity>
                  <Text style={{ marginHorizontal: 8, color: themeObject.colors.text, fontWeight: 'bold' }}>{cartItem.ai_amount}</Text>
                  <TouchableOpacity onPress={() => handleUpdateCart(cartItem.ai_amount + 1)}>
                    <Ionicons name="add" size={20} color={themeObject.colors.text} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleUpdateCart(1)}>
                  <Ionicons name="cart-outline" size={24} color={themeObject.colors.primary} />
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>
    </View>
  );
};
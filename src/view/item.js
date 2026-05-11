import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Image, Share, Text, TouchableOpacity, View } from "react-native";
import { useCart } from "../viewModel/providers/cartProvider";
import { styles } from "./catalogStyles";

export const RenderItem = (props) => {
  const { 
    item, themeObject, tLang, openEditModal, confirmDelete, 
    animalsList, brandsList, isAdmin, onPress, userId 
  } = props;
    
  const { cart, updateCartItem } = useCart();
  
  const cartItem = cart?.find(c => Number(c.ai_it_id) === Number(item.it_id));

  const handleUpdateCart = async (amount) => {
    if (!userId) { Alert.alert("Ошибка", "Авторизуйтесь"); return; }
    await updateCartItem(item.it_id, amount);
  };

  const handleShare = async () => {
    try {
      const categoryName = animalsList.find(a => a.an_id === item.it_an_id)?.an_name || '---';
      const price = item.it_price ? `${Number(item.it_price).toFixed(2)} Br` : '';
      const message = `${categoryName} - ${item.it_name}\n\n${item.it_description}\n\nЦена: ${price}`;
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
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={{ color: themeObject.colors.primary, fontWeight: '700', fontSize: 10 }}>
             {(animalsList || []).find(a => String(a.an_id) === String(item.it_an_id))?.an_name?.toUpperCase() || '---'}
             {' • '}
             {(brandsList || []).find(b => String(b.br_id) === String(item.it_br_id))?.br_name?.toUpperCase() || '---'}
          </Text>
          <Text style={{ color: themeObject.colors.text, fontSize: 14 }} numberOfLines={2}>{item.it_name}</Text>
          <Text style={{ color: themeObject.colors.primary, fontSize: 14 }}>{Number(item.it_price).toFixed(2)} Br</Text>
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
            
            {cartItem ? (
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
            )}
          </View>
        )}
      </View>
    </View>
  );
};
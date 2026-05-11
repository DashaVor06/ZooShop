import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PromotionModal } from "../../src/view/promotionModal";
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useUserRole } from "../../src/viewModel/hooks/useUserRole";
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';
import { supabaseAnimalService } from "../../src/viewModel/services/supabaseAnimalService";
import { supabaseBrandService } from "../../src/viewModel/services/supabaseBrandService";
import { supabaseCharacteristicService } from "../../src/viewModel/services/supabaseCharacteristicService";
import { supabasePromotionService } from "../../src/viewModel/services/supabasePromotionService";

export default function IndexScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const db = useSQLiteContext();
  const { userProfile } = useUserRole();
  const isAdmin = userProfile?.acc_r_id === 1;

  const { promotions, addPromotion, updatePromotion, deletePromotion, loading } = supabasePromotionService(db);
  const { brands } = supabaseBrandService(db);
  const { animals } = supabaseAnimalService(db);
  const { characteristicValues } = supabaseCharacteristicService(db);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const handleSave = async (promoData) => {
    if (promoData.pr_id) {
      await updatePromotion(promoData);
    } else {
      await addPromotion(promoData);
    }
    setModalVisible(false);
    setEditingPromo(null);
  };

  const renderPromotion = ({ item }) => {
    const brandName = brands.find(b => String(b.br_id) === String(item.pr_br_id))?.br_name || "Любой";
    
    // Пытаемся найти животное через подкатегорию
    const subcat = characteristicValues.find(cv => String(cv.cv_id) === String(item.pr_cv_id));
    const animalName = subcat 
      ? (animals.find(a => String(a.an_id) === String(subcat.cv_an_id))?.an_name || "---")
      : "Все";
    
    const subcatName = subcat?.cv_value || "Все";

    return (
      <View style={[styles.promoCard, { backgroundColor: themeObject.colors.card, borderColor: themeObject.colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ backgroundColor: themeObject.colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
                -{item.pr_discount_percentage}%
              </Text>
            </View>
            {isAdmin && (
              <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 10 }}>ID: {item.pr_id}</Text>
            )}
          </View>
          
          <View style={styles.promoInfoRow}>
            <Ionicons name="calendar-outline" size={16} color={themeObject.colors.primary} />
            <Text style={[styles.promoInfoText, { color: themeObject.colors.text }]}>
              Период: <Text style={{ fontWeight: '500' }}>{item.pr_start_date}</Text> — <Text style={{ fontWeight: '500' }}>{item.pr_end_date || '...'}</Text>
            </Text>
          </View>

          <View style={styles.promoInfoRow}>
            <Ionicons name="paw-outline" size={16} color={themeObject.colors.primary} />
            <Text style={[styles.promoInfoText, { color: themeObject.colors.text }]}>
              Категория: <Text style={{ fontWeight: '500' }}>{animalName}</Text>
            </Text>
          </View>

          <View style={styles.promoInfoRow}>
            <Ionicons name="pricetag-outline" size={16} color={themeObject.colors.primary} />
            <Text style={[styles.promoInfoText, { color: themeObject.colors.text }]}>
              Бренд: <Text style={{ fontWeight: '500' }}>{brandName}</Text>
            </Text>
          </View>

          <View style={styles.promoInfoRow}>
            <Ionicons name="list-outline" size={16} color={themeObject.colors.primary} />
            <Text style={[styles.promoInfoText, { color: themeObject.colors.text }]}>
              Подкатегория: <Text style={{ fontWeight: '500' }}>{subcatName}</Text>
            </Text>
          </View>
        </View>
        
        {isAdmin && (
          <View style={{ justifyContent: 'center', paddingLeft: 15, borderLeftWidth: 0.5, borderLeftColor: themeObject.colors.border, marginLeft: 10 }}>
            <TouchableOpacity onPress={() => { setEditingPromo(item); setModalVisible(true); }} style={{ marginBottom: 20 }}>
              <Ionicons name="pencil" size={22} color={themeObject.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deletePromotion(item.pr_id)}>
              <Ionicons name="trash" size={22} color={themeObject.colors.error || "#FF3B30"} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeObject.colors.text }]}>
          Акции и скидки
        </Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => { setEditingPromo(null); setModalVisible(true); }}>
            <Ionicons name="add-circle" size={30} color={themeObject.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={promotions}
        keyExtractor={(item, index) => item?.pr_id?.toString() || index.toString()}
        renderItem={renderPromotion}
        ListEmptyComponent={<Text style={{ color: themeObject.colors.text, textAlign: 'center', marginTop: 20 }}>Акций пока нет</Text>}
      />

      {isAdmin && (
        <PromotionModal
          visible={modalVisible}
          onClose={() => { setModalVisible(false); setEditingPromo(null); }}
          onSave={handleSave}
          promotion={editingPromo}
          brands={brands}
          subcategories={characteristicValues}
          animals={animals}
          themeObject={themeObject}
          tLang={tLang}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  promoCard: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15, flexDirection: 'row' },
  promoInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  promoInfoText: { marginLeft: 10, fontSize: 13 },
});

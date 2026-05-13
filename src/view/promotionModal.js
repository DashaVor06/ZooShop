import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { SimplePicker } from './simplePicker';

export const PromotionModal = ({ 
  visible, 
  onClose, 
  onSave, 
  promotion, 
  brands, 
  subcategories,
  animals = [],
  themeObject, 
  tLang 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discount, setDiscount] = useState('');
  const [brId, setBrId] = useState(null);
  const [cvId, setCvId] = useState(null);
  const [anId, setAnId] = useState(null);

  useEffect(() => {
    if (promotion) {
      setStartDate(promotion.pr_start_date || '');
      setEndDate(promotion.pr_end_date || '');
      setDiscount(promotion.pr_discount_percentage?.toString() || '');
      setBrId(promotion.pr_br_id);
      setCvId(promotion.pr_cv_id);
      setAnId(promotion.pr_an_id);
    } else {
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setDiscount('');
      setBrId(null);
      setCvId(null);
      setAnId(null);
    }
  }, [promotion, visible]);

  const handleSave = () => {
    onSave({
      pr_id: promotion?.pr_id,
      pr_start_date: startDate,
      pr_end_date: endDate || null,
      pr_discount_percentage: parseInt(discount),
      pr_br_id: brId,
      pr_cv_id: cvId,
      pr_an_id: anId
    });
  };

  const brandItems = brands.map(b => ({ label: b.br_name, value: b.br_id }));
  
  // Фильтруем подкатегории по выбранному животному
  const filteredSubcats = anId 
    ? subcategories.filter(s => String(s.cv_an_id) === String(anId))
    : subcategories;

  const subcatItems = filteredSubcats.map(s => ({ label: s.cv_value, value: s.cv_id }));
  const animalItems = animals.map(a => ({ label: a.an_name, value: a.an_id }));

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: themeObject.colors.card }]}>
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            {promotion ? 'Редактировать акцию' : 'Добавить акцию'}
          </Text>
          
          <ScrollView>
            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Дата начала (YYYY-MM-DD):</Text>
            <TextInput
              style={[styles.input, { color: themeObject.colors.text, borderColor: themeObject.colors.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-01-01"
              placeholderTextColor={themeObject.colors.placeholder}
            />

            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Дата окончания (необяз.):</Text>
            <TextInput
              style={[styles.input, { color: themeObject.colors.text, borderColor: themeObject.colors.border }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2024-12-31"
              placeholderTextColor={themeObject.colors.placeholder}
            />

            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Скидка (%):</Text>
            <TextInput
              style={[styles.input, { color: themeObject.colors.text, borderColor: themeObject.colors.border }]}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={themeObject.colors.placeholder}
            />

            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Бренд:</Text>
            <SimplePicker
              selectedValue={brId}
              onValueChange={setBrId}
              items={[{ label: 'Любой', value: null }, ...brandItems]}
              themeObject={themeObject}
              isManual={false}
              placeholder="Выберите бренд"
            />

            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Животное:</Text>
            <SimplePicker
              selectedValue={anId}
              onValueChange={setAnId}
              items={[{ label: 'Любое', value: null }, ...animalItems]}
              themeObject={themeObject}
              isManual={false}
              placeholder="Выберите животное"
            />

            <Text style={{ color: themeObject.colors.text, marginBottom: 5 }}>Подкатегория:</Text>
            <SimplePicker
              selectedValue={cvId}
              onValueChange={setCvId}
              items={[{ label: 'Любая', value: null }, ...subcatItems]}
              themeObject={themeObject}
              isManual={false}
              placeholder="Выберите подкатегорию"
            />
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: themeObject.colors.surface }]}>
              <Text style={{ color: themeObject.colors.text }}>{tLang("common.cancel") || "Отмена"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.button, { backgroundColor: themeObject.colors.primary }]}>
              <Text style={{ color: '#fff' }}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { padding: 20, borderRadius: 10, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  button: { padding: 15, borderRadius: 5, flex: 0.45, alignItems: 'center' }
});

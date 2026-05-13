import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SimplePicker } from "./simplePicker";

export const InfrastructureModal = ({
  visible,
  onClose,
  type, // 'shop' or 'storage'
  item, // existing item if editing
  onSave,
  onDelete,
  themeObject,
  tLang,
  cities = []
}) => {
  const [address, setAddress] = useState("");
  const [cityId, setCityId] = useState(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [isManualCity, setIsManualCity] = useState(false);

  useEffect(() => {
    if (item) {
      setAddress(type === 'shop' ? item.sh_address : item.st_address);
      setCityId(type === 'shop' ? item.sh_c_id : item.st_c_id);
      setLat(item.lat ? item.lat.toString() : "");
      setLng(item.lng ? item.lng.toString() : "");
      setIsManualCity(false);
    } else {
      setAddress("");
      setCityId(null);
      setLat("");
      setLng("");
      setIsManualCity(false);
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!address.trim()) {
      Alert.alert(tLang("common.error"), tLang("catalog.fillRequired"));
      return;
    }

    if (isManualCity && (typeof cityId !== 'string' || !cityId.trim())) {
      Alert.alert(tLang("common.error"), tLang("catalog.fillRequired"));
      return;
    }

    if (!isManualCity && !cityId) {
      Alert.alert(tLang("common.error"), tLang("catalog.fillRequired"));
      return;
    }
    
    const data = {
      [type === 'shop' ? 'sh_address' : 'st_address']: address,
      [type === 'shop' ? 'sh_c_id' : 'st_c_id']: cityId,
      lat: lat.trim() ? parseFloat(lat) : null,
      lng: lng.trim() ? parseFloat(lng) : null,
      isManualCity // Передаем флаг, чтобы на вызывающей стороне знать, нужно ли создавать город
    };

    onSave(data);
  };

  const cityItems = cities.map(c => ({ label: c.c_name, value: c.c_id }));

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={[styles.title, { color: themeObject.colors.text }]}>
            {item 
              ? (type === 'shop' ? tLang("catalog.editShop") : tLang("catalog.editStorage"))
              : (type === 'shop' ? tLang("catalog.addShop") : tLang("catalog.addStorage"))
            }
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: themeObject.colors.inputBackground, 
              color: themeObject.colors.text, 
              borderColor: themeObject.colors.border 
            }]}
            placeholder={tLang("catalog.address")}
            placeholderTextColor={themeObject.colors.placeholder}
            value={address}
            onChangeText={setAddress}
          />

          <SimplePicker
            selectedValue={cityId}
            onValueChange={setCityId}
            items={cityItems}
            placeholder={tLang("catalog.city")}
            themeObject={themeObject}
            isManual={isManualCity}
            setIsManual={setIsManualCity}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: themeObject.colors.inputBackground, color: themeObject.colors.text, borderColor: themeObject.colors.border }]}
              placeholder={tLang("catalog.latitude")}
              placeholderTextColor={themeObject.colors.placeholder}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: themeObject.colors.inputBackground, color: themeObject.colors.text, borderColor: themeObject.colors.border }]}
              placeholder={tLang("catalog.longitude")}
              placeholderTextColor={themeObject.colors.placeholder}
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton, { backgroundColor: themeObject.colors.surface }]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: themeObject.colors.text }]}>{tLang("common.cancel")}</Text>
            </TouchableOpacity>

            {item && (
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: themeObject.colors.error }]} 
                onPress={() => onDelete(type === 'shop' ? item.sh_id : item.st_d)}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>{tLang("common.delete")}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: themeObject.colors.primary }]} 
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>{tLang("common.save")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
  button: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#ccc' },
  buttonText: { fontWeight: 'bold', fontSize: 16 }
});
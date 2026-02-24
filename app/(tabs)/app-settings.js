import { useLanguageSelector } from '@/src/hooks/localizationHooks/useLanguageSelector';
import { useThemeSelector } from '@/src/hooks/themeHooks/useThemeSelector';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, Text, View } from "react-native";
import DropDownPicker from 'react-native-dropdown-picker';

export default function SettingsScreen() {
  const { selectedLanguage, languageOptions, handleLanguageChange, tLang } = useLanguageSelector();
  const { selectedTheme, themeOptions, handleThemeChange, tTheme } = useThemeSelector();
  const themeObject = selectedTheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <BasePicker
        selectedItem={selectedLanguage}
        onItemChange={handleLanguageChange}
        label={tLang('language')}
        options={languageOptions}
        themeObject = {themeObject}
      />

      <BasePicker
        selectedItem={selectedTheme}
        onItemChange={handleThemeChange}
        label={tTheme('theme')}
        options={themeOptions}
        themeObject = {themeObject}
      />
    </View>
  );
}

function BasePicker({ 
  selectedItem, 
  onItemChange, 
  label,
  options = [],
  themeObject,
  marginBottom = 16,
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedItem);
  const [items, setItems] = useState(options);

  return (
    <View style={[styles.card, { 
      backgroundColor: themeObject.colors.card,
      marginBottom,
      zIndex: open ? 9999 : 1,
      elevation: open ? 9999 : 1,
    }]}>
      <Text style={[styles.label, { color: themeObject.colors.text }]}>
        {label}
      </Text>
      
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        onChangeValue={(val) => onItemChange(val)}
        style={{
          backgroundColor: themeObject.colors.card,
          borderColor: themeObject.colors.border,
          borderRadius: 8,
          minHeight: 60,
        }}
        textStyle={{
          color: themeObject.colors.text,
          fontSize: 16,
        }}
        dropDownContainerStyle={{
          backgroundColor: themeObject.colors.card,
          borderColor: themeObject.colors.border,
        }}
        selectedItemContainerStyle={{
          backgroundColor: 'transparent', // или уберите эту строку
        }}
        selectedItemLabelStyle={{
          color: themeObject.colors.primary,
        }}
        listItemLabelStyle={{
          color: themeObject.colors.text,
        }}
        arrowIconStyle={{
          tintColor: themeObject.colors.text,
        }}
        tickIconStyle={{
          tintColor: themeObject.colors.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    width: '100%',
  },
});
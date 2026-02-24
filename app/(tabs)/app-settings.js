import { useLanguageSelector } from '@/src/hooks/localizationHooks/useLanguageSelector';
import { useThemeSelector } from '@/src/hooks/themeHooks/useThemeSelector';
import { Picker } from '@react-native-picker/picker';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from "react-native";

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
        wrapperStyle={{ 
          backgroundColor: themeObject.colors.card,
          borderColor: themeObject.colors.border 
        }}
        pickerStyle={{ color: themeObject.colors.text }}
        labelStyle={{ color: themeObject.colors.text }}
      />

      <BasePicker
        selectedItem={selectedTheme}
        onItemChange={handleThemeChange}
        label={tTheme('theme')}
        options={themeOptions}
        wrapperStyle={{ 
          backgroundColor: themeObject.colors.card,
          borderColor: themeObject.colors.border 
        }}
        pickerStyle={{ color: themeObject.colors.text }}
        labelStyle={{ color: themeObject.colors.text }}
      />
    </View>
  );
}

function BasePicker({ 
  selectedItem, 
  onItemChange, 
  label,
  options = [],
  pickerStyle = {},
  wrapperStyle = {},
  labelStyle = {},
  marginBottom = 16
}) {  
  return (
    <View style={[styles.card, wrapperStyle, { marginBottom }]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      
      <View style={[styles.pickerWrapper, wrapperStyle]}>
        <Picker
          selectedValue={selectedItem}
          onValueChange={onItemChange}
          style={[styles.picker, pickerStyle]}
          dropdownIconColor={pickerStyle.color || "#666666"}
          mode="dropdown"
        >
          {options.map((opt) => (
            <Picker.Item 
              key={opt.value}
              label={opt.label} 
              value={opt.value} 
              color={pickerStyle.color}
            />
          ))}
        </Picker>
      </View>
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
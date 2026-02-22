import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { Text, View } from "react-native";
import { useLanguage } from '../../src/i18n/languageContext';

export default function SettingsScreen() {
  const { locale, changeLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    changeLanguage(lang);
  };

  return (
    <View>    
      <Text>{t('language')}</Text>
      <Picker
        selectedValue={selectedLanguage}
        onValueChange={handleLanguageChange}
      >
        <Picker.Item label={t('languages.russian')} value="ru" />
        <Picker.Item label={t('languages.english')} value="en" />
      </Picker>
    </View>
    
  );
}
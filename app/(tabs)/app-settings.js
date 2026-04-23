import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { SimplePicker } from '../../src/view/simplePicker';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useThemeSelector } from '../../src/viewModel/hooks/useThemeSelector';
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';
import * as NotificationService from '../../src/viewModel/services/notificationService';

export default function SettingsScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { selectedLanguage, languageOptions, handleLanguageChange, tLang } = useLanguageSelector();
  const { selectedTheme, themeOptions, handleThemeChange, tTheme } = useThemeSelector();

  const [notifsEnabled, setNotifsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('notifications_enabled');
    setNotifsEnabled(enabled === 'true');
  };

  const toggleNotifications = async (value) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        // Устанавливаем на 10:00 утра по умолчанию
        await NotificationService.scheduleDailyNotification(10, 0);
        setNotifsEnabled(true);
        await AsyncStorage.setItem('notifications_enabled', 'true');
        Alert.alert(tLang('common.success'), "Уведомления включены на 10:00");
      } else {
        Alert.alert("Ошибка", "Доступ к уведомлениям запрещен");
      }
    } else {
      await NotificationService.cancelNotifications();
      setNotifsEnabled(false);
      await AsyncStorage.setItem('notifications_enabled', 'false');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      
      {/* Язык и Тема (сохраняем ваш код) */}
      <View style={styles.pickerWrapper}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>{tLang('language')}</Text>
        <SimplePicker
          selectedValue={selectedLanguage}
          onValueChange={handleLanguageChange}
          items={languageOptions}
          themeObject={themeObject}
        />
      </View>

      <View style={styles.pickerWrapper}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>{tTheme('theme')}</Text>
        <SimplePicker
          selectedValue={selectedTheme}
          onValueChange={handleThemeChange}
          items={themeOptions}
          themeObject={themeObject}
        />
      </View>

      {/* Новое: Уведомления */}
      <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: themeObject.colors.border, paddingTop: 20 }]}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>
          Ежедневные уведомления
        </Text>
        <Switch
          value={notifsEnabled}
          onValueChange={toggleNotifications}
          trackColor={{ false: "#767577", true: themeObject.colors.primary }}
        />
      </View>
      <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 12 }}>
        Будет приходить напоминание заглянуть в каталог каждый день в 10:00.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pickerWrapper: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});
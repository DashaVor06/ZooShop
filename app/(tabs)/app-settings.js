import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
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
  const [notificationTime, setNotificationTime] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false); 

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await AsyncStorage.getItem('notifications_enabled');
    const savedHour = await AsyncStorage.getItem('notifications_hour');
    const savedMinute = await AsyncStorage.getItem('notifications_minute');

    setNotifsEnabled(enabled === 'true');

    if (savedHour !== null && savedMinute !== null) {
      const date = new Date();
      date.setHours(parseInt(savedHour, 10));
      date.setMinutes(parseInt(savedMinute, 10));
      setNotificationTime(date);
    }
  };

  const toggleNotifications = async (value) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await NotificationService.scheduleDailyNotification(
          notificationTime.getHours(),   // 👈 вот тут
          notificationTime.getMinutes()  // 👈 и тут
        );
        console.log(notificationTime.toLocaleTimeString());
        setNotifsEnabled(true);
        await AsyncStorage.setItem('notifications_enabled', 'true');
      } else {
        Alert.alert("Ошибка", "Доступ к уведомлениям запрещен");
      }
    } else {
      await NotificationService.cancelNotifications();
      setNotifsEnabled(false);
      await AsyncStorage.setItem('notifications_enabled', 'false');
    }
  };

  const onTimeChange = async (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios'); // Скрываем на Android после выбора

    if (selectedDate) {
      setNotificationTime(selectedDate);
      
      // Сохраняем время
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      await AsyncStorage.setItem('notifications_hour', hour.toString());
      await AsyncStorage.setItem('notifications_minute', minute.toString());

      // Если уведомления включены, перепланируем на новое время
      if (notifsEnabled) {
        await NotificationService.scheduleDailyNotification(hour, minute);
      }
    }
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      
      {/* Язык и Тема */}
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

      {/* Уведомления */}
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

      {/* Выбор времени (показываем только если включены уведомления) */}
      <View style={styles.timeSettingRow}>
        <Text style={{ color: themeObject.colors.text, fontSize: 16 }}>Время напоминания:</Text>
        
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={notificationTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
            style={{ width: 100 }}
          />
        ) : (
          <TouchableOpacity 
            onPress={() => setShowPicker(true)}
            style={[styles.timeButton, { backgroundColor: themeObject.colors.surface || '#eee' }]}
          >
            <Text style={{ color: themeObject.colors.primary, fontWeight: 'bold' }}>
              {formatTime(notificationTime)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={notificationTime}
          mode="time"
          is24Hour={true}
          onChange={onTimeChange}
        />
      )}

      <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 12, marginTop: 10 }}>
        Будет приходить напоминание каждый день в {formatTime(notificationTime)}.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pickerWrapper: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeSettingRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 20 
  },
  timeButton: {
    padding: 10,
    borderRadius: 8,
  }
});
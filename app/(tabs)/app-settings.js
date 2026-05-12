import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { AuthModal } from '../../src/view/authModal';
import { SimplePicker } from '../../src/view/simplePicker';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useThemeSelector } from '../../src/viewModel/hooks/useThemeSelector';
import { useUserRole } from '../../src/viewModel/hooks/useUserRole';
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';
import * as NotificationService from '../../src/viewModel/services/notificationService';

import { supabase } from '../../src/model/supabase';

export default function SettingsScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { selectedLanguage, languageOptions, handleLanguageChange, tLang } = useLanguageSelector();
  const { selectedTheme, themeOptions, handleThemeChange, tTheme } = useThemeSelector();
  const { isAdmin, userProfile } = useUserRole();
  const router = useRouter();

  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false); 

  const [user, setUser] = useState(null);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  useEffect(() => {
    loadSettings();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) Alert.alert(tLang('common.exit'), tLang('auth.logoutSuccess'));
  };

  const toggleNotifications = async (value) => {
    if (value) {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await NotificationService.scheduleDailyNotification(
          notificationTime.getHours(),
          notificationTime.getMinutes()
        );
        setNotifsEnabled(true);
        await AsyncStorage.setItem('notifications_enabled', 'true');
      } else {
        Alert.alert(tLang('common.error'), tLang('settings.notifPermissionError'));
      }
    } else {
      await NotificationService.cancelNotifications();
      setNotifsEnabled(false);
      await AsyncStorage.setItem('notifications_enabled', 'false');
    }
  };

  const onTimeChange = async (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNotificationTime(selectedDate);
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      await AsyncStorage.setItem('notifications_hour', hour.toString());
      await AsyncStorage.setItem('notifications_minute', minute.toString());
      if (notifsEnabled) await NotificationService.scheduleDailyNotification(hour, minute);
    }
  };

  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      
      {/* СЕКЦИЯ АККАУНТА */}
      <View style={styles.authSection}>
        <Text style={[styles.sectionTitle, { color: themeObject.colors.text }]}>
          {tLang('auth.account')}
        </Text>
        
        {user ? (
          <View style={[styles.profileCard, { backgroundColor: themeObject.colors.surface || '#f9f9f9' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: themeObject.colors.text, fontSize: 16 }}>{user.email}</Text>
              
              {/* BONUS BALANCE (Only for non-admins) */}
              {!isAdmin && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={{ color: themeObject.colors.secondaryText, fontSize: 14, marginLeft: 4 }}>
                    {tLang('order.bonuses')}: {userProfile?.acc_bonus_balance || 0}
                  </Text>
                </View>
              )}

              {isAdmin && (
                <Text style={{ color: themeObject.colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
                  {tLang('auth.admin')}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>
                {tLang('auth.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: themeObject.colors.primary }]}
            onPress={() => setIsAuthModalVisible(true)}
          >
            <Text style={styles.loginButtonText}>
              {tLang('auth.loginRegister')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: themeObject.colors.border }]} />

      {/* ЯЗЫК И ТЕМА */}
      <View style={styles.pickerWrapper}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>{tLang('language')}</Text>
        <SimplePicker selectedValue={selectedLanguage} onValueChange={handleLanguageChange} items={languageOptions} themeObject={themeObject} />
      </View>

      <View style={styles.pickerWrapper}>
        <Text style={[styles.label, { color: themeObject.colors.text }]}>{tTheme('theme')}</Text>
        <SimplePicker selectedValue={selectedTheme} onValueChange={handleThemeChange} items={themeOptions} themeObject={themeObject} />
      </View>

      {/* ИСТОРИЯ ЗАКАЗОВ (ТОЛЬКО ДЛЯ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ) */}
      {user && !isAdmin && (
        <View style={{ borderTopWidth: 1, borderTopColor: themeObject.colors.border, paddingTop: 20, marginBottom: 20 }}>
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: themeObject.colors.surface || '#eee' }]}
            onPress={() => router.push('/order-history')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={24} color={themeObject.colors.primary} />
              <Text style={{ color: themeObject.colors.text, marginLeft: 15, fontSize: 16, fontWeight: '500' }}>
                {tLang('order.history')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeObject.colors.border} />
          </TouchableOpacity>
        </View>
      )}

      {/* УВЕДОМЛЕНИЯ (ТОЛЬКО ДЛЯ АДМИНА) */}
      {isAdmin && (
        <>
          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: themeObject.colors.border, paddingTop: 20 }]}>
            <Text style={[styles.label, { color: themeObject.colors.text }]}>
              {tLang('settings.notifications')}
            </Text>
            <Switch value={notifsEnabled} onValueChange={toggleNotifications} trackColor={{ false: "#767577", true: themeObject.colors.primary }} />
          </View>

          <View style={styles.timeSettingRow}>
            <Text style={{ color: themeObject.colors.text, fontSize: 16 }}>
              {tLang('settings.reminderTime')}
            </Text>
            {Platform.OS === 'ios' ? (
              <DateTimePicker value={notificationTime} mode="time" display="default" onChange={onTimeChange} style={{ width: 100 }} />
            ) : (
              <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.timeButton, { backgroundColor: themeObject.colors.surface || '#eee' }]}>
                <Text style={{ color: themeObject.colors.primary, fontWeight: 'bold' }}>{formatTime(notificationTime)}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ color: themeObject.colors.secondaryText || '#666', fontSize: 12, marginTop: 8 }}>
            {tLang('settings.notificationDesc', { time: formatTime(notificationTime) })}
          </Text>

          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker value={notificationTime} mode="time" is24Hour={true} onChange={onTimeChange} />
          )}
        </>
      )}

      <AuthModal 
        visible={isAuthModalVisible} 
        onClose={() => setIsAuthModalVisible(false)} 
        themeObject={themeObject} 
        onAuthSuccess={(newUser) => setUser(newUser)} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  authSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  profileCard: { padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutButton: { padding: 8 },
  loginButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, marginVertical: 20 },
  pickerWrapper: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeSettingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  timeButton: { padding: 10, borderRadius: 8 },
  historyButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 12 
  }
});
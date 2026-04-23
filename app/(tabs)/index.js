// app/(tabs)/index.js
import { useSQLiteContext } from "expo-sqlite";
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { useNetworkStatus } from "../../src/viewModel/hooks/useNetworkStatus";
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';
import { weatherService } from "../../src/viewModel/services/weatherService";

export default function IndexScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { tLang } = useLanguageSelector();
  const { isConnected } = useNetworkStatus();
  const db = useSQLiteContext();
  
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchWeather } = weatherService(db, isConnected);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchWeather();
      setWeather(data);
      setLoading(false);
    };
    loadData();
  }, [isConnected]);

  return (
    <View style={[styles.container, { backgroundColor: themeObject.colors.background }]}>
      <View style={[styles.weatherCard, { backgroundColor: themeObject.colors.card }]}>
        {loading ? (
          <ActivityIndicator color={themeObject.colors.primary} />
        ) : weather ? (
          <>
            <Text style={{ color: themeObject.colors.text, fontSize: 18, fontWeight: 'bold' }}>
              {weather.city}
            </Text>
            <View style={styles.weatherInfo}>
              <Image 
                source={{ uri: `https://openweathermap.org/img/wn/${weather.icon}@2x.png` }} 
                style={{ width: 50, height: 50 }}
              />
              <Text style={{ color: themeObject.colors.text, fontSize: 24 }}>
                {Math.round(weather.temp)}°C
              </Text>
            </View>
            <Text style={{ color: themeObject.colors.secondaryText || '#666' }}>
              {weather.description}
            </Text>
            {!isConnected && (
              <Text style={styles.offlineLabel}>{tLang('network.offlineMode')}</Text>
            )}
          </>
        ) : (
          <Text style={{ color: themeObject.colors.text }}>Данные о погоде недоступны</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  weatherCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowOpacity: 0.1,
  },
  weatherInfo: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  offlineLabel: { fontSize: 10, marginTop: 5, color: 'orange' }
});
import { SplashScreen, Stack } from "expo-router";
import { SQLiteProvider } from 'expo-sqlite';
import { useContext } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDbIfNeeded } from "../src/database/migrations";
import { LanguageProvider } from "../src/localization/languageProvider";
import { ThemeContext } from "../src/theme/themeProvider";
import { ThemeProvider } from "../src/theme/themeProvider.js";

function RootContent() {
  const themeContext = useContext(ThemeContext);
  
  if (!themeContext) {
    return <SplashScreen />;
  }
  
  const { themeObject } = themeContext;

  return (
    <>
      <StatusBar 
        barStyle={themeObject.dark ? "light-content" : "dark-content"}
        backgroundColor={themeObject.colors.background}
      />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="test.db" onInit={migrateDbIfNeeded}>
        <LanguageProvider>
          <ThemeProvider>
            <RootContent />
          </ThemeProvider>
        </LanguageProvider>
      </SQLiteProvider>
    </SafeAreaProvider>    
  );
}
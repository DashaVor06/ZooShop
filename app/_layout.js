import { Stack } from "expo-router";
import { SQLiteProvider } from 'expo-sqlite';
import { useContext } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { migrateDbIfNeeded } from "../src/model/localdbInit";
import { LanguageProvider } from "../src/viewModel/providers/languageProvider";
import { ThemeContext, ThemeProvider } from "../src/viewModel/providers/themeProvider";

function RootContent() {
  const themeContext = useContext(ThemeContext);
  
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
      <SQLiteProvider databaseName="catalog.db" onInit={migrateDbIfNeeded}>
        <LanguageProvider>
          <ThemeProvider>
            <RootContent />
          </ThemeProvider>
        </LanguageProvider>
      </SQLiteProvider>
    </SafeAreaProvider>    
  );
}
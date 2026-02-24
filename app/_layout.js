import { ThemeContext } from "@/src/appearance/themeProvider";
import { ThemeProvider } from "@/src/appearance/themeProvider.js";
import { LanguageProvider } from "@/src/language/languageProvider";
import { Stack } from "expo-router";
import { useContext } from "react";
import { StatusBar } from "react-native";

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
    <LanguageProvider>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
import { Stack } from "expo-router";
import { LanguageProvider } from '../src/i18n/languageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{
          headerShown: false
        }}/>
      </Stack>
    </LanguageProvider>  
  ) 
}

import { ThemeContext } from '@/src/appearance/themeProvider';
import { useLanguageSelector } from '@/src/hooks/localizationHooks/useLanguageSelector';
import { useContext } from 'react';
import { Text, View } from 'react-native';

export default function BasketScreen() {
  const { themeObject } = useContext(ThemeContext);
  const { selectedLanguage, languageOptions, handleLanguageChange, tLang } = useLanguageSelector();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: themeObject.colors.background,
      }}
    >
      <Text style={{ color: themeObject.colors.text }}>
        {tLang('tabBar.basket')}
      </Text>
    </View>
  );
}
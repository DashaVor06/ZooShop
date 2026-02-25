import { useContext } from 'react';
import { Text, View } from 'react-native';
import { useLanguageSelector } from '../../src/hooks/localizationHooks/useLanguageSelector';
import { ThemeContext } from '../../src/theme/themeProvider';

export default function IndexScreen() {
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
        {tLang('tabBar.home')}
      </Text>
    </View>
  );
}

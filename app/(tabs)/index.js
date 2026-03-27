import { useContext } from 'react';
import { Text, View } from 'react-native';
import { useLanguageSelector } from '../../src/viewModel/hooks/useLanguageSelector';
import { ThemeContext } from '../../src/viewModel/providers/themeProvider';

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

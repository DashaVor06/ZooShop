import { ThemeContext } from '@/src/appearance/themeProvider';
import { DarkTheme } from '@react-navigation/native';
import { useContext, useEffect, useState } from 'react';

export const useThemeSelector = () => {
  const { themeObject, changeTheme, tTheme } = useContext(ThemeContext);

  const themeName = themeObject.dark ? 'dark' : 'light';
  const [selectedTheme, setSelectedTheme] = useState(themeName);
  
  const themeOptions = [
    { label: tTheme('themes.dark'), value: 'dark' },
    { label: tTheme('themes.light'), value: 'light' }
  ];
 
  useEffect(() => {
    setSelectedTheme(themeObject === DarkTheme ? 'dark' : 'light');
  }, [themeObject]);

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    changeTheme(themeName);
  };

  return {
    selectedTheme,
    themeOptions,
    handleThemeChange,
    tTheme
  };
}
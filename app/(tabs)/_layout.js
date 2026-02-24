import { ThemeContext } from '@/src/appearance/themeProvider';
import { LanguageContext } from '@/src/i18n/languageProvider';
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext } from 'react';

export default function TabsLayout() {
  const { tLang, locale } = useContext(LanguageContext);
  const { themeObject } = useContext(ThemeContext);

  return (
    <Tabs
      key={locale}
      screenOptions={{
        tabBarActiveTintColor: themeObject.colors.primary,
        tabBarInactiveTintColor: themeObject.colors.text,
        tabBarStyle: {
          backgroundColor: themeObject.colors.background,
          borderTopColor: themeObject.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          color: themeObject.colors.text,
        },
        headerStyle: {
          backgroundColor: themeObject.colors.background,
        },
        headerTitleStyle: {
          color: themeObject.colors.text,
        },
        headerTintColor: themeObject.colors.primary,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          title: tLang('tabBar.home'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "home-sharp" : "home-outline"}
              size={24}
              color={focused ? themeObject.colors.primary : themeObject.colors.text}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="catalog" 
        options={{
          title: tLang('tabBar.catalog'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "search-sharp" : "search-outline"}
              size={24}
              color={focused ? themeObject.colors.primary : themeObject.colors.text}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="basket" 
        options={{
          title: tLang('tabBar.basket'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "basket-sharp" : "basket-outline"}
              size={24}
              color={focused ? themeObject.colors.primary : themeObject.colors.text}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="app-settings" 
        options={{
          title: tLang('tabBar.settings'),
          tabBarIcon: ({focused}) => (
            <Ionicons 
              name={focused ? "settings-sharp" : "settings-outline"} 
              size={24}
              color={focused ? themeObject.colors.primary : themeObject.colors.text}
            /> 
          )
        }}
      />
    </Tabs>
  );
}
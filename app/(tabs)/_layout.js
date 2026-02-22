import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useLanguage } from '../../src/i18n/languageContext';

export default function TabsLayout() {
  const { t, locale } = useLanguage();

  return (
    <Tabs
      key={locale}
      screenOptions={{
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#000000",
        tabBarLabelStyle: {
          fontSize: 12
        }
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{
          title: t('tabBar.home'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "home-sharp" : "home-outline"}
              size={24}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="catalog" 
        options={{
          title: t('tabBar.catalog'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "search-sharp" : "search-outline"}
              size={24}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="basket" 
        options={{
          title: t('tabBar.basket'),
          tabBarIcon: ({focused}) => ( 
            <Ionicons 
              name={focused ? "basket-sharp" : "basket-outline"}
              size={24}
            />
          )
        }}
      />
      <Tabs.Screen 
        name="app-settings" 
        options={{
          title: t('tabBar.settings'),
          tabBarIcon: ({focused}) => (
            <Ionicons 
              name={focused ? "settings-sharp" : "settings-outline"} 
              size={24}
            /> 
          )
        }}
      />
    </Tabs>
  );
}

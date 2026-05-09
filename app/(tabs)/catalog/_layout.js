import { Stack } from 'expo-router';

export default function CatalogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* index — это основной экран списка товаров */}
      <Stack.Screen name="index" />
      {/* [id] — это страница товара, которая будет открываться поверх */}
      <Stack.Screen 
        name="[id]" 
        options={{ 
          presentation: 'fullScreenModal', // будет на весь экран
          headerShown: false // если хотите убрать заголовок внутри страницы товара
        }} 
      />
    </Stack>
  );
}
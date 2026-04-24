import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHANNEL_ID = 'default';

export const scheduleDailyNotification = async (hour, minute) => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  const trigger = Platform.select({
    ios: {
      type: 'calendar',
      hour: Number(hour),
      minute: Number(minute),
      repeats: true,
    },
    android: {
      type: 'daily',
      hour: Number(hour),
      minute: Number(minute),
      channelId: CHANNEL_ID,
    },
  });

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Пора заглянуть в каталог! 🐾",
        body: "Проверьте новые товары для ваших питомцев.",
        sound: 'default',
      },
      trigger,
    });
    
    console.log(`[${Platform.OS}] Запланировано на ${hour}:${minute}`);
    return id;
  } catch (error) {
    console.error("Ошибка планирования:", error);
    return null;
  }
};

export const cancelNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};
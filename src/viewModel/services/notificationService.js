import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const scheduleDailyNotification = async (hour, minute) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Пора заглянуть в каталог! 🐾",
      body: "Проверьте новые товары для ваших питомцев.",
    },
    trigger: {
      hour: hour,
      minute: minute,
      repeats: true,
    },
  });
  return id;
};

export const cancelNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};
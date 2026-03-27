import React from "react";
import {
    Text,
    View
} from "react-native";
import { styles } from "./catalogStyles";

export const Notification = ({ notification, insets }) => {
  if (!notification.visible) {
    return null;
  }
  
  return (
    <View style={[
      styles.notification,
      { 
        backgroundColor: notification.type === "success" ? "#4CAF50" : "#f44336",
        top: insets.top + 10,
      }
    ]}>
      <Text style={styles.notificationText}>{notification.message}</Text>
    </View>
  );
};

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../src/view/catalogStyles";

export const renderConfirmModal = ({
  confirmModalVisible,
  themeObject,
  tLang,
  setConfirmModalVisible,
  handleDeleteItem,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={confirmModalVisible}
      onRequestClose={() => setConfirmModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.confirmModalContent, { backgroundColor: themeObject.colors.background }]}>
          <Ionicons name="warning" size={50} color="#f44336" style={styles.warningIcon} />
          <Text style={[styles.confirmTitle, { color: themeObject.colors.text }]}>
            {tLang('catalog.confirmDelete')}
          </Text>
          <Text style={[styles.confirmText, { color: themeObject.colors.secondaryText || "#666666" }]}>
            {tLang('catalog.confirmDeleteMessage')}
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelConfirmButton]}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.cancelConfirmText}>
                {tLang('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.deleteConfirmButton]}
              onPress={handleDeleteItem}
            >
              <Text style={styles.deleteConfirmText}>
                {tLang('common.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
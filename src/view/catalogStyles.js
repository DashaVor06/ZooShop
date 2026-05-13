import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16, // Отступы по бокам для всего списка
    paddingTop: 16,        // Отступ сверху
    paddingBottom: 32,     // Запас снизу для удобства скролла
  },
productCard: {
  width: '48%', // Немного меньше 50%, чтобы осталось место для отступа между ними
  borderRadius: 12,
  marginBottom: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  overflow: "hidden",
},
imageContainer: {
  width: "100%",
  height: 120, // Уменьшите высоту картинки, так как карточек стало две
  backgroundColor: "transparent",
  justifyContent: "center",
  alignItems: "center",
},
  productImage: {
    width: "100%",
    height: "100%",
  },
  cardContent: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notification: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteConfirmButton: {
    backgroundColor: '#f44336',
  },
  cancelConfirmText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: "#ff3b30",
    padding: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  offlineText: {
    color: "white",
    fontSize: 12
  },
  syncBanner: {
    backgroundColor: "#34c759",
    padding: 6,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  syncText: {
    color: "white",
    fontSize: 12,
    marginLeft: 8
  },
  // catalogStyles.js - добавьте эти стили
searchContainer: {
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 8,
},
searchInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  height: 44,
  gap: 8,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  padding: 0,
  margin: 0,
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 32,
  marginTop: 100,
},
emptyText: {
  fontSize: 16,
  textAlign: 'center',
  marginTop: 16,
},
// catalogStyles.js - добавьте или замените эти стили
searchSection: {
  flexDirection: 'row',
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 8,
  gap: 12,
  alignItems: 'center',
},
searchContainer: {
  flex: 3,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 12,
  height: 44,
  gap: 8,
},
searchInput: {
  flex: 1,
  fontSize: 16,
  padding: 0,
  margin: 0,
},
sortButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  paddingHorizontal: 12,
  height: 44,
  borderRadius: 8,
  borderWidth: 1,
},
sortButtonText: {
  fontSize: 14,
  fontWeight: '500',
},
sortModalContent: {
  position: 'absolute',
  top: '30%',
  left: '10%',
  right: '10%',
  borderRadius: 12,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
sortModalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 16,
  textAlign: 'center',
},
sortOption: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  gap: 12,
},
sortOptionActive: {
  backgroundColor: 'rgba(0,0,0,0.05)',
},
sortOptionText: {
  flex: 1,
  fontSize: 16,
},
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 32,
  marginTop: 100,
},
emptyText: {
  fontSize: 16,
  textAlign: 'center',
  marginTop: 16,
},
});
import { EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';

export const imagekitService = () => {
  
  const loadImage = async (isEdit, fileId, sourceType = 'library') => {
    try {
      const imageUri = await pickImage(sourceType);
      return imageUri;
    } 
    catch (error) {
      throw error;
    }
  };

  const pickImage = async (sourceType) => {
    try {
      let permissionResult;
      
      if (sourceType === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      
      if (!permissionResult.granted) {
        throw new Error(sourceType === 'camera' ? 'catalog.cameraPermissionError' : 'catalog.permissionError');
      }

      const options = {
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      };

      const result = sourceType === 'camera' 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled) {
        return result.assets[0].uri;
      }    
      return null;
    } 
    catch (error) {
      if (error.message.includes('Permission')) throw error;
      throw new Error('catalog.pickingImageError');
    }
  }
  
  const uploadToImageKit = async (imageUri) => {
    try {
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop();
      const fileType = filename.split('.').pop();
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });
      
      formData.append('fileName', filename);

      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY + ':'),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'catalog.uploadFailed');
      }

      const data = await response.json();
      
      return {
        url: data.url,
        fileId: data.fileId
      };
    } 
    catch (error) {
      console.error('Upload error:', error);
      throw new Error('catalog.uploadImageError');
    }
  };

  const deleteImageFromImageKit = async (fileId) => {
    try {
      if (!fileId) return false;
      const encodedFileId = encodeURIComponent(fileId);
      
      const response = await fetch(`https://api.imagekit.io/v1/files/${encodedFileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY + ':'),
        },
      });
      
      if (!response.ok && response.status !== 404) return false;
      return true;
    } 
    catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return {
    loadImage,
    uploadToImageKit,
    deleteImageFromImageKit
  };
};
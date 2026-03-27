import { EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY } from '@env';
import * as ImagePicker from 'expo-image-picker';

export const imagekitService = () => {
  
  const loadImage = async () => {
    try {
      const imageUri = await pickImage();
      return imageUri;
    } 
    catch (error) {
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('catalog.permissionError')
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }    
      return null;
    } 
    catch {
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
        type: `image/${fileType}`,
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
      if (!fileId) {
        console.log('No fileId provided for deletion');
        return false;
      }
      
      console.log('Deleting image with fileId:', fileId);
      
      const encodedFileId = encodeURIComponent(fileId);
      
      const response = await fetch(`https://api.imagekit.io/v1/files/${encodedFileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(EXPO_PUBLIC_IMAGEKIT_PRIVATE_KEY + ':'),
        },
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok && response.status !== 404) {
        const errorData = await response.json();
        console.error('Delete error details:', errorData);
        return false;
      }
      
      console.log('Image deleted successfully');
      return true;
    } 
    catch (error) {
      console.error('Error deleting image from ImageKit:', error);
      return false;
    }
  };

  return {
    loadImage,
    uploadToImageKit,
    deleteImageFromImageKit
  };
};
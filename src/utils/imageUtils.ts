import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface ImageData {
  id: string;
  base64: string;
  mimeType: string;
  originalName?: string;
}

/**
 * Convert image URI to base64 string for database storage
 */
export const convertImageToBase64 = async (uri: string): Promise<ImageData | null> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate a unique ID for the image
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine MIME type based on file extension
    const extension = uri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // default

    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
    }

    return {
      id: imageId,
      base64,
      mimeType,
      originalName: uri.split('/').pop(),
    };
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

/**
 * Convert base64 string back to data URI for display
 */
export const convertBase64ToDataUri = (imageData: ImageData): string => {
  return `data:${imageData.mimeType};base64,${imageData.base64}`;
};

/**
 * Convert base64 string with metadata to data URI for display
 */
export const convertBase64StringToDataUri = (base64: string, mimeType: string): string => {
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Convert multiple images to base64
 */
export const convertMultipleImagesToBase64 = async (uris: string[]): Promise<ImageData[]> => {
  const promises = uris.map(uri => convertImageToBase64(uri));
  const results = await Promise.all(promises);
  return results.filter((result): result is ImageData => result !== null);
};

/**
 * Compress and resize image before converting to base64
 * This helps reduce database storage size
 */
export const compressAndConvertImage = async (
  uri: string,
  maxWidth: number = 600,
  quality: number = 0.6
): Promise<ImageData | null> => {
  try {
    // Compress and resize the image
    const manipulatedImage = await manipulateAsync(
      uri,
      [
        { resize: { width: maxWidth } }, // Resize to max width, maintaining aspect ratio
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG, // Convert to JPEG for better compression
      }
    );

    // Convert the compressed image to base64
    return await convertImageToBase64(manipulatedImage.uri);
  } catch (error) {
    console.error('Error compressing and converting image:', error);
    // Fall back to basic conversion if compression fails
    return await convertImageToBase64(uri);
  }
};
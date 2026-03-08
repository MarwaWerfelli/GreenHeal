import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

/**
 * Image directory types
 */
export type ImageDirectory = 'room_photos' | 'journal_photos' | 'onboarding_photos';

/**
 * Get the directory path for a specific image type
 */
function getDirectoryPath(directory: ImageDirectory): string {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('Document directory not available');
  }
  return `${baseDir}greenheal/${directory}/`;
}

/**
 * Ensure directory exists, create if it doesn't
 */
async function ensureDirectoryExists(directory: ImageDirectory): Promise<void> {
  const dirPath = getDirectoryPath(directory);
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

/**
 * Generate a unique filename for an image
 */
function generateFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}.jpg`;
}

/**
 * Capture a photo using the device camera
 * Returns the URI of the captured photo, or null if cancelled
 */
export async function capturePhoto(): Promise<string | null> {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Camera permission denied');
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error capturing photo:', error);
    throw new Error('Failed to capture photo');
  }
}

/**
 * Pick images from the device gallery
 * Returns an array of URIs of selected images
 */
export async function pickFromGallery(allowsMultiple: boolean = false): Promise<string[]> {
  try {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Media library permission denied');
      return [];
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: allowsMultiple,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return [];
    }

    return result.assets.map(asset => asset.uri);
  } catch (error) {
    console.error('Error picking from gallery:', error);
    throw new Error('Failed to pick images from gallery');
  }
}

/**
 * Compress an image to reduce file size
 * Returns the URI of the compressed image
 */
export async function compressImage(uri: string, quality: number = 0.7): Promise<string> {
  try {
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1920 } }], // Resize to max width of 1920px, maintaining aspect ratio
      { compress: quality, format: SaveFormat.JPEG }
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Resize image for Stability AI API (max 3072x3072 pixels = 9.4 megapixels)
 * Returns the URI of the resized image
 */
export async function resizeForStabilityAI(uri: string): Promise<string> {
  try {
    const MAX_DIMENSION = 3072; // Stability AI max dimension
    
    // Get original image dimensions
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(
        uri,
        (w, h) => resolve({ width: w, height: h }),
        reject
      );
    });

    // If already within bounds, don't resize
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      console.log(`Image already within bounds: ${width}x${height}`);
      return uri;
    }

    // Resize based on the larger dimension to avoid upscaling
    const operations = width >= height
      ? [{ resize: { width: MAX_DIMENSION } }]
      : [{ resize: { height: MAX_DIMENSION } }];

    console.log(`Resizing image from ${width}x${height} to fit ${MAX_DIMENSION}px`);
    
    const manipResult = await manipulateAsync(
      uri,
      operations,
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    console.log(`Image resized successfully`);
    return manipResult.uri;
  } catch (error) {
    console.error('Error resizing image for Stability AI:', error);
    // Return original URI if resize fails
    return uri;
  }
}

/**
 * Save an image to the app's document directory
 * Returns the file path where the image was saved
 */
export async function saveImage(uri: string, directory: ImageDirectory): Promise<string> {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(directory);

    // Compress image before saving
    const compressedUri = await compressImage(uri);

    // Generate filename and destination path
    const filename = generateFilename();
    const destPath = getDirectoryPath(directory) + filename;

    // Copy file to destination
    await FileSystem.copyAsync({
      from: compressedUri,
      to: destPath,
    });

    return destPath;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

/**
 * Delete an image from the file system
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(path);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Check if an image exists at the given path
 */
export async function imageExists(path: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
}

/**
 * Get the size of an image file in bytes
 */
export async function getImageSize(path: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(path);
    
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting image size:', error);
    return 0;
  }
}

/**
 * Clean up orphaned images (images not referenced in database)
 * This should be called periodically to free up storage space
 */
export async function cleanupOrphanedImages(
  directory: ImageDirectory,
  referencedPaths: string[]
): Promise<number> {
  try {
    const dirPath = getDirectoryPath(directory);
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    
    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(dirPath);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = dirPath + file;
      
      // Check if this file is referenced
      const isReferenced = referencedPaths.some(ref => ref === filePath);
      
      if (!isReferenced) {
        await FileSystem.deleteAsync(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    return 0;
  }
}

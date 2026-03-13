import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

interface ImageDimensions {
  width: number;
  height: number;
}

interface UploadPreparationProfile {
  maxDimension: number;
  quality: number;
}

interface UploadPreparationOptions {
  maxBytes: number;
  profiles: UploadPreparationProfile[];
  logLabel: string;
}

const ANALYSIS_UPLOAD_PROFILES: UploadPreparationProfile[] = [
  { maxDimension: 1600, quality: 0.72 },
  { maxDimension: 1440, quality: 0.6 },
  { maxDimension: 1280, quality: 0.52 },
  { maxDimension: 1024, quality: 0.42 },
];

const VISUALIZATION_UPLOAD_PROFILES: UploadPreparationProfile[] = [
  { maxDimension: 2048, quality: 0.82 },
  { maxDimension: 1600, quality: 0.72 },
  { maxDimension: 1280, quality: 0.6 },
];

const ANALYSIS_UPLOAD_MAX_BYTES = 1_800_000;
const VISUALIZATION_UPLOAD_MAX_BYTES = 3_500_000;

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

async function getImageDimensions(uri: string): Promise<ImageDimensions | null> {
  try {
    return await new Promise<ImageDimensions>((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        reject
      );
    });
  } catch (error) {
    console.warn('Unable to read image dimensions, falling back to quality-only compression:', error);
    return null;
  }
}

function isWithinMaxDimension(dimensions: ImageDimensions | null, maxDimension: number): boolean {
  if (!dimensions) {
    return false;
  }

  return dimensions.width <= maxDimension && dimensions.height <= maxDimension;
}

function buildResizeOperations(
  dimensions: ImageDimensions | null,
  maxDimension: number
): { resize: { width?: number; height?: number } }[] {
  if (!dimensions || isWithinMaxDimension(dimensions, maxDimension)) {
    return [];
  }

  return dimensions.width >= dimensions.height
    ? [{ resize: { width: maxDimension } }]
    : [{ resize: { height: maxDimension } }];
}

async function prepareImageForUpload(
  uri: string,
  { maxBytes, profiles, logLabel }: UploadPreparationOptions
): Promise<string> {
  try {
    const originalSize = await getImageSize(uri);
    const dimensions = await getImageDimensions(uri);
    const firstProfile = profiles[0];

    if (
      originalSize > 0 &&
      originalSize <= maxBytes &&
      isWithinMaxDimension(dimensions, firstProfile.maxDimension)
    ) {
      return uri;
    }

    let latestUri = uri;

    for (const profile of profiles) {
      const operations = buildResizeOperations(dimensions, profile.maxDimension);
      const manipResult = await manipulateAsync(uri, operations, {
        compress: profile.quality,
        format: SaveFormat.JPEG,
      });

      latestUri = manipResult.uri;
      const candidateSize = await getImageSize(latestUri);

      console.log(
        `[IMAGE] Prepared ${logLabel}: ${candidateSize || 'unknown'} bytes at ${profile.maxDimension}px / q=${profile.quality}`
      );

      if (candidateSize === 0 || candidateSize <= maxBytes) {
        return latestUri;
      }
    }

    return latestUri;
  } catch (error) {
    console.error(`Error preparing ${logLabel}:`, error);
    return uri;
  }
}

/**
 * Prepare an image for analysis upload.
 * This path is more aggressive because the request body uses base64 JSON.
 */
export async function prepareImageForAnalysisUpload(uri: string): Promise<string> {
  return prepareImageForUpload(uri, {
    maxBytes: ANALYSIS_UPLOAD_MAX_BYTES,
    profiles: ANALYSIS_UPLOAD_PROFILES,
    logLabel: 'analysis upload',
  });
}

/**
 * Prepare an image for visualization upload.
 * This path still compresses, but keeps a bit more detail for multipart uploads.
 */
export async function prepareImageForVisualizationUpload(uri: string): Promise<string> {
  return prepareImageForUpload(uri, {
    maxBytes: VISUALIZATION_UPLOAD_MAX_BYTES,
    profiles: VISUALIZATION_UPLOAD_PROFILES,
    logLabel: 'visualization upload',
  });
}

/**
 * Legacy helper kept for compatibility with existing call sites.
 * Uses the visualization upload profile to keep Stability AI uploads smaller and safer.
 */
export async function resizeForStabilityAI(uri: string): Promise<string> {
  return prepareImageForVisualizationUpload(uri);
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

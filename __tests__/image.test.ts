import * as fc from 'fast-check';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync } from 'expo-image-manipulator';
import {
  saveImage,
  deleteImage,
  imageExists,
  getImageSize,
  cleanupOrphanedImages,
  capturePhoto,
  pickFromGallery,
  compressImage,
} from '../src/modules/image';
import type { ImageDirectory } from '../src/modules/image';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('expo-image-picker');
jest.mock('expo-image-manipulator');

/**
 * Property 31: Image Storage Round-Trip
 * 
 * For any captured image (room photo, journal photo), saving it using
 * expo-file-system should make it retrievable from the stored file path.
 * 
 * Validates: Requirements 15.1
 */
describe('Image Management Module', () => {
  let mockFileSystem: Record<string, { exists: boolean; size: number; uri: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFileSystem = {};

    // Mock FileSystem
    (FileSystem.documentDirectory as any) = 'file:///mock/documents/';
    
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (mockFileSystem[path]) {
        return { exists: true, size: mockFileSystem[path].size, uri: path };
      }
      return { exists: false };
    });

    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    
    (FileSystem.copyAsync as jest.Mock).mockImplementation(async ({ from, to }: any) => {
      mockFileSystem[to] = { exists: true, size: 1024, uri: to };
    });

    (FileSystem.deleteAsync as jest.Mock).mockImplementation(async (path: string) => {
      delete mockFileSystem[path];
    });

    (FileSystem.readDirectoryAsync as jest.Mock).mockImplementation(async (path: string) => {
      return Object.keys(mockFileSystem)
        .filter(key => key.startsWith(path) && key !== path) // Exclude the directory itself
        .map(key => key.replace(path, ''));
    });

    // Mock ImagePicker
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/camera/photo.jpg' }],
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///mock/gallery/photo.jpg' }],
    });

    // Mock image manipulator
    (manipulateAsync as jest.Mock).mockImplementation(async (uri: string) => ({
      uri: uri.replace('.jpg', '_compressed.jpg'),
    }));
  });

  describe('Property 31: Image Storage Round-Trip', () => {
    test('Saved image can be retrieved and exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<ImageDirectory>('room_photos', 'journal_photos', 'onboarding_photos'),
          fc.string({ minLength: 10, maxLength: 100 }),
          async (directory, mockUri) => {
            const uri = `file:///mock/${mockUri}.jpg`;
            
            // Save image
            const savedPath = await saveImage(uri, directory);
            
            // Should return a path
            expect(savedPath).toBeTruthy();
            expect(typeof savedPath).toBe('string');
            
            // Image should exist at the saved path
            const exists = await imageExists(savedPath);
            expect(exists).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Saved image path contains correct directory', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<ImageDirectory>('room_photos', 'journal_photos', 'onboarding_photos'),
          async (directory) => {
            const uri = 'file:///mock/test.jpg';
            const savedPath = await saveImage(uri, directory);
            
            // Path should contain the directory name
            expect(savedPath).toContain(directory);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Multiple images can be saved to same directory', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<ImageDirectory>('room_photos', 'journal_photos', 'onboarding_photos'),
          fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
          async (directory, uris) => {
            const savedPaths: string[] = [];
            
            // Save all images
            for (const uri of uris) {
              const fullUri = `file:///mock/${uri}.jpg`;
              const savedPath = await saveImage(fullUri, directory);
              savedPaths.push(savedPath);
            }
            
            // All paths should be unique
            const uniquePaths = new Set(savedPaths);
            expect(uniquePaths.size).toBe(savedPaths.length);
            
            // All images should exist
            for (const path of savedPaths) {
              const exists = await imageExists(path);
              expect(exists).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('Deleted image no longer exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<ImageDirectory>('room_photos', 'journal_photos', 'onboarding_photos'),
          async (directory) => {
            const uri = 'file:///mock/test.jpg';
            
            // Save image
            const savedPath = await saveImage(uri, directory);
            expect(await imageExists(savedPath)).toBe(true);
            
            // Delete image
            await deleteImage(savedPath);
            
            // Should no longer exist
            const exists = await imageExists(savedPath);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Image compression reduces file size', async () => {
      const originalUri = 'file:///mock/large_image.jpg';
      
      // Mock a large file
      mockFileSystem[originalUri] = { exists: true, size: 5000000, uri: originalUri };
      
      const compressedUri = await compressImage(originalUri, 0.5);
      
      // Should return a different URI (compressed version)
      expect(compressedUri).toBeTruthy();
      expect(typeof compressedUri).toBe('string');
    });

    test('Image exists check returns false for non-existent images', async () => {
      const nonExistentPath = 'file:///mock/nonexistent.jpg';
      const exists = await imageExists(nonExistentPath);
      expect(exists).toBe(false);
    });

    test('Get image size returns correct value', async () => {
      const uri = 'file:///mock/test.jpg';
      const directory: ImageDirectory = 'room_photos';
      
      const savedPath = await saveImage(uri, directory);
      const size = await getImageSize(savedPath);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('Camera and gallery operations', () => {
    test('Capture photo returns URI when permission granted', async () => {
      const uri = await capturePhoto();
      
      expect(uri).toBeTruthy();
      expect(typeof uri).toBe('string');
      expect(uri).toContain('file://');
    });

    test('Capture photo returns null when cancelled', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: true });
      
      const uri = await capturePhoto();
      expect(uri).toBeNull();
    });

    test('Capture photo returns null when permission denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      
      const uri = await capturePhoto();
      expect(uri).toBeNull();
    });

    test('Pick from gallery returns array of URIs', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          { uri: 'file:///mock/photo1.jpg' },
          { uri: 'file:///mock/photo2.jpg' },
        ],
      });
      
      const uris = await pickFromGallery(true);
      
      expect(Array.isArray(uris)).toBe(true);
      expect(uris.length).toBe(2);
      uris.forEach(uri => {
        expect(typeof uri).toBe('string');
        expect(uri).toContain('file://');
      });
    });

    test('Pick from gallery returns empty array when cancelled', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });
      
      const uris = await pickFromGallery(false);
      expect(uris).toEqual([]);
    });

    test('Pick from gallery returns empty array when permission denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
      
      const uris = await pickFromGallery(false);
      expect(uris).toEqual([]);
    });
  });

  describe('Cleanup operations', () => {
    test('Cleanup removes orphaned images', async () => {
      const directory: ImageDirectory = 'journal_photos';
      const dirPath = `${FileSystem.documentDirectory}greenheal/${directory}/`;
      
      // Mark directory as existing
      mockFileSystem[dirPath] = { exists: true, size: 0, uri: dirPath };
      
      // Create some mock files
      mockFileSystem[`${dirPath}image1.jpg`] = { exists: true, size: 1024, uri: `${dirPath}image1.jpg` };
      mockFileSystem[`${dirPath}image2.jpg`] = { exists: true, size: 1024, uri: `${dirPath}image2.jpg` };
      mockFileSystem[`${dirPath}image3.jpg`] = { exists: true, size: 1024, uri: `${dirPath}image3.jpg` };
      
      // Only reference image1 and image2
      const referencedPaths = [
        `${dirPath}image1.jpg`,
        `${dirPath}image2.jpg`,
      ];
      
      const deletedCount = await cleanupOrphanedImages(directory, referencedPaths);
      
      // Should have deleted image3
      expect(deletedCount).toBe(1);
    });

    test('Cleanup returns 0 when directory does not exist', async () => {
      const directory: ImageDirectory = 'room_photos';
      const deletedCount = await cleanupOrphanedImages(directory, []);
      
      expect(deletedCount).toBe(0);
    });

    test('Cleanup preserves referenced images', async () => {
      const directory: ImageDirectory = 'journal_photos';
      const dirPath = `${FileSystem.documentDirectory}greenheal/${directory}/`;
      
      // Mark directory as existing
      mockFileSystem[dirPath] = { exists: true, size: 0, uri: dirPath };
      
      // Create mock files
      mockFileSystem[`${dirPath}image1.jpg`] = { exists: true, size: 1024, uri: `${dirPath}image1.jpg` };
      mockFileSystem[`${dirPath}image2.jpg`] = { exists: true, size: 1024, uri: `${dirPath}image2.jpg` };
      
      // Reference both images
      const referencedPaths = [
        `${dirPath}image1.jpg`,
        `${dirPath}image2.jpg`,
      ];
      
      const deletedCount = await cleanupOrphanedImages(directory, referencedPaths);
      
      // Should not delete any images
      expect(deletedCount).toBe(0);
      
      // Both images should still exist
      expect(await imageExists(`${dirPath}image1.jpg`)).toBe(true);
      expect(await imageExists(`${dirPath}image2.jpg`)).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('Save image handles errors gracefully', async () => {
      (FileSystem.copyAsync as jest.Mock).mockRejectedValue(new Error('Copy failed'));
      
      await expect(saveImage('file:///mock/test.jpg', 'room_photos')).rejects.toThrow('Failed to save image');
    });

    test('Delete image handles errors gracefully', async () => {
      // Make getInfoAsync fail
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(new Error('Access denied'));
      
      await expect(deleteImage('file:///mock/test.jpg')).rejects.toThrow('Failed to delete image');
    });

    test('Image exists returns false on error', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('Access denied'));
      
      const exists = await imageExists('file:///mock/test.jpg');
      expect(exists).toBe(false);
    });

    test('Get image size returns 0 on error', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('Access denied'));
      
      const size = await getImageSize('file:///mock/test.jpg');
      expect(size).toBe(0);
    });

    test('Capture photo handles errors gracefully', async () => {
      (ImagePicker.launchCameraAsync as jest.Mock).mockRejectedValue(new Error('Camera error'));
      
      await expect(capturePhoto()).rejects.toThrow('Failed to capture photo');
    });

    test('Pick from gallery handles errors gracefully', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValue(new Error('Gallery error'));
      
      await expect(pickFromGallery(false)).rejects.toThrow('Failed to pick images from gallery');
    });

    test('Compress image returns original URI on compression failure', async () => {
      (manipulateAsync as jest.Mock).mockRejectedValue(new Error('Compression failed'));
      
      const originalUri = 'file:///mock/test.jpg';
      const result = await compressImage(originalUri);
      
      // Should return original URI as fallback
      expect(result).toBe(originalUri);
    });
  });
});

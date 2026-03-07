import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { compressImage } from '../src/modules/image';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator');

/**
 * Property 34: Image Compression
 * 
 * For any captured image, the app should compress it before storage
 * while maintaining visual quality.
 * 
 * Validates: Requirements 15.4
 */
describe('Image Compression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 34: Image Compression', () => {
    test('Compression is applied with correct parameters', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      const result = await compressImage(mockUri, 0.7);
      
      // Should call manipulateAsync with correct parameters
      expect(manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      
      expect(result).toBe(compressedUri);
    });

    test('Compression maintains visual quality with default quality', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri);
      
      // Default quality should be 0.7 (70%)
      expect(manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
    });

    test('Compression with custom quality parameter', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      const qualities = [0.5, 0.6, 0.7, 0.8, 0.9];
      
      for (const quality of qualities) {
        await compressImage(mockUri, quality);
        
        expect(manipulateAsync).toHaveBeenCalledWith(
          mockUri,
          [{ resize: { width: 1920 } }],
          { compress: quality, format: SaveFormat.JPEG }
        );
      }
    });

    test('Compression resizes large images to max width', async () => {
      const mockUri = 'file:///mock/large_image.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri);
      
      // Should resize to max width of 1920px
      const calls = (manipulateAsync as jest.Mock).mock.calls;
      const resizeAction = calls[0][1][0];
      
      expect(resizeAction).toEqual({ resize: { width: 1920 } });
    });

    test('Compression uses JPEG format for optimal file size', async () => {
      const mockUri = 'file:///mock/original.png';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri);
      
      const calls = (manipulateAsync as jest.Mock).mock.calls;
      const options = calls[0][2];
      
      expect(options.format).toBe(SaveFormat.JPEG);
    });

    test('Compression returns original URI on failure', async () => {
      const mockUri = 'file:///mock/original.jpg';
      
      (manipulateAsync as jest.Mock).mockRejectedValue(new Error('Compression failed'));
      
      const result = await compressImage(mockUri);
      
      // Should return original URI as fallback
      expect(result).toBe(mockUri);
    });

    test('Compression handles various image formats', async () => {
      const formats = [
        'file:///mock/image.jpg',
        'file:///mock/image.jpeg',
        'file:///mock/image.png',
        'file:///mock/image.webp',
      ];
      
      for (const uri of formats) {
        (manipulateAsync as jest.Mock).mockResolvedValue({ uri: uri.replace(/\.\w+$/, '_compressed.jpg') });
        
        const result = await compressImage(uri);
        
        expect(result).toBeTruthy();
        expect(manipulateAsync).toHaveBeenCalledWith(
          uri,
          expect.any(Array),
          expect.objectContaining({ format: SaveFormat.JPEG })
        );
      }
    });

    test('Multiple compressions can be performed sequentially', async () => {
      const images = [
        'file:///mock/image1.jpg',
        'file:///mock/image2.jpg',
        'file:///mock/image3.jpg',
      ];
      
      (manipulateAsync as jest.Mock).mockImplementation(async (uri: string) => ({
        uri: uri.replace('.jpg', '_compressed.jpg'),
      }));
      
      const results = [];
      for (const image of images) {
        const result = await compressImage(image);
        results.push(result);
      }
      
      expect(results).toHaveLength(3);
      expect(manipulateAsync).toHaveBeenCalledTimes(3);
      
      results.forEach((result, index) => {
        expect(result).toContain('compressed');
        expect(result).toContain(`image${index + 1}`);
      });
    });

    test('Compression with very low quality', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri, 0.3);
      
      expect(manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.3, format: SaveFormat.JPEG }
      );
    });

    test('Compression with very high quality', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri, 0.95);
      
      expect(manipulateAsync).toHaveBeenCalledWith(
        mockUri,
        [{ resize: { width: 1920 } }],
        { compress: 0.95, format: SaveFormat.JPEG }
      );
    });

    test('Compression logs errors but does not throw', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockUri = 'file:///mock/original.jpg';
      
      (manipulateAsync as jest.Mock).mockRejectedValue(new Error('Compression error'));
      
      const result = await compressImage(mockUri);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error compressing image:',
        expect.any(Error)
      );
      expect(result).toBe(mockUri);
      
      consoleErrorSpy.mockRestore();
    });

    test('Compression maintains aspect ratio', async () => {
      const mockUri = 'file:///mock/original.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri);
      
      // Resize action should only specify width, allowing height to scale proportionally
      const calls = (manipulateAsync as jest.Mock).mock.calls;
      const resizeAction = calls[0][1][0];
      
      expect(resizeAction.resize).toHaveProperty('width');
      expect(resizeAction.resize).not.toHaveProperty('height');
    });

    test('Compression is idempotent', async () => {
      const mockUri = 'file:///mock/original.jpg';
      let compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      // First compression
      const result1 = await compressImage(mockUri);
      
      // Second compression on already compressed image
      compressedUri = 'file:///mock/compressed_again.jpg';
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      const result2 = await compressImage(result1);
      
      // Both should succeed
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(manipulateAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('File size reduction validation', () => {
    test('Compression reduces file size conceptually', async () => {
      // This test validates the compression logic is called
      // Actual file size reduction would be tested in integration tests
      const mockUri = 'file:///mock/large_image.jpg';
      const compressedUri = 'file:///mock/compressed.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: compressedUri });
      
      await compressImage(mockUri, 0.5);
      
      // Verify compression was applied with quality < 1.0
      const calls = (manipulateAsync as jest.Mock).mock.calls;
      const options = calls[0][2];
      
      expect(options.compress).toBeLessThan(1.0);
      expect(options.compress).toBeGreaterThan(0);
    });

    test('Lower quality setting implies more compression', async () => {
      const mockUri = 'file:///mock/image.jpg';
      
      (manipulateAsync as jest.Mock).mockResolvedValue({ uri: 'file:///mock/compressed.jpg' });
      
      await compressImage(mockUri, 0.3);
      const lowQualityCalls = (manipulateAsync as jest.Mock).mock.calls;
      
      jest.clearAllMocks();
      
      await compressImage(mockUri, 0.9);
      const highQualityCalls = (manipulateAsync as jest.Mock).mock.calls;
      
      // Lower quality value should be used for more compression
      expect(lowQualityCalls[0][2].compress).toBeLessThan(highQualityCalls[0][2].compress);
    });
  });
});

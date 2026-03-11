import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import CameraScreen from '../src/screens/CameraScreen';
import { pickFromGallery } from '../src/modules/image';

// Mock modules
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../src/modules/image', () => ({
  pickFromGallery: jest.fn(),
}));

// Mock expo-camera
const mockRequestPermission = jest.fn();
const mockTakePictureAsync = jest.fn();

jest.mock('expo-camera', () => ({
  CameraView: ({ children }: any) => <>{children}</>,
  useCameraPermissions: () => [
    { granted: false, canAskAgain: true },
    mockRequestPermission,
  ],
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
} as any;
const mockedPickFromGallery = pickFromGallery as jest.MockedFunction<typeof pickFromGallery>;

// Mock Alert and Linking
jest.spyOn(Alert, 'alert');
jest.spyOn(Linking, 'openSettings').mockResolvedValue(true);

describe('Camera Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPickFromGallery.mockResolvedValue([]);
  });

  describe('Unit tests for camera permissions', () => {
    test('Shows permission request when permission not granted', () => {
      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      expect(getByText('permissions.camera_required')).toBeTruthy();
      expect(getByText('permissions.camera_explanation')).toBeTruthy();
    });

    test('Shows open settings button when permission denied', () => {
      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      const settingsButton = getByText('common.open_settings');
      expect(settingsButton).toBeTruthy();
      expect(getByText('camera.chooseFromGallery')).toBeTruthy();
    });

    test('Requests permission when button pressed', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });
      
      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      const settingsButton = getByText('common.open_settings');
      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    test('Shows alert when permission denied', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });
      
      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      const settingsButton = getByText('common.open_settings');
      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'permissions.camera_required',
          'camera.permissionDenied',
          expect.any(Array)
        );
      });
    });

    test('Opens settings when user confirms in alert', async () => {
      mockRequestPermission.mockResolvedValue({ granted: false });
      
      // Mock Alert.alert to call the onPress of the second button
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });
      
      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      const settingsButton = getByText('common.open_settings');
      fireEvent.press(settingsButton);

      await waitFor(() => {
        expect(Linking.openSettings).toHaveBeenCalled();
      });
    });
  });

  describe('Camera functionality', () => {
    test('Shows camera view when permission granted', () => {
      // Mock permission as granted
      jest.spyOn(require('expo-camera'), 'useCameraPermissions').mockReturnValue([
        { granted: true },
        mockRequestPermission,
      ]);

      const { queryByText } = render(<CameraScreen navigation={mockNavigation} />);
      
      // Should not show permission request
      expect(queryByText('permissions.camera_required')).toBeNull();
    });

    test('Allows selecting a gallery image and continuing to analysis', async () => {
      jest.spyOn(require('expo-camera'), 'useCameraPermissions').mockReturnValue([
        { granted: true },
        mockRequestPermission,
      ]);
      mockedPickFromGallery.mockResolvedValue(['file://gallery-room.jpg']);

      const { getByText } = render(<CameraScreen navigation={mockNavigation} />);

      fireEvent.press(getByText('camera.chooseFromGallery'));

      await waitFor(() => {
        expect(mockedPickFromGallery).toHaveBeenCalledWith(false);
        expect(getByText('camera.usePhoto')).toBeTruthy();
      });

      fireEvent.press(getByText('camera.usePhoto'));

      expect(mockNavigate).toHaveBeenCalledWith('AIAnalysis', {
        imageUri: 'file://gallery-room.jpg',
      });
    });
  });
});

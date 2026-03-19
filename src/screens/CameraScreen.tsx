import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { CameraScreenProps } from '../types';
import { pickFromGallery, prepareImageForAnalysisUpload } from '../modules/image';

const colors = DESIGN_SYSTEM.colors;
const shadows = DESIGN_SYSTEM.shadows;

export default function CameraScreen({ navigation, route }: CameraScreenProps) {
  const { t } = useTranslation();
  const guidedContext = route?.params?.guidedContext;
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Handle permission request
  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        t('permissions.camera_required'),
        t('camera.permissionDenied'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.open_settings'),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  // Capture photo
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          setCapturedPhoto(photo.uri);
        }
      } catch (error) {
        console.error('Error capturing photo:', error);
        Alert.alert(t('errors.generic'));
      }
    }
  };

  // Use captured photo
  const handleUsePhoto = async () => {
    if (!capturedPhoto || preparingPhoto) {
      return;
    }

    try {
      setPreparingPhoto(true);
      const preparedPhotoUri = await prepareImageForAnalysisUpload(capturedPhoto);
      navigation.navigate('AIAnalysis', { imageUri: preparedPhotoUri, guidedContext });
    } catch (error) {
      console.error('Error preparing photo for analysis:', error);
      Alert.alert(t('errors.generic'));
    } finally {
      setPreparingPhoto(false);
    }
  };

  // Pick photo from gallery
  const handleChooseFromGallery = async () => {
    try {
      const results = await pickFromGallery(false);
      if (results.length > 0) {
        setCapturedPhoto(results[0]);
      }
    } catch (error) {
      console.error('Error picking photo from gallery:', error);
      Alert.alert(t('errors.generic'));
    }
  };

  // Retake photo
  const handleRetake = () => {
    if (preparingPhoto) {
      return;
    }

    setCapturedPhoto(null);
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.permissionTitle}>
            {t('permissions.camera_required')}
          </Text>
          <Text style={styles.permissionText}>
            {t('permissions.camera_explanation')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>
              {t('common.open_settings')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, styles.galleryButton]}
            onPress={handleChooseFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>
              {t('camera.chooseFromGallery')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show preview if photo captured
  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.retakeButton]}
            onPress={handleRetake}
            disabled={preparingPhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.useButton,
              preparingPhoto && styles.controlButtonDisabled,
            ]}
            onPress={handleUsePhoto}
            disabled={preparingPhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>
              {preparingPhoto ? t('common.loading') : t('camera.usePhoto')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show camera view
  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.cameraOverlayTop}>
          <Text style={styles.cameraHint}>
            {t('camera.hint') || 'Aim at the main area of your room for the best analysis.'}
          </Text>
        </View>
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.galleryActionButton}
            onPress={handleChooseFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.galleryActionButtonText}>
              {t('camera.chooseFromGallery')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 220,
    alignItems: 'center',
    ...shadows.small,
  },
  galleryButton: {
    marginTop: 12,
    backgroundColor: colors.secondary,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bgSurface,
  },
  camera: {
    flex: 1,
  },
  cameraOverlayTop: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cameraHint: {
    fontSize: 12,
    color: colors.bgSurface,
    textAlign: 'center',
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  galleryActionButton: {
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  galleryActionButtonText: {
    color: colors.bgSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  controlButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 140,
  },
  controlButtonDisabled: {
    opacity: 0.7,
  },
  retakeButton: {
    backgroundColor: colors.overlay,
  },
  useButton: {
    backgroundColor: colors.primary,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.bgSurface,
    textAlign: 'center',
  },
});

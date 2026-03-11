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
import { COLORS } from '../utils/constants';
import type { CameraScreenProps } from '../types';
import { pickFromGallery } from '../modules/image';

export default function CameraScreen({ navigation }: CameraScreenProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
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
  const handleUsePhoto = () => {
    if (capturedPhoto) {
      // Navigate to AI Analysis screen with the photo
      navigation.navigate('AIAnalysis', { imageUri: capturedPhoto });
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
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.useButton]}
            onPress={handleUsePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>{t('camera.usePhoto')}</Text>
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
    backgroundColor: COLORS.text,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.white,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  galleryButton: {
    marginTop: 12,
    backgroundColor: COLORS.textSecondary,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
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
    backgroundColor: COLORS.black + '55',
  },
  cameraHint: {
    fontSize: 12,
    color: COLORS.white,
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
    backgroundColor: COLORS.black + '77',
  },
  galleryActionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
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
  retakeButton: {
    backgroundColor: COLORS.textSecondary,
  },
  useButton: {
    backgroundColor: COLORS.primary,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
});

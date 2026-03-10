import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomVisualizationScreenProps } from '../types';
import { DESIGN_SYSTEM } from '../utils/constants';
import Constants from 'expo-constants';

const BACKEND_URL =
  Constants.expoConfig?.extra?.BACKEND_URL || 'http://localhost:3000';

// ─── Before / After Slider ───────────────────────────────────────────────────
function BeforeAfterSlider({
  beforeUri,
  afterUri,
}: {
  beforeUri: string;
  afterUri: string;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const sliderX = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const next = Math.max(0, Math.min(containerWidth, currentX.current + gs.dx));
        sliderX.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        currentX.current = Math.max(
          0,
          Math.min(containerWidth, currentX.current + gs.dx)
        );
      },
    })
  ).current;

  function onLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(w);
    currentX.current = w / 2;
    sliderX.setValue(w / 2);
  }

  const clipWidth = sliderX.interpolate({
    inputRange: [0, Math.max(containerWidth, 1)],
    outputRange: [0, Math.max(containerWidth, 1)],
    extrapolate: 'clamp',
  });

  return (
    <View style={sliderStyles.wrapper} onLayout={onLayout}>
      {/* After image — full width, at the back */}
      <Image source={{ uri: afterUri }} style={sliderStyles.fullImage} resizeMode="cover" />

      {/* Before image — clipped to left of the divider */}
      <Animated.View style={[sliderStyles.clip, { width: clipWidth }]}>
        <Image
          source={{ uri: beforeUri }}
          style={[sliderStyles.fullImage, { width: containerWidth || '100%' }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Divider line */}
      <Animated.View
        style={[sliderStyles.divider, { left: sliderX }]}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.handle}>
          <Text style={sliderStyles.handleArrows}>{'◀  ▶'}</Text>
        </View>
      </Animated.View>

      {/* Labels */}
      <View style={sliderStyles.labelBefore} pointerEvents="none">
        <Text style={sliderStyles.labelText}>Before</Text>
      </View>
      <View style={sliderStyles.labelAfter} pointerEvents="none">
        <Text style={sliderStyles.labelText}>After</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginTop: 16,
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
  },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  handleArrows: {
    fontSize: 12,
    color: '#2D6A4F',
    fontWeight: 'bold',
  },
  labelBefore: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelAfter: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(45,106,79,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RoomVisualizationScreen({
  route,
}: RoomVisualizationScreenProps) {
  const { imageUri, recommendations } = route.params;
  const { t } = useTranslation();
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fixed positions for plant icons overlay
  const plantPositions: Array<{ left: string; top: string }> = [
    { left: '15%', top: '25%' },
    { left: '65%', top: '40%' },
    { left: '25%', top: '70%' },
  ];

  async function handleGenerateAIVisualization() {
    if (!recommendations.length) {
      Alert.alert(t('common.error'), 'No plant recommendations available', [
        { text: t('common.ok') },
      ]);
      return;
    }

    try {
      console.log('[ROOM_VIZ] Starting AI visualization...');
      setGenerating(true);

      const plantDescriptions = recommendations
        .map((p) => `${p.name} (${p.placement})`)
        .join(', ');

      // Send image + plant info to the backend which uploads to a host then calls Decor8
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'room.jpg',
      } as any);
      formData.append('plantDescriptions', plantDescriptions);
      formData.append('roomType', 'livingroom');

      console.log('[ROOM_VIZ] Posting to backend /api/visualize...');

      const response = await fetch(`${BACKEND_URL}/api/visualize`, {
        method: 'POST',
        body: formData,
      });

      console.log('[ROOM_VIZ] Backend response status:', response.status);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || `Backend error ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('No image URL returned from backend');
      }

      console.log('[ROOM_VIZ] Generated image URL:', data.imageUrl);
      setAiImageUrl(data.imageUrl);

      Alert.alert(
        t('common.success'),
        'Your room has been beautifully redesigned with healing plants! 🌿',
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('[ROOM_VIZ] Error:', error.message);

      let msg = 'Failed to generate visualization. Please try again.';
      if (error.message?.toLowerCase().includes('network') || error.message?.includes('fetch')) {
        msg = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        msg = 'API authentication failed. Please verify API keys on the backend.';
      } else if (error.message?.includes('429')) {
        msg = 'Rate limit reached. Please wait a moment and try again.';
      } else if (error.message) {
        msg = error.message;
      }

      Alert.alert('Generation Error', msg, [{ text: t('common.ok') }]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{t('aiAnalysis.yourRoom')}</Text>
      <Text style={styles.subtitle}>{t('aiAnalysis.placementSuggestions')}</Text>

      {/* Room Photo with Plant Icons Overlay */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.roomImage}
          imageStyle={styles.roomImageStyle}
        >
          {recommendations.slice(0, 3).map((plant, index) => {
            const pos = plantPositions[index] || plantPositions[0];
            return (
              <View
                key={index}
                style={[styles.plantIcon, { left: pos.left as any, top: pos.top as any }]}
              >
                <View style={styles.plantIconCircle}>
                  <Text style={styles.plantEmoji}>🪴</Text>
                </View>
                <View style={styles.plantLabelContainer}>
                  <Text style={styles.plantLabel} numberOfLines={1}>
                    {plant.name}
                  </Text>
                </View>
              </View>
            );
          })}
        </ImageBackground>
      </View>

      {/* Plant Placement Details */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          📍 {t('aiAnalysis.suggestedPlacements')}
        </Text>
        {recommendations.map((plant, index) => (
          <View key={index} style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>🪴</Text>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.plantPlacement}>{plant.placement}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* AI Visualization Section */}
      <View style={styles.aiSection}>
        <Text style={styles.aiTitle}>✨ {t('aiAnalysis.aiExampleTitle')}</Text>
        <Text style={styles.aiSubtitle}>{t('aiAnalysis.aiExampleSubtitle')}</Text>

        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateAIVisualization}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator
                size="small"
                color={DESIGN_SYSTEM.colors.bgSurface}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.generateButtonText}>
                {t('aiAnalysis.generating')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.generateButtonIcon}>🎨</Text>
              <Text style={styles.generateButtonText}>
                {aiImageUrl
                  ? t('aiAnalysis.regenerateExample')
                  : t('aiAnalysis.generateExample')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Before / After Slider */}
        {aiImageUrl && (
          <View style={styles.aiImageContainer}>
            <Text style={styles.aiImageLabel}>
              {t('aiAnalysis.aiGeneratedExample')}
            </Text>
            <BeforeAfterSlider beforeUri={imageUri} afterUri={aiImageUrl} />
            <Text style={styles.aiImageNote}>
              Drag the slider to compare before & after · {t('aiAnalysis.exampleNote')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  roomImageStyle: {
    resizeMode: 'cover',
  },
  plantIcon: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  plantIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  plantEmoji: {
    fontSize: 32,
  },
  plantLabelContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(45, 106, 79, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  plantLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.bgSurface,
    textAlign: 'center',
  },
  suggestionsContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.bgBase,
  },
  suggestionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 4,
  },
  plantPlacement: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 20,
  },
  aiSection: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 8,
  },
  aiSubtitle: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  aiImageContainer: {
    marginTop: 20,
  },
  aiImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 4,
  },
  aiImageNote: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});

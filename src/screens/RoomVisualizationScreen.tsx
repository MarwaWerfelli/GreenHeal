import React, { useState } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PlantRecommendation, RoomVisualizationScreenProps } from '../types';
import { DESIGN_SYSTEM } from '../utils/constants';
import Constants from 'expo-constants';
import { prepareImageForVisualizationUpload } from '../modules/image';

const BACKEND_URL =
  Constants.expoConfig?.extra?.BACKEND_URL || 'http://localhost:3000';

type PlacementPreview = {
  left: string;
  top: string;
  mode: 'corner' | 'hanging' | 'wall' | 'shelf' | 'table' | 'window';
  guidance: string;
  maskCenterX: number;
  maskCenterY: number;
  maskWidth: number;
  maskHeight: number;
};

type VisualizationStylePreset =
  | 'balancedModern'
  | 'wallGrid'
  | 'hanging'
  | 'shelfStyling'
  | 'cornerRetreat';

const STYLE_PRESETS: Array<{ id: VisualizationStylePreset; emoji: string }> = [
  { id: 'balancedModern', emoji: '✨' },
  { id: 'wallGrid', emoji: '🧱' },
  { id: 'hanging', emoji: '🪴' },
  { id: 'shelfStyling', emoji: '🪵' },
  { id: 'cornerRetreat', emoji: '🛋️' },
];

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function isValidRecommendation(value: unknown): value is PlantRecommendation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PlantRecommendation>;

  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.placement === 'string' &&
    candidate.placement.trim().length > 0
  );
}

function getPlacementPreview(placement: string): PlacementPreview {
  const normalized = placement.toLowerCase();

  if (includesAnyKeyword(normalized, ['hanging', 'ceiling', 'suspended', 'pendant', 'macrame'])) {
    return {
      left: '52%',
      top: '14%',
      mode: 'hanging',
      guidance: 'Ceiling-hung styling with slim visible support, compact scale, and no floating look.',
      maskCenterX: 0.56,
      maskCenterY: 0.18,
      maskWidth: 0.16,
      maskHeight: 0.24,
    };
  }

  if (includesAnyKeyword(normalized, ['wall', 'mounted', 'mount', 'grid', 'frame', 'geometric', 'modular', 'rail'])) {
    return {
      left: '70%',
      top: '29%',
      mode: 'wall',
      guidance: 'Geometric wall-planter styling with visible support, restrained size, and realistic shadow.',
      maskCenterX: 0.72,
      maskCenterY: 0.34,
      maskWidth: 0.18,
      maskHeight: 0.24,
    };
  }

  if (includesAnyKeyword(normalized, ['shelf', 'bookcase', 'ledge', 'mantel', 'etagere'])) {
    return {
      left: '68%',
      top: '33%',
      mode: 'shelf',
      guidance: 'Placed neatly on a shelf or ledge with compact scale, depth, and believable contact shadow.',
      maskCenterX: 0.68,
      maskCenterY: 0.35,
      maskWidth: 0.16,
      maskHeight: 0.18,
    };
  }

  if (includesAnyKeyword(normalized, ['table', 'desk', 'counter', 'nightstand', 'console', 'coffee table', 'side table'])) {
    return {
      left: '58%',
      top: '52%',
      mode: 'table',
      guidance: 'Placed on furniture with a modest footprint so the surface still feels open, elegant, and grounded.',
      maskCenterX: 0.58,
      maskCenterY: 0.56,
      maskWidth: 0.15,
      maskHeight: 0.17,
    };
  }

  if (includesAnyKeyword(normalized, ['window', 'sill', 'bay window'])) {
    return {
      left: '24%',
      top: '28%',
      mode: 'window',
      guidance: 'Positioned near natural light with a restrained size and minimal visual clutter.',
      maskCenterX: 0.24,
      maskCenterY: 0.32,
      maskWidth: 0.14,
      maskHeight: 0.2,
    };
  }

  return {
    left: '78%',
    top: '74%',
    mode: 'corner',
    guidance: 'Placed as a calm corner feature with a grounded modern planter and subtle contact shadow.',
    maskCenterX: 0.78,
    maskCenterY: 0.76,
    maskWidth: 0.16,
    maskHeight: 0.22,
  };
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RoomVisualizationScreen({
  route,
}: RoomVisualizationScreenProps) {
  const {
    imageUri: rawImageUri = '',
    recommendations: rawRecommendations = [],
    selectedPlant: rawSelectedPlant,
    selectedPlants: rawSelectedPlants = [],
  } = route.params ?? {};
  const { t } = useTranslation();
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stylePreset, setStylePreset] = useState<VisualizationStylePreset>('balancedModern');
  const imageUri = typeof rawImageUri === 'string' ? rawImageUri : '';
  const recommendations = Array.isArray(rawRecommendations)
    ? rawRecommendations.filter(isValidRecommendation)
    : [];
  const selectedPlants = Array.isArray(rawSelectedPlants)
    ? rawSelectedPlants.filter(isValidRecommendation)
    : [];
  const selectedPlant = isValidRecommendation(rawSelectedPlant) ? rawSelectedPlant : null;
  const roomPlanPlants = selectedPlants.length ? selectedPlants : recommendations;
  const isMultiPlantMode = roomPlanPlants.length > 1;
  const initialPreviewIndex = Math.max(
    0,
    roomPlanPlants.findIndex((plant) => plant.name === selectedPlant?.name)
  );
  const [activePreviewIndex, setActivePreviewIndex] = useState(initialPreviewIndex);
  const previewPlant = roomPlanPlants[activePreviewIndex] ?? selectedPlant ?? recommendations[0] ?? null;
  const previewPlacement = getPlacementPreview(previewPlant?.placement ?? '');
  const plantsForRender = isMultiPlantMode ? roomPlanPlants : previewPlant ? [previewPlant] : [];
  const roomSubtitleKey = isMultiPlantMode
    ? 'aiAnalysis.multiPlantSubtitle'
    : 'aiAnalysis.sameRoomSubtitle';
  const generateButtonKey = aiImageUrl
    ? isMultiPlantMode
      ? 'aiAnalysis.regenerateMultiPlant'
      : 'aiAnalysis.regenerateSelectedPlant'
    : isMultiPlantMode
      ? 'aiAnalysis.generateMultiPlant'
      : 'aiAnalysis.generateSelectedPlant';
  const planMarkers = roomPlanPlants.map((plant, index) => ({
    plant,
    index,
    preview: getPlacementPreview(plant.placement ?? ''),
    active: index === activePreviewIndex,
  }));
  const companionPlants = roomPlanPlants.filter((_, index) => index !== activePreviewIndex);

  async function handleGenerateAIVisualization() {
    if (!previewPlant || !plantsForRender.length) {
      Alert.alert(t('common.error'), 'No plant recommendations available', [
        { text: t('common.ok') },
      ]);
      return;
    }

    try {
      console.log('[ROOM_VIZ] Starting AI visualization...');
      setGenerating(true);

      console.log('[ROOM_VIZ] Preparing image before upload...');
      const resizedImageUri = await prepareImageForVisualizationUpload(imageUri);

      const plantDescriptions = plantsForRender
        .map((plant) => `${plant.name} (${plant.placement})`)
        .join(', ');
      const renderStyle = isMultiPlantMode
        ? 'same-room-multi-plant'
        : 'same-room-single-plant';

      const formData = new FormData();
      formData.append('image', {
        uri: resizedImageUri,
        type: 'image/jpeg',
        name: 'room.jpg',
      } as any);
      formData.append('plantDescriptions', plantDescriptions);
      formData.append('renderStyle', renderStyle);
      formData.append('stylePreset', stylePreset);

      if (!isMultiPlantMode) {
        formData.append('selectedPlantName', previewPlant.name);
        formData.append('selectedPlacement', previewPlant.placement);
        formData.append('placementMode', previewPlacement.mode);
        formData.append('maskCenterX', String(previewPlacement.maskCenterX));
        formData.append('maskCenterY', String(previewPlacement.maskCenterY));
        formData.append('maskWidth', String(previewPlacement.maskWidth));
        formData.append('maskHeight', String(previewPlacement.maskHeight));
      }

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
        t(isMultiPlantMode ? 'aiAnalysis.multiPlantSuccess' : 'aiAnalysis.sameRoomSuccess'),
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
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{t('aiAnalysis.yourRoomWithPlants')}</Text>
        </View>
        <Text style={styles.title}>{t('aiAnalysis.yourRoom')}</Text>
        <Text style={styles.subtitle}>{t(roomSubtitleKey)}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaPill}>
            <Text style={styles.heroMetaText}>
              {t('aiAnalysis.planSelectedCount', { count: roomPlanPlants.length })}
            </Text>
          </View>
          {previewPlant && (
            <View style={styles.heroMetaPillPrimary}>
              <Text style={styles.heroMetaTextPrimary}>
                {t('aiAnalysis.selectedForPreview')}: {previewPlant.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.imageWrapper}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.roomImage}
          imageStyle={styles.roomImageStyle}
        >
          <View style={styles.imageBadgeRow}>
            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>
                {t('aiAnalysis.planSelectedCount', { count: roomPlanPlants.length })}
              </Text>
            </View>
          </View>
          {previewPlant && !isMultiPlantMode && (
            <View
              style={[
                styles.maskTarget,
                {
                  left: `${(previewPlacement.maskCenterX - previewPlacement.maskWidth / 2) * 100}%` as any,
                  top: `${(previewPlacement.maskCenterY - previewPlacement.maskHeight / 2) * 100}%` as any,
                  width: `${previewPlacement.maskWidth * 100}%` as any,
                  height: `${previewPlacement.maskHeight * 100}%` as any,
                },
              ]}
            />
          )}
          {planMarkers.map(({ plant, index, preview, active }) => (
            <TouchableOpacity
              key={`${plant.name}-${index}`}
              testID={`room-plan-marker-${index}`}
              activeOpacity={0.9}
              onPress={() => setActivePreviewIndex(index)}
              hitSlop={8}
              style={[
                styles.planMarkerTouchable,
                active && styles.planMarkerTouchableActive,
                { left: preview.left as any, top: preview.top as any },
              ]}
            >
              <View
                style={styles.planMarker}
              >
                <View
                  style={[
                    styles.planMarkerCircle,
                    active ? styles.planMarkerCircleActive : styles.planMarkerCircleInactive,
                  ]}
                >
                  <Text style={styles.planMarkerCircleText}>{active ? '🪴' : index + 1}</Text>
                </View>
                {active && (
                  <View style={styles.planMarkerLabelContainer}>
                    <Text style={styles.planMarkerLabel} numberOfLines={1}>
                      {plant.name}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.imageLegend}>
            <Text style={styles.imageLegendText}>{t('aiAnalysis.choosePlantForPreview')}</Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          🪴 {t('aiAnalysis.selectedPlantTitle')}
        </Text>
        {previewPlant && (
          <View style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>🪴</Text>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.plantName}>{previewPlant.name}</Text>
              <Text style={styles.plantPlacement}>{previewPlant.placement}</Text>
              <Text style={styles.placementGuidance}>{previewPlacement.guidance}</Text>
            </View>
          </View>
        )}

        {roomPlanPlants.length > 1 && (
          <View style={styles.switcherContainer}>
            <Text style={styles.switcherHint}>{t('aiAnalysis.choosePlantForPreview')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.switcherScrollContent}
            >
              {roomPlanPlants.map((plant, index) => {
                const active = index === activePreviewIndex;

                return (
                  <TouchableOpacity
                    key={`${plant.name}-selector-${index}`}
                    testID={`room-plan-selector-${index}`}
                    style={[styles.selectorChip, active && styles.selectorChipActive]}
                    onPress={() => setActivePreviewIndex(index)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.selectorChipTitle, active && styles.selectorChipTitleActive]}>
                      {plant.name}
                    </Text>
                    <Text style={[styles.selectorChipMeta, active && styles.selectorChipMetaActive]} numberOfLines={1}>
                      {active ? t('aiAnalysis.selectedForPreview') : plant.placement}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.planSummaryRow}>
          <Text style={styles.planSummaryText}>
            {t('aiAnalysis.planSelectedCount', { count: roomPlanPlants.length })}
          </Text>
        </View>

        <View style={styles.stylePickerContainer}>
          <Text style={styles.stylePickerTitle}>{t('aiAnalysis.stylePresetLabel')}</Text>
          <Text style={styles.stylePickerHint}>{t('aiAnalysis.stylePresetHint')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stylePresetScrollContent}
          >
            {STYLE_PRESETS.map((preset) => {
              const active = preset.id === stylePreset;

              return (
                <TouchableOpacity
                  key={preset.id}
                  testID={`style-preset-${preset.id}`}
                  style={[styles.stylePresetChip, active && styles.stylePresetChipActive]}
                  onPress={() => setStylePreset(preset.id)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.stylePresetTitle, active && styles.stylePresetTitleActive]}>
                    {preset.emoji} {t(`aiAnalysis.stylePresets.${preset.id}.label`)}
                  </Text>
                  <Text
                    style={[styles.stylePresetDescription, active && styles.stylePresetDescriptionActive]}
                    numberOfLines={3}
                  >
                    {t(`aiAnalysis.stylePresets.${preset.id}.description`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {companionPlants.length > 0 && (
          <View style={styles.companionContainer}>
            <Text style={styles.companionTitle}>
              {t(isMultiPlantMode ? 'aiAnalysis.multiPlantIncludedTitle' : 'aiAnalysis.companionPlants')}
            </Text>
            <Text style={styles.companionHint}>
              {t(isMultiPlantMode ? 'aiAnalysis.multiPlantIncludedHint' : 'aiAnalysis.companionPlantsHint')}
            </Text>
            <View style={styles.chipRow}>
              {companionPlants.map((plant) => (
                <View key={plant.name} style={styles.planChip}>
                  <Text style={styles.planChipText}>{plant.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* AI Visualization Section */}
      <View style={styles.aiSection}>
        <Text style={styles.aiTitle}>✨ {t('aiAnalysis.aiExampleTitle')}</Text>
        <Text style={styles.aiSubtitle}>{t(roomSubtitleKey)}</Text>

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
                {t(generateButtonKey)}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {aiImageUrl && (
          <View style={styles.aiImageContainer}>
            <Text style={styles.aiImageLabel}>
              {t('aiAnalysis.aiGeneratedExample')}
            </Text>
            <Image
              testID="generated-room-image"
              source={{ uri: aiImageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
            <Text style={styles.aiImageNote}>
              {t('aiAnalysis.exampleNote')}
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
    padding: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 22,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  heroMetaPill: {
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaPillPrimary: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  heroMetaTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  roomImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  roomImageStyle: {
    resizeMode: 'cover',
  },
  imageBadgeRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageBadge: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  imageBadgeText: {
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  maskTarget: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(37, 91, 67, 0.68)',
    backgroundColor: 'rgba(37, 91, 67, 0.1)',
    borderRadius: 999,
    zIndex: 1,
  },
  planMarkerTouchable: {
    position: 'absolute',
    zIndex: 3,
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  planMarkerTouchableActive: {
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  planMarker: {
    alignItems: 'center',
  },
  planMarkerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...DESIGN_SYSTEM.shadows.small,
  },
  planMarkerCircleActive: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  planMarkerCircleInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 91, 67, 0.92)',
  },
  planMarkerCircleText: {
    color: DESIGN_SYSTEM.colors.bgSurface,
    fontSize: 15,
    fontWeight: '800',
  },
  planMarkerLabelContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(23,49,38,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: 150,
  },
  planMarkerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.bgSurface,
    textAlign: 'center',
  },
  imageLegend: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 4,
  },
  imageLegendText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    textAlign: 'center',
  },
  suggestionsContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  suggestionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  planSummaryRow: {
    marginTop: 4,
  },
  planSummaryText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    fontWeight: '600',
  },
  stylePickerContainer: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  stylePickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 6,
  },
  stylePickerHint: {
    fontSize: 12,
    lineHeight: 18,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 12,
  },
  stylePresetScrollContent: {
    paddingRight: 4,
    gap: 10,
  },
  stylePresetChip: {
    width: 190,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  stylePresetChipActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  stylePresetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 8,
  },
  stylePresetTitleActive: {
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  stylePresetDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  stylePresetDescriptionActive: {
    color: 'rgba(255,255,255,0.86)',
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
  placementGuidance: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
  switcherContainer: {
    marginBottom: 14,
  },
  switcherHint: {
    fontSize: 13,
    lineHeight: 19,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 12,
  },
  switcherScrollContent: {
    paddingRight: 4,
    gap: 10,
  },
  selectorChip: {
    width: 172,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  selectorChipActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  selectorChipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 4,
  },
  selectorChipTitleActive: {
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  selectorChipMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  selectorChipMetaActive: {
    color: 'rgba(255,255,255,0.86)',
  },
  companionContainer: {
    marginTop: 4,
  },
  companionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 6,
  },
  companionHint: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  planChip: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planChipText: {
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  aiSection: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    ...DESIGN_SYSTEM.shadows.glowSubtle,
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
  generatedImage: {
    width: '100%',
    height: 320,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  aiImageNote: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});

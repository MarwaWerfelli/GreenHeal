import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { analyzeRoom, getRemainingRequests } from '../modules/ai';
import { isConnected } from '../modules/connectivity';
import { COLORS, DESIGN_SYSTEM } from '../utils/constants';
import type { AIAnalysisScreenProps, PlantRecommendation } from '../types';

export default function AIAnalysisScreen({ route, navigation }: AIAnalysisScreenProps) {
  const { imageUri } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);
  const [remainingRequests, setRemainingRequests] = useState<number>(5);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number>(0);
  const [selectedPlantIndices, setSelectedPlantIndices] = useState<number[]>([]);

  const selectedPlants = useMemo(
    () => recommendations.filter((_, index) => selectedPlantIndices.includes(index)),
    [recommendations, selectedPlantIndices]
  );
  const selectedPlant =
    recommendations[selectedPlantIndex] ??
    recommendations[selectedPlantIndices[0] ?? 0] ??
    null;

  useEffect(() => {
    checkConnectivityAndAnalyze();
    loadRemainingRequests();
  }, []);

  async function checkConnectivityAndAnalyze() {
    const connected = await isConnected();
    if (!connected) {
      setLoading(false);
      setError('offline');
      return;
    }
    performAnalysis();
  }

  async function loadRemainingRequests() {
    try {
      const remaining = await getRemainingRequests();
      setRemainingRequests(remaining);
    } catch (err) {
      console.error('Error loading remaining requests:', err);
    }
  }

  async function performAnalysis() {
    setLoading(true);
    setError(null);

    try {
      const results = await analyzeRoom(imageUri);
      setRecommendations(results);
      setSelectedPlantIndex(0);
      setSelectedPlantIndices(results.length ? [0] : []);
      await loadRemainingRequests();
    } catch (err: any) {
      console.error('AI analysis error:', err);
      
      if (err.message === 'DAILY_LIMIT_REACHED') {
        setError('limit_reached');
      } else if (err.message === 'API_AUTH_ERROR') {
        setError('auth_error');
      } else {
        setError('analysis_failed');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    performAnalysis();
  }

  function handlePlantPress(plant: PlantRecommendation) {
    navigation.navigate('PlantDetail', { plant, source: 'ai' });
  }

  function handleTogglePlanSelection(index: number) {
    setSelectedPlantIndices((current) => {
      if (current.includes(index)) {
        const nextSelection = current.filter((item) => item !== index);

        if (selectedPlantIndex === index && nextSelection.length > 0) {
          setSelectedPlantIndex(nextSelection[0]);
        }

        return nextSelection;
      }

      return [...current, index].sort((left, right) => left - right);
    });
  }

  function handleSelectPreview(index: number) {
    setSelectedPlantIndex(index);
    setSelectedPlantIndices((current) => {
      if (current.includes(index)) {
        return current;
      }

      return [...current, index].sort((left, right) => left - right);
    });
  }

  function handleGenerateVisualization() {
    if (!selectedPlants.length || !selectedPlant) {
      Alert.alert(
        t('aiAnalysis.planRequiredTitle'),
        t('aiAnalysis.planRequiredMessage'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    navigation.navigate('RoomVisualization', {
      imageUri,
      recommendations,
      selectedPlant,
      selectedPlants,
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('aiAnalysis.analyzing')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          {error === 'limit_reached' ? (
            <>
              <Text style={styles.errorTitle}>{t('aiAnalysis.limitReached')}</Text>
              <Text style={styles.errorMessage}>
                {t('aiAnalysis.limitMessage', { limit: 5, resetTime: 'midnight' })}
              </Text>
            </>
          ) : error === 'offline' ? (
            <>
              <Text style={styles.errorTitle}>📡</Text>
              <Text style={styles.errorMessage}>{t('offline.aiUnavailable')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.errorTitle}>😔</Text>
              <Text style={styles.errorMessage}>{t('aiAnalysis.error')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{t('aiAnalysis.title')}</Text>
          </View>
          <Text style={styles.title}>{t('aiAnalysis.recommendations')}</Text>
          <Text style={styles.subtitle}>{t('aiAnalysis.planSelectionHint')}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {t('aiAnalysis.remainingRequests', { count: remainingRequests })}
              </Text>
            </View>
            <View style={styles.metaPillAccent}>
              <Text style={styles.metaPillAccentText}>
                {t('aiAnalysis.planSelectedCount', { count: selectedPlants.length })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.visualizationContainer}>
          <View style={styles.visualizationHeader}>
            <View>
              <Text style={styles.visualizationEyebrow}>{t('aiAnalysis.yourRoomWithPlants')}</Text>
              <Text style={styles.visualizationTitle}>
                ✨ {t('aiAnalysis.generateVisualization')}
              </Text>
            </View>
            <View style={styles.planSummaryBadge}>
              <Text style={styles.planSummaryBadgeText}>
                {t('aiAnalysis.planSelectedCount', { count: selectedPlants.length })}
              </Text>
            </View>
          </View>
          <Text style={styles.planSummary}>{t('aiAnalysis.choosePlantForPreview')}</Text>

          {selectedPlants.length > 0 && (
            <View style={styles.planChipRow}>
              {selectedPlants.map((plant) => (
                <View key={plant.name} style={styles.planChip}>
                  <Text style={styles.planChipText}>{plant.name}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.visualizationHint}>
            {selectedPlant
              ? `${t('aiAnalysis.selectedForPreview')}: ${selectedPlant.name}`
              : t('aiAnalysis.choosePlantForPreview')}
          </Text>

          <TouchableOpacity
            style={[
              styles.generateButton,
              !selectedPlants.length && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateVisualization}
            disabled={!selectedPlants.length}
          >
            <Text style={styles.generateButtonIcon}>🎨</Text>
            <Text style={styles.generateButtonText}>
              {t('aiAnalysis.generateVisualization')}
            </Text>
          </TouchableOpacity>
        </View>

        {recommendations.map((plant, index) => (
          <View
            key={index}
            style={[
              styles.plantCard,
              selectedPlantIndices.includes(index) && styles.selectedPlantCard,
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePlantPress(plant)}
              testID={`plant-card-${index}`}
              activeOpacity={0.85}
            >
              <View style={styles.plantHeader}>
                <Text style={styles.plantName}>{plant.name}</Text>
                <View style={styles.headerBadges}>
                  {selectedPlantIndices.includes(index) && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{t('aiAnalysis.selectedForPlan')}</Text>
                    </View>
                  )}
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>
                      {t(`careDifficulty.${plant.careDifficulty.toLowerCase()}`)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.plantPlacement}>📍 {plant.placement}</Text>
              <Text style={styles.plantBenefit} numberOfLines={2}>
                {plant.healingBenefit}
              </Text>

              <View style={styles.plantFooter}>
                <Text style={styles.plantCost}>{plant.estimatedCost}</Text>
                <Text style={styles.plantWatering}>
                  💧 {t('plantDetail.wateringFrequency', { days: plant.wateringFrequencyDays })}
                </Text>
              </View>

              <Text style={styles.encouragingMessage}>{plant.encouragingMessage}</Text>
              <Text style={styles.detailsHint}>{t('aiAnalysis.viewPlantDetails')}</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.planButton,
                  selectedPlantIndices.includes(index) && styles.planButtonActive,
                ]}
                onPress={() => handleTogglePlanSelection(index)}
                testID={`toggle-plan-${index}`}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    selectedPlantIndices.includes(index) && styles.planButtonTextActive,
                  ]}
                >
                  {selectedPlantIndices.includes(index)
                    ? t('aiAnalysis.removeFromPlan')
                    : t('aiAnalysis.addToPlan')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  index === selectedPlantIndex && styles.selectButtonActive,
                ]}
                onPress={() => handleSelectPreview(index)}
                testID={`select-plant-${index}`}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    index === selectedPlantIndex && styles.selectButtonTextActive,
                  ]}
                >
                  {index === selectedPlantIndex
                    ? t('aiAnalysis.selectedForPreview')
                    : t('aiAnalysis.previewThisPlant')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 18,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    padding: 22,
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
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  metaPill: {
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillAccent: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  metaPillAccentText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  plantCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  selectedPlantCard: {
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.primary,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plantName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
  },
  headerBadges: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  planBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
  difficultyBadge: {
    backgroundColor: COLORS.secondary + '18',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  plantPlacement: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  plantBenefit: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  plantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  plantCost: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  plantWatering: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  encouragingMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  detailsHint: {
    fontSize: 12,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  planButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
  },
  planButtonActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  planButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  planButtonTextActive: {
    color: COLORS.primary,
  },
  selectButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
  },
  selectButtonActive: {
    backgroundColor: COLORS.primary,
  },
  selectButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextActive: {
    color: COLORS.white,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 20,
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  generateButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  visualizationContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  visualizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  visualizationEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 6,
  },
  visualizationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planSummaryBadge: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planSummaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  planSummary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  planChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  planChip: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  visualizationHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  visualizationImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  generateButtonDisabled: {
    backgroundColor: COLORS.textDisabled,
  },
});

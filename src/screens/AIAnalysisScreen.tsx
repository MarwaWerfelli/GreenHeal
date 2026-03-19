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
import { DESIGN_SYSTEM } from '../utils/constants';
import type { AIAnalysisScreenProps, PlantRecommendation } from '../types';

const colors = DESIGN_SYSTEM.colors;
const shadows = DESIGN_SYSTEM.shadows;

export default function AIAnalysisScreen({ route, navigation }: AIAnalysisScreenProps) {
  const { imageUri, guidedContext } = route.params;
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
  const guidedSummaryRows = useMemo(() => {
    if (!guidedContext) {
      return [];
    }

    const dominantSymptoms = (guidedContext.dominantSymptoms.length
      ? guidedContext.dominantSymptoms
      : guidedContext.symptoms
    ).map((symptom) => t(`guidedDialogue.symptoms.${symptom}.label`));

    return [
      {
        label: t('aiAnalysis.guidedSummarySymptoms'),
        value: dominantSymptoms.join(', '),
      },
      {
        label: t('aiAnalysis.guidedSummaryTime'),
        value: t(`guidedDialogue.timeOfDay.${guidedContext.intensityWindow}.label`),
      },
      {
        label: t('aiAnalysis.guidedSummarySupport'),
        value: t(`guidedDialogue.supportFocus.${guidedContext.supportFocus}.label`),
      },
    ];
  }, [guidedContext, t]);

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
      const results = await analyzeRoom(imageUri, guidedContext);
      const normalizedResults = Array.isArray(results) ? results : [];

      setRecommendations(normalizedResults);
      setSelectedPlantIndex(0);
      setSelectedPlantIndices(normalizedResults.length ? [0] : []);
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
          <ActivityIndicator size="large" color={colors.primary} />
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

        {guidedSummaryRows.length > 0 && (
          <View style={styles.guidedContextCard}>
            <Text style={styles.guidedContextEyebrow}>{t('aiAnalysis.guidedSummaryTitle')}</Text>
            <Text style={styles.guidedContextSubtitle}>{t('aiAnalysis.guidedSummarySubtitle')}</Text>
            <View style={styles.guidedContextTable}>
              {guidedSummaryRows.map((row, index) => (
                <View
                  key={`${row.label}-${index}`}
                  style={[
                    styles.guidedContextRow,
                    index === guidedSummaryRows.length - 1 && styles.guidedContextRowLast,
                  ]}
                >
                  <Text style={styles.guidedContextLabel}>{row.label}</Text>
                  <Text style={styles.guidedContextValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.visualizationContainer}>
          <View style={styles.visualizationHeader}>
            <View style={styles.visualizationHeaderContent}>
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

        {recommendations.map((plant, index) => {
          const planDetails = [
            { label: t('aiAnalysis.planTable.plant'), value: plant.name, emphasize: true },
            { label: t('aiAnalysis.planTable.placement'), value: plant.placement },
            { label: t('aiAnalysis.planTable.healingBenefit'), value: plant.healingBenefit },
            {
              label: t('aiAnalysis.planTable.healingRole'),
              value: plant.healingRole ?? plant.healingBenefit,
            },
            {
              label: t('aiAnalysis.planTable.sensoryAction'),
              value: plant.sensoryAction ?? t('aiAnalysis.planTable.sensoryFallback'),
            },
            {
              label: t('aiAnalysis.planTable.careDifficulty'),
              value: t(`careDifficulty.${plant.careDifficulty.toLowerCase()}`),
            },
            { label: t('aiAnalysis.planTable.estimatedCost'), value: plant.estimatedCost },
            {
              label: t('aiAnalysis.planTable.watering'),
              value: t('plantDetail.wateringFrequency', { days: plant.wateringFrequencyDays }),
            },
          ];

          return (
            <View
              key={`${plant.name}-${index}`}
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
                  <View style={styles.titleBlock}>
                    <Text style={styles.planIndex}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.plantName}>{plant.name}</Text>
                  </View>
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

                <View style={styles.planTable}>
                  {planDetails.map((detail, detailIndex) => (
                    <View
                      key={`${detail.label}-${detailIndex}`}
                      style={[
                        styles.planTableRow,
                        detailIndex === planDetails.length - 1 && styles.planTableRowLast,
                      ]}
                    >
                      <Text style={styles.planTableLabel}>{detail.label}</Text>
                      <Text
                        style={[
                          styles.planTableValue,
                          detail.emphasize && styles.planTableValueStrong,
                        ]}
                      >
                        {detail.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.encouragementBox}>
                  <Text style={styles.encouragementLabel}>
                    {t('aiAnalysis.planTable.encouragement')}
                  </Text>
                  <Text style={styles.encouragingMessage}>{plant.encouragingMessage}</Text>
                </View>

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
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
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
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: colors.bgSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backButtonText: {
    color: colors.primary,
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
    backgroundColor: colors.bgSurface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.medium,
  },
  guidedContextCard: {
    marginBottom: 18,
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guidedContextEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  guidedContextSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  guidedContextTable: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  guidedContextRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  guidedContextRowLast: {
    borderBottomWidth: 0,
  },
  guidedContextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  guidedContextValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: colors.primary,
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
    backgroundColor: colors.bgBase,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillAccent: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  metaPillAccentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.bgSurface,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  plantCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.medium,
  },
  selectedPlantCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryPale,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planIndex: {
    width: 36,
    height: 36,
    borderRadius: 12,
    marginRight: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.primaryPale,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
    paddingTop: 8,
  },
  plantName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
  headerBadges: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  planBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bgSurface,
  },
  difficultyBadge: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  planTable: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 20,
    backgroundColor: colors.bgBase,
    overflow: 'hidden',
  },
  planTableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 12,
  },
  planTableRowLast: {
    borderBottomWidth: 0,
  },
  planTableLabel: {
    width: 112,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  planTableValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  planTableValueStrong: {
    fontWeight: '700',
    color: colors.primary,
  },
  encouragementBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.primaryPale,
  },
  encouragementLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  plantPlacement: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  plantBenefit: {
    fontSize: 14,
    color: colors.textPrimary,
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
    borderTopColor: colors.borderSubtle,
  },
  plantCost: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  plantWatering: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  encouragingMessage: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.secondaryDark,
    lineHeight: 20,
  },
  detailsHint: {
    fontSize: 12,
    color: colors.primary,
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
    borderColor: colors.primary,
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  planButtonActive: {
    backgroundColor: colors.primaryPale,
  },
  planButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  planButtonTextActive: {
    color: colors.primary,
  },
  selectButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  selectButtonActive: {
    backgroundColor: colors.primary,
  },
  selectButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextActive: {
    color: colors.bgSurface,
  },
  generateButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginBottom: 20,
    ...shadows.glowSubtle,
  },
  generateButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  generateButtonText: {
    color: colors.bgSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  visualizationContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.medium,
  },
  visualizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  visualizationHeaderContent: {
    flex: 1,
    minWidth: 0,
  },
  visualizationEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  visualizationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  planSummaryBadge: {
    backgroundColor: colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
    alignSelf: 'flex-start',
  },
  planSummaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
    textAlign: 'center',
  },
  planSummary: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryPale,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  planChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  visualizationHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  visualizationImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  generateButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
});

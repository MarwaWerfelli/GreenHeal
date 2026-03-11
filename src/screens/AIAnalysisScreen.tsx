import React, { useState, useEffect } from 'react';
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
import { analyzeRoom, getRemainingRequests, PlantRecommendation } from '../modules/ai';
import { isConnected } from '../modules/connectivity';
import { COLORS } from '../utils/constants';
import type { AIAnalysisScreenProps } from '../types';

export default function AIAnalysisScreen({ route, navigation }: AIAnalysisScreenProps) {
  const { imageUri } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);
  const [remainingRequests, setRemainingRequests] = useState<number>(5);
  const [selectedPlantIndex, setSelectedPlantIndex] = useState<number>(0);

  const selectedPlant = recommendations[selectedPlantIndex] ?? null;

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

  function handleGenerateVisualization() {
    if (!recommendations.length || !selectedPlant) {
      Alert.alert(
        t('aiAnalysis.visualizationError'),
        t('aiAnalysis.visualizationErrorMessage'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    navigation.navigate('RoomVisualization', {
      imageUri,
      recommendations,
      selectedPlant,
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
        <View style={styles.header}>
          <Text style={styles.title}>{t('aiAnalysis.recommendations')}</Text>
          <Text style={styles.remainingText}>
            {t('aiAnalysis.remainingRequests', { count: remainingRequests })}
          </Text>
        </View>

        {/* Visualization Section */}
        <View style={styles.visualizationContainer}>
          <Text style={styles.visualizationTitle}>
            ✨ {t('aiAnalysis.yourRoomWithPlants')}
          </Text>
          <Text style={styles.visualizationHint}>
            {selectedPlant
              ? `${t('aiAnalysis.selectedForPreview')}: ${selectedPlant.name}`
              : t('aiAnalysis.choosePlantForPreview')}
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateVisualization}
          >
            <Text style={styles.generateButtonIcon}>🎨</Text>
            <Text style={styles.generateButtonText}>
              {t('aiAnalysis.generateVisualization')}
            </Text>
          </TouchableOpacity>
        </View>

        {recommendations.map((plant, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.plantCard,
              index === selectedPlantIndex && styles.selectedPlantCard,
            ]}
            onPress={() => handlePlantPress(plant)}
            testID={`plant-card-${index}`}
          >
            <View style={styles.plantHeader}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {t(`careDifficulty.${plant.careDifficulty.toLowerCase()}`)}
                </Text>
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

            <TouchableOpacity
              style={[
                styles.selectButton,
                index === selectedPlantIndex && styles.selectButtonActive,
              ]}
              onPress={() => setSelectedPlantIndex(index)}
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
          </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  plantCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPlantCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: COLORS.secondary + '30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
    borderTopColor: COLORS.background,
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
  selectButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  visualizationHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  visualizationImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
});

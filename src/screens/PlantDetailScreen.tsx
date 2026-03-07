import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { enrichPlantData } from '../modules/plantDatabase';
import { savePlant, initDatabase, updatePlantWateringDate, deletePlant } from '../modules/storage';
import { schedulePlantReminder, cancelReminder } from '../modules/notifications';
import { COLORS } from '../utils/constants';
import type { PlantDetailScreenProps, EnrichedPlantData, GardenPlant } from '../types';

export default function PlantDetailScreen({ route, navigation }: PlantDetailScreenProps) {
  const { plant, source } = route.params;
  const { t } = useTranslation();
  const [enrichedData, setEnrichedData] = useState<EnrichedPlantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [watering, setWatering] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadEnrichedData();
  }, []);

  async function loadEnrichedData() {
    setLoading(true);
    try {
      const data = await enrichPlantData(plant.name);
      setEnrichedData(data);
    } catch (error) {
      console.error('Error loading enriched data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToGarden() {
    setAdding(true);
    try {
      // Initialize database if needed
      await initDatabase();

      // Calculate next watering date
      const now = new Date();
      const nextWatering = new Date(now);
      nextWatering.setDate(nextWatering.getDate() + plant.wateringFrequencyDays);

      const gardenPlant: GardenPlant = {
        name: plant.name,
        placement: plant.placement,
        healingBenefit: plant.healingBenefit,
        careDifficulty: plant.careDifficulty,
        estimatedCost: plant.estimatedCost,
        wateringFrequencyDays: plant.wateringFrequencyDays,
        nextWateringAt: nextWatering.toISOString(),
        addedAt: now.toISOString(),
      };

      await savePlant(gardenPlant);

      Alert.alert(
        t('plantDetail.added'),
        '',
        [
          {
            text: t('common.done'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding plant to garden:', error);
      Alert.alert(t('errors.save_failed'));
    } finally {
      setAdding(false);
    }
  }

  function handleFindNearMe() {
    const searchQuery = encodeURIComponent(plant.name);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}+plant+nursery`;
    Linking.openURL(mapsUrl);
  }

  async function handleMarkAsWatered() {
    if (!('id' in plant) || !plant.id) return;

    setWatering(true);
    try {
      const now = new Date();
      const nextWatering = new Date(now);
      nextWatering.setDate(nextWatering.getDate() + plant.wateringFrequencyDays);

      await updatePlantWateringDate(plant.id, now);

      // Schedule next reminder
      if (plant.notificationId) {
        await cancelReminder(plant.notificationId);
      }
      await schedulePlantReminder(
        plant.id,
        plant.name,
        nextWatering
      );
      
      Alert.alert(
        t('garden.watered'),
        '',
        [
          {
            text: t('common.done'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error marking plant as watered:', error);
      Alert.alert(t('errors.save_failed'));
    } finally {
      setWatering(false);
    }
  }

  function handleRemoveFromGarden() {
    Alert.alert(
      t('garden.removeFromGarden'),
      t('garden.removeConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: confirmRemove,
        },
      ]
    );
  }

  async function confirmRemove() {
    if (!('id' in plant) || !plant.id) return;

    setRemoving(true);
    try {
      // Cancel notification if exists
      if (plant.notificationId) {
        await cancelReminder(plant.notificationId);
      }

      // Delete from database
      await deletePlant(plant.id);

      navigation.goBack();
    } catch (error) {
      console.error('Error removing plant:', error);
      Alert.alert(t('errors.generic'));
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.plantName}>{plant.name}</Text>

        {/* Healing Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('plantDetail.healingBenefits')}</Text>
          <Text style={styles.sectionText}>{plant.healingBenefit}</Text>
        </View>

        {/* Placement Guidance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('plantDetail.placement')}</Text>
          <Text style={styles.sectionText}>{plant.placement}</Text>
        </View>

        {/* Care Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('plantDetail.careInstructions')}</Text>
          
          {enrichedData ? (
            <>
              {enrichedData.scientificName && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Scientific Name: </Text>
                  {enrichedData.scientificName}
                </Text>
              )}
              {enrichedData.wateringDetails && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Watering: </Text>
                  {enrichedData.wateringDetails}
                </Text>
              )}
              {enrichedData.sunlightRequirements && enrichedData.sunlightRequirements.length > 0 && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Sunlight: </Text>
                  {enrichedData.sunlightRequirements.join(', ')}
                </Text>
              )}
              {enrichedData.soilType && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Soil: </Text>
                  {enrichedData.soilType}
                </Text>
              )}
              {enrichedData.toxicity && (
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Toxicity: </Text>
                  {enrichedData.toxicity}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.sectionText}>
              {t('plantDetail.wateringFrequency', { days: plant.wateringFrequencyDays })}
            </Text>
          )}
        </View>

        {/* Plant Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>{t('plantDetail.difficulty')}</Text>
            <Text style={styles.detailCardValue}>
              {t(`careDifficulty.${plant.careDifficulty}`)}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>{t('plantDetail.cost')}</Text>
            <Text style={styles.detailCardValue}>{plant.estimatedCost}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {source === 'ai' && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, adding && styles.buttonDisabled]}
            onPress={handleAddToGarden}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>{t('plantDetail.addToGarden')}</Text>
            )}
          </TouchableOpacity>
        )}

        {source === 'garden' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, watering && styles.buttonDisabled]}
              onPress={handleMarkAsWatered}
              disabled={watering}
            >
              {watering ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>{t('garden.markAsWatered')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton, removing && styles.buttonDisabled]}
              onPress={handleRemoveFromGarden}
              disabled={removing}
            >
              {removing ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>{t('garden.removeFromGarden')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleFindNearMe}
        >
          <Text style={styles.secondaryButtonText}>{t('plantDetail.findNearMe')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    padding: 20,
  },
  plantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  detailCardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

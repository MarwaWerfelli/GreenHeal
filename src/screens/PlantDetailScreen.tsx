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
  Switch,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { enrichPlantData } from '../modules/plantDatabase';
import { savePlant, initDatabase, updatePlantWateringDate, deletePlant, updatePlantWateringSettings } from '../modules/storage';
import { schedulePlantReminder, cancelReminder, scheduleWateringReminder, cancelWateringReminder, hasNotificationPermissions, requestPermissions } from '../modules/notifications';
import { COLORS, DESIGN_SYSTEM } from '../utils/constants';
import type { PlantDetailScreenProps, EnrichedPlantData, GardenPlant } from '../types';

export default function PlantDetailScreen({ route, navigation }: PlantDetailScreenProps) {
  const { plant, source } = route.params;
  const { t } = useTranslation();
  const [enrichedData, setEnrichedData] = useState<EnrichedPlantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [watering, setWatering] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [wateringFrequency, setWateringFrequency] = useState(7);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadEnrichedData();
    checkNotificationPermission();
    
    // Load watering reminder settings if viewing from garden
    if (source === 'garden' && 'id' in plant) {
      setReminderEnabled(plant.wateringReminderEnabled || false);
      setWateringFrequency(plant.wateringFrequencyDays || 7);
      setReminderTime(plant.reminderTime || '09:00');
    }
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

  async function checkNotificationPermission() {
    const permission = await hasNotificationPermissions();
    setHasPermission(permission);
  }

  async function handleToggleReminder(value: boolean) {
    if (!('id' in plant) || !plant.id) return;

    // Check permission first
    if (value && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          t('permissions.notifications_required'),
          t('permissions.notifications_explanation'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.open_settings'),
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }
      setHasPermission(true);
    }

    setReminderEnabled(value);

    try {
      await updatePlantWateringSettings(plant.id, {
        wateringReminderEnabled: value,
      });

      if (value && plant.nextWateringDate) {
        // Schedule reminder
        await scheduleWateringReminder({
          id: plant.id,
          name: plant.name,
          nextWateringDate: plant.nextWateringDate,
          lastWateredDate: plant.lastWateredDate,
          reminderTime: reminderTime,
        });
      } else {
        // Cancel reminder
        await cancelWateringReminder(plant.id);
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert(t('errors.save_failed'));
      setReminderEnabled(!value); // Revert on error
    }
  }

  async function handleFrequencyChange(days: number) {
    if (!('id' in plant) || !plant.id) return;

    setWateringFrequency(days);

    try {
      await updatePlantWateringSettings(plant.id, {
        wateringFrequencyDays: days,
      });

      // Reschedule reminder if enabled
      if (reminderEnabled && plant.nextWateringDate) {
        await scheduleWateringReminder({
          id: plant.id,
          name: plant.name,
          nextWateringDate: plant.nextWateringDate,
          lastWateredDate: plant.lastWateredDate,
          reminderTime: reminderTime,
        });
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
      Alert.alert(t('errors.save_failed'));
    }
  }

  async function handleTimeChange(time: string) {
    if (!('id' in plant) || !plant.id) return;

    setReminderTime(time);

    try {
      await updatePlantWateringSettings(plant.id, {
        reminderTime: time,
      });

      // Reschedule reminder if enabled
      if (reminderEnabled && plant.nextWateringDate) {
        await scheduleWateringReminder({
          id: plant.id,
          name: plant.name,
          nextWateringDate: plant.nextWateringDate,
          lastWateredDate: plant.lastWateredDate,
          reminderTime: time,
        });
      }
    } catch (error) {
      console.error('Error updating reminder time:', error);
      Alert.alert(t('errors.save_failed'));
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
        wateringReminderEnabled: true, // Enable reminders by default
        lastWateredDate: now.toISOString(),
        nextWateringDate: nextWatering.toISOString(),
        reminderTime: '09:00', // Default reminder time
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
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(t('errors.save_failed'), __DEV__ ? message : undefined);
    } finally {
      setAdding(false);
    }
  }

  async function handleFindNearMe() {
    try {
      // Try to get user's location
      const { status } = await import('expo-location').then(Location => 
        Location.requestForegroundPermissionsAsync()
      );
      
      if (status === 'granted') {
        const Location = await import('expo-location');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const { latitude, longitude } = location.coords;
        // Search for nearest plant nurseries/shops, not specific plant names
        const searchQuery = encodeURIComponent('plant nursery');
        
        // Use location-based search with user's coordinates
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}&query_place_id=&center=${latitude},${longitude}`;
        Linking.openURL(mapsUrl);
      } else {
        // Fallback to generic search without location
        const searchQuery = encodeURIComponent('plant nursery near me');
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
        Linking.openURL(mapsUrl);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to generic search
      const searchQuery = encodeURIComponent('plant nursery near me');
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      Linking.openURL(mapsUrl);
    }
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

        {/* Watering Reminder Settings (only for garden plants) */}
        {source === 'garden' && 'id' in plant && (
          <View style={styles.reminderSection}>
            <Text style={styles.sectionTitle}>💧 Watering Reminders</Text>
            
            <View style={styles.reminderRow}>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderLabel}>Enable Reminders</Text>
                <Text style={styles.reminderSubtext}>
                  Get notified when it's time to water
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: DESIGN_SYSTEM.colors.textSecondary + '40', true: DESIGN_SYSTEM.colors.primary + '60' }}
                thumbColor={reminderEnabled ? DESIGN_SYSTEM.colors.primary : '#f4f3f4'}
              />
            </View>

            {reminderEnabled && (
              <>
                <View style={styles.reminderRow}>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderLabel}>Watering Frequency</Text>
                    <Text style={styles.reminderSubtext}>
                      Water every {wateringFrequency} days
                    </Text>
                  </View>
                  <View style={styles.frequencyButtons}>
                    {[3, 5, 7, 10, 14].map(days => (
                      <TouchableOpacity
                        key={days}
                        style={[
                          styles.frequencyButton,
                          wateringFrequency === days && styles.frequencyButtonActive,
                        ]}
                        onPress={() => handleFrequencyChange(days)}
                      >
                        <Text
                          style={[
                            styles.frequencyButtonText,
                            wateringFrequency === days && styles.frequencyButtonTextActive,
                          ]}
                        >
                          {days}d
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.reminderRow}>
                  <View style={styles.reminderTextContainer}>
                    <Text style={styles.reminderLabel}>Reminder Time</Text>
                    <Text style={styles.reminderSubtext}>
                      Daily reminder at {reminderTime}
                    </Text>
                  </View>
                  <View style={styles.timeButtons}>
                    {['09:00', '12:00', '18:00', '20:00'].map(time => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeButton,
                          reminderTime === time && styles.timeButtonActive,
                        ]}
                        onPress={() => handleTimeChange(time)}
                      >
                        <Text
                          style={[
                            styles.timeButtonText,
                            reminderTime === time && styles.timeButtonTextActive,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {plant.nextWateringDate && (
                  <View style={styles.nextWateringCard}>
                    <Text style={styles.nextWateringLabel}>Next Watering</Text>
                    <Text style={styles.nextWateringDate}>
                      {new Date(plant.nextWateringDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {!hasPermission && (
                  <View style={styles.permissionWarning}>
                    <Text style={styles.permissionWarningText}>
                      ⚠️ Notification permissions are required for reminders
                    </Text>
                    <TouchableOpacity
                      style={styles.permissionButton}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Linking.openURL('app-settings:');
                        } else {
                          Linking.openSettings();
                        }
                      }}
                    >
                      <Text style={styles.permissionButtonText}>
                        {t('common.open_settings')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

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
  reminderSection: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    padding: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  reminderRow: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  reminderTextContainer: {
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.text,
    marginBottom: 4,
  },
  reminderSubtext: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
    flexWrap: 'wrap',
  },
  frequencyButton: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.background,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.textSecondary + '40',
  },
  frequencyButtonActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryLight,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: DESIGN_SYSTEM.colors.primary,
  },
  timeButtons: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
    flexWrap: 'wrap',
  },
  timeButton: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.background,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.textSecondary + '40',
  },
  timeButtonActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryLight,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  timeButtonTextActive: {
    color: DESIGN_SYSTEM.colors.primary,
  },
  nextWateringCard: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryLight,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    padding: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.sm,
  },
  nextWateringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextWateringDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.primary,
  },
  permissionWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    padding: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  permissionWarningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  permissionButton: {
    backgroundColor: '#856404',
    borderRadius: DESIGN_SYSTEM.borderRadius.small,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    alignSelf: 'flex-start',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

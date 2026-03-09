import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { GardenPlant } from '../types';

interface PlantCardProps {
  plant: GardenPlant;
  onPress: () => void;
  layout?: 'grid' | 'list';
}

function PlantCard({ plant, onPress, layout = 'grid' }: PlantCardProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Calculate watering countdown
  const getWateringCountdown = () => {
    if (!plant.nextWateringDate) return null;
    
    const now = new Date();
    const nextWatering = new Date(plant.nextWateringDate);
    const diffTime = nextWatering.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilWatering = getWateringCountdown();
  const needsWatering = daysUntilWatering !== null && daysUntilWatering <= 0;

  // Health status based on watering needs
  const getHealthStatus = () => {
    if (needsWatering) return { color: DESIGN_SYSTEM.colors.warning, label: t('garden.needsWatering'), icon: 'water' };
    if (daysUntilWatering !== null && daysUntilWatering <= 2) return { color: DESIGN_SYSTEM.colors.warning, label: t('garden.soon'), icon: 'time' };
    return { color: DESIGN_SYSTEM.colors.success, label: t('garden.healthy'), icon: 'checkmark-circle' };
  };

  const healthStatus = getHealthStatus();

  // Difficulty color
  const difficultyColor = {
    easy: DESIGN_SYSTEM.colors.success,
    medium: DESIGN_SYSTEM.colors.warning,
    hard: DESIGN_SYSTEM.colors.error,
  }[plant.careDifficulty];

  const cardStyle = layout === 'grid' ? styles.gridCard : styles.listCard;
  const contentStyle = layout === 'grid' ? styles.gridContent : styles.listContent;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          cardStyle,
          needsWatering && styles.needsWateringCard,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={`${plant.name}, ${healthStatus.label}`}
        accessibilityHint="Tap to view plant details"
        accessibilityRole="button"
      >
        <View style={contentStyle}>
          {/* Plant emoji/icon placeholder */}
          <View style={styles.plantIconContainer}>
            <Text style={styles.plantIcon}>🌱</Text>
          </View>

          {/* Plant info */}
          <View style={styles.plantInfo}>
            <Text style={styles.plantName} numberOfLines={2}>
              {plant.name}
            </Text>

            {/* Watering countdown */}
            {daysUntilWatering !== null && (
              <View style={styles.wateringInfo}>
                <Ionicons
                  name="water"
                  size={14}
                  color={needsWatering ? DESIGN_SYSTEM.colors.warning : DESIGN_SYSTEM.colors.primary}
                />
                <Text style={[
                  styles.wateringText,
                  needsWatering && styles.wateringTextUrgent,
                ]}>
                  {needsWatering
                    ? t('garden.waterNow')
                    : daysUntilWatering === 1
                    ? t('garden.waterTomorrow')
                    : t('garden.waterInDays', { days: daysUntilWatering })}
                </Text>
              </View>
            )}

            {/* Health status */}
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Ionicons
                  name={healthStatus.icon as any}
                  size={12}
                  color={healthStatus.color}
                />
                <Text style={[styles.statusText, { color: healthStatus.color }]}>
                  {healthStatus.label}
                </Text>
              </View>

              {/* Care difficulty */}
              <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
                <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                  {t(`careDifficulty.${plant.careDifficulty}`)}
                </Text>
              </View>
            </View>
          </View>

          {/* Needs watering badge */}
          {needsWatering && (
            <View style={styles.needsWateringBadge}>
              <Ionicons name="water" size={16} color={DESIGN_SYSTEM.colors.surface} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    ...DESIGN_SYSTEM.shadows.medium,
    overflow: 'hidden',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  listCard: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    ...DESIGN_SYSTEM.shadows.medium,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    overflow: 'hidden',
  },
  needsWateringCard: {
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.warning,
    backgroundColor: DESIGN_SYSTEM.colors.warning + '10',
  },
  gridContent: {
    padding: DESIGN_SYSTEM.spacing.md,
  },
  listContent: {
    flexDirection: 'row',
    padding: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.md,
  },
  plantIconContainer: {
    width: 60,
    height: 60,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  plantIcon: {
    fontSize: 32,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.text,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  wateringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    gap: 4,
  },
  wateringText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    fontWeight: '500',
  },
  wateringTextUrgent: {
    color: DESIGN_SYSTEM.colors.warning,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    paddingVertical: 4,
    borderRadius: DESIGN_SYSTEM.borderRadius.small,
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
    paddingVertical: 4,
    borderRadius: DESIGN_SYSTEM.borderRadius.small,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  needsWateringBadge: {
    position: 'absolute',
    top: DESIGN_SYSTEM.spacing.sm,
    right: DESIGN_SYSTEM.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DESIGN_SYSTEM.colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.small,
  },
});


// Memoize to prevent unnecessary re-renders
export default React.memo(PlantCard, (prevProps, nextProps) => {
  return (
    prevProps.plant.id === nextProps.plant.id &&
    prevProps.plant.nextWateringDate === nextProps.plant.nextWateringDate &&
    prevProps.plant.wateringReminderEnabled === nextProps.plant.wateringReminderEnabled &&
    prevProps.layout === nextProps.layout
  );
});

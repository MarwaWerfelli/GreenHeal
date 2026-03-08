import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { getGardenPlants } from '../modules/storage';
import { COLORS } from '../utils/constants';
import type { GardenPlant } from '../types';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, BottomTabParamList } from '../types';

type MyGardenScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'MyGarden'>,
  StackScreenProps<RootStackParamList>
>;

export default function MyGardenScreen({ navigation }: MyGardenScreenProps) {
  const { t } = useTranslation();
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [])
  );

  async function loadPlants() {
    setLoading(true);
    try {
      const gardenPlants = await getGardenPlants();
      setPlants(gardenPlants);
    } catch (error) {
      console.error('Error loading garden plants:', error);
    } finally {
      setLoading(false);
    }
  }

  function needsWatering(plant: GardenPlant): boolean {
    const now = new Date();
    const nextWatering = new Date(plant.nextWateringAt);
    return now >= nextWatering;
  }

  function formatLastWatered(plant: GardenPlant): string {
    if (!plant.lastWateredAt) {
      return t('garden.noPlantsYet');
    }

    const lastWatered = new Date(plant.lastWateredAt);
    const now = new Date();
    const diffInMs = now.getTime() - lastWatered.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffInDays} days ago`;
    }
  }

  function getDaysUntilWatering(plant: GardenPlant): number {
    const now = new Date();
    const nextWatering = new Date(plant.nextWateringAt);
    const diffInMs = nextWatering.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  }

  function renderPlant({ item }: { item: GardenPlant }) {
    const needsWater = needsWatering(item);
    const daysUntil = getDaysUntilWatering(item);

    return (
      <TouchableOpacity
        style={[styles.plantCard, needsWater && styles.plantCardNeedsWater]}
        onPress={() => {
          // @ts-ignore - navigation type issue
          navigation.navigate('PlantDetail', { plant: item, source: 'garden' });
        }}
      >
        <View style={styles.plantHeader}>
          <Text style={styles.plantName}>{item.name}</Text>
          {needsWater && (
            <View style={styles.waterBadge}>
              <Text style={styles.waterBadgeText}>💧 {t('garden.needsWatering')}</Text>
            </View>
          )}
        </View>

        <View style={styles.plantDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('plantDetail.difficulty')}:</Text>
            <Text style={styles.detailValue}>{t(`careDifficulty.${item.careDifficulty}`)}</Text>
          </View>

          {item.lastWateredAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('garden.lastWatered', { date: '' })}</Text>
              <Text style={styles.detailValue}>{formatLastWatered(item)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {needsWater ? t('garden.needsWatering') : t('garden.nextWatering', { days: '' })}
            </Text>
            <Text style={[styles.detailValue, needsWater && styles.needsWaterText]}>
              {needsWater ? 'Now' : `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (plants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={styles.emptyText}>{t('garden.noPlantsYet')}</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            // @ts-ignore - navigation type issue
            navigation.navigate('Camera');
          }}
        >
          <Text style={styles.emptyButtonText}>{t('home.scanRoom')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContent}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
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
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  plantCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.secondary + '30',
    maxWidth: '48%',
  },
  plantCardNeedsWater: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  plantHeader: {
    marginBottom: 12,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  waterBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  waterBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  plantDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  needsWaterText: {
    color: '#FF9800',
  },
});

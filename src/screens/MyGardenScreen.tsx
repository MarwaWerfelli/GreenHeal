import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Modal,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGardenPlants, updatePlantWateringSettings } from '../modules/storage';
import { scheduleWateringReminder } from '../modules/notifications';
import SwipeablePlantCard from '../components/SwipeablePlantCard';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { GardenPlant } from '../types';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, BottomTabParamList } from '../types';

type MyGardenScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'MyGarden'>,
  StackScreenProps<RootStackParamList>
>;

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'needsWater' | 'healthy';
type SortOption = 'name' | 'nextWatering' | 'recentlyAdded';

const STORAGE_KEYS = {
  VIEW_MODE: '@greenheal:garden_view_mode',
  FILTER: '@greenheal:garden_filter',
  SORT: '@greenheal:garden_sort',
};

export default function MyGardenScreen({ navigation }: MyGardenScreenProps) {
  const { t } = useTranslation();
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<GardenPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recentlyAdded');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPlants();
      loadPreferences();
    }, [])
  );

  useEffect(() => {
    applyFiltersAndSort();
  }, [plants, searchQuery, filterOption, sortOption]);

  const loadPreferences = async () => {
    try {
      const savedViewMode = await AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      const savedFilter = await AsyncStorage.getItem(STORAGE_KEYS.FILTER);
      const savedSort = await AsyncStorage.getItem(STORAGE_KEYS.SORT);

      if (savedViewMode) setViewMode(savedViewMode as ViewMode);
      if (savedFilter) setFilterOption(savedFilter as FilterOption);
      if (savedSort) setSortOption(savedSort as SortOption);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreference = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlants();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const applyFiltersAndSort = () => {
    let result = [...plants];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(plant =>
        plant.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter option
    if (filterOption === 'needsWater') {
      result = result.filter(plant => needsWatering(plant));
    } else if (filterOption === 'healthy') {
      result = result.filter(plant => !needsWatering(plant));
    }

    // Apply sort
    if (sortOption === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'nextWatering') {
      result.sort((a, b) => {
        const dateA = new Date(a.nextWateringDate || a.nextWateringAt);
        const dateB = new Date(b.nextWateringDate || b.nextWateringAt);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortOption === 'recentlyAdded') {
      result.sort((a, b) => {
        const dateA = new Date(a.addedAt);
        const dateB = new Date(b.addedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }

    setFilteredPlants(result);
  };

  function needsWatering(plant: GardenPlant): boolean {
    const now = new Date();
    const nextWatering = new Date(plant.nextWateringDate || plant.nextWateringAt);
    return now >= nextWatering;
  }

  const toggleViewMode = useCallback(() => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    savePreference(STORAGE_KEYS.VIEW_MODE, newMode);
  }, [viewMode]);

  const handleFilterSelect = useCallback((filter: FilterOption) => {
    setFilterOption(filter);
    savePreference(STORAGE_KEYS.FILTER, filter);
    setShowFilterModal(false);
  }, []);

  const handleSortSelect = useCallback((sort: SortOption) => {
    setSortOption(sort);
    savePreference(STORAGE_KEYS.SORT, sort);
    setShowSortModal(false);
  }, []);

  const handleWaterPlant = useCallback(async (plant: GardenPlant) => {
    try {
      const now = new Date().toISOString();

      // Update plant watering settings (this will auto-calculate next watering date)
      await updatePlantWateringSettings(plant.id!, {
        lastWateredDate: now,
      });

      // Reload plants to get updated data
      await loadPlants();

      // Reschedule watering reminder if enabled
      if (plant.wateringReminderEnabled && plant.id) {
        // Get the updated plant data with new nextWateringDate
        const updatedPlants = await getGardenPlants();
        const updatedPlant = updatedPlants.find(p => p.id === plant.id);
        
        if (updatedPlant) {
          await scheduleWateringReminder({
            id: updatedPlant.id!,
            name: updatedPlant.name,
            nextWateringDate: updatedPlant.nextWateringDate,
            lastWateredDate: now,
            reminderTime: updatedPlant.reminderTime,
          });
        }
      }

      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error watering plant:', error);
    }
  }, []);

  const renderPlant = useCallback(({ item }: { item: GardenPlant }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <SwipeablePlantCard
        plant={item}
        layout={viewMode}
        onPress={() => {
          navigation.navigate('PlantDetail', { plant: item, source: 'garden' });
        }}
        onWater={handleWaterPlant}
      />
    </View>
  ), [viewMode, handleWaterPlant, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary} />
      </View>
    );
  }

  if (plants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t('garden.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('garden.emptyMessage')}</Text>
          <TouchableOpacity
            style={styles.emptyScanButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <LinearGradient
              colors={[DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.primary + 'DD']}
              style={styles.emptyScanGradient}
            >
              <Text style={styles.emptyScanText}>{t('home.scanRoom')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Search and Controls */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={DESIGN_SYSTEM.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('garden.searchPlaceholder')}
            placeholderTextColor={DESIGN_SYSTEM.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={DESIGN_SYSTEM.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color={DESIGN_SYSTEM.colors.primary} />
            {filterOption !== 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="swap-vertical" size={20} color={DESIGN_SYSTEM.colors.primary} />
            {sortOption !== 'recentlyAdded' && <View style={styles.activeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleViewMode}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={20}
              color={DESIGN_SYSTEM.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Plant List */}
      <FlatList
        data={filteredPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContent}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render on view mode change
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DESIGN_SYSTEM.colors.primary}
          />
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('garden.filterBy')}</Text>
            
            {(['all', 'needsWater', 'healthy'] as FilterOption[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  filterOption === option && styles.modalOptionActive,
                ]}
                onPress={() => handleFilterSelect(option)}
              >
                <Text style={[
                  styles.modalOptionText,
                  filterOption === option && styles.modalOptionTextActive,
                ]}>
                  {t(`garden.filter.${option}`)}
                </Text>
                {filterOption === option && (
                  <Ionicons name="checkmark" size={20} color={DESIGN_SYSTEM.colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('garden.sortBy')}</Text>
            
            {(['name', 'nextWatering', 'recentlyAdded'] as SortOption[]).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  sortOption === option && styles.modalOptionActive,
                ]}
                onPress={() => handleSortSelect(option)}
              >
                <Text style={[
                  styles.modalOptionText,
                  sortOption === option && styles.modalOptionTextActive,
                ]}>
                  {t(`garden.sort.${option}`)}
                </Text>
                {sortOption === option && (
                  <Ionicons name="checkmark" size={20} color={DESIGN_SYSTEM.colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing.xl,
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.text,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  emptyScanButton: {
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  emptyScanGradient: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.xl,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
  },
  emptyScanText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.surface,
  },
  header: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingTop: DESIGN_SYSTEM.spacing.md,
    paddingBottom: DESIGN_SYSTEM.spacing.sm,
    ...DESIGN_SYSTEM.shadows.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.background,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  searchIcon: {
    marginRight: DESIGN_SYSTEM.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.text,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    backgroundColor: DESIGN_SYSTEM.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_SYSTEM.colors.accent,
  },
  listContent: {
    padding: DESIGN_SYSTEM.spacing.md,
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  gridItem: {
    width: '48%',
    marginHorizontal: '1%',
  },
  listItem: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN_SYSTEM.colors.surface,
    borderTopLeftRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    borderTopRightRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    padding: DESIGN_SYSTEM.spacing.lg,
    paddingBottom: DESIGN_SYSTEM.spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DESIGN_SYSTEM.colors.text,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    backgroundColor: DESIGN_SYSTEM.colors.background,
  },
  modalOptionActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryLight,
  },
  modalOptionText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.text,
  },
  modalOptionTextActive: {
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
  },
  modalCloseButton: {
    marginTop: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
});

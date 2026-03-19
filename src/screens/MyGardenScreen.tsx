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
  SafeAreaView,
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
      setPlants(Array.isArray(gardenPlants) ? gardenPlants : []);
    } catch (error) {
      console.error('Error loading garden plants:', error);
      setPlants([]);
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
    let result = Array.isArray(plants) ? [...plants] : [];

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
        const updatedPlant = (Array.isArray(updatedPlants) ? updatedPlants : []).find(p => p.id === plant.id);
        
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
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!Array.isArray(plants) || plants.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Animated.View style={styles.emptyCard}>
          <LinearGradient
            colors={DESIGN_SYSTEM.colors.heroGradient}
            style={styles.emptyBadge}
          >
            <Text style={styles.emptyEmoji}>🌱</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>{t('garden.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('garden.emptyMessage')}</Text>
          <TouchableOpacity
            style={styles.emptyScanButton}
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={DESIGN_SYSTEM.colors.primaryGradient}
              style={styles.emptyScanGradient}
            >
              <Text style={styles.emptyScanText}>{t('home.scanRoom')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search and Controls */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={DESIGN_SYSTEM.colors.heroGradient}
          style={styles.headerCard}
        >
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
              activeOpacity={0.85}
            >
              <Ionicons name="filter" size={20} color={DESIGN_SYSTEM.colors.primary} />
              {filterOption !== 'all' && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSortModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="swap-vertical" size={20} color={DESIGN_SYSTEM.colors.primary} />
              {sortOption !== 'recentlyAdded' && <View style={styles.activeDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleViewMode}
              activeOpacity={0.85}
            >
              <Ionicons
                name={viewMode === 'grid' ? 'list' : 'grid'}
                size={20}
                color={DESIGN_SYSTEM.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.listShell}>
        <FlatList
          data={filteredPlants}
          renderItem={renderPlant}
          keyExtractor={(item) => item.id!.toString()}
          contentContainerStyle={styles.listContent}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render on view mode change
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DESIGN_SYSTEM.colors.primary}
            />
          }
        />
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
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
            <View style={styles.modalHandle} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 240,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 24,
    paddingVertical: DESIGN_SYSTEM.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing.xl,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 28,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.xl,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.large,
  },
  emptyBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  emptyScanButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  emptyScanGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.md,
  },
  emptyScanText: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  headerWrap: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingTop: DESIGN_SYSTEM.spacing.md,
    paddingBottom: DESIGN_SYSTEM.spacing.sm,
  },
  headerCard: {
    borderRadius: 24,
    padding: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 18,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    minHeight: 52,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  searchIcon: {
    marginRight: DESIGN_SYSTEM.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.small,
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_SYSTEM.colors.accentRose,
  },
  listShell: {
    flex: 1,
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
    backgroundColor: DESIGN_SYSTEM.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: DESIGN_SYSTEM.spacing.lg,
    paddingBottom: DESIGN_SYSTEM.spacing.xl,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.large,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: DESIGN_SYSTEM.colors.borderStrong,
    alignSelf: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    borderRadius: 18,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  modalOptionActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderColor: DESIGN_SYSTEM.colors.primaryGlow,
  },
  modalOptionText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  modalOptionTextActive: {
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
  },
  modalCloseButton: {
    marginTop: DESIGN_SYSTEM.spacing.md,
    backgroundColor: DESIGN_SYSTEM.colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
});

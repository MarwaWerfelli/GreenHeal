import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { saveMoodCheckIn, getGardenPlants, getOnboardingData } from '../modules/storage';
import MoodChart from '../components/MoodChart';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { HomeScreenProps } from '../types';

// Import SVG icons
import CameraIcon from '../../assets/camera.svg';
import WaterIcon from '../../assets/water.svg';
import BookIcon from '../../assets/book.svg';
import PlantIcon from '../../assets/plant.svg';

// Daily plant tips with icons - using translation keys
const DAILY_TIPS = [
  { icon: '🌿', key: 'home.tips.0' },
  { icon: '🌱', key: 'home.tips.1' },
  { icon: '🍃', key: 'home.tips.2' },
  { icon: '🌸', key: 'home.tips.3' },
  { icon: '🌿', key: 'home.tips.4' },
  { icon: '🌼', key: 'home.tips.5' },
  { icon: '🌿', key: 'home.tips.6' },
  { icon: '🌱', key: 'home.tips.7' },
  { icon: '🍃', key: 'home.tips.8' },
  { icon: '🌿', key: 'home.tips.9' },
];

// Mood emojis for the 1-5 scale
const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];
const MOOD_LABELS = ['mood.1', 'mood.2', 'mood.3', 'mood.4', 'mood.5'];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [plantCount, setPlantCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState('Friend');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Auto-scroll carousel every 10 seconds
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % DAILY_TIPS.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Reload plant count whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      // Get plant count
      const plants = await getGardenPlants();
      setPlantCount(plants.length);

      // Get user name from onboarding (if available)
      const onboarding = await getOnboardingData();
      if (onboarding) {
        setUserName(t('home.friend'));
      } else {
        setUserName(t('home.friend'));
      }

      // Calculate streak (placeholder)
      setStreak(0);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const handleMoodSelection = useCallback(async (moodScore: number) => {
    try {
      setSelectedMood(moodScore);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save mood check-in
      await saveMoodCheckIn({
        moodScore: moodScore as 1 | 2 | 3 | 4 | 5,
        createdAt: new Date().toISOString(),
      });
      
      console.log(`Mood check-in saved: ${moodScore}`);
      
      // Reload data to update chart
      setTimeout(() => loadUserData(), 500);
    } catch (error) {
      console.error('Error saving mood check-in:', error);
    }
  }, []);

  const handleScanRoom = useCallback(() => {
    navigation.navigate('Camera');
  }, [navigation]);

  const handleMyJourney = useCallback(() => {
    navigation.navigate('HealingJournal');
  }, [navigation]);

  const handleWaterPlants = useCallback(() => {
    navigation.navigate('MyGarden');
  }, [navigation]);

  const handleAddPlant = useCallback(() => {
    navigation.navigate('MyGarden');
  }, [navigation]);

  const handleNewEntry = useCallback(() => {
    navigation.navigate('JournalEntryForm', {});
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section with Gradient */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={DESIGN_SYSTEM.colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            <Text style={styles.heroGreeting}>
              {getGreeting()}, {userName} 🌿
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('home.yourHealingJourney')}
            </Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statBadge}>
                <Text style={styles.statLabel}>{t('home.streak')}</Text>
                <Text style={styles.statValue}>{streak} {t('home.days')}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statLabel}>{t('home.plants')}</Text>
                <Text style={styles.statValue}>{plantCount}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleScanRoom}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionContent, styles.scanRoomCard]}>
                <CameraIcon 
                  width={36} 
                  height={36} 
                  color={DESIGN_SYSTEM.colors.primaryLight}
                  style={styles.iconImage}
                />
                <Text style={[styles.quickActionText, styles.scanRoomText]}>{t('home.scanRoom')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleWaterPlants}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionContent, styles.waterPlantsCard]}>
                <WaterIcon 
                  width={36} 
                  height={36} 
                  color={DESIGN_SYSTEM.colors.accentBlueIcon}
                  style={styles.iconImage}
                />
                <Text style={[styles.quickActionText, styles.waterText]}>{t('home.waterPlants')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleNewEntry}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionContent, styles.newEntryCard]}>
                <BookIcon 
                  width={36} 
                  height={36} 
                  color={DESIGN_SYSTEM.colors.accentWarm}
                  style={styles.iconImage}
                />
                <Text style={[styles.quickActionText, styles.newEntryText]}>{t('home.newEntry')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleAddPlant}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionContent, styles.addPlantCard]}>
                <PlantIcon 
                  width={36} 
                  height={36} 
                  color={DESIGN_SYSTEM.colors.primaryLight}
                  style={styles.iconImage}
                />
                <Text style={[styles.quickActionText, styles.addPlantText]}>{t('home.addPlant')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Tip Carousel */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>💡 {t('home.dailyTip')}</Text>
          <FlatList
            data={DAILY_TIPS}
            horizontal
            pagingEnabled={false}
            snapToInterval={Dimensions.get('window').width - DESIGN_SYSTEM.spacing.md * 2}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const slideWidth = Dimensions.get('window').width - DESIGN_SYSTEM.spacing.md * 2;
              const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
              setCurrentTipIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.tipSlide}>
                <Text style={styles.tipIcon}>{item.icon}</Text>
                <Text style={styles.tipText}>{t(item.key)}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          
          {/* Pagination dots */}
          <View style={styles.paginationDots}>
            {DAILY_TIPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentTipIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Mood Check-in Widget with Chart */}
        <View style={styles.moodContainer}>
          <LinearGradient
            colors={[DESIGN_SYSTEM.colors.primaryGlow, DESIGN_SYSTEM.colors.borderSubtle]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.moodGradientBorder}
          >
            <View style={styles.moodContent}>
              <Text style={styles.moodTitle}>{t('home.moodCheckIn')}</Text>
              <View style={styles.moodScale}>
                {MOOD_EMOJIS.map((emoji, index) => {
                  const moodScore = index + 1;
                  const isSelected = selectedMood === moodScore;
                  const bounceAnim = useRef(new Animated.Value(1)).current;

                  const handlePress = () => {
                    // Bounce animation
                    Animated.sequence([
                      Animated.spring(bounceAnim, {
                        toValue: 1.3,
                        friction: 3,
                        tension: 40,
                        useNativeDriver: true,
                      }),
                      Animated.spring(bounceAnim, {
                        toValue: 1,
                        friction: 3,
                        tension: 40,
                        useNativeDriver: true,
                      }),
                    ]).start();

                    handleMoodSelection(moodScore);
                  };

                  return (
                    <TouchableOpacity
                      key={moodScore}
                      style={[
                        styles.moodButton,
                        isSelected && styles.moodButtonSelected,
                      ]}
                      onPress={handlePress}
                      activeOpacity={0.6}
                      testID={`mood-button-${moodScore}`}
                    >
                      <Animated.Text
                        style={[
                          styles.moodEmoji,
                          { transform: [{ scale: bounceAnim }] },
                        ]}
                      >
                        {emoji}
                      </Animated.Text>
                      <Text style={styles.moodLabel}>{t(MOOD_LABELS[index])}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* Weekly Mood Chart */}
              <MoodChart />
              
              {/* Progress text */}
              <Text style={styles.moodProgressText}>
                {t('home.moodProgress')}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  heroSection: {
    padding: DESIGN_SYSTEM.spacing.xl,
    paddingTop: DESIGN_SYSTEM.spacing.xxl,
    paddingBottom: DESIGN_SYSTEM.spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: '800',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.md,
  },
  statBadge: {
    backgroundColor: DESIGN_SYSTEM.colors.glassOverlay,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.glassBorder,
  },
  statLabel: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  quickActionsContainer: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    marginTop: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  quickActionContent: {
    padding: DESIGN_SYSTEM.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  scanRoomCard: {
    backgroundColor: '#ffffff',
  },
  waterPlantsCard: {
    backgroundColor: DESIGN_SYSTEM.colors.accentBlue,
  },
  newEntryCard: {
    backgroundColor: DESIGN_SYSTEM.colors.accentWarmPale,
  },
  addPlantCard: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  iconImage: {
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    textAlign: 'center',
  },
  scanRoomText: {
    color: DESIGN_SYSTEM.colors.primary,
  },
  waterText: {
    color: DESIGN_SYSTEM.colors.accentBlueIcon,
  },
  newEntryText: {
    color: DESIGN_SYSTEM.colors.accentWarm,
  },
  addPlantText: {
    color: DESIGN_SYSTEM.colors.primary,
  },
  tipContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    paddingVertical: DESIGN_SYSTEM.spacing.lg,
    borderRadius: 20,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    borderLeftWidth: 4,
    borderLeftColor: DESIGN_SYSTEM.colors.primaryLight,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
  },
  tipSlide: {
    width: Dimensions.get('window').width - DESIGN_SYSTEM.spacing.md * 2,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  tipText: {
    fontSize: 15,
    color: DESIGN_SYSTEM.colors.textPrimary,
    lineHeight: 22,
    textAlign: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: DESIGN_SYSTEM.spacing.md,
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DESIGN_SYSTEM.colors.textDisabled,
  },
  dotActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    width: 20,
  },
  moodContainer: {
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.medium,
  },
  moodGradientBorder: {
    padding: 2,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
  },
  moodContent: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    padding: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.md,
    textAlign: 'center',
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: DESIGN_SYSTEM.spacing.sm,
    borderRadius: DESIGN_SYSTEM.borderRadius.medium,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    minHeight: 90,
    justifyContent: 'center',
  },
  moodButtonSelected: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryGlow,
    borderColor: DESIGN_SYSTEM.colors.primary,
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
    lineHeight: 32,
  },
  moodLabel: {
    fontSize: 9,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  moodProgressText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginTop: DESIGN_SYSTEM.spacing.md,
    fontStyle: 'italic',
  },
});

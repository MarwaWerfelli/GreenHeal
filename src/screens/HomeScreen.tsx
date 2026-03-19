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
import type { HealingGoal, HomeScreenProps } from '../types';

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
const VALID_HEALING_GOALS: HealingGoal[] = ['stress', 'physical', 'depression', 'sleep', 'wellness'];

function getSafeColorArray(value: unknown, fallback: string[]): string[] {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(color => typeof color === 'string' && color.trim().length > 0)
  ) {
    return value;
  }

  return fallback;
}

function isHealingGoal(value: unknown): value is HealingGoal {
  return typeof value === 'string' && VALID_HEALING_GOALS.includes(value as HealingGoal);
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const dailyTips = Array.isArray(DAILY_TIPS) ? DAILY_TIPS : [];
  const moodEmojis = Array.isArray(MOOD_EMOJIS) ? MOOD_EMOJIS : [];
  const moodLabels = Array.isArray(MOOD_LABELS) ? MOOD_LABELS : [];
  const heroGradientColors = getSafeColorArray(
    DESIGN_SYSTEM.colors.heroGradient,
    [DESIGN_SYSTEM.colors.bgBase, DESIGN_SYSTEM.colors.bgSurface]
  );
  const moodGradientColors = getSafeColorArray(
    [DESIGN_SYSTEM.colors.primaryGlow, DESIGN_SYSTEM.colors.borderSubtle],
    [DESIGN_SYSTEM.colors.bgSurface, DESIGN_SYSTEM.colors.bgElevated]
  );
  const tipSlideWidth = Dimensions.get('window').width - DESIGN_SYSTEM.spacing.md * 2;
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [plantCount, setPlantCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userName, setUserName] = useState('Friend');
  const [recoveryFocus, setRecoveryFocus] = useState<HealingGoal | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  // One stable Animated.Value per mood button — must NOT be inside .map()
  const bounceAnims = useRef(moodEmojis.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Auto-scroll carousel every 10 seconds
    if (dailyTips.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % dailyTips.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [dailyTips.length, fadeAnim]);

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
      const normalizedPlants = Array.isArray(plants) ? plants : [];
      setPlantCount(normalizedPlants.length);

      // Get user name from onboarding (if available)
      const onboarding = await getOnboardingData();
      const reportProfile = onboarding?.reportProfile;
      const preferredName =
        reportProfile && typeof reportProfile === 'object' && typeof reportProfile.preferredName === 'string'
          ? reportProfile.preferredName.trim()
          : '';
      const fullName =
        reportProfile && typeof reportProfile === 'object' && typeof reportProfile.fullName === 'string'
          ? reportProfile.fullName.trim()
          : '';
      const displayName = preferredName || fullName || t('home.friend');

      if (onboarding && isHealingGoal(onboarding.healingGoal)) {
        setRecoveryFocus(onboarding.healingGoal);
        setUserName(displayName);
      } else {
        setRecoveryFocus(null);
        setUserName(displayName);
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

  const getRecoveryFocusLabel = () => {
    if (!recoveryFocus) {
      return t('onboarding.healingGoals.wellness');
    }

    return t(`onboarding.healingGoals.${recoveryFocus}`);
  };

  const getDailyActionText = () => {
    if (selectedMood !== null && selectedMood <= 2) {
      return t('home.dailyActionRestore');
    }

    if (plantCount === 0) {
      return t('home.dailyActionStartSpace');
    }

    switch (recoveryFocus) {
      case 'stress':
        return t('home.dailyActionStress');
      case 'sleep':
        return t('home.dailyActionSleep');
      case 'physical':
        return t('home.dailyActionPhysical');
      case 'depression':
        return t('home.dailyActionReconnect');
      case 'wellness':
      default:
        return t('home.dailyActionWellness');
    }
  };

  const getReflectionPrompt = () => {
    switch (recoveryFocus) {
      case 'stress':
        return t('home.reflectionStress');
      case 'sleep':
        return t('home.reflectionSleep');
      case 'physical':
        return t('home.reflectionPhysical');
      case 'depression':
        return t('home.reflectionDepression');
      case 'wellness':
      default:
        return t('home.reflectionWellness');
    }
  };

  const getMoodSupportMessage = () => {
    if (selectedMood === null) {
      return t('home.moodSupport.default');
    }

    return t(`home.moodSupport.${selectedMood}`);
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
    navigation.navigate('GuidedDialogue');
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

  const supportTitle = plantCount > 0
    ? t('home.supportReadyTitle')
    : t('home.supportEmptyTitle');
  const supportBody = plantCount > 0
    ? t('home.supportReadyBody')
    : t('home.supportEmptyBody');
  const healingPathSteps = [
    {
      key: 'scan',
      emoji: '📸',
      title: t('home.stepOneTitle'),
      body: t('home.stepOneBody'),
    },
    {
      key: 'choose',
      emoji: '🪴',
      title: t('home.stepTwoTitle'),
      body: t('home.stepTwoBody'),
    },
    {
      key: 'care',
      emoji: '💧',
      title: t('home.stepThreeTitle'),
      body: t('home.stepThreeBody'),
    },
  ];
  const dailyRhythmCards = [
    {
      key: 'focus',
      label: t('home.todayFocusTitle'),
      text: `${t('home.focusLabel')}: ${getRecoveryFocusLabel()}`,
      style: styles.dailyRhythmCardPrimary,
    },
    {
      key: 'step',
      label: t('home.gentleStepTitle'),
      text: getDailyActionText(),
      style: styles.dailyRhythmCardWarm,
    },
    {
      key: 'reflection',
      label: t('home.reflectionPromptTitle'),
      text: getReflectionPrompt(),
      style: styles.dailyRhythmCardCalm,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Gradient */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={heroGradientColors}
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

            <View style={styles.focusPill}>
              <Text style={styles.focusPillText}>
                {t('home.focusLabel')}: {getRecoveryFocusLabel()}
              </Text>
            </View>
            
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

        <View style={styles.supportCardContainer}>
          <View style={styles.supportCard}>
            <Text style={styles.supportEyebrow}>{t('home.supportEyebrow')}</Text>
            <Text style={styles.supportTitle}>{supportTitle}</Text>
            <Text style={styles.supportDescription}>{supportBody}</Text>

            <View style={styles.supportActionsRow}>
              <TouchableOpacity
                style={styles.supportPrimaryButton}
                onPress={handleScanRoom}
                activeOpacity={0.85}
              >
                <Text style={styles.supportPrimaryButtonText}>{t('home.primaryAction')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportSecondaryButton}
                onPress={handleWaterPlants}
                activeOpacity={0.85}
              >
                <Text style={styles.supportSecondaryButtonText}>{t('home.secondaryAction')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.dailyRhythmSection}>
          <Text style={styles.sectionTitle}>{t('home.dailyRhythmTitle')}</Text>
          <Text style={styles.dailyRhythmSubtitle}>{t('home.dailyRhythmSubtitle')}</Text>

          {dailyRhythmCards.map((card) => (
            <View key={card.key} style={[styles.dailyRhythmCard, card.style]}>
              <Text style={styles.dailyRhythmLabel}>{card.label}</Text>
              <Text style={styles.dailyRhythmText}>{card.text}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>{t('home.nextActionsTitle')}</Text>

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
                <Text style={styles.quickActionHint}>{t('home.actionHintScan')}</Text>
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
                <Text style={styles.quickActionHint}>{t('home.actionHintCare')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleMyJourney}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionContent, styles.newEntryCard]}>
                <BookIcon 
                  width={36} 
                  height={36} 
                  color={DESIGN_SYSTEM.colors.accentWarm}
                  style={styles.iconImage}
                />
                <Text style={[styles.quickActionText, styles.newEntryText]}>{t('home.myJourney')}</Text>
                <Text style={styles.quickActionHint}>{t('home.actionHintJourney')}</Text>
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
                <Text style={styles.quickActionHint}>{t('home.actionHintGarden')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.pathwaySection}>
          <Text style={styles.sectionTitle}>{t('home.healingPathTitle')}</Text>
          {healingPathSteps.map((step) => (
            <View key={step.key} style={styles.pathwayCard}>
              <Text style={styles.pathwayEmoji}>{step.emoji}</Text>
              <View style={styles.pathwayTextContainer}>
                <Text style={styles.pathwayTitle}>{step.title}</Text>
                <Text style={styles.pathwayDescription}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Daily Tip Carousel */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>💡 {t('home.dailyTip')}</Text>
          {dailyTips.length > 0 ? (
            <>
              <FlatList
                data={dailyTips}
                horizontal
                pagingEnabled={false}
                snapToInterval={tipSlideWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / tipSlideWidth);
                  const clampedIndex = Math.max(0, Math.min(index, dailyTips.length - 1));
                  setCurrentTipIndex(clampedIndex);
                }}
                renderItem={({ item }) => (
                  <View style={styles.tipSlide}>
                    <Text style={styles.tipIcon}>{item.icon}</Text>
                    <Text style={styles.tipText}>{t(item.key)}</Text>
                  </View>
                )}
                keyExtractor={(item, index) => `${item.key}-${index}`}
              />

              {/* Pagination dots */}
              <View style={styles.paginationDots}>
                {dailyTips.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index === currentTipIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.tipSlide}>
              <Text style={styles.tipText}>{t('home.friend')}</Text>
            </View>
          )}
        </View>

        {/* Mood Check-in Widget with Chart */}
        <View style={styles.moodContainer}>
          <LinearGradient
            colors={moodGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.moodGradientBorder}
          >
            <View style={styles.moodContent}>
              <Text style={styles.moodTitle}>{t('home.moodCheckIn')}</Text>
              <View style={styles.moodScale}>
                {moodEmojis.map((emoji, index) => {
                  const moodScore = index + 1;
                  const isSelected = selectedMood === moodScore;
                  const bounceAnim = bounceAnims[index];

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
                      <Text style={styles.moodLabel}>{t(moodLabels[index] || `mood.${moodScore}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text testID="mood-support-text" style={styles.moodSupportText}>
                {getMoodSupportMessage()}
              </Text>
              
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
    lineHeight: 23,
  },
  focusPill: {
    alignSelf: 'flex-start',
    backgroundColor: DESIGN_SYSTEM.colors.glassOverlay,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.glassBorder,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    borderRadius: 999,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  focusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  supportCardContainer: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    marginTop: -DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  supportCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 24,
    padding: DESIGN_SYSTEM.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  supportEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  supportDescription: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 21,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  supportActionsRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  supportPrimaryButton: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  supportPrimaryButtonText: {
    color: DESIGN_SYSTEM.colors.bgSurface,
    fontSize: 14,
    fontWeight: '700',
  },
  supportSecondaryButton: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  supportSecondaryButtonText: {
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  dailyRhythmSection: {
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  dailyRhythmSubtitle: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 21,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  dailyRhythmCard: {
    borderRadius: 18,
    padding: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    borderWidth: 1,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  dailyRhythmCardPrimary: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  dailyRhythmCardWarm: {
    backgroundColor: DESIGN_SYSTEM.colors.accentWarmPale,
    borderColor: DESIGN_SYSTEM.colors.accentGoldDim,
  },
  dailyRhythmCardCalm: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderColor: DESIGN_SYSTEM.colors.primaryGlow,
  },
  dailyRhythmLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dailyRhythmText: {
    fontSize: 15,
    lineHeight: 22,
    color: DESIGN_SYSTEM.colors.textPrimary,
    fontWeight: '600',
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
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.md,
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
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
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
    marginBottom: 4,
  },
  quickActionHint: {
    fontSize: 12,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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
  pathwaySection: {
    marginHorizontal: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  pathwayCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 18,
    padding: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  pathwayEmoji: {
    fontSize: 24,
    marginRight: DESIGN_SYSTEM.spacing.md,
    marginTop: 2,
  },
  pathwayTextContainer: {
    flex: 1,
  },
  pathwayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 4,
  },
  pathwayDescription: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 19,
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
  moodSupportText: {
    fontSize: 14,
    lineHeight: 21,
    color: DESIGN_SYSTEM.colors.textPrimary,
    textAlign: 'center',
    marginTop: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  moodProgressText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginTop: DESIGN_SYSTEM.spacing.md,
    fontStyle: 'italic',
  },
});

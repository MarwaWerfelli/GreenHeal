import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveMoodCheckIn } from '../modules/storage';
import { COLORS } from '../utils/constants';
import type { HomeScreenProps } from '../types';

// Daily plant tips - deterministic based on date
const DAILY_TIPS = [
  'Lavender can reduce anxiety and improve sleep quality',
  'Aloe vera purifies air and promotes skin healing',
  'Snake plants release oxygen at night, perfect for bedrooms',
  'Jasmine fragrance can reduce stress and improve mood',
  'Rosemary enhances memory and concentration',
  'Chamomile tea from fresh flowers aids relaxation',
  'Mint leaves can relieve headaches and improve digestion',
  'Peace lilies remove toxins and improve air quality',
  'Spider plants are excellent for reducing indoor pollution',
  'Basil has anti-inflammatory and antibacterial properties',
];

// Mood emojis for the 1-5 scale
const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];
const MOOD_LABELS = ['mood.1', 'mood.2', 'mood.3', 'mood.4', 'mood.5'];

/**
 * Get daily tip based on current date (deterministic)
 */
function getDailyTip(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const handleMoodSelection = async (moodScore: number) => {
    try {
      setSelectedMood(moodScore);
      await saveMoodCheckIn(moodScore);
      console.log(`Mood check-in saved: ${moodScore}`);
    } catch (error) {
      console.error('Error saving mood check-in:', error);
    }
  };

  const handleScanRoom = () => {
    navigation.navigate('Camera');
  };

  const handleMyJourney = () => {
    // Navigate to healing journal tab
    navigation.navigate('HealingJournal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌿 {t('home.title')}</Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleScanRoom}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionButtonText}>{t('home.scanRoom')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleMyJourney}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>📔</Text>
            <Text style={styles.actionButtonText}>{t('home.myJourney')}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>💡 {t('home.dailyTip')}</Text>
          <Text style={styles.tipText}>{getDailyTip()}</Text>
        </View>

        {/* Mood Check-in Widget */}
        <View style={styles.moodContainer}>
          <Text style={styles.moodTitle}>{t('home.moodCheckIn')}</Text>
          <View style={styles.moodScale}>
            {MOOD_EMOJIS.map((emoji, index) => {
              const moodScore = index + 1;
              const isSelected = selectedMood === moodScore;
              return (
                <TouchableOpacity
                  key={moodScore}
                  style={[
                    styles.moodButton,
                    isSelected && styles.moodButtonSelected,
                  ]}
                  onPress={() => handleMoodSelection(moodScore)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                  <Text style={styles.moodLabel}>{t(MOOD_LABELS[index])}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  tipContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  moodContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  moodButtonSelected: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

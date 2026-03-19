import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { DESIGN_SYSTEM } from '../utils/constants';

const RATINGS = [1, 2, 3, 4, 5];

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const [overallRating, setOverallRating] = useState(0);
  const [supportRating, setSupportRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isSubmitDisabled = overallRating === 0 || supportRating === 0;

  const renderRatingRow = (
    label: string,
    prefix: 'overall-rating' | 'support-rating',
    selectedValue: number,
    onSelect: (value: number) => void,
  ) => (
    <View style={styles.questionCard}>
      <Text style={styles.questionText}>{label}</Text>
      <View style={styles.ratingRow}>
        {RATINGS.map((rating) => {
          const isSelected = rating <= selectedValue;
          return (
            <TouchableOpacity
              key={`${prefix}-${rating}`}
              testID={`${prefix}-${rating}`}
              style={[styles.ratingChip, isSelected && styles.ratingChipSelected]}
              onPress={() => onSelect(rating)}
              activeOpacity={0.8}
            >
              <Text style={[styles.ratingText, isSelected && styles.ratingTextSelected]}>
                {rating}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.thankYouState}>
          <LinearGradient
            colors={DESIGN_SYSTEM.colors.heroGradient}
            style={styles.thankYouCard}
          >
            <View style={styles.thankYouBadge}>
              <Text style={styles.thankYouBadgeText}>✓</Text>
            </View>
            <Text style={styles.thankYouTitle}>{t('feedback.thankYouTitle')}</Text>
            <Text style={styles.thankYouBody}>{t('feedback.thankYouBody')}</Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={DESIGN_SYSTEM.colors.heroGradient}
          style={styles.heroCard}
        >
          <Text style={styles.eyebrow}>GreenHeal</Text>
          <Text style={styles.title}>{t('feedback.title')}</Text>
          <Text style={styles.subtitle}>{t('feedback.subtitle')}</Text>

          <View style={styles.progressRow}>
            <View style={[styles.progressDot, overallRating > 0 && styles.progressDotActive]} />
            <View style={[styles.progressDot, supportRating > 0 && styles.progressDotActive]} />
            <View style={[styles.progressDot, notes.trim().length > 0 && styles.progressDotActiveSoft]} />
          </View>
        </LinearGradient>

        {renderRatingRow(
          t('feedback.overallExperience'),
          'overall-rating',
          overallRating,
          setOverallRating,
        )}

        {renderRatingRow(
          t('feedback.healingSupport'),
          'support-rating',
          supportRating,
          setSupportRating,
        )}

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{t('feedback.comment')}</Text>
          <TextInput
            testID="feedback-notes-input"
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('feedback.commentPlaceholder')}
            placeholderTextColor={DESIGN_SYSTEM.colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
          onPress={() => !isSubmitDisabled && setSubmitted(true)}
          disabled={isSubmitDisabled}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              isSubmitDisabled
                ? [DESIGN_SYSTEM.colors.textDisabled, DESIGN_SYSTEM.colors.textDisabled]
                : DESIGN_SYSTEM.colors.primaryGradient
            }
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>{t('feedback.submit')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  content: {
    padding: DESIGN_SYSTEM.spacing.md,
    paddingBottom: 120,
    gap: DESIGN_SYSTEM.spacing.md,
  },
  heroCard: {
    borderRadius: 28,
    padding: DESIGN_SYSTEM.spacing.xl,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginTop: DESIGN_SYSTEM.spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: DESIGN_SYSTEM.spacing.sm,
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  progressDot: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: DESIGN_SYSTEM.colors.glassOverlay,
  },
  progressDotActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
  },
  progressDotActiveSoft: {
    backgroundColor: DESIGN_SYSTEM.colors.accentGold,
  },
  questionCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: 22,
    padding: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  ratingChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  ratingChipSelected: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    borderColor: DESIGN_SYSTEM.colors.primary,
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  ratingTextSelected: {
    color: DESIGN_SYSTEM.colors.bgSurface,
  },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: DESIGN_SYSTEM.colors.textPrimary,
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
  },
  submitButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  submitButtonDisabled: {
    ...DESIGN_SYSTEM.shadows.small,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: DESIGN_SYSTEM.colors.bgSurface,
    fontSize: 16,
    fontWeight: '700',
  },
  thankYouState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  thankYouCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    paddingHorizontal: DESIGN_SYSTEM.spacing.xl,
    paddingVertical: DESIGN_SYSTEM.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.large,
  },
  thankYouBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.primaryGlow,
  },
  thankYouBadgeText: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  thankYouTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  thankYouBody: {
    fontSize: 16,
    lineHeight: 24,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
  },
});
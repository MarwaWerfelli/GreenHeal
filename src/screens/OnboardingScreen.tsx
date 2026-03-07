import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { saveOnboardingData } from '../modules/storage';
import { saveImage } from '../modules/image';
import { COLORS } from '../utils/constants';
import type { HealingGoal, Budget, OnboardingData } from '../types';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [healingGoal, setHealingGoal] = useState<HealingGoal | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [plantPhotos, setPlantPhotos] = useState<string[]>([]);

  const healingGoalOptions: { value: HealingGoal; label: string }[] = [
    { value: 'stress', label: t('onboarding.healingGoals.stress') },
    { value: 'physical', label: t('onboarding.healingGoals.physical') },
    { value: 'depression', label: t('onboarding.healingGoals.depression') },
    { value: 'sleep', label: t('onboarding.healingGoals.sleep') },
    { value: 'wellness', label: t('onboarding.healingGoals.wellness') },
  ];

  const budgetOptions: { value: Budget; label: string }[] = [
    { value: 'under10', label: t('onboarding.budget.under10') },
    { value: '10to30', label: t('onboarding.budget.10to30') },
    { value: 'over30', label: t('onboarding.budget.over30') },
    { value: 'have_plants', label: t('onboarding.budget.havePlants') },
  ];

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const savedPaths: string[] = [];
      
      for (const asset of result.assets) {
        try {
          const savedPath = await saveImage(asset.uri, 'onboarding_photos');
          savedPaths.push(savedPath);
        } catch (error) {
          console.error('Error saving image:', error);
        }
      }
      
      setPlantPhotos([...plantPhotos, ...savedPaths]);
    }
  };

  const handleComplete = async () => {
    if (!healingGoal || !budget) {
      return;
    }

    const onboardingData: OnboardingData = {
      healingGoal,
      budget,
      existingPlantPhotos: plantPhotos.length > 0 ? plantPhotos : undefined,
      completedAt: new Date().toISOString(),
    };

    await saveOnboardingData(onboardingData);
    onComplete();
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((stepNumber) => (
        <View
          key={stepNumber}
          style={[
            styles.progressDot,
            step >= stepNumber && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.question}>{t('onboarding.healingQuestion')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.healingSubtitle')}</Text>

      <View style={styles.optionsContainer}>
        {healingGoalOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              healingGoal === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => setHealingGoal(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                healingGoal === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {healingGoal === option.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !healingGoal && styles.nextButtonDisabled]}
        onPress={() => healingGoal && setStep(2)}
        activeOpacity={0.7}
      >
        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.question}>{t('onboarding.budgetQuestion')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.budgetSubtitle')}</Text>

      <View style={styles.optionsContainer}>
        {budgetOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              budget === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => setBudget(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                budget === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {budget === option.value && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !budget && styles.nextButtonDisabled]}
          onPress={() => budget && setStep(3)}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.question}>{t('onboarding.photosQuestion')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.photosSubtitle')}</Text>

      {plantPhotos.length > 0 && (
        <ScrollView
          horizontal
          style={styles.photoPreviewContainer}
          showsHorizontalScrollIndicator={false}
        >
          {plantPhotos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.photoPreview}
            />
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handlePickImages}
        activeOpacity={0.7}
      >
        <Text style={styles.uploadButtonText}>
          {plantPhotos.length > 0
            ? t('onboarding.addMorePhotos')
            : t('onboarding.uploadPhotos')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.optionalText}>{t('onboarding.optional')}</Text>

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.completeButtonText}>{t('common.complete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🌿 {t('onboarding.title')}</Text>
        
        {renderProgressIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textSecondary + '40',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 32,
  },
  stepContainer: {
    width: '100%',
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textSecondary + '40',
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  photoPreviewContainer: {
    marginBottom: 16,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
});

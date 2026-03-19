import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { saveOnboardingData } from '../modules/storage';
import { saveImage } from '../modules/image';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { HealingGoal, Budget, OnboardingData, ReportProfile } from '../types';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const colors = DESIGN_SYSTEM.colors;
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [age, setAge] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [careProgram, setCareProgram] = useState('');
  const [clinicianName, setClinicianName] = useState('');
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
  const isProfileStepValid =
    fullName.trim().length > 0 && preferredName.trim().length > 0;
  const currentStepSubtitle =
    step === 1
      ? t('onboarding.profileSubtitle')
      : step === 2
        ? t('onboarding.healingSubtitle')
        : step === 3
          ? t('onboarding.budgetSubtitle')
          : t('onboarding.photosSubtitle');

  const buildReportProfile = (): ReportProfile => ({
    fullName: fullName.trim(),
    preferredName: preferredName.trim(),
    age: age.trim() || undefined,
    hospitalName: hospitalName.trim() || undefined,
    patientId: patientId.trim() || undefined,
    careProgram: careProgram.trim() || undefined,
    clinicianName: clinicianName.trim() || undefined,
  });

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
      reportProfile: buildReportProfile(),
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
      {[1, 2, 3, 4].map((stepNumber) => (
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
      <Text style={styles.question}>{t('onboarding.profileQuestion')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.profileSubtitle')}</Text>

      <Text style={styles.sectionLabel}>{t('onboarding.profilePersonalSection')}</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.fullName')}</Text>
        <TextInput
          testID="onboarding-fullName-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.fullName')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.preferredName')}</Text>
        <TextInput
          testID="onboarding-preferredName-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.preferredName')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          value={preferredName}
          onChangeText={setPreferredName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.age')}</Text>
        <TextInput
          testID="onboarding-age-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.age')}
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
        />
      </View>

      <Text style={styles.sectionLabel}>{t('onboarding.profileCareSection')}</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.hospitalName')}</Text>
        <TextInput
          testID="onboarding-hospitalName-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.hospitalName')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          value={hospitalName}
          onChangeText={setHospitalName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.patientId')}</Text>
        <TextInput
          testID="onboarding-patientId-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.patientId')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          value={patientId}
          onChangeText={setPatientId}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.careProgram')}</Text>
        <TextInput
          testID="onboarding-careProgram-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.careProgram')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          value={careProgram}
          onChangeText={setCareProgram}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('onboarding.profileFields.clinicianName')}</Text>
        <TextInput
          testID="onboarding-clinicianName-input"
          style={styles.textInput}
          placeholder={t('onboarding.profileFields.clinicianName')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="words"
          value={clinicianName}
          onChangeText={setClinicianName}
        />
      </View>

      <Text style={styles.helperText}>{t('onboarding.profileOptional')}</Text>
      <Text style={styles.helperText}>{t('onboarding.profilePrivacy')}</Text>

      <TouchableOpacity
        style={[styles.nextButton, !isProfileStepValid && styles.nextButtonDisabled]}
        onPress={() => isProfileStepValid && setStep(2)}
        disabled={!isProfileStepValid}
        activeOpacity={0.7}
      >
        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
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

      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !healingGoal && styles.nextButtonDisabled]}
          onPress={() => healingGoal && setStep(3)}
          disabled={!healingGoal}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
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
          onPress={() => setStep(2)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !budget && styles.nextButtonDisabled]}
          onPress={() => budget && setStep(4)}
          disabled={!budget}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
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
          onPress={() => setStep(3)}
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.stepBadge}>{step} / 4</Text>
          <Text style={styles.title}>🌿 {t('onboarding.title')}</Text>
          <Text style={styles.heroSubtitle}>{currentStepSubtitle}</Text>
          {renderProgressIndicator()}
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
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
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingTop: DESIGN_SYSTEM.spacing.xl,
    paddingBottom: DESIGN_SYSTEM.spacing.xl,
  },
  heroCard: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.xl,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  stepBadge: {
    alignSelf: 'center',
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    gap: 12,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DESIGN_SYSTEM.colors.textSecondary + '30',
  },
  progressDotActive: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    width: 32,
  },
  stepContainer: {
    width: '100%',
    padding: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'left',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  helperText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'left',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    padding: 20,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  optionButtonSelected: {
    borderColor: DESIGN_SYSTEM.colors.primary,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  optionText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
  },
  checkmark: {
    fontSize: 20,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    padding: 18,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  nextButtonDisabled: {
    backgroundColor: DESIGN_SYSTEM.colors.textSecondary + '40',
  },
  nextButtonText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    padding: 18,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderStrong,
  },
  backButtonText: {
    color: DESIGN_SYSTEM.colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    padding: 18,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.glowSubtle,
  },
  completeButtonText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: DESIGN_SYSTEM.colors.secondary,
    padding: 18,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionalText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
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
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
});

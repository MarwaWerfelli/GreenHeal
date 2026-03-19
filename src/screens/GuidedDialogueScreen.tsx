import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { DESIGN_SYSTEM } from '../utils/constants';
import type {
  GuidedDialogueContext,
  GuidedDialogueScreenProps,
  GuidedSymptomKey,
  SymptomSupportFocus,
  SymptomTimeOfDay,
} from '../types';

const colors = DESIGN_SYSTEM.colors;
const shadows = DESIGN_SYSTEM.shadows;
const SYMPTOMS: GuidedSymptomKey[] = [
  'night_waking',
  'anxiety',
  'irritability',
  'restlessness',
  'mental_fatigue',
  'low_mood',
];
const TIMES: SymptomTimeOfDay[] = ['night', 'morning', 'afternoon', 'evening', 'all_day'];
const SUPPORTS: SymptomSupportFocus[] = ['sleep', 'calm', 'emotional_balance', 'focus'];

export default function GuidedDialogueScreen({ navigation }: GuidedDialogueScreenProps) {
  const { t } = useTranslation();
  const [symptoms, setSymptoms] = useState<GuidedSymptomKey[]>([]);
  const [intensityWindow, setIntensityWindow] = useState<SymptomTimeOfDay | null>(null);
  const [supportFocus, setSupportFocus] = useState<SymptomSupportFocus | null>(null);

  const dominantSymptoms = useMemo(() => symptoms.slice(0, 2), [symptoms]);
  const canContinue = symptoms.length > 0 && Boolean(intensityWindow) && Boolean(supportFocus);

  function toggleSymptom(symptom: GuidedSymptomKey) {
    setSymptoms((current) => (
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    ));
  }

  function handleContinue() {
    if (!canContinue || !intensityWindow || !supportFocus) {
      return;
    }

    const guidedContext: GuidedDialogueContext = {
      symptoms,
      dominantSymptoms: dominantSymptoms.length ? dominantSymptoms : symptoms.slice(0, 1),
      intensityWindow,
      supportFocus,
    };

    navigation.navigate('Camera', { guidedContext });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{t('guidedDialogue.eyebrow')}</Text>
          <Text style={styles.title}>{t('guidedDialogue.title')}</Text>
          <Text style={styles.subtitle}>{t('guidedDialogue.subtitle')}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionStep}>{t('guidedDialogue.steps.symptoms')}</Text>
          <Text style={styles.sectionTitle}>{t('guidedDialogue.sections.symptomsTitle')}</Text>
          <Text style={styles.sectionBody}>{t('guidedDialogue.sections.symptomsBody')}</Text>
          <View style={styles.chipGrid}>
            {SYMPTOMS.map((symptom) => {
              const selected = symptoms.includes(symptom);
              return (
                <TouchableOpacity
                  key={symptom}
                  testID={`symptom-${symptom}`}
                  style={[styles.optionChip, selected && styles.optionChipSelected]}
                  onPress={() => toggleSymptom(symptom)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                    {t(`guidedDialogue.symptoms.${symptom}.label`)}
                  </Text>
                  <Text style={[styles.optionBody, selected && styles.optionBodySelected]}>
                    {t(`guidedDialogue.symptoms.${symptom}.hint`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionStep}>{t('guidedDialogue.steps.timing')}</Text>
          <Text style={styles.sectionTitle}>{t('guidedDialogue.sections.timingTitle')}</Text>
          <View style={styles.stackList}>
            {TIMES.map((time) => {
              const selected = intensityWindow === time;
              return (
                <TouchableOpacity
                  key={time}
                  testID={`time-${time}`}
                  style={[styles.rowButton, selected && styles.rowButtonSelected]}
                  onPress={() => setIntensityWindow(time)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
                    {t(`guidedDialogue.timeOfDay.${time}.label`)}
                  </Text>
                  <Text style={[styles.rowBody, selected && styles.rowBodySelected]}>
                    {t(`guidedDialogue.timeOfDay.${time}.hint`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionStep}>{t('guidedDialogue.steps.support')}</Text>
          <Text style={styles.sectionTitle}>{t('guidedDialogue.sections.supportTitle')}</Text>
          <View style={styles.stackList}>
            {SUPPORTS.map((support) => {
              const selected = supportFocus === support;
              return (
                <TouchableOpacity
                  key={support}
                  testID={`support-${support}`}
                  style={[styles.rowButton, selected && styles.rowButtonSelected]}
                  onPress={() => setSupportFocus(support)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>
                    {t(`guidedDialogue.supportFocus.${support}.label`)}
                  </Text>
                  <Text style={[styles.rowBody, selected && styles.rowBodySelected]}>
                    {t(`guidedDialogue.supportFocus.${support}.hint`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('guidedDialogue.summaryTitle')}</Text>
          <Text style={styles.summaryText}>
            {dominantSymptoms.length
              ? dominantSymptoms
                .map((symptom) => t(`guidedDialogue.symptoms.${symptom}.label`))
                .join(' • ')
              : t('guidedDialogue.summaryPlaceholder')}
          </Text>
        </View>

        <TouchableOpacity
          testID="continue-guided-dialogue"
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>{t('guidedDialogue.cta')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  content: { padding: 18, paddingBottom: 36 },
  heroCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.medium,
  },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionStep: { color: colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '700', marginBottom: 6 },
  sectionBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  chipGrid: { gap: 10 },
  optionChip: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgBase,
  },
  optionChipSelected: { backgroundColor: colors.primaryPale, borderColor: colors.primary },
  optionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  optionTitleSelected: { color: colors.primary },
  optionBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  optionBodySelected: { color: colors.textPrimary },
  stackList: { gap: 10 },
  rowButton: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgBase,
  },
  rowButtonSelected: { backgroundColor: colors.primaryPale, borderColor: colors.primary },
  rowTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  rowTitleSelected: { color: colors.primary },
  rowBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  rowBodySelected: { color: colors.textPrimary },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    backgroundColor: colors.primaryPale,
  },
  summaryTitle: { color: colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  summaryText: { color: colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    ...shadows.medium,
  },
  continueButtonDisabled: { opacity: 0.45 },
  continueButtonText: { color: colors.bgSurface, fontSize: 16, fontWeight: '800' },
});
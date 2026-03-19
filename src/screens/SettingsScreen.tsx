import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { clearOnboardingData } from '../modules/storage';
import { DESIGN_SYSTEM } from '../utils/constants';
import type { Language, RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const colors = DESIGN_SYSTEM.colors;
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: t('languages.english') },
    { code: 'ar', label: t('languages.arabic') },
    { code: 'fr', label: t('languages.french') },
  ];

  async function handleLanguageChange(language: Language) {
    try {
      await changeLanguage(language);
      setCurrentLang(language);
      
      // Note: RTL changes require app restart in React Native
      // The I18nManager.forceRTL is called in changeLanguage but takes effect on next launch
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('errors.generic'));
    }
  }

  function handleResetProfile() {
    Alert.alert(
      t('settings.resetProfile'),
      t('settings.resetConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearOnboardingData();
              // Navigate to language selection to restart onboarding
              navigation.reset({
                index: 0,
                routes: [{ name: 'LanguageSelection' }],
              });
            } catch (error) {
              console.error('Error resetting profile:', error);
              Alert.alert(t('errors.generic'));
            }
          },
        },
      ]
    );
  }

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>{t('settings.about')}</Text>
          <Text style={styles.heroTitle}>GreenHeal</Text>
          <Text style={styles.heroSubtitle}>{t('settings.version')} {appVersion}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                currentLang === lang.code && styles.languageOptionSelected,
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <View>
                <Text
                  style={[
                    styles.languageText,
                    currentLang === lang.code && styles.languageTextSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </View>
              {currentLang === lang.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.supportTools')}</Text>
          <TouchableOpacity
            style={styles.feedbackCard}
            testID="settings-report-preview-card"
            onPress={() => navigation.navigate('ReportPreview')}
          >
            <View style={styles.supportCardHeader}>
              <Text style={styles.feedbackTitle}>{t('settings.reportPreview')}</Text>
              <Text style={styles.supportArrow}>→</Text>
            </View>
            <Text style={styles.feedbackDescription}>{t('settings.reportPreviewSubtitle')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feedbackCard, styles.supportCardSpacing]}
            testID="settings-feedback-card"
            onPress={() => navigation.navigate('Feedback')}
          >
            <View style={styles.supportCardHeader}>
              <Text style={styles.feedbackTitle}>{t('settings.feedback')}</Text>
              <Text style={styles.supportArrow}>→</Text>
            </View>
            <Text style={styles.feedbackDescription}>{t('settings.feedbackSubtitle')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetProfile}
          >
            <Text style={styles.resetButtonText}>{t('settings.resetProfile')}</Text>
          </TouchableOpacity>
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
  content: {
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  heroCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    padding: DESIGN_SYSTEM.spacing.xl,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: DESIGN_SYSTEM.spacing.xs,
  },
  heroSubtitle: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  section: {
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    padding: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    marginBottom: 8,
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  languageOptionSelected: {
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
    borderColor: DESIGN_SYSTEM.colors.primary,
  },
  languageText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  languageTextSelected: {
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DESIGN_SYSTEM.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: DESIGN_SYSTEM.colors.error,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    alignItems: 'center',
  },
  resetButtonText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    padding: 16,
  },
  supportCardSpacing: {
    marginTop: 12,
  },
  supportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  supportArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
  },
  feedbackDescription: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 20,
  },
});

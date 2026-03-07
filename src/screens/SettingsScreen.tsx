import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { clearOnboardingData } from '../modules/storage';
import type { Language, RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <Text
              style={[
                styles.languageText,
                currentLang === lang.code && styles.languageTextSelected,
              ]}
            >
              {lang.label}
            </Text>
            {currentLang === lang.code && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetProfile}
        >
          <Text style={styles.resetButtonText}>{t('settings.resetProfile')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.aboutTitle}>{t('settings.about')}</Text>
        <Text style={styles.versionText}>
          {t('settings.version')} {appVersion}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D6A4F',
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  languageOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#2D6A4F',
  },
  languageText: {
    fontSize: 16,
    color: '#333333',
  },
  languageTextSelected: {
    fontWeight: '600',
    color: '#2D6A4F',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D6A4F',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
  },
});

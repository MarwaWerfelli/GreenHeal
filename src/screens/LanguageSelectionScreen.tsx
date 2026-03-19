import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Localization from 'expo-localization';
import { saveLanguagePreference } from '../modules/storage';
import { changeLanguage } from '../i18n';
import { DESIGN_SYSTEM } from '../utils/constants';

type Language = 'en' | 'ar' | 'fr';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇹🇳' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

interface LanguageSelectionScreenProps {
  onLanguageSelected: (language: Language) => void;
}

export default function LanguageSelectionScreen({
  onLanguageSelected,
}: LanguageSelectionScreenProps) {
  const colors = DESIGN_SYSTEM.colors;
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  useEffect(() => {
    // Detect device language and pre-select if supported
    const deviceLocales = Localization.getLocales();
    const deviceLanguage = deviceLocales[0]?.languageCode;

    if (deviceLanguage === 'ar' || deviceLanguage === 'fr') {
      setSelectedLanguage(deviceLanguage as Language);
    } else {
      // Default to English if not supported
      setSelectedLanguage('en');
    }
  }, []);

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    
    // Save language preference to AsyncStorage
    await saveLanguagePreference(language);
    
    // Update i18n language
    await changeLanguage(language);
    
    // Navigate to onboarding
    onLanguageSelected(language);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgBase} />
      
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Healing journey companion</Text>
          <Text style={styles.title}>🌿 GreenHeal</Text>
          <Text style={styles.subtitle}>Choose Your Language</Text>
          <Text style={styles.subtitleArabic}>اختر لغتك</Text>
          <Text style={styles.subtitleFrench}>Choisissez votre langue</Text>
        </View>

        <View style={styles.languageList}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageButton,
                selectedLanguage === language.code && styles.languageButtonSelected,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <View style={styles.languageTextContainer}>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageNativeName}>{language.nativeName}</Text>
              </View>
              <View style={styles.checkmarkShell}>
                {selectedLanguage === language.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.bgBase,
  },
  content: {
    flex: 1,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingTop: DESIGN_SYSTEM.spacing.xxl,
    alignItems: 'center',
  },
  heroCard: {
    width: '100%',
    paddingVertical: DESIGN_SYSTEM.spacing.xl,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.xlarge,
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    ...DESIGN_SYSTEM.shadows.medium,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    letterSpacing: 0.6,
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  subtitle: {
    fontSize: 20,
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleArabic: {
    fontSize: 18,
    color: DESIGN_SYSTEM.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleFrench: {
    fontSize: 18,
    color: DESIGN_SYSTEM.colors.textSecondary,
    textAlign: 'center',
  },
  languageList: {
    width: '100%',
    gap: DESIGN_SYSTEM.spacing.md,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgSurface,
    padding: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.large,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
    ...DESIGN_SYSTEM.shadows.small,
  },
  languageButtonSelected: {
    borderColor: DESIGN_SYSTEM.colors.primary,
    backgroundColor: DESIGN_SYSTEM.colors.primaryPale,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.textSecondary,
  },
  checkmarkShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.bgElevated,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.borderSubtle,
  },
  checkmark: {
    fontSize: 18,
    color: DESIGN_SYSTEM.colors.primary,
    fontWeight: 'bold',
  },
});

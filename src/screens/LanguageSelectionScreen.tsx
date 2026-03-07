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
import { COLORS } from '../utils/constants';

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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <Text style={styles.title}>🌿 GreenHeal</Text>
        <Text style={styles.subtitle}>Choose Your Language</Text>
        <Text style={styles.subtitleArabic}>اختر لغتك</Text>
        <Text style={styles.subtitleFrench}>Choisissez votre langue</Text>

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
              {selectedLanguage === language.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitleArabic: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  subtitleFrench: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  languageList: {
    width: '100%',
    gap: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
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
    color: COLORS.text,
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  checkmark: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import { getLanguagePreference, saveLanguagePreference } from '../modules/storage';
import type { Language } from '../types';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
};

/**
 * Initialize i18next with language resources
 */
export async function init(): Promise<void> {
  try {
    // Get saved language preference or detect device language
    let language = await getLanguagePreference();
    
    if (!language) {
      // Detect device language
      const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
      
      // Map device language to supported languages
      if (deviceLanguage === 'ar') {
        language = 'ar';
      } else if (deviceLanguage === 'fr') {
        language = 'fr';
      } else {
        language = 'en'; // Default to English
      }
    }

    // Configure RTL for Arabic
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
    }

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: language,
        fallbackLng: 'en',
        compatibilityJSON: 'v3',
        interpolation: {
          escapeValue: false,
        },
      });

    console.log('i18n initialized with language:', language);
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // Fallback to English if initialization fails
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'en',
        fallbackLng: 'en',
        compatibilityJSON: 'v3',
        interpolation: {
          escapeValue: false,
        },
      });
  }
}

/**
 * Change the app language
 */
export async function changeLanguage(language: Language): Promise<void> {
  try {
    await i18n.changeLanguage(language);
    await saveLanguagePreference(language);
    
    // Update RTL setting
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
    }
    
    console.log('Language changed to:', language);
  } catch (error) {
    console.error('Error changing language:', error);
    throw new Error('Failed to change language');
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): Language {
  return i18n.language as Language;
}

/**
 * Translate a key
 */
export function t(key: string, options?: object): string {
  return i18n.t(key, options);
}

/**
 * Check if current language is RTL
 */
export function isRTL(): boolean {
  return i18n.language === 'ar';
}

// Export i18n instance for use with useTranslation hook
export default i18n;

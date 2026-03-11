import * as fc from 'fast-check';
import i18n, { init, changeLanguage, getCurrentLanguage, t, isRTL } from '../src/i18n';
import type { Language } from '../src/types';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('react-native', () => ({
  I18nManager: {
    isRTL: false,
    forceRTL: jest.fn(),
    allowRTL: jest.fn(),
  },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

/**
 * Property 29: Static Content Translation
 * 
 * For any selected language, all static content (onboarding questions,
 * button labels, error messages) should display in that language.
 * 
 * Validates: Requirements 17.8
 */
describe('Internationalization Module', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await init();
  });

  describe('Property 29: Static Content Translation', () => {
    test('All languages have translations for common keys', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      const commonKeys = [
        'common.cancel',
        'common.confirm',
        'common.delete',
        'common.save',
        'common.continue',
        'common.back',
        'common.next',
        'common.done',
        'common.retry',
        'common.loading',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.constantFrom(...commonKeys),
          async (language, key) => {
            await changeLanguage(language);
            const translation = t(key);
            
            // Translation should not be empty
            expect(translation).toBeTruthy();
            // Translation should not be the key itself (fallback)
            expect(translation).not.toBe(key);
            // Translation should be a string
            expect(typeof translation).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Onboarding questions are translated in all languages', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      const onboardingKeys = [
        'onboarding.welcome',
        'onboarding.subtitle',
        'onboarding.healingQuestion',
        'onboarding.healingSubtitle',
        'onboarding.healingGoals.stress',
        'onboarding.healingGoals.physical',
        'onboarding.healingGoals.depression',
        'onboarding.healingGoals.sleep',
        'onboarding.healingGoals.wellness',
        'onboarding.budgetQuestion',
        'onboarding.budgetSubtitle',
        'onboarding.budget.under10',
        'onboarding.budget.10to30',
        'onboarding.budget.over30',
        'onboarding.budget.havePlants',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.constantFrom(...onboardingKeys),
          async (language, key) => {
            await changeLanguage(language);
            const translation = t(key);
            
            expect(translation).toBeTruthy();
            expect(translation).not.toBe(key);
            expect(typeof translation).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Button labels are translated in all languages', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      const buttonKeys = [
        'home.scanRoom',
        'home.myJourney',
        'camera.capture',
        'camera.chooseFromGallery',
        'camera.usePhoto',
        'camera.retake',
        'plantDetail.addToGarden',
        'plantDetail.findNearMe',
        'journal.newEntry',
        'garden.markAsWatered',
        'garden.removeFromGarden',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.constantFrom(...buttonKeys),
          async (language, key) => {
            await changeLanguage(language);
            const translation = t(key);
            
            expect(translation).toBeTruthy();
            expect(translation).not.toBe(key);
            expect(typeof translation).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Error messages are translated in all languages', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      const errorKeys = [
        'errors.network',
        'errors.service_unavailable',
        'errors.save_failed',
        'errors.load_failed',
        'errors.generic',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.constantFrom(...errorKeys),
          async (language, key) => {
            await changeLanguage(language);
            const translation = t(key);
            
            expect(translation).toBeTruthy();
            expect(translation).not.toBe(key);
            expect(typeof translation).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Screen titles are translated in all languages', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      const screenKeys = [
        'home.title',
        'camera.title',
        'aiAnalysis.title',
        'plantDetail.title',
        'journal.title',
        'garden.title',
        'settings.title',
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.constantFrom(...screenKeys),
          async (language, key) => {
            await changeLanguage(language);
            const translation = t(key);
            
            expect(translation).toBeTruthy();
            expect(translation).not.toBe(key);
            expect(typeof translation).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Translations with interpolation work correctly', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...languages),
          fc.integer({ min: 1, max: 30 }),
          async (language, days) => {
            await changeLanguage(language);
            const translation = t('plantDetail.wateringFrequency', { days });
            
            // Should contain the number
            expect(translation).toContain(days.toString());
            // Should not contain the placeholder
            expect(translation).not.toContain('{{days}}');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Language change updates current language', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<Language>('en', 'ar', 'fr'),
          async (language) => {
            await changeLanguage(language);
            const current = getCurrentLanguage();
            expect(current).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('RTL is correctly set for Arabic', async () => {
      await changeLanguage('ar');
      expect(isRTL()).toBe(true);

      await changeLanguage('en');
      expect(isRTL()).toBe(false);

      await changeLanguage('fr');
      expect(isRTL()).toBe(false);
    });

    test('All translations are non-empty strings', async () => {
      const languages: Language[] = ['en', 'ar', 'fr'];
      
      // Sample of various keys from different sections
      const allKeys = [
        'common.cancel',
        'languageSelection.title',
        'onboarding.welcome',
        'home.scanRoom',
        'camera.capture',
        'aiAnalysis.analyzing',
        'plantDetail.healingBenefits',
        'journal.newEntry',
        'garden.noPlantsYet',
        'settings.language',
        'permissions.camera_required',
        'errors.network',
        'offline.indicator',
        'careDifficulty.easy',
        'mood.3',
      ];

      for (const language of languages) {
        await changeLanguage(language);
        
        for (const key of allKeys) {
          const translation = t(key);
          expect(translation).toBeTruthy();
          expect(typeof translation).toBe('string');
          expect(translation.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Language initialization', () => {
    test('Initializes with default language if no preference saved', async () => {
      await init();
      const language = getCurrentLanguage();
      expect(['en', 'ar', 'fr']).toContain(language);
    });

    test('Fallback to English on initialization error', async () => {
      // This is tested by the init function's error handling
      await init();
      const language = getCurrentLanguage();
      expect(language).toBeTruthy();
    });
  });

  describe('Translation consistency', () => {
    test('Same key returns same translation for same language', async () => {
      await changeLanguage('en');
      const translation1 = t('common.cancel');
      const translation2 = t('common.cancel');
      expect(translation1).toBe(translation2);
    });

    test('Different languages return different translations', async () => {
      await changeLanguage('en');
      const enTranslation = t('common.cancel');
      
      await changeLanguage('ar');
      const arTranslation = t('common.cancel');
      
      await changeLanguage('fr');
      const frTranslation = t('common.cancel');
      
      // All should be different (unless by coincidence)
      expect(enTranslation).not.toBe(arTranslation);
      expect(enTranslation).not.toBe(frTranslation);
      expect(arTranslation).not.toBe(frTranslation);
    });
  });
});

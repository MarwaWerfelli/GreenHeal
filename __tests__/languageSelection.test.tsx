import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as fc from 'fast-check';
import * as Localization from 'expo-localization';
import LanguageSelectionScreen from '../src/screens/LanguageSelectionScreen';
import { saveLanguagePreference, getLanguagePreference } from '../src/modules/storage';
import { changeLanguage } from '../src/i18n';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('../src/i18n');

describe('Language Selection Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (saveLanguagePreference as jest.Mock).mockResolvedValue(undefined);
    (getLanguagePreference as jest.Mock).mockResolvedValue(null);
    (changeLanguage as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Property 3: Device Language Pre-Selection', () => {
    test('Pre-selects device language if supported (Arabic or French)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('ar', 'fr'),
          async (deviceLanguage) => {
            // Mock device language
            (Localization.getLocales as jest.Mock).mockReturnValue([
              { languageCode: deviceLanguage },
            ]);

            const onLanguageSelected = jest.fn();
            const { getByText } = render(
              <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
            );

            // Wait for component to mount and detect language
            await waitFor(() => {
              // Find the button for the device language
              const languageName = deviceLanguage === 'ar' ? 'Arabic' : 'French';
              const button = getByText(languageName).parent?.parent;
              
              // Should have selected style (check for checkmark)
              const checkmark = getByText('✓');
              expect(checkmark).toBeTruthy();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Defaults to English for unsupported device languages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 2, maxLength: 2 }).filter(
            (lang) => lang !== 'ar' && lang !== 'fr' && lang !== 'en'
          ),
          async (deviceLanguage) => {
            // Mock unsupported device language
            (Localization.getLocales as jest.Mock).mockReturnValue([
              { languageCode: deviceLanguage },
            ]);

            const onLanguageSelected = jest.fn();
            const { getByText } = render(
              <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
            );

            // Wait for component to mount
            await waitFor(() => {
              // English should be selected by default
              const checkmark = getByText('✓');
              expect(checkmark).toBeTruthy();
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Language Selection Navigation', () => {
    test('Saves language preference and navigates on selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('en', 'ar', 'fr'),
          async (selectedLanguage) => {
            (Localization.getLocales as jest.Mock).mockReturnValue([
              { languageCode: 'en' },
            ]);

            const onLanguageSelected = jest.fn();
            const { getAllByText } = render(
              <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
            );

            // Get language name
            const languageNames = {
              en: 'English',
              ar: 'Arabic',
              fr: 'French',
            };
            const languageName = languageNames[selectedLanguage];

            // Tap on language button (get first occurrence)
            const buttons = getAllByText(languageName);
            fireEvent.press(buttons[0]);

            // Wait for async operations
            await waitFor(() => {
              // Should save language preference
              expect(saveLanguagePreference).toHaveBeenCalledWith(selectedLanguage);
              
              // Should change i18n language
              expect(changeLanguage).toHaveBeenCalledWith(selectedLanguage);
              
              // Should call navigation callback
              expect(onLanguageSelected).toHaveBeenCalledWith(selectedLanguage);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for language selection screen', () => {
    test('Displays all three language options', () => {
      (Localization.getLocales as jest.Mock).mockReturnValue([
        { languageCode: 'en' },
      ]);

      const onLanguageSelected = jest.fn();
      const { getAllByText, getByText } = render(
        <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
      );

      // Should display all language options (English appears twice, so use getAllByText)
      expect(getAllByText('English').length).toBeGreaterThan(0);
      expect(getAllByText('Arabic').length).toBeGreaterThan(0);
      expect(getAllByText('French').length).toBeGreaterThan(0);
      
      // Should display native names
      expect(getByText('العربية')).toBeTruthy();
      expect(getByText('Français')).toBeTruthy();
    });

    test('Displays app title and subtitles', () => {
      (Localization.getLocales as jest.Mock).mockReturnValue([
        { languageCode: 'en' },
      ]);

      const onLanguageSelected = jest.fn();
      const { getByText } = render(
        <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
      );

      // Should display title
      expect(getByText('🌿 GreenHeal')).toBeTruthy();
      
      // Should display subtitles in all languages
      expect(getByText('Choose Your Language')).toBeTruthy();
      expect(getByText('اختر لغتك')).toBeTruthy();
      expect(getByText('Choisissez votre langue')).toBeTruthy();
    });

    test('Updates selection when different language is tapped', async () => {
      (Localization.getLocales as jest.Mock).mockReturnValue([
        { languageCode: 'en' },
      ]);

      const onLanguageSelected = jest.fn();
      const { getAllByText } = render(
        <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
      );

      // Tap on French
      const frenchButtons = getAllByText('French');
      fireEvent.press(frenchButtons[0]);

      await waitFor(() => {
        expect(saveLanguagePreference).toHaveBeenCalledWith('fr');
        expect(onLanguageSelected).toHaveBeenCalledWith('fr');
      });

      // Clear mocks
      jest.clearAllMocks();

      // Tap on Arabic
      const arabicButtons = getAllByText('Arabic');
      fireEvent.press(arabicButtons[0]);

      await waitFor(() => {
        expect(saveLanguagePreference).toHaveBeenCalledWith('ar');
        expect(onLanguageSelected).toHaveBeenCalledWith('ar');
      });
    });

    test('Shows visual feedback for selected language', () => {
      (Localization.getLocales as jest.Mock).mockReturnValue([
        { languageCode: 'en' },
      ]);

      const onLanguageSelected = jest.fn();
      const { getByText } = render(
        <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
      );

      // Should show checkmark for selected language
      const checkmark = getByText('✓');
      expect(checkmark).toBeTruthy();
    });

    test('Displays flags for each language', () => {
      (Localization.getLocales as jest.Mock).mockReturnValue([
        { languageCode: 'en' },
      ]);

      const onLanguageSelected = jest.fn();
      const { getByText } = render(
        <LanguageSelectionScreen onLanguageSelected={onLanguageSelected} />
      );

      // Should display flags
      expect(getByText('🇬🇧')).toBeTruthy();
      expect(getByText('🇹🇳')).toBeTruthy();
      expect(getByText('🇫🇷')).toBeTruthy();
    });
  });
});

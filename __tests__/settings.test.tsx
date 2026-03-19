import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, I18nManager } from 'react-native';
import SettingsScreen from '../src/screens/SettingsScreen';
import { changeLanguage, getCurrentLanguage } from '../src/i18n';
import { clearOnboardingData } from '../src/modules/storage';
import fc from 'fast-check';

// Mock dependencies
jest.mock('../src/i18n');
jest.mock('../src/modules/storage');
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
  },
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'languages.english': 'English',
        'languages.arabic': 'Arabic',
        'languages.french': 'French',
        'settings.language': 'Language',
        'settings.supportTools': 'Support tools',
        'settings.reportPreview': 'Weekly report preview',
        'settings.reportPreviewSubtitle': 'See what a healing update for your care team could include before sharing is enabled.',
        'settings.feedback': 'Rate GreenHeal',
        'settings.feedbackSubtitle': 'Tell us how the app is supporting your healing journey.',
        'settings.resetProfile': 'Reset Healing Profile',
        'settings.resetConfirm': 'Are you sure you want to reset your healing profile? This will clear all your onboarding data.',
        'settings.version': 'Version',
        'settings.about': 'About GreenHeal',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'errors.generic': 'Something went wrong. Please try again.',
      };
      return translations[key] || key;
    },
  }),
}));

const mockedChangeLanguage = changeLanguage as jest.MockedFunction<typeof changeLanguage>;
const mockedGetCurrentLanguage = getCurrentLanguage as jest.MockedFunction<typeof getCurrentLanguage>;
const mockedClearOnboardingData = clearOnboardingData as jest.MockedFunction<typeof clearOnboardingData>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

describe('Settings Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentLanguage.mockReturnValue('en');
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Unit Tests', () => {
    test('Renders language options', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('English')).toBeTruthy();
      expect(getByText('Arabic')).toBeTruthy();
      expect(getByText('French')).toBeTruthy();
    });

    test('Highlights current language', () => {
      mockedGetCurrentLanguage.mockReturnValue('fr');

      const { getByText } = render(<SettingsScreen />);

      const frenchOption = getByText('French').parent?.parent;
      expect(frenchOption).toBeTruthy();
    });

    test('Changes language when option is pressed', async () => {
      mockedChangeLanguage.mockResolvedValue();

      const { getByText } = render(<SettingsScreen />);

      const arabicOption = getByText('Arabic');
      fireEvent.press(arabicOption);

      await waitFor(() => {
        expect(mockedChangeLanguage).toHaveBeenCalledWith('ar');
      });
    });

    test('Shows error alert if language change fails', async () => {
      mockedChangeLanguage.mockRejectedValue(new Error('Language change failed'));

      const { getByText } = render(<SettingsScreen />);

      const frenchOption = getByText('French');
      fireEvent.press(frenchOption);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Something went wrong. Please try again.');
      });
    });

    test('Displays reset profile button', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Reset Healing Profile')).toBeTruthy();
    });

    test('Navigates to feedback screen', () => {
      const { getByText } = render(<SettingsScreen />);

      fireEvent.press(getByText('Rate GreenHeal'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Feedback');
    });

    test('Navigates to weekly report preview screen', () => {
      const { getByText } = render(<SettingsScreen />);

      fireEvent.press(getByText('Weekly report preview'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ReportPreview');
    });

    test('Shows confirmation dialog when reset is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      const resetButton = getByText('Reset Healing Profile');
      fireEvent.press(resetButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Healing Profile',
        'Are you sure you want to reset your healing profile? This will clear all your onboarding data.',
        expect.any(Array)
      );
    });

    test('Clears onboarding data and navigates on reset confirm', async () => {
      mockedClearOnboardingData.mockResolvedValue();

      const { getByText } = render(<SettingsScreen />);

      const resetButton = getByText('Reset Healing Profile');
      fireEvent.press(resetButton);

      // Get the confirm button from Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2][1];
      await confirmButton.onPress();

      await waitFor(() => {
        expect(mockedClearOnboardingData).toHaveBeenCalled();
        expect(mockNavigation.reset).toHaveBeenCalledWith({
          index: 0,
          routes: [{ name: 'LanguageSelection' }],
        });
      });
    });

    test('Shows error alert if reset fails', async () => {
      mockedClearOnboardingData.mockRejectedValue(new Error('Reset failed'));

      const { getByText } = render(<SettingsScreen />);

      const resetButton = getByText('Reset Healing Profile');
      fireEvent.press(resetButton);

      // Get the confirm button from Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2][1];
      await confirmButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Something went wrong. Please try again.');
      });
    });

    test('Displays app version', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Version 1.0.0')).toBeTruthy();
    });

    test('Does not reset when cancel is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      const resetButton = getByText('Reset Healing Profile');
      fireEvent.press(resetButton);

      // Get the cancel button from Alert.alert call
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelButton = alertCall[2][0];
      cancelButton.onPress?.();

      expect(mockedClearOnboardingData).not.toHaveBeenCalled();
      expect(mockNavigation.reset).not.toHaveBeenCalled();
    });
  });

  describe('Property Tests', () => {
    test.skip('Property 28: Language Change Immediate Update', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('en', 'ar', 'fr'),
          async (language) => {
            mockedChangeLanguage.mockResolvedValue();
            mockedGetCurrentLanguage.mockReturnValue(language);

            const { getByText, rerender } = render(<SettingsScreen />);

            // Change to a different language
            const targetLang = language === 'en' ? 'ar' : 'en';
            const targetLabel = targetLang === 'ar' ? 'Arabic' : 'English';
            
            const option = getByText(targetLabel);
            fireEvent.press(option);

            await waitFor(() => {
              expect(mockedChangeLanguage).toHaveBeenCalledWith(targetLang);
            });

            // Verify language change was called
            expect(mockedChangeLanguage).toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    test.skip('Property 30: Profile Reset Data Clearing', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          async (runNumber) => {
            mockedClearOnboardingData.mockResolvedValue();

            const { getByText } = render(<SettingsScreen />);

            const resetButton = getByText('Reset Healing Profile');
            fireEvent.press(resetButton);

            // Confirm reset
            const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
            const confirmButton = alertCall[2][1];
            await confirmButton.onPress();

            await waitFor(() => {
              expect(mockedClearOnboardingData).toHaveBeenCalled();
              expect(mockNavigation.reset).toHaveBeenCalledWith({
                index: 0,
                routes: [{ name: 'LanguageSelection' }],
              });
            });

            // Verify data was cleared
            expect(mockedClearOnboardingData).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});

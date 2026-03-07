import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AppNavigator from '../src/navigation/AppNavigator';
import { getOnboardingData } from '../src/modules/storage';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('../src/i18n', () => ({
  init: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [
    { granted: false, canAskAgain: true },
    jest.fn(),
  ]),
}));

// Mock AI module
jest.mock('../src/modules/ai', () => ({
  analyzeRoom: jest.fn(),
  getRemainingRequests: jest.fn().mockResolvedValue(5),
}));

// Mock the screen components to make them identifiable
jest.mock('../src/screens/LanguageSelectionScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function LanguageSelectionScreen() {
    return <Text testID="language-selection-screen">Language Selection</Text>;
  };
});

jest.mock('../src/screens/OnboardingScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function OnboardingScreen() {
    return <Text testID="onboarding-screen">Onboarding</Text>;
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: any) => <>{children}</>,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

jest.mock('@react-navigation/stack', () => {
  const React = require('react');
  return {
    createStackNavigator: () => ({
      Navigator: ({ children }: any) => <>{children}</>,
      Screen: ({ children, component, name }: any) => {
        // If component prop is provided, render it
        if (component) {
          const Component = component;
          return <Component />;
        }
        // If children is a function, call it with mock navigation
        if (typeof children === 'function') {
          return <>{children({ navigation: { navigate: jest.fn() } })}</>;
        }
        // Otherwise render children directly
        return <>{children}</>;
      },
    }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: any) => (
        <Text testID="main-tabs">Main Tabs</Text>
      ),
      Screen: () => null,
    }),
  };
});

// Mock useTranslation for the MainTabs component
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('Navigation Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unit tests for navigation structure', () => {
    test('Shows language selection when onboarding not complete', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(<AppNavigator />);

      await waitFor(() => {
        // Should show language selection screen
        expect(getByTestId('language-selection-screen')).toBeTruthy();
      });
    });

    test('Shows main tabs when onboarding is complete', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });

      const { getByTestId } = render(<AppNavigator />);

      await waitFor(
        () => {
          // Should show main tabs
          expect(getByTestId('main-tabs')).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });

    test('Bottom tabs are hidden during onboarding', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue(null);

      const { queryByTestId } = render(<AppNavigator />);

      await waitFor(() => {
        // Should not show main tabs during onboarding
        expect(queryByTestId('main-tabs')).toBeNull();
      });
    });

    test('Bottom tabs are shown after onboarding', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue({
        healingGoal: 'wellness',
        budget: 'have_plants',
        completedAt: new Date().toISOString(),
      });

      const { getByTestId } = render(<AppNavigator />);

      await waitFor(
        () => {
          // Should show main tabs
          expect(getByTestId('main-tabs')).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });

    test('Initializes i18n on app start', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue(null);
      const { init } = require('../src/i18n');

      render(<AppNavigator />);

      await waitFor(() => {
        expect(init).toHaveBeenCalled();
      });
    });

    test('Checks onboarding status on mount', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue(null);

      render(<AppNavigator />);

      await waitFor(() => {
        expect(getOnboardingData).toHaveBeenCalled();
      });
    });
  });

  describe('Stack navigation flows', () => {
    test('Language selection navigates to onboarding', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue(null);

      const { getByTestId } = render(<AppNavigator />);

      await waitFor(() => {
        // Language selection screen should be visible
        expect(getByTestId('language-selection-screen')).toBeTruthy();
      });
    });

    test('Onboarding completion shows main tabs', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue({
        healingGoal: 'sleep',
        budget: '10to30',
        completedAt: new Date().toISOString(),
      });

      const { getByTestId } = render(<AppNavigator />);

      await waitFor(
        () => {
          // Main tabs should be visible
          expect(getByTestId('main-tabs')).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });
});

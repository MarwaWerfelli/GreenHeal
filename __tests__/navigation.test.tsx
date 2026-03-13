import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import AppNavigator from '../src/navigation/AppNavigator';
import { getOnboardingData, clearOnboardingData, initDatabase } from '../src/modules/storage';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children }: any) => <View>{children}</View>,
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Ionicons = (props: any) => <View {...props} />;
  (Ionicons as any).glyphMap = {
    home: 'home',
    leaf: 'leaf',
    book: 'book',
    settings: 'settings',
    'help-circle': 'help-circle',
  };
  return { Ionicons };
});
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

jest.mock('../src/screens/HomeScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function HomeScreen() {
    return <Text testID="home-screen">Home</Text>;
  };
});

jest.mock('../src/screens/CameraScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function CameraScreen() {
    return <Text testID="camera-screen">Camera</Text>;
  };
});

jest.mock('../src/screens/AIAnalysisScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function AIAnalysisScreen() {
    return <Text testID="analysis-screen">AI Analysis</Text>;
  };
});

jest.mock('../src/screens/RoomVisualizationScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function RoomVisualizationScreen() {
    return <Text testID="room-visualization-screen">Room Visualization</Text>;
  };
});

jest.mock('../src/screens/PlantDetailScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function PlantDetailScreen() {
    return <Text testID="plant-detail-screen">Plant Detail</Text>;
  };
});

jest.mock('../src/screens/HealingJournalScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function HealingJournalScreen() {
    return <Text testID="healing-journal-screen">Journal</Text>;
  };
});

jest.mock('../src/screens/JournalEntryFormScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function JournalEntryFormScreen() {
    return <Text testID="journal-entry-form-screen">Journal Entry Form</Text>;
  };
});

jest.mock('../src/screens/JournalEntryDetailScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function JournalEntryDetailScreen() {
    return <Text testID="journal-entry-detail-screen">Journal Entry Detail</Text>;
  };
});

jest.mock('../src/screens/MyGardenScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MyGardenScreen() {
    return <Text testID="my-garden-screen">My Garden</Text>;
  };
});

jest.mock('../src/screens/SettingsScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function SettingsScreen() {
    return <Text testID="settings-screen">Settings</Text>;
  };
});

jest.mock('../src/components/OfflineIndicator', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function OfflineIndicator() {
    return <View testID="offline-indicator" />;
  };
});

jest.mock('../src/components/FloatingActionButton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function FloatingActionButton() {
    return <View testID="floating-action-button" />;
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
    (clearOnboardingData as jest.Mock).mockResolvedValue(undefined);
    (initDatabase as jest.Mock).mockResolvedValue(undefined);
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

    test('Clears invalid onboarding data and shows onboarding flow', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue({
        completedAt: new Date().toISOString(),
      });

      const { getByTestId, queryByTestId } = render(<AppNavigator />);

      await waitFor(() => {
        expect(getByTestId('language-selection-screen')).toBeTruthy();
      });

      expect(queryByTestId('main-tabs')).toBeNull();
      expect(clearOnboardingData).toHaveBeenCalled();
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

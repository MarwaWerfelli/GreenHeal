import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as fc from 'fast-check';
import HomeScreen from '../src/screens/HomeScreen';
import { getGardenPlants, getOnboardingData, resetDatabase, saveMoodCheckIn } from '../src/modules/storage';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const tipMap: Record<string, string> = {
        'home.tips.0': 'Lavender can reduce anxiety and improve sleep quality',
        'home.tips.1': 'Aloe vera purifies air and promotes skin healing',
        'home.tips.2': 'Snake plants release oxygen at night, helping with better sleep',
        'home.tips.3': 'Jasmine fragrance can have calming and mood-lifting effects',
        'home.tips.4': 'Rosemary may help improve memory and concentration',
        'home.tips.5': 'Chamomile has soothing properties that can reduce stress',
        'home.tips.6': 'Mint can increase alertness and reduce fatigue',
        'home.tips.7': 'Peace lilies help create a calm, spa-like atmosphere',
        'home.tips.8': 'Spider plants are excellent air purifiers and very easy to care for',
        'home.tips.9': 'Basil can help reduce stress and add fresh energy to your space',
      };
      return tipMap[key] ?? key;
    },
    i18n: { language: 'en' },
  }),
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success' },
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => callback(), [callback]);
  },
}));
jest.mock('../src/components/MoodChart', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View testID="mood-chart" />;
});
jest.mock('../assets/camera.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View />;
});
jest.mock('../assets/water.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View />;
});
jest.mock('../assets/book.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View />;
});
jest.mock('../assets/plant.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return () => <View />;
});

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
} as any;

describe('Home Screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (getGardenPlants as jest.Mock).mockResolvedValue([]);
    (getOnboardingData as jest.Mock).mockResolvedValue(null);
    await resetDatabase();
  });

  describe('Property 6: Mood Score Recording', () => {
    /**
     * Property: Mood scores (1-5) are correctly recorded to SQLite with timestamp
     * Validates: Requirements 2.6
     */
    test('Property test: Mood scores are recorded with timestamp (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (moodScore) => {
            // Reset mocks for each iteration
            jest.clearAllMocks();
            (saveMoodCheckIn as jest.Mock).mockResolvedValue(undefined);

            // Render home screen
            const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

            // Find and press the mood emoji
            const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];
            const moodEmoji = moodEmojis[moodScore - 1];
            const moodButton = getByText(moodEmoji);

            fireEvent.press(moodButton);

            // Wait for mood check-in to be saved
            await waitFor(() => {
              expect(saveMoodCheckIn).toHaveBeenCalledWith(
                expect.objectContaining({
                  moodScore,
                  createdAt: expect.any(String),
                })
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);
  });

  describe('Property 7: Daily Tip Rotation', () => {
    /**
     * Property: Daily tip is deterministic based on date
     * Validates: Requirements 2.4
     */
    test('Property test: Daily tip is deterministic (100 iterations)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 365 }), // Day of year
          async (dayOffset) => {
            // Mock Date to return a specific day
            const mockDate = new Date(2026, 0, 1);
            mockDate.setDate(mockDate.getDate() + dayOffset);
            const originalDate = global.Date;
            global.Date = class extends originalDate {
              constructor() {
                super();
                return mockDate;
              }
              static now() {
                return mockDate.getTime();
              }
            } as any;

            // Render home screen twice
            const { getAllByText: getAllByText1, unmount: unmount1 } = render(
              <HomeScreen navigation={mockNavigation} />
            );
            const tip1Element = getAllByText1(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/)[0];
            const tip1 = tip1Element.props.children;
            unmount1();

            const { getAllByText: getAllByText2, unmount: unmount2 } = render(
              <HomeScreen navigation={mockNavigation} />
            );
            const tip2Element = getAllByText2(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/)[0];
            const tip2 = tip2Element.props.children;
            unmount2();

            // Restore original Date
            global.Date = originalDate;

            // Same date should produce same tip
            expect(tip1).toBe(tip2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit tests for home screen', () => {
    test('Displays scan room button', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText('home.scanRoom')).toBeTruthy();
    });

    test('Displays my journey button', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText('home.myJourney')).toBeTruthy();
    });

    test('Displays daily tip', () => {
      const { getAllByText, getByText } = render(<HomeScreen navigation={mockNavigation} />);
      // Check that the tip title is displayed (split across emoji and text)
      expect(getByText(/💡/)).toBeTruthy();
      // Check that a tip is displayed
      expect(getAllByText(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/).length).toBeGreaterThan(0);
    });

    test('Displays mood check-in widget', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText('home.moodCheckIn')).toBeTruthy();
      // Check that all 5 mood emojis are displayed
      expect(getByText('😢')).toBeTruthy();
      expect(getByText('😕')).toBeTruthy();
      expect(getByText('😐')).toBeTruthy();
      expect(getByText('🙂')).toBeTruthy();
      expect(getByText('😊')).toBeTruthy();
    });

    test('Displays daily healing rhythm section', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText('home.dailyRhythmTitle')).toBeTruthy();
      expect(getByText('home.gentleStepTitle')).toBeTruthy();
      expect(getByText('home.reflectionPromptTitle')).toBeTruthy();
    });

    test('Scan room button navigates to guided dialogue', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      fireEvent.press(getByText('home.scanRoom'));

      expect(mockNavigate).toHaveBeenCalledWith('GuidedDialogue');
    });

    test('My journey button navigates to healing journal', () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      const myJourneyButton = getByText('home.myJourney');
      fireEvent.press(myJourneyButton);
      expect(mockNavigate).toHaveBeenCalledWith('HealingJournal');
    });

    test('Mood selection saves to database', async () => {
      (saveMoodCheckIn as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      
      // Press mood emoji for score 3
      const moodButton = getByText('😐');
      fireEvent.press(moodButton);

      await waitFor(() => {
        expect(saveMoodCheckIn).toHaveBeenCalledWith(
          expect.objectContaining({
            moodScore: 3,
            createdAt: expect.any(String),
          })
        );
      });
    });

    test('Mood selection updates visual state', async () => {
      (saveMoodCheckIn as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      
      // Press mood emoji for score 5
      const moodButton = getByText('😊');
      fireEvent.press(moodButton);

      await waitFor(() => {
        // Check that the mood was saved
        expect(saveMoodCheckIn).toHaveBeenCalledWith(
          expect.objectContaining({
            moodScore: 5,
            createdAt: expect.any(String),
          })
        );
      });
    });

    test('Mood selection shows supportive guidance', async () => {
      (saveMoodCheckIn as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      fireEvent.press(getByText('😊'));

      await waitFor(() => {
        expect(getByText('home.moodSupport.5')).toBeTruthy();
      });
    });

    test('Uses preferred name from onboarding when available', async () => {
      (getOnboardingData as jest.Mock).mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        reportProfile: {
          fullName: 'Lina Haddad',
          preferredName: 'Lina',
        },
        completedAt: new Date().toISOString(),
      });

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText(/Lina 🌿/)).toBeTruthy();
      });
    });

    test('Handles unexpected garden plant payloads without logging an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getGardenPlants as jest.Mock).mockResolvedValue(undefined);

      render(<HomeScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getGardenPlants).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('Handles malformed onboarding profile payloads without logging an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (getOnboardingData as jest.Mock).mockResolvedValue({
        healingGoal: 'sleep',
        budget: 'under10',
        reportProfile: {
          fullName: 42,
          preferredName: { value: 'Lina' },
        },
        completedAt: new Date().toISOString(),
      });

      render(<HomeScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getOnboardingData).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});

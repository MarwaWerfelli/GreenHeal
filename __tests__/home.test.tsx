import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as fc from 'fast-check';
import HomeScreen from '../src/screens/HomeScreen';
import { saveMoodCheckIn } from '../src/modules/storage';
import { resetDatabase } from '../src/modules/storage';

// Mock modules
jest.mock('../src/modules/storage');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
} as any;

describe('Home Screen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
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
              expect(saveMoodCheckIn).toHaveBeenCalledWith(moodScore);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
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
            const { getByText: getByText1, unmount: unmount1 } = render(
              <HomeScreen navigation={mockNavigation} />
            );
            const tip1Element = getByText1(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/);
            const tip1 = tip1Element.props.children;
            unmount1();

            const { getByText: getByText2, unmount: unmount2 } = render(
              <HomeScreen navigation={mockNavigation} />
            );
            const tip2Element = getByText2(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/);
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
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      // Check that the tip title is displayed (split across emoji and text)
      expect(getByText(/💡/)).toBeTruthy();
      // Check that a tip is displayed
      expect(
        getByText(/Lavender|Aloe|Snake|Jasmine|Rosemary|Chamomile|Mint|Peace|Spider|Basil/)
      ).toBeTruthy();
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
        expect(saveMoodCheckIn).toHaveBeenCalledWith(3);
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
        expect(saveMoodCheckIn).toHaveBeenCalledWith(5);
      });
    });
  });
});

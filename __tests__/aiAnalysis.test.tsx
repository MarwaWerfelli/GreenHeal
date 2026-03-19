import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import * as fc from 'fast-check';
import AIAnalysisScreen from '../src/screens/AIAnalysisScreen';
import { analyzeRoom, getRemainingRequests } from '../src/modules/ai';
import type { PlantRecommendation } from '../src/types';

// Mock dependencies
jest.mock('../src/modules/ai');
jest.mock('../src/modules/connectivity', () => ({
  isConnected: jest.fn().mockResolvedValue(true),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'plantDetail.wateringFrequency') {
        return `Water every ${params?.days} days`;
      }
      if (key === 'aiAnalysis.remainingRequests') {
        return `${params?.count} analyses remaining today`;
      }
      if (key === 'aiAnalysis.planSelectedCount') {
        return `Room plan: ${params?.count} selected`;
      }
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

const mockedAnalyzeRoom = analyzeRoom as jest.MockedFunction<typeof analyzeRoom>;
const mockedGetRemainingRequests = getRemainingRequests as jest.MockedFunction<typeof getRemainingRequests>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = {
  params: {
    imageUri: 'file://test-image.jpg',
  },
} as any;

describe('AIAnalysisScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetRemainingRequests.mockResolvedValue(5);
  });

  describe('Unit tests', () => {
    test('Shows loading state initially', () => {
      mockedAnalyzeRoom.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getAllByText, getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('aiAnalysis.analyzing')).toBeTruthy();
    });

    test('Displays 3 plant recommendations after successful analysis', async () => {
      const mockRecommendations: PlantRecommendation[] = [
        {
          name: 'Lavender',
          placement: 'Near the window',
          healingBenefit: 'Reduces stress',
          healingRole: 'Supports rest before sleep',
          sensoryAction: 'Adds a soft calming scent cue',
          careDifficulty: 'easy',
          estimatedCost: '15 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Great choice!',
        },
        {
          name: 'Snake Plant',
          placement: 'Corner',
          healingBenefit: 'Improves air quality',
          careDifficulty: 'easy',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Perfect!',
        },
        {
          name: 'Peace Lily',
          placement: 'Desk',
          healingBenefit: 'Promotes calmness',
          careDifficulty: 'medium',
          estimatedCost: '25 TND',
          wateringFrequencyDays: 5,
          encouragingMessage: 'You got this!',
        },
      ];

      mockedAnalyzeRoom.mockResolvedValue(mockRecommendations);

      const { getAllByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('Lavender').length).toBeGreaterThan(0);
        expect(getAllByText('Snake Plant').length).toBeGreaterThan(0);
        expect(getAllByText('Peace Lily').length).toBeGreaterThan(0);
        expect(getAllByText('aiAnalysis.planTable.plant').length).toBeGreaterThan(0);
        expect(getAllByText('aiAnalysis.planTable.placement').length).toBeGreaterThan(0);
        expect(getAllByText('aiAnalysis.planTable.healingRole').length).toBeGreaterThan(0);
        expect(getAllByText('aiAnalysis.planTable.sensoryAction').length).toBeGreaterThan(0);
      });
    });

    test('Passes guided context to analysis and renders the guided summary', async () => {
      const guidedRoute = {
        params: {
          imageUri: 'file://test-image.jpg',
          guidedContext: {
            symptoms: ['night_waking', 'anxiety'],
            dominantSymptoms: ['night_waking'],
            intensityWindow: 'night',
            supportFocus: 'sleep',
          },
        },
      } as any;

      mockedAnalyzeRoom.mockResolvedValue([
        {
          name: 'Lavender',
          placement: 'Near the bed-side shelf',
          healingBenefit: 'Reduces stress',
          healingRole: 'Helps slow the room into a bedtime rhythm',
          sensoryAction: 'Soft scent and gentle visual texture',
          careDifficulty: 'easy',
          estimatedCost: '15 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Great choice!',
        },
        {
          name: 'Snake Plant',
          placement: 'Corner',
          healingBenefit: 'Improves air quality',
          careDifficulty: 'easy',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Perfect!',
        },
        {
          name: 'Peace Lily',
          placement: 'Desk',
          healingBenefit: 'Promotes calmness',
          careDifficulty: 'medium',
          estimatedCost: '25 TND',
          wateringFrequencyDays: 5,
          encouragingMessage: 'You got this!',
        },
      ]);

      const { getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={guidedRoute} />
      );

      await waitFor(() => {
        expect(mockedAnalyzeRoom).toHaveBeenCalledWith(
          'file://test-image.jpg',
          guidedRoute.params.guidedContext
        );
        expect(getByText('aiAnalysis.guidedSummaryTitle')).toBeTruthy();
        expect(getByText('guidedDialogue.symptoms.night_waking.label')).toBeTruthy();
        expect(getByText('guidedDialogue.timeOfDay.night.label')).toBeTruthy();
        expect(getByText('guidedDialogue.supportFocus.sleep.label')).toBeTruthy();
      });
    });

    test('Safely falls back to an empty recommendation list when analysis returns a malformed payload', async () => {
      mockedAnalyzeRoom.mockResolvedValue(undefined as any);

      const { getAllByText, queryByTestId } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getAllByText('Room plan: 0 selected').length).toBeGreaterThan(0);
      });

      expect(queryByTestId('plant-card-0')).toBeNull();
    });

    test('Shows error message when analysis fails', async () => {
      mockedAnalyzeRoom.mockRejectedValue(new Error('Network error'));

      const { getAllByText, getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('aiAnalysis.error')).toBeTruthy();
      });
    });

    test('Shows limit reached message when daily limit exceeded', async () => {
      mockedAnalyzeRoom.mockRejectedValue(new Error('DAILY_LIMIT_REACHED'));

      const { getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('aiAnalysis.limitReached')).toBeTruthy();
      });
    });

    test('Retry button calls analyzeRoom again', async () => {
      mockedAnalyzeRoom.mockRejectedValueOnce(new Error('Network error'));
      mockedAnalyzeRoom.mockResolvedValueOnce([
        {
          name: 'Test Plant',
          placement: 'Here',
          healingBenefit: 'Good',
          careDifficulty: 'easy',
          estimatedCost: '10 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Nice!',
        },
        {
          name: 'Test Plant 2',
          placement: 'There',
          healingBenefit: 'Better',
          careDifficulty: 'medium',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Great!',
        },
        {
          name: 'Test Plant 3',
          placement: 'Everywhere',
          healingBenefit: 'Best',
          careDifficulty: 'hard',
          estimatedCost: '30 TND',
          wateringFrequencyDays: 3,
          encouragingMessage: 'Perfect!',
        },
      ]);

      const { getAllByText, getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('aiAnalysis.error')).toBeTruthy();
      });

      const retryButton = getByText('common.retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(getAllByText('Test Plant').length).toBeGreaterThan(0);
      });

      expect(mockedAnalyzeRoom).toHaveBeenCalledTimes(2);
    });

    test('Navigates to plant detail when card is pressed', async () => {
      const mockRecommendations: PlantRecommendation[] = [
        {
          name: 'Lavender',
          placement: 'Near the window',
          healingBenefit: 'Reduces stress',
          careDifficulty: 'easy',
          estimatedCost: '15 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Great choice!',
        },
        {
          name: 'Snake Plant',
          placement: 'Corner',
          healingBenefit: 'Improves air quality',
          careDifficulty: 'easy',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Perfect!',
        },
        {
          name: 'Peace Lily',
          placement: 'Desk',
          healingBenefit: 'Promotes calmness',
          careDifficulty: 'medium',
          estimatedCost: '25 TND',
          wateringFrequencyDays: 5,
          encouragingMessage: 'You got this!',
        },
      ];

      mockedAnalyzeRoom.mockResolvedValue(mockRecommendations);

      const { getByTestId } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('plant-card-0')).toBeTruthy();
      });

      fireEvent.press(getByTestId('plant-card-0'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PlantDetail', {
        plant: mockRecommendations[0],
        source: 'ai',
      });
    });

    test('Generates visualization with the selected plant and room plan', async () => {
      const mockRecommendations: PlantRecommendation[] = [
        {
          name: 'Lavender',
          placement: 'Near the window',
          healingBenefit: 'Reduces stress',
          careDifficulty: 'easy',
          estimatedCost: '15 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Great choice!',
        },
        {
          name: 'Snake Plant',
          placement: 'Corner',
          healingBenefit: 'Improves air quality',
          careDifficulty: 'easy',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Perfect!',
        },
        {
          name: 'Peace Lily',
          placement: 'Desk',
          healingBenefit: 'Promotes calmness',
          careDifficulty: 'medium',
          estimatedCost: '25 TND',
          wateringFrequencyDays: 5,
          encouragingMessage: 'You got this!',
        },
      ];

      mockedAnalyzeRoom.mockResolvedValue(mockRecommendations);

      const { getByTestId, getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('select-plant-1')).toBeTruthy();
      });

      fireEvent.press(getByTestId('select-plant-1'));
      expect(mockNavigation.navigate).not.toHaveBeenCalled();

      fireEvent.press(getByText('aiAnalysis.generateVisualization'));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('RoomVisualization', {
        imageUri: 'file://test-image.jpg',
        recommendations: mockRecommendations,
        selectedPlant: mockRecommendations[1],
        selectedPlants: [mockRecommendations[0], mockRecommendations[1]],
      });
    });

    test('Displays remaining requests count', async () => {
      mockedGetRemainingRequests.mockResolvedValue(3);
      mockedAnalyzeRoom.mockResolvedValue([
        {
          name: 'Test Plant',
          placement: 'Here',
          healingBenefit: 'Good',
          careDifficulty: 'easy',
          estimatedCost: '10 TND',
          wateringFrequencyDays: 7,
          encouragingMessage: 'Nice!',
        },
        {
          name: 'Test Plant 2',
          placement: 'There',
          healingBenefit: 'Better',
          careDifficulty: 'medium',
          estimatedCost: '20 TND',
          wateringFrequencyDays: 14,
          encouragingMessage: 'Great!',
        },
        {
          name: 'Test Plant 3',
          placement: 'Everywhere',
          healingBenefit: 'Best',
          careDifficulty: 'hard',
          estimatedCost: '30 TND',
          wateringFrequencyDays: 3,
          encouragingMessage: 'Perfect!',
        },
      ]);

      const { getByText } = render(
        <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('3 analyses remaining today')).toBeTruthy();
      });
    });
  });

  describe.skip('Property 10: Plant Recommendation Display Completeness', () => {
    // Validates: Requirements 4.6
    test('All plant recommendation fields are displayed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              placement: fc.string({ minLength: 1, maxLength: 100 }),
              healingBenefit: fc.string({ minLength: 1, maxLength: 200 }),
              careDifficulty: fc.constantFrom<'easy' | 'medium' | 'hard'>('easy', 'medium', 'hard'),
              estimatedCost: fc.string({ minLength: 1, maxLength: 20 }),
              wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
              encouragingMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 3, maxLength: 3 }
          ),
          async (plants) => {
            mockedAnalyzeRoom.mockResolvedValue(plants);

            const { getByText } = render(
              <AIAnalysisScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              // All plant names should be displayed
              plants.forEach((plant) => {
                expect(getByText(plant.name)).toBeTruthy();
                expect(getByText(plant.estimatedCost)).toBeTruthy();
                expect(getByText(plant.encouragingMessage)).toBeTruthy();
              });
            });
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});

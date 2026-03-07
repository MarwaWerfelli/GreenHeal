import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import * as fc from 'fast-check';
import PlantDetailScreen from '../src/screens/PlantDetailScreen';
import { enrichPlantData } from '../src/modules/plantDatabase';
import { savePlant, initDatabase } from '../src/modules/storage';
import type { PlantRecommendation, EnrichedPlantData } from '../src/types';

// Mock dependencies
jest.mock('../src/modules/plantDatabase');
jest.mock('../src/modules/storage');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (key === 'plantDetail.wateringFrequency') {
        return `Water every ${params?.days} days`;
      }
      if (key.startsWith('careDifficulty.')) {
        return key.split('.')[1];
      }
      return key;
    },
  }),
}));

const mockedEnrichPlantData = enrichPlantData as jest.MockedFunction<typeof enrichPlantData>;
const mockedSavePlant = savePlant as jest.MockedFunction<typeof savePlant>;
const mockedInitDatabase = initDatabase as jest.MockedFunction<typeof initDatabase>;

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockPlant: PlantRecommendation = {
  name: 'Lavender',
  placement: 'Near the window for optimal sunlight',
  healingBenefit: 'Reduces stress and anxiety, promotes better sleep',
  careDifficulty: 'easy',
  estimatedCost: '15 TND',
  wateringFrequencyDays: 7,
  encouragingMessage: 'Great choice!',
};

const mockRoute = {
  params: {
    plant: mockPlant,
    source: 'ai' as const,
  },
} as any;

describe('PlantDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    mockedInitDatabase.mockResolvedValue();
    mockedSavePlant.mockResolvedValue();
  });

  describe('Unit tests', () => {
    test('Shows loading state initially', () => {
      mockedEnrichPlantData.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('common.loading')).toBeTruthy();
    });

    test('Displays plant name and basic information', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Lavender')).toBeTruthy();
        expect(getByText('Reduces stress and anxiety, promotes better sleep')).toBeTruthy();
        expect(getByText('Near the window for optimal sunlight')).toBeTruthy();
      });
    });

    test('Displays enriched data when API returns results', async () => {
      const enrichedData: EnrichedPlantData = {
        scientificName: 'Lavandula angustifolia',
        family: 'Lamiaceae',
        wateringDetails: 'Moderate watering',
        sunlightRequirements: ['Full sun', 'Partial shade'],
        soilType: 'Well-drained',
        toxicity: 'Non-toxic',
      };

      mockedEnrichPlantData.mockResolvedValue(enrichedData);

      const { getByText, getAllByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        // Check for enriched data - these are nested in Text components with labels
        expect(getByText(/Lavandula angustifolia/)).toBeTruthy();
        expect(getByText(/Moderate watering/)).toBeTruthy();
        expect(getByText(/Full sun, Partial shade/)).toBeTruthy();
        expect(getByText(/Well-drained/)).toBeTruthy();
        expect(getByText(/Non-toxic/)).toBeTruthy();
      });
    });

    test('Falls back to AI-provided data when API returns no results', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Water every 7 days')).toBeTruthy();
      });
    });

    test('Displays "Add to My Garden" button for AI source', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('plantDetail.addToGarden')).toBeTruthy();
      });
    });

    test('Hides "Add to My Garden" button for garden source', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const gardenRoute = {
        params: {
          plant: mockPlant,
          source: 'garden' as const,
        },
      } as any;

      const { queryByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={gardenRoute} />
      );

      await waitFor(() => {
        expect(queryByText('plantDetail.addToGarden')).toBeNull();
      });
    });

    test('Opens Google Maps when "Find it Near Me" is pressed', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('plantDetail.findNearMe');
        fireEvent.press(button);
      });

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=Lavender+plant+nursery'
      );
    });

    test('Saves plant to database when "Add to My Garden" is pressed', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('plantDetail.addToGarden');
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockedInitDatabase).toHaveBeenCalled();
        expect(mockedSavePlant).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Lavender',
            placement: 'Near the window for optimal sunlight',
            healingBenefit: 'Reduces stress and anxiety, promotes better sleep',
            careDifficulty: 'easy',
            estimatedCost: '15 TND',
            wateringFrequencyDays: 7,
          })
        );
        expect(Alert.alert).toHaveBeenCalledWith(
          'plantDetail.added',
          '',
          expect.any(Array)
        );
      });
    });

    test('Shows error alert when save fails', async () => {
      mockedEnrichPlantData.mockResolvedValue(null);
      mockedSavePlant.mockRejectedValue(new Error('Database error'));

      const { getByText } = render(
        <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const button = getByText('plantDetail.addToGarden');
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('errors.save_failed');
      });
    });
  });

  describe('Property-based tests', () => {
    /**
     * Property 12: Plant Database API Enrichment
     * 
     * When the Plant Database API returns enriched data, the screen MUST display
     * the enriched information. When the API returns null, the screen MUST fall
     * back to displaying AI-provided data.
     * 
     * Validates: Requirements 5.5, 7.6, 10.3, 10.6
     */
    test.skip('Property 12: Plant Database API Enrichment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            scientificName: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
            family: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
            wateringDetails: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
            sunlightRequirements: fc.option(
              fc.array(fc.constantFrom('Full sun', 'Partial shade', 'Shade'), { minLength: 1, maxLength: 3 }),
              { nil: undefined }
            ),
            soilType: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
            toxicity: fc.option(fc.constantFrom('Non-toxic', 'Toxic to pets', 'Toxic to humans', 'Toxic to humans and pets'), { nil: undefined }),
          }),
          async (enrichedData) => {
            mockedEnrichPlantData.mockResolvedValue(enrichedData);

            const { getByText, queryByText } = render(
              <PlantDetailScreen navigation={mockNavigation} route={mockRoute} />
            );

            await waitFor(() => {
              // If enriched data has scientific name, it should be displayed
              if (enrichedData.scientificName) {
                expect(getByText(enrichedData.scientificName)).toBeTruthy();
              }

              // If enriched data has watering details, it should be displayed
              if (enrichedData.wateringDetails) {
                expect(getByText(enrichedData.wateringDetails)).toBeTruthy();
              }

              // If enriched data has sunlight requirements, they should be displayed
              if (enrichedData.sunlightRequirements && enrichedData.sunlightRequirements.length > 0) {
                expect(getByText(enrichedData.sunlightRequirements.join(', '))).toBeTruthy();
              }

              // If no enriched data, should fall back to AI-provided watering frequency
              if (!enrichedData.wateringDetails && !enrichedData.sunlightRequirements) {
                expect(queryByText('Water every 7 days')).toBeTruthy();
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13: Add to Garden Persistence
     * 
     * When a user adds a plant to their garden, the plant data MUST be saved to
     * SQLite with all required fields including calculated next watering date.
     * The save operation MUST initialize the database first.
     * 
     * Validates: Requirements 5.10
     */
    test.skip('Property 13: Add to Garden Persistence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 3, maxLength: 50 }),
            placement: fc.string({ minLength: 10, maxLength: 200 }),
            healingBenefit: fc.string({ minLength: 10, maxLength: 300 }),
            careDifficulty: fc.constantFrom('easy', 'medium', 'hard'),
            estimatedCost: fc.string({ minLength: 3, maxLength: 20 }),
            wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
            encouragingMessage: fc.string({ minLength: 5, maxLength: 100 }),
          }),
          async (plant) => {
            mockedEnrichPlantData.mockResolvedValue(null);
            mockedSavePlant.mockResolvedValue();

            const testRoute = {
              params: {
                plant,
                source: 'ai' as const,
              },
            } as any;

            const { getByText } = render(
              <PlantDetailScreen navigation={mockNavigation} route={testRoute} />
            );

            await waitFor(() => {
              const button = getByText('plantDetail.addToGarden');
              fireEvent.press(button);
            });

            await waitFor(() => {
              // Database must be initialized
              expect(mockedInitDatabase).toHaveBeenCalled();

              // Plant must be saved with all required fields
              expect(mockedSavePlant).toHaveBeenCalledWith(
                expect.objectContaining({
                  name: plant.name,
                  placement: plant.placement,
                  healingBenefit: plant.healingBenefit,
                  careDifficulty: plant.careDifficulty,
                  estimatedCost: plant.estimatedCost,
                  wateringFrequencyDays: plant.wateringFrequencyDays,
                  nextWateringAt: expect.any(String),
                  addedAt: expect.any(String),
                })
              );

              // Verify next watering date is calculated correctly
              const savedPlant = mockedSavePlant.mock.calls[0][0];
              const nextWateringDate = new Date(savedPlant.nextWateringAt);
              const addedDate = new Date(savedPlant.addedAt);
              const diffInDays = Math.floor(
                (nextWateringDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              expect(diffInDays).toBe(plant.wateringFrequencyDays);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

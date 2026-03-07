import axios from 'axios';
import * as fc from 'fast-check';
import {
  searchPlant,
  enrichPlantData,
  isCacheValid,
} from '../src/modules/plantDatabase';
import { cachePlantData, getCachedPlantData } from '../src/modules/storage';

// Mock dependencies
jest.mock('axios');
jest.mock('../src/modules/storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetCachedPlantData = getCachedPlantData as jest.MockedFunction<typeof getCachedPlantData>;
const mockedCachePlantData = cachePlantData as jest.MockedFunction<typeof cachePlantData>;

describe('Plant Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlant', () => {
    test('Returns plant data from API when not cached', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Lavender',
        scientific_name: ['Lavandula'],
        family: 'Lamiaceae',
        watering: 'Moderate',
        sunlight: ['full sun'],
        default_image: {
          original_url: 'https://example.com/lavender.jpg',
        },
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await searchPlant('Lavender');

      expect(result).toEqual(mockPlantData);
      expect(mockedCachePlantData).toHaveBeenCalledWith('Lavender', JSON.stringify(mockPlantData));
    });

    test('Returns cached data when cache is valid', async () => {
      const mockPlantData = {
        id: 1,
        common_name: 'Snake Plant',
        scientific_name: ['Sansevieria'],
        family: 'Asparagaceae',
        watering: 'Minimal',
        sunlight: ['part shade'],
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockedGetCachedPlantData.mockResolvedValue({
        plantName: 'Snake Plant',
        apiResponse: JSON.stringify(mockPlantData),
        cachedAt: yesterday.toISOString(),
        expiresAt: new Date(yesterday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await searchPlant('Snake Plant');

      expect(result).toEqual(mockPlantData);
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('Returns null when API returns no results', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [],
        },
      });

      const result = await searchPlant('NonexistentPlant');

      expect(result).toBeNull();
    });

    test('Returns null on API error', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await searchPlant('Lavender');

      expect(result).toBeNull();
    });
  });

  describe('enrichPlantData', () => {
    test('Returns enriched data when plant is found', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Peace Lily',
        scientific_name: ['Spathiphyllum'],
        family: 'Araceae',
        watering: 'Average',
        sunlight: ['part shade', 'full shade'],
        soil: ['loam', 'clay'],
        growth_rate: 'Moderate',
        poisonous_to_humans: 1,
        poisonous_to_pets: 1,
        default_image: {
          original_url: 'https://example.com/peace-lily.jpg',
        },
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await enrichPlantData('Peace Lily');

      expect(result).toEqual({
        scientificName: 'Spathiphyllum',
        family: 'Araceae',
        wateringDetails: 'Average',
        sunlightRequirements: ['part shade', 'full shade'],
        soilType: 'loam',
        growthRate: 'Moderate',
        toxicity: 'Toxic to humans and pets',
        imageUrl: 'https://example.com/peace-lily.jpg',
      });
    });

    test('Returns null when plant is not found', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [],
        },
      });

      const result = await enrichPlantData('NonexistentPlant');

      expect(result).toBeNull();
    });

    test('Handles plants toxic only to humans', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Test Plant',
        scientific_name: ['Testus plantus'],
        family: 'Testaceae',
        watering: 'Moderate',
        sunlight: ['full sun'],
        poisonous_to_humans: 1,
        poisonous_to_pets: 0,
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await enrichPlantData('Test Plant');

      expect(result?.toxicity).toBe('Toxic to humans');
    });

    test('Handles plants toxic only to pets', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Test Plant',
        scientific_name: ['Testus plantus'],
        family: 'Testaceae',
        watering: 'Moderate',
        sunlight: ['full sun'],
        poisonous_to_humans: 0,
        poisonous_to_pets: 1,
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await enrichPlantData('Test Plant');

      expect(result?.toxicity).toBe('Toxic to pets');
    });

    test('Handles non-toxic plants', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Test Plant',
        scientific_name: ['Testus plantus'],
        family: 'Testaceae',
        watering: 'Moderate',
        sunlight: ['full sun'],
        poisonous_to_humans: 0,
        poisonous_to_pets: 0,
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await enrichPlantData('Test Plant');

      expect(result?.toxicity).toBe('Non-toxic');
    });
  });

  describe('isCacheValid', () => {
    test('Returns true for cache within 7 days', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(isCacheValid(yesterday.toISOString())).toBe(true);
    });

    test('Returns false for cache older than 7 days', () => {
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      
      expect(isCacheValid(eightDaysAgo.toISOString())).toBe(false);
    });

    test('Returns true for cache exactly 6 days old', () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      
      expect(isCacheValid(sixDaysAgo.toISOString())).toBe(true);
    });

    test('Returns false for cache exactly 7 days old', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      expect(isCacheValid(sevenDaysAgo.toISOString())).toBe(false);
    });
  });

  describe('Property 23: Plant Data Cache Duration', () => {
    // Validates: Requirements 10.4
    test('Cache validity follows 7-day expiry rule', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 14 }), // Days ago
          async (daysAgo) => {
            const cacheDate = new Date();
            cacheDate.setDate(cacheDate.getDate() - daysAgo);
            
            const isValid = isCacheValid(cacheDate.toISOString());
            
            // Should be valid if less than 7 days old
            if (daysAgo < 7) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('API integration', () => {
    test('Calls Perenual API with correct parameters', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          data: [{
            id: 1,
            common_name: 'Lavender',
            scientific_name: ['Lavandula'],
            family: 'Lamiaceae',
            watering: 'Moderate',
            sunlight: ['full sun'],
          }],
        },
      });

      await searchPlant('Lavender');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('perenual.com/api/species-list'),
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Lavender',
          }),
        })
      );
    });

    test('Handles missing optional fields gracefully', async () => {
      mockedGetCachedPlantData.mockResolvedValue(null);
      
      const mockPlantData = {
        id: 1,
        common_name: 'Minimal Plant',
        scientific_name: ['Minimus'],
        family: 'Minimaceae',
        watering: 'Low',
        sunlight: ['shade'],
      };

      mockedAxios.get.mockResolvedValue({
        data: {
          data: [mockPlantData],
        },
      });

      const result = await enrichPlantData('Minimal Plant');

      expect(result).toEqual({
        scientificName: 'Minimus',
        family: 'Minimaceae',
        wateringDetails: 'Low',
        sunlightRequirements: ['shade'],
        soilType: undefined,
        growthRate: undefined,
        toxicity: 'Non-toxic',
        imageUrl: undefined,
      });
    });
  });
});

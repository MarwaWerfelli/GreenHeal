import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveOnboardingData,
  getOnboardingData,
  saveLanguagePreference,
  getLanguagePreference,
  saveAIRequestCount,
  getAIRequestCount,
} from '../src/modules/storage';
import type { OnboardingData, Language } from '../src/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Storage Module - AsyncStorage Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock implementation
    const storage: Record<string, string> = {};
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      storage[key] = value;
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      return storage[key] || null;
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      delete storage[key];
    });
  });

  /**
   * Property 1: AsyncStorage Round-Trip Persistence
   * 
   * For any valid data (language preference, onboarding data, AI request count),
   * storing it in AsyncStorage and then retrieving it should return equivalent data.
   * 
   * Validates: Requirements 1.5, 9.1, 9.2, 9.6, 18.3
   */
  describe('Property 1: AsyncStorage Round-Trip Persistence', () => {
    test('Language preference round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom<Language>('en', 'ar', 'fr'),
          async (language) => {
            // Save language preference
            await saveLanguagePreference(language);
            
            // Retrieve language preference
            const retrieved = await getLanguagePreference();
            
            // Should be equal
            expect(retrieved).toBe(language);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Onboarding data round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record<OnboardingData>({
            healingGoal: fc.constantFrom('stress', 'physical', 'depression', 'sleep', 'wellness'),
            budget: fc.constantFrom('under10', '10to30', 'over30', 'have_plants'),
            existingPlantPhotos: fc.option(fc.array(fc.string(), { minLength: 0, maxLength: 5 })),
            completedAt: fc.integer({ min: Date.now() - 31536000000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
          }),
          async (onboardingData) => {
            // Save onboarding data
            await saveOnboardingData(onboardingData);
            
            // Retrieve onboarding data
            const retrieved = await getOnboardingData();
            
            // Should be deeply equal
            expect(retrieved).toEqual(onboardingData);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('AI request count round-trip', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: new Date('2026-01-01').getTime(), max: new Date('2027-01-01').getTime() }),
          async (count, resetTimestamp) => {
            // Save AI request count
            const resetAt = new Date(resetTimestamp).toISOString();
            await saveAIRequestCount({ count, resetAt });
            
            // Retrieve AI request count
            const retrieved = await getAIRequestCount();
            
            // Should be equal
            expect(retrieved).not.toBeNull();
            expect(retrieved!.count).toBe(count);
            expect(retrieved!.resetAt).toBe(resetAt);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Multiple sequential operations maintain consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              language: fc.constantFrom<Language>('en', 'ar', 'fr'),
              count: fc.integer({ min: 0, max: 5 }),
              resetTimestamp: fc.integer({ min: new Date('2026-01-01').getTime(), max: new Date('2027-01-01').getTime() }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (operations) => {
            // Perform all save operations
            for (const op of operations) {
              await saveLanguagePreference(op.language);
              await saveAIRequestCount({ count: op.count, resetAt: new Date(op.resetTimestamp).toISOString() });
            }
            
            // Retrieve last saved values
            const lastOp = operations[operations.length - 1];
            const retrievedLang = await getLanguagePreference();
            const retrievedCount = await getAIRequestCount();
            
            // Should match the last saved values
            expect(retrievedLang).toBe(lastOp.language);
            expect(retrievedCount).not.toBeNull();
            expect(retrievedCount!.count).toBe(lastOp.count);
            expect(retrievedCount!.resetAt).toBe(new Date(lastOp.resetTimestamp).toISOString());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    test('Getting non-existent language preference returns null', async () => {
      const result = await getLanguagePreference();
      expect(result).toBeNull();
    });

    test('Getting non-existent onboarding data returns null', async () => {
      const result = await getOnboardingData();
      expect(result).toBeNull();
    });

    test('Getting non-existent AI request count returns null', async () => {
      const result = await getAIRequestCount();
      expect(result).toBeNull();
    });

    test('Onboarding data with optional fields', async () => {
      const data: OnboardingData = {
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      };
      
      await saveOnboardingData(data);
      const retrieved = await getOnboardingData();
      
      expect(retrieved).toEqual(data);
      expect(retrieved?.existingPlantPhotos).toBeUndefined();
    });
  });
});

import axios from 'axios';
import * as fc from 'fast-check';
import {
  analyzeRoom,
  checkDailyLimit,
  incrementRequestCount,
  getRemainingRequests,
  PlantRecommendation,
} from '../src/modules/ai';
import {
  saveOnboardingData,
  getOnboardingData,
  saveAIRequestCount,
  getAIRequestCount,
} from '../src/modules/storage';
import { getCurrentLanguage } from '../src/i18n';
import { prepareImageForAnalysisUpload } from '../src/modules/image';

// Mock dependencies
jest.mock('axios');
jest.mock('../src/modules/storage');
jest.mock('../src/i18n');
jest.mock('../src/modules/image');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetOnboardingData = getOnboardingData as jest.MockedFunction<typeof getOnboardingData>;
const mockedGetCurrentLanguage = getCurrentLanguage as jest.MockedFunction<typeof getCurrentLanguage>;
const mockedSaveAIRequestCount = saveAIRequestCount as jest.MockedFunction<typeof saveAIRequestCount>;
const mockedGetAIRequestCount = getAIRequestCount as jest.MockedFunction<typeof getAIRequestCount>;
const mockedPrepareImageForAnalysisUpload =
  prepareImageForAnalysisUpload as jest.MockedFunction<typeof prepareImageForAnalysisUpload>;

describe('AI Analysis Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrepareImageForAnalysisUpload.mockResolvedValue('file://test-image-resized.jpg');
    // Mock FileReader for base64 conversion
    global.FileReader = jest.fn().mockImplementation(function(this: any) {
      this.readAsDataURL = jest.fn(function(this: any) {
        this.onloadend?.();
      });
      this.result = 'data:image/jpeg;base64,mockBase64Data';
    }) as any;
    
    // Mock fetch for image conversion
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob()),
    } as any);
  });

  describe('analyzeRoom', () => {

    test('Successfully analyzes room and returns 3 plant recommendations', async () => {
      // Setup mocks
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      
      const mockResponse = {
        data: {
          content: JSON.stringify([
            {
              name: 'Lavender',
              placement: 'Near the window',
              healingBenefit: 'Reduces stress and anxiety',
              careDifficulty: 'easy',
              estimatedCost: '15 TND',
              wateringFrequency: 7,
              encouragingMessage: 'You got this!',
            },
            {
              name: 'Snake Plant',
              placement: 'Corner of the room',
              healingBenefit: 'Improves air quality',
              careDifficulty: 'easy',
              estimatedCost: '20 TND',
              wateringFrequency: 14,
              encouragingMessage: 'Great choice!',
            },
            {
              name: 'Peace Lily',
              placement: 'On the desk',
              healingBenefit: 'Promotes calmness',
              careDifficulty: 'medium',
              estimatedCost: '25 TND',
              wateringFrequency: 5,
              encouragingMessage: 'Perfect for you!',
            },
          ]),
        },
      };
      
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await analyzeRoom('file://test-image.jpg');

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Lavender');
      expect(result[1].name).toBe('Snake Plant');
      expect(result[2].name).toBe('Peace Lily');
      expect(mockedSaveAIRequestCount).toHaveBeenCalled();
    });

    test('Resizes image before converting it to base64', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      mockedPrepareImageForAnalysisUpload.mockResolvedValue('file://resized-upload.jpg');
      mockedAxios.post.mockResolvedValue({
        data: {
          content: JSON.stringify([
            { name: 'Lavender', placement: 'Near the window', healingBenefit: 'Reduces stress', careDifficulty: 'easy', estimatedCost: '15 TND', wateringFrequency: 7, encouragingMessage: 'You got this!' },
            { name: 'Snake Plant', placement: 'Corner of the room', healingBenefit: 'Improves air quality', careDifficulty: 'easy', estimatedCost: '20 TND', wateringFrequency: 14, encouragingMessage: 'Great choice!' },
            { name: 'Peace Lily', placement: 'On the desk', healingBenefit: 'Promotes calmness', careDifficulty: 'medium', estimatedCost: '25 TND', wateringFrequency: 5, encouragingMessage: 'Perfect for you!' },
          ]),
        },
      });

      await analyzeRoom('file://test-image.jpg');

      expect(mockedPrepareImageForAnalysisUpload).toHaveBeenCalledWith('file://test-image.jpg');
      expect(global.fetch).toHaveBeenCalledWith('file://resized-upload.jpg');
    });

    test('Builds analysis prompt with anchored modern placement guidance', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      mockedAxios.post.mockResolvedValue({
        data: {
          content: JSON.stringify([
            { name: 'Lavender', placement: 'window ledge', healingBenefit: 'Reduces stress', careDifficulty: 'easy', estimatedCost: '15 TND', wateringFrequency: 7, encouragingMessage: 'You got this!' },
            { name: 'Snake Plant', placement: 'geometric wall planter', healingBenefit: 'Improves air quality', careDifficulty: 'easy', estimatedCost: '20 TND', wateringFrequency: 14, encouragingMessage: 'Great choice!' },
            { name: 'Pothos', placement: 'ceiling hanging planter', healingBenefit: 'Feels uplifting', careDifficulty: 'easy', estimatedCost: '18 TND', wateringFrequency: 7, encouragingMessage: 'Fresh and calming!' },
          ]),
        },
      });

      await analyzeRoom('file://test-image.jpg');

      const [, requestBody] = mockedAxios.post.mock.calls[0];

      expect(requestBody.systemPrompt).toContain('real support surface or mounting method');
      expect(requestBody.systemPrompt).toContain('geometric wall-mounted planter');
      expect(requestBody.systemPrompt).toContain('ceiling hanging planter');
      expect(requestBody.systemPrompt).toContain('Avoid vague or unrealistic placements like floating in mid-air');
    });

    test('Builds a symptom-aware prompt and preserves healing role details', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'sleep',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      mockedAxios.post.mockResolvedValue({
        data: {
          content: JSON.stringify([
            {
              name: 'Lavender',
              placement: 'Bedside floating shelf',
              healingBenefit: 'Supports better sleep onset',
              healingRole: 'Helps settle the room into a bedtime ritual',
              sensoryAction: 'Soft calming scent and a gentler visual cue',
              careDifficulty: 'easy',
              estimatedCost: '15 TND',
              wateringFrequency: 7,
              encouragingMessage: 'You got this!',
            },
            {
              name: 'Snake Plant',
              placement: 'Calm bedroom corner',
              healingBenefit: 'Supports fresher nighttime air',
              careDifficulty: 'easy',
              estimatedCost: '20 TND',
              wateringFrequency: 14,
              encouragingMessage: 'Great choice!',
            },
            {
              name: 'Peace Lily',
              placement: 'Low dresser',
              healingBenefit: 'Softens the emotional tone of the room',
              careDifficulty: 'medium',
              estimatedCost: '25 TND',
              wateringFrequency: 5,
              encouragingMessage: 'Perfect for you!',
            },
          ]),
        },
      });

      const guidedContext = {
        symptoms: ['night_waking', 'anxiety'] as const,
        dominantSymptoms: ['night_waking'] as const,
        intensityWindow: 'night' as const,
        supportFocus: 'sleep' as const,
      };

      const result = await analyzeRoom('file://test-image.jpg', guidedContext);

      const [, requestBody] = mockedAxios.post.mock.calls[0];
      expect(requestBody.systemPrompt).toContain('frequent night waking');
      expect(requestBody.systemPrompt).toContain('mild anxiety');
      expect(requestBody.systemPrompt).toContain('sensory mode of action');
      expect(result[0].healingRole).toBe('Helps settle the room into a bedtime ritual');
      expect(result[0].sensoryAction).toBe('Soft calming scent and a gentler visual cue');
      expect(result[1].sensoryAction).toContain('bedtime atmosphere');
    });

    test('Throws error when daily limit is reached', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ 
        count: 5, 
        resetAt: new Date(Date.now() + 86400000).toISOString() 
      });

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    test('Throws error when onboarding data is missing', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue(null);

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('Onboarding data not found');
    });

    test('Throws API_AUTH_ERROR on 401 response', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      
      mockedAxios.post.mockRejectedValue({
        response: { status: 401 },
      });

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('API_AUTH_ERROR');
    });

    test('Throws AI_ANALYSIS_FAILED on network error', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('AI_ANALYSIS_FAILED');
    });

    test('Throws error when AI response is empty', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      
      mockedAxios.post.mockResolvedValue({
        data: { content: '' },
      });

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('Empty response from AI');
    });

    test('Throws error when response does not contain exactly 3 recommendations', async () => {
      mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
      mockedGetOnboardingData.mockResolvedValue({
        healingGoal: 'stress',
        budget: 'under10',
        completedAt: new Date().toISOString(),
      });
      mockedGetCurrentLanguage.mockResolvedValue('en');
      
      mockedAxios.post.mockResolvedValue({
        data: {
          content: JSON.stringify([
            { name: 'Plant 1', placement: 'Here', healingBenefit: 'Good', careDifficulty: 'easy', estimatedCost: '10', wateringFrequency: 7, encouragingMessage: 'Nice!' },
          ]),
        },
      });

      await expect(analyzeRoom('file://test-image.jpg')).rejects.toThrow('Failed to parse AI response');
    });
  });

  describe('Property 8: AI Request Payload Completeness', () => {
    // Validates: Requirements 4.1, 4.2, 4.3
    test('AI request includes healing goal, budget, and language', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('stress', 'physical', 'depression', 'sleep', 'wellness'),
          fc.constantFrom('under10', '10to30', '30plus', 'have_plants'),
          fc.constantFrom('en', 'ar', 'fr'),
          async (healingGoal, budget, language) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();
            
            // Setup mocks
            mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
            mockedGetOnboardingData.mockResolvedValue({
              healingGoal,
              budget,
              completedAt: new Date().toISOString(),
            });
            mockedGetCurrentLanguage.mockResolvedValue(language as any);
            
            const mockResponse = {
              data: {
                content: JSON.stringify([
                  { name: 'Plant 1', placement: 'Here', healingBenefit: 'Good', careDifficulty: 'easy', estimatedCost: '10', wateringFrequency: 7, encouragingMessage: 'Nice!' },
                  { name: 'Plant 2', placement: 'There', healingBenefit: 'Better', careDifficulty: 'medium', estimatedCost: '20', wateringFrequency: 14, encouragingMessage: 'Great!' },
                  { name: 'Plant 3', placement: 'Everywhere', healingBenefit: 'Best', careDifficulty: 'hard', estimatedCost: '30', wateringFrequency: 3, encouragingMessage: 'Perfect!' },
                ]),
              },
            };
            
            mockedAxios.post.mockResolvedValue(mockResponse);

            await analyzeRoom('file://test-image.jpg');

            // Verify the API was called with correct payload
            expect(mockedAxios.post).toHaveBeenCalled();
            const callArgs = mockedAxios.post.mock.calls[0];
            const requestUrl = callArgs[0];
            const requestBody = callArgs[1];
            const systemPrompt = requestBody.systemPrompt;
            
            // System prompt should include language name
            const languageName = language === 'en' ? 'English' : language === 'ar' ? 'Arabic' : 'French';
            expect(requestUrl).toContain('/api/analyze-room');
            expect(requestBody.healingGoal).toBe(healingGoal);
            expect(requestBody.budget).toBe(budget);
            expect(requestBody.language).toBe(language);
            expect(requestBody.imageBase64).toBe('mockBase64Data');
            expect(systemPrompt).toContain(languageName);
            expect(systemPrompt).toContain('healing from');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: AI Response Parsing', () => {
    // Validates: Requirements 4.5
    test('Parses exactly 3 plant recommendations with all required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 50 }),
              placement: fc.string({ minLength: 1, maxLength: 100 }),
              healingBenefit: fc.string({ minLength: 1, maxLength: 200 }),
              careDifficulty: fc.constantFrom('easy', 'medium', 'hard'),
              estimatedCost: fc.string({ minLength: 1, maxLength: 20 }),
              wateringFrequency: fc.integer({ min: 1, max: 30 }),
              encouragingMessage: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 3, maxLength: 3 }
          ),
          async (plants) => {
            mockedGetAIRequestCount.mockResolvedValue({ count: 0, resetAt: new Date(Date.now() + 86400000).toISOString() });
            mockedGetOnboardingData.mockResolvedValue({
              healingGoal: 'stress',
              budget: 'under10',
              completedAt: new Date().toISOString(),
            });
            mockedGetCurrentLanguage.mockResolvedValue('en');
            
            mockedAxios.post.mockResolvedValue({
              data: {
                content: JSON.stringify(plants),
              },
            });

            const result = await analyzeRoom('file://test-image.jpg');

            // Should return exactly 3 recommendations
            expect(result).toHaveLength(3);
            
            // Each recommendation should have all required fields
            result.forEach((rec, index) => {
              expect(rec.name).toBe(plants[index].name);
              expect(rec.placement).toBe(plants[index].placement);
              expect(rec.healingBenefit).toBe(plants[index].healingBenefit);
              expect(rec.careDifficulty).toBe(plants[index].careDifficulty);
              expect(rec.estimatedCost).toBe(plants[index].estimatedCost);
              expect(rec.wateringFrequencyDays).toBe(plants[index].wateringFrequency);
              expect(rec.encouragingMessage).toBe(plants[index].encouragingMessage);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: AI Request Rate Limiting', () => {
    // Validates: Requirements 4.7
    test('Enforces 5 requests per day limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          async (requestCount) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            mockedGetAIRequestCount.mockResolvedValue({
              count: requestCount,
              resetAt: tomorrow.toISOString(),
            });

            const canProceed = await checkDailyLimit();

            // Should allow if under 5, block if 5 or more
            if (requestCount < 5) {
              expect(canProceed).toBe(true);
            } else {
              expect(canProceed).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Resets limit after 24 hours', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: -86400000, max: 86400000 }), // -1 day to +1 day
          async (requestCount, timeOffset) => {
            const resetAt = new Date(Date.now() + timeOffset);
            
            mockedGetAIRequestCount.mockResolvedValue({
              count: requestCount,
              resetAt: resetAt.toISOString(),
            });

            const canProceed = await checkDailyLimit();

            // If reset time has passed (including exactly at reset time), should always allow
            // If reset time hasn't passed, should check count
            if (timeOffset <= 0) {
              expect(canProceed).toBe(true);
            } else {
              expect(canProceed).toBe(requestCount < 5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Rate limiting functions', () => {
    test('incrementRequestCount increments count correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      mockedGetAIRequestCount.mockResolvedValue({
        count: 2,
        resetAt: tomorrow.toISOString(),
      });

      await incrementRequestCount();

      expect(mockedSaveAIRequestCount).toHaveBeenCalledWith({
        count: 3,
        resetAt: tomorrow.toISOString(),
      });
    });

    test('incrementRequestCount resets count after expiry', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      mockedGetAIRequestCount.mockResolvedValue({
        count: 5,
        resetAt: yesterday.toISOString(),
      });

      await incrementRequestCount();

      const callArgs = mockedSaveAIRequestCount.mock.calls[0][0];
      expect(callArgs.count).toBe(1);
      expect(new Date(callArgs.resetAt).getTime()).toBeGreaterThan(Date.now());
    });

    test('getRemainingRequests returns correct count', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      mockedGetAIRequestCount.mockResolvedValue({
        count: 3,
        resetAt: tomorrow.toISOString(),
      });

      const remaining = await getRemainingRequests();

      expect(remaining).toBe(2);
    });

    test('getRemainingRequests returns 5 when no data exists', async () => {
      mockedGetAIRequestCount.mockResolvedValue(null);

      const remaining = await getRemainingRequests();

      expect(remaining).toBe(5);
    });

    test('getRemainingRequests returns 5 after reset time', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      mockedGetAIRequestCount.mockResolvedValue({
        count: 5,
        resetAt: yesterday.toISOString(),
      });

      const remaining = await getRemainingRequests();

      expect(remaining).toBe(5);
    });
  });
});

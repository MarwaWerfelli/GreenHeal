import axios from 'axios';
import Constants from 'expo-constants';
import { getOnboardingData, saveAIRequestCount, getAIRequestCount } from './storage';
import { getCurrentLanguage } from '../i18n';
import { resizeForStabilityAI } from './image';
import type { PlantRecommendation } from '../types';

export type { PlantRecommendation };

// Get API keys from app config
const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
const PERENUAL_API_KEY = Constants.expoConfig?.extra?.PERENUAL_API_KEY || '';
const STABILITY_API_KEY = Constants.expoConfig?.extra?.STABILITY_API_KEY || '';
const DAILY_LIMIT = 5;

interface AIRequestCount {
  count: number;
  resetAt: string;
}

const HEALING_GOAL_MAP: Record<string, string> = {
  stress: 'Stress & Anxiety',
  physical: 'Physical Recovery',
  depression: 'Depression & Low Mood',
  sleep: 'Sleep Issues',
  wellness: 'General Wellness',
};

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  fr: 'French',
};

export async function analyzeRoom(imageUri: string): Promise<PlantRecommendation[]> {
  // Check daily limit
  const canProceed = await checkDailyLimit();
  if (!canProceed) {
    throw new Error('DAILY_LIMIT_REACHED');
  }

  // Get user context
  const onboardingData = await getOnboardingData();
  const language = await getCurrentLanguage();
  
  if (!onboardingData) {
    throw new Error('Onboarding data not found');
  }

  const healingGoal = HEALING_GOAL_MAP[onboardingData.healingGoal] || 'General Wellness';
  const languageName = LANGUAGE_MAP[language] || 'English';

  // Build system prompt
  const systemPrompt = `You are a therapeutic interior designer and plant therapist. Respond in ${languageName}. Analyze this room photo. Consider the lighting, available surfaces, room type, and empty spaces. The user is healing from ${healingGoal}. Suggest 3 specific healing plants tailored to their condition, each with: plant name, exact placement in the room, the specific healing benefit for their condition (cite real science briefly), care difficulty (easy/medium/hard), estimated cost in TND, watering frequency in days, and an encouraging message. Keep the tone warm, supportive, and hopeful. Format your response as JSON array with fields: name, placement, healingBenefit, careDifficulty, estimatedCost, wateringFrequency, encouragingMessage.`;

  try {
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Parse response
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const recommendations = parseAIResponse(content);
    
    // Increment request count
    await incrementRequestCount();

    return recommendations;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('API_AUTH_ERROR');
    }
    if (error.message === 'DAILY_LIMIT_REACHED' || 
        error.message === 'Empty response from AI' ||
        error.message === 'Onboarding data not found' ||
        error.message.startsWith('Failed to parse')) {
      throw error;
    }
    throw new Error('AI_ANALYSIS_FAILED');
  }
}

function parseAIResponse(content: string): PlantRecommendation[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new Error('Expected exactly 3 plant recommendations');
    }

    // Validate each recommendation
    const recommendations: PlantRecommendation[] = parsed.map((item: any) => {
      if (!item.name || !item.placement || !item.healingBenefit || 
          !item.careDifficulty || !item.estimatedCost || 
          !item.wateringFrequency || !item.encouragingMessage) {
        throw new Error('Missing required fields in recommendation');
      }

      return {
        name: String(item.name),
        placement: String(item.placement),
        healingBenefit: String(item.healingBenefit),
        careDifficulty: item.careDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
        estimatedCost: String(item.estimatedCost),
        wateringFrequencyDays: Number(item.wateringFrequency),
        encouragingMessage: String(item.encouragingMessage),
      };
    });

    return recommendations;
  } catch (error) {
    throw new Error('Failed to parse AI response');
  }
}

async function convertImageToBase64(imageUri: string): Promise<string> {
  // For React Native, we need to use fetch to read the file
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function checkDailyLimit(): Promise<boolean> {
  const requestData = await getAIRequestCount();
  
  if (!requestData) {
    return true;
  }

  const resetAt = new Date(requestData.resetAt);
  const now = new Date();

  // Check if we need to reset the counter
  if (now >= resetAt) {
    return true;
  }

  // Check if under limit
  return requestData.count < DAILY_LIMIT;
}

export async function incrementRequestCount(): Promise<void> {
  const requestData = await getAIRequestCount();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (!requestData) {
    // First request
    await saveAIRequestCount({
      count: 1,
      resetAt: tomorrow.toISOString(),
    });
    return;
  }

  const resetAt = new Date(requestData.resetAt);

  if (now >= resetAt) {
    // Reset counter
    await saveAIRequestCount({
      count: 1,
      resetAt: tomorrow.toISOString(),
    });
  } else {
    // Increment counter
    await saveAIRequestCount({
      count: requestData.count + 1,
      resetAt: requestData.resetAt,
    });
  }
}

export async function getRemainingRequests(): Promise<number> {
  const requestData = await getAIRequestCount();
  
  if (!requestData) {
    return DAILY_LIMIT;
  }

  const resetAt = new Date(requestData.resetAt);
  const now = new Date();

  // Check if counter should be reset
  if (now >= resetAt) {
    return DAILY_LIMIT;
  }

  return Math.max(0, DAILY_LIMIT - requestData.count);
}

/**
 * Generate a visualization of the room with the recommended plants
 * Uses backend API which calls Stability AI
 */
export async function generateRoomVisualization(
  originalImageUri: string,
  recommendations: PlantRecommendation[]
): Promise<string> {
  try {
    console.log('[VISUALIZATION] Starting visualization generation...');
    console.log('[VISUALIZATION] Original image URI:', originalImageUri);
    console.log('[VISUALIZATION] Recommendations count:', recommendations.length);
    
    // Resize image to meet Stability AI requirements (max 9.4 megapixels)
    console.log('[VISUALIZATION] Resizing image...');
    const resizedImageUri = await resizeForStabilityAI(originalImageUri);
    console.log('[VISUALIZATION] Image resized successfully');

    // Build a detailed prompt describing what to add
    const plantDescriptions = recommendations.map((plant) => 
      `${plant.name} in a modern pot ${plant.placement}`
    ).join(', ');

    const prompt = `Room with healing plants: ${plantDescriptions}. The plants should look healthy, vibrant, and professionally placed in modern decorative pots.`;
    console.log('[VISUALIZATION] Prompt:', prompt);

    // Create form data
    const formData = new FormData();
    formData.append('image', {
      uri: resizedImageUri,
      type: 'image/jpeg',
      name: 'room.jpg',
    } as any);
    formData.append('prompt', prompt);

    // Call backend API
    const BACKEND_URL = __DEV__ 
      ? 'http://localhost:3000' 
      : 'https://greenhealbackend.vercel.app';

    console.log('[VISUALIZATION] Calling backend API:', BACKEND_URL);
    const apiResponse = await axios.post(
      `${BACKEND_URL}/api/visualize`,
      formData,
      {
        timeout: 90000, // 90 second timeout for DALL-E
      }
    );

    console.log('[VISUALIZATION] Backend response status:', apiResponse.status);
    console.log('[VISUALIZATION] Backend response data:', JSON.stringify(apiResponse.data));

    if (!apiResponse.data.success || !apiResponse.data.imageUrl) {
      console.error('[VISUALIZATION] Invalid response from backend:', apiResponse.data);
      throw new Error('Invalid response from backend');
    }

    console.log('[VISUALIZATION] Visualization generated successfully!');
    console.log('[VISUALIZATION] Image URL:', apiResponse.data.imageUrl);
    return apiResponse.data.imageUrl;
  } catch (error: any) {
    console.error('[VISUALIZATION] Error generating room visualization:', error.message);
    console.error('[VISUALIZATION] Error details:', error);
    if (error.response) {
      console.error('[VISUALIZATION] Error response status:', error.response.status);
      console.error('[VISUALIZATION] Error response data:', JSON.stringify(error.response.data));
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('API_AUTH_ERROR');
    }
    throw new Error('IMAGE_GENERATION_FAILED');
  }
}

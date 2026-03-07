import axios from 'axios';
import Constants from 'expo-constants';
import { getOnboardingData, saveAIRequestCount, getAIRequestCount } from './storage';
import { getCurrentLanguage } from '../i18n';
import type { PlantRecommendation } from '../types';

export type { PlantRecommendation };

// Get API keys from app config
const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
const PERENUAL_API_KEY = Constants.expoConfig?.extra?.PERENUAL_API_KEY || '';
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
 * Uses GPT-4 Vision to describe the room, then DALL-E 3 to generate a matching visualization
 */
export async function generateRoomVisualization(
  originalImageUri: string,
  recommendations: PlantRecommendation[]
): Promise<string> {
  try {
    // Step 1: Use GPT-4 Vision to get a detailed description of the room
    const base64Image = await convertImageToBase64(originalImageUri);
    
    const descriptionResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an interior design expert. Describe this room in extreme detail: layout, furniture, colors, materials, lighting, flooring, walls, windows, doors, and any existing objects. Be very specific about spatial relationships and exact positions. Keep it under 200 words.',
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
        max_tokens: 300,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const roomDescription = descriptionResponse.data.choices[0]?.message?.content;
    if (!roomDescription) {
      throw new Error('Failed to get room description');
    }

    // Step 2: Build plant placement descriptions
    const plantDescriptions = recommendations.map((plant) => 
      `${plant.name} ${plant.placement}`
    ).join(', ');

    // Step 3: Create a detailed prompt for DALL-E 3
    const prompt = `Professional interior design photograph: ${roomDescription} Now add these healing plants in modern decorative pots: ${plantDescriptions}. The plants should be placed exactly as described, looking healthy and vibrant. Maintain the exact same room layout, furniture, colors, and lighting. Only add the plants. Photorealistic, high quality, natural lighting.`;

    // Step 4: Generate image with DALL-E 3
    const imageResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const imageUrl = imageResponse.data.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    return imageUrl;
  } catch (error: any) {
    console.error('Error generating room visualization:', error);
    console.error('Error details:', error.response?.data);
    if (error.response?.status === 401) {
      throw new Error('API_AUTH_ERROR');
    }
    throw new Error('IMAGE_GENERATION_FAILED');
  }
}

import axios from 'axios';
import Constants from 'expo-constants';
import { getOnboardingData, saveAIRequestCount, getAIRequestCount } from './storage';
import { getCurrentLanguage } from '../i18n';
import {
  prepareImageForAnalysisUpload,
  prepareImageForVisualizationUpload,
} from './image';
import type {
  GuidedDialogueContext,
  GuidedSymptomKey,
  PlantRecommendation,
  SymptomSupportFocus,
  SymptomTimeOfDay,
} from '../types';

export type { PlantRecommendation };

const DEFAULT_BACKEND_URL = 'https://greenhealbackend.vercel.app';
const BACKEND_URL =
  Constants.expoConfig?.extra?.BACKEND_URL ||
  (__DEV__ ? 'http://localhost:3000' : DEFAULT_BACKEND_URL);
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

const GUIDED_SYMPTOM_LABELS: Record<GuidedSymptomKey, string> = {
  night_waking: 'frequent night waking',
  anxiety: 'mild anxiety',
  irritability: 'unusual irritability',
  restlessness: 'restlessness',
  mental_fatigue: 'mental fatigue',
  low_mood: 'low mood',
};

const SYMPTOM_TIME_LABELS: Record<SymptomTimeOfDay, string> = {
  night: 'nighttime',
  morning: 'the morning',
  afternoon: 'the afternoon',
  evening: 'the evening',
  all_day: 'throughout the day',
};

const SUPPORT_FOCUS_LABELS: Record<SymptomSupportFocus, string> = {
  sleep: 'sleep support',
  calm: 'calm and anxiety relief',
  emotional_balance: 'emotional balance',
  focus: 'grounded focus',
};

export async function analyzeRoom(
  imageUri: string,
  guidedContext?: GuidedDialogueContext
): Promise<PlantRecommendation[]> {
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
  const guidedPrompt = buildGuidedDialoguePrompt(guidedContext);

  // Build system prompt
  const systemPrompt = [
    `You are a therapeutic interior designer and plant therapist. Respond in ${languageName}.`,
    'Analyze this room photo. Consider the lighting, available surfaces, room type, and empty spaces.',
    `The user is healing from ${healingGoal}.`,
    guidedPrompt,
    'Suggest 3 specific healing plants tailored to their condition.',
    'For each recommendation, give an exact realistic placement that names a real support surface or mounting method.',
    'Prefer modern organization styles when they fit the room, such as a geometric wall-mounted planter, a ceiling hanging planter, a floating shelf planter, a slim side-table planter, or a restrained corner floor planter.',
    'Avoid vague or unrealistic placements like floating in mid-air, oversized plants dominating the room, blocking doors, or covering major furniture.',
    'Each recommendation must include: plant name, exact placement in the room, the specific healing benefit for their condition (cite real science briefly), healing role for the reported symptoms, sensory mode of action, care difficulty (easy/medium/hard), estimated cost in TND, watering frequency in days, and an encouraging message.',
    'Keep the tone warm, supportive, and hopeful.',
    'Format your response as JSON array with fields: name, placement, healingBenefit, healingRole, sensoryAction, careDifficulty, estimatedCost, wateringFrequency, encouragingMessage.',
  ].filter(Boolean).join(' ');

  try {
    // Prepare large images before upload so camera photos stay within request limits
    const resizedImageUri = await prepareImageForAnalysisUpload(imageUri);

    // Convert resized image to base64
    const base64Image = await convertImageToBase64(resizedImageUri);

    // Call backend API
    const response = await axios.post(
      `${BACKEND_URL}/api/analyze-room`,
      {
        imageBase64: base64Image,
        imageMimeType: 'image/jpeg',
        systemPrompt,
        healingGoal: onboardingData.healingGoal,
        budget: onboardingData.budget,
        language,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    // Parse response
    const content = response.data?.content;
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const recommendations = parseAIResponse(content, guidedContext);
    
    // Increment request count
    await incrementRequestCount();

    return recommendations;
  } catch (error: any) {
    if (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.response?.data?.code === 'OPENAI_API_KEY_NOT_CONFIGURED'
    ) {
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

function buildGuidedDialoguePrompt(guidedContext?: GuidedDialogueContext): string {
  if (!guidedContext || !guidedContext.symptoms.length) {
    return '';
  }

  const symptoms = guidedContext.symptoms
    .map((symptom) => GUIDED_SYMPTOM_LABELS[symptom])
    .join(', ');
  const dominantSymptoms = (guidedContext.dominantSymptoms.length
    ? guidedContext.dominantSymptoms
    : guidedContext.symptoms.slice(0, 1)
  ).map((symptom) => GUIDED_SYMPTOM_LABELS[symptom]).join(', ');
  const strongestTime = SYMPTOM_TIME_LABELS[guidedContext.intensityWindow];
  const supportFocus = SUPPORT_FOCUS_LABELS[guidedContext.supportFocus];

  return [
    `The user reported these symptoms before the room scan: ${symptoms}.`,
    `The dominant symptoms are: ${dominantSymptoms}.`,
    `The symptoms feel strongest during ${strongestTime}.`,
    `The user wants ${supportFocus}.`,
    'Tailor each recommendation to these symptoms and explain how the plant supports them through sensory pathways such as calming scent, softer visual texture, visual grounding, bedtime ritual cues, or fresher air.',
  ].join(' ');
}

function parseAIResponse(
  content: string,
  guidedContext?: GuidedDialogueContext
): PlantRecommendation[] {
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

      const healingBenefit = String(item.healingBenefit);

      return {
        name: String(item.name),
        placement: String(item.placement),
        healingBenefit,
        healingRole: String(item.healingRole ?? healingBenefit),
        sensoryAction: String(item.sensoryAction ?? buildFallbackSensoryAction(guidedContext)),
        careDifficulty: normalizeCareDifficulty(item.careDifficulty),
        estimatedCost: String(item.estimatedCost),
        wateringFrequencyDays: Number(item.wateringFrequency ?? item.wateringFrequencyDays),
        encouragingMessage: String(item.encouragingMessage),
      };
    });

    return recommendations;
  } catch (error) {
    throw new Error('Failed to parse AI response');
  }
}

function normalizeCareDifficulty(value: unknown): 'easy' | 'medium' | 'hard' {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') {
    return normalized;
  }

  return 'medium';
}

function buildFallbackSensoryAction(guidedContext?: GuidedDialogueContext): string {
  if (!guidedContext) {
    return 'Adds gentle greenery that softens the room and supports a calmer atmosphere.';
  }

  const fallbackBySupport: Record<SymptomSupportFocus, string> = {
    sleep: 'Supports a quieter bedtime atmosphere through a calm visual presence and a soothing evening cue.',
    calm: 'Helps soften the sensory tone of the room with gentler visual texture and a more settled feel.',
    emotional_balance: 'Creates a steadier emotional anchor in the space through consistent, comforting greenery.',
    focus: 'Brings visual order and grounded structure that can help the room feel clearer and less overstimulating.',
  };

  return fallbackBySupport[guidedContext.supportFocus];
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
    
    // Prepare image for multipart upload with a safer size budget
    console.log('[VISUALIZATION] Preparing image...');
    const resizedImageUri = await prepareImageForVisualizationUpload(originalImageUri);
    console.log('[VISUALIZATION] Image prepared successfully');

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

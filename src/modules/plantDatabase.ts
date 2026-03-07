import axios from 'axios';
import Constants from 'expo-constants';
import { cachePlantData, getCachedPlantData } from './storage';
import type { PlantAPIResponse, EnrichedPlantData } from '../types';

// Get API key from app config
const PERENUAL_API_KEY = Constants.expoConfig?.extra?.PERENUAL_API_KEY || '';
const PERENUAL_BASE_URL = 'https://perenual.com/api';
const CACHE_DURATION_DAYS = 7;

/**
 * Search for a plant in the Perenual API
 */
export async function searchPlant(plantName: string): Promise<PlantAPIResponse | null> {
  try {
    // Check cache first
    const cached = await getCachedPlantData(plantName);
    if (cached && isCacheValid(cached.cachedAt)) {
      return JSON.parse(cached.apiResponse);
    }

    // Search API
    const response = await axios.get(`${PERENUAL_BASE_URL}/species-list`, {
      params: {
        key: PERENUAL_API_KEY,
        q: plantName,
      },
    });

    if (response.data.data && response.data.data.length > 0) {
      const plantData = response.data.data[0];
      
      // Cache the result
      await cachePlantData(plantName, JSON.stringify(plantData));
      
      return plantData;
    }

    return null;
  } catch (error) {
    console.error('Error searching plant:', error);
    return null;
  }
}

/**
 * Enrich plant data with additional information from the API
 */
export async function enrichPlantData(plantName: string): Promise<EnrichedPlantData | null> {
  try {
    const plantData = await searchPlant(plantName);
    
    if (!plantData) {
      return null;
    }

    return {
      scientificName: plantData.scientific_name?.[0],
      family: plantData.family,
      wateringDetails: plantData.watering,
      sunlightRequirements: plantData.sunlight,
      soilType: plantData.soil?.[0],
      growthRate: plantData.growth_rate,
      toxicity: getToxicityInfo(plantData),
      imageUrl: plantData.default_image?.original_url,
    };
  } catch (error) {
    console.error('Error enriching plant data:', error);
    return null;
  }
}

/**
 * Check if cached data is still valid (within 7 days)
 */
export function isCacheValid(cachedAt: string): boolean {
  const cacheDate = new Date(cachedAt);
  const now = new Date();
  const diffInMs = now.getTime() - cacheDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  return diffInDays < CACHE_DURATION_DAYS;
}

/**
 * Get toxicity information from plant data
 */
function getToxicityInfo(plantData: PlantAPIResponse): string {
  const toxicToHumans = plantData.poisonous_to_humans === 1;
  const toxicToPets = plantData.poisonous_to_pets === 1;

  if (toxicToHumans && toxicToPets) {
    return 'Toxic to humans and pets';
  } else if (toxicToHumans) {
    return 'Toxic to humans';
  } else if (toxicToPets) {
    return 'Toxic to pets';
  }
  
  return 'Non-toxic';
}

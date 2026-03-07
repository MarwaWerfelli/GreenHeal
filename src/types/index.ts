// Language types
export type Language = 'en' | 'ar' | 'fr';

// Onboarding types
export type HealingGoal = 'stress' | 'physical' | 'depression' | 'sleep' | 'wellness';
export type Budget = 'under10' | '10to30' | 'over30' | 'have_plants';

export interface OnboardingData {
  healingGoal: HealingGoal;
  budget: Budget;
  existingPlantPhotos?: string[];
  completedAt: string;
}

// Plant types
export interface PlantRecommendation {
  name: string;
  placement: string;
  healingBenefit: string;
  careDifficulty: 'easy' | 'medium' | 'hard';
  estimatedCost: string;
  wateringFrequencyDays: number;
  encouragingMessage: string;
}

export interface GardenPlant {
  id?: number;
  name: string;
  placement?: string;
  healingBenefit?: string;
  careDifficulty: 'easy' | 'medium' | 'hard';
  estimatedCost?: string;
  wateringFrequencyDays: number;
  lastWateredAt?: string;
  nextWateringAt: string;
  careInstructions?: string;
  notificationId?: string;
  addedAt: string;
}

export interface EnrichedPlantData {
  scientificName?: string;
  family?: string;
  wateringDetails?: string;
  sunlightRequirements?: string[];
  soilType?: string;
  growthRate?: string;
  toxicity?: string;
  imageUrl?: string;
}

// Journal types
export interface JournalEntry {
  id?: number;
  moodScore: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  photoPath?: string;
  createdAt: string;
}

export interface MoodCheckIn {
  id?: number;
  moodScore: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

// Cache types
export interface PlantCacheEntry {
  id?: number;
  plantName: string;
  apiResponse: string;
  cachedAt: string;
  expiresAt: string;
}

// API types
export interface PlantAPIResponse {
  id: number;
  common_name: string;
  scientific_name: string[];
  family: string;
  watering: string;
  sunlight: string[];
  watering_general_benchmark?: {
    value: string;
    unit: string;
  };
  soil?: string[];
  growth_rate?: string;
  poisonous_to_humans?: number;
  poisonous_to_pets?: number;
  default_image?: {
    original_url: string;
  };
}

// Navigation types
export type RootStackParamList = {
  LanguageSelection: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Camera: undefined;
  AIAnalysis: { imageUri: string };
  PlantDetail: { plant: PlantRecommendation | GardenPlant; source: 'ai' | 'garden' };
  JournalEntryForm: { entryId?: number };
  JournalEntryDetail: { entryId: number };
};

export type BottomTabParamList = {
  Home: undefined;
  MyGarden: undefined;
  HealingJournal: undefined;
  Settings: undefined;
};

// Screen prop types
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export type CameraScreenProps = StackScreenProps<RootStackParamList, 'Camera'>;

export type AIAnalysisScreenProps = StackScreenProps<RootStackParamList, 'AIAnalysis'>;

export type PlantDetailScreenProps = StackScreenProps<RootStackParamList, 'PlantDetail'>;

export type JournalEntryFormScreenProps = StackScreenProps<RootStackParamList, 'JournalEntryForm'>;

export type JournalEntryDetailScreenProps = StackScreenProps<RootStackParamList, 'JournalEntryDetail'>;

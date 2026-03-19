// Language types
export type Language = 'en' | 'ar' | 'fr';

// Onboarding types
export type HealingGoal = 'stress' | 'physical' | 'depression' | 'sleep' | 'wellness';
export type Budget = 'under10' | '10to30' | 'over30' | 'have_plants';

export interface ReportProfile {
  fullName: string;
  preferredName: string;
  age?: string;
  hospitalName?: string;
  patientId?: string;
  careProgram?: string;
  clinicianName?: string;
}

export type ReportHandoffMethod = 'care_team_email' | 'hospital_portal' | 'print_packet';

export interface ReportExportRecord {
  generatedAt: string;
  fileUri: string;
}

export interface ReportSharingPreferences {
  readyForFutureSharing?: boolean;
  reviewedAt?: string;
  consentConfirmedAt?: string;
  handoffPreparedAt?: string;
  handoffMethod?: ReportHandoffMethod;
  exportGeneratedAt?: string;
  exportFileUri?: string;
  exportHistory?: ReportExportRecord[];
}

export interface OnboardingData {
  reportProfile?: ReportProfile;
  reportSharing?: ReportSharingPreferences;
  healingGoal: HealingGoal;
  budget: Budget;
  existingPlantPhotos?: string[];
  completedAt: string;
}

export type GuidedSymptomKey =
  | 'night_waking'
  | 'anxiety'
  | 'irritability'
  | 'restlessness'
  | 'mental_fatigue'
  | 'low_mood';

export type SymptomTimeOfDay = 'night' | 'morning' | 'afternoon' | 'evening' | 'all_day';

export type SymptomSupportFocus = 'sleep' | 'calm' | 'emotional_balance' | 'focus';

export interface GuidedDialogueContext {
  symptoms: GuidedSymptomKey[];
  dominantSymptoms: GuidedSymptomKey[];
  intensityWindow: SymptomTimeOfDay;
  supportFocus: SymptomSupportFocus;
}

// Plant types
export interface PlantRecommendation {
  name: string;
  placement: string;
  healingBenefit: string;
  healingRole?: string;
  sensoryAction?: string;
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
  // Watering reminder fields
  wateringReminderEnabled: boolean;
  lastWateredDate?: string; // ISO format
  nextWateringDate?: string; // ISO format
  reminderTime?: string; // HH:MM format
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
  Feedback: undefined;
  ReportPreview: undefined;
  GuidedDialogue: undefined;
  Camera: { guidedContext?: GuidedDialogueContext } | undefined;
  AIAnalysis: { imageUri: string; guidedContext?: GuidedDialogueContext };
  RoomVisualization: {
    imageUri: string;
    recommendations: PlantRecommendation[];
    selectedPlant?: PlantRecommendation;
    selectedPlants?: PlantRecommendation[];
  };
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

export type GuidedDialogueScreenProps = StackScreenProps<RootStackParamList, 'GuidedDialogue'>;

export type CameraScreenProps = StackScreenProps<RootStackParamList, 'Camera'>;

export type AIAnalysisScreenProps = StackScreenProps<RootStackParamList, 'AIAnalysis'>;

export type RoomVisualizationScreenProps = StackScreenProps<RootStackParamList, 'RoomVisualization'>;

export type PlantDetailScreenProps = StackScreenProps<RootStackParamList, 'PlantDetail'>;

export type JournalEntryFormScreenProps = StackScreenProps<RootStackParamList, 'JournalEntryForm'>;

export type JournalEntryDetailScreenProps = StackScreenProps<RootStackParamList, 'JournalEntryDetail'>;

# Design Document: GreenHeal Mobile App

## Overview

GreenHeal is a React Native Expo mobile application that transforms living spaces into therapeutic environments through AI-powered plant recommendations. The app combines computer vision analysis, plant therapy science, mood tracking, and care management to support users in their healing journey.

The system architecture follows a client-side mobile application pattern with external API integrations. The app operates primarily offline with local data persistence, reaching out to cloud services only for AI analysis and plant information enrichment. This design ensures users can access their healing journal, garden management, and mood tracking features regardless of connectivity.

Key technical decisions:
- React Native with Expo SDK 51 for cross-platform mobile development with managed workflow
- SQLite for structured local data (journal entries, garden plants, mood tracking)
- AsyncStorage for simple key-value preferences (onboarding data, language settings)
- OpenAI GPT-4o Vision API for intelligent room analysis and personalized plant recommendations
- Perenual API for enriched plant care information with 7-day caching strategy
- i18next for comprehensive internationalization with RTL support for Arabic

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     GreenHeal Mobile App                     │
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │  Presentation  │  │   Navigation   │  │   UI Layer     ││
│  │     Layer      │  │     Layer      │  │   (Screens)    ││
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘│
│           │                   │                    │         │
│  ┌────────┴───────────────────┴────────────────────┴───────┐│
│  │              Business Logic Layer                        ││
│  │  - Room Analysis  - Journal Management                   ││
│  │  - Plant Recommendations  - Garden Management            ││
│  │  - Mood Tracking  - Notification Scheduling              ││
│  └────────┬─────────────────────────────────────────────────┘│
│           │                                                   │
│  ┌────────┴───────────────────────────────────────────────┐ │
│  │              Data Access Layer                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │  SQLite DB   │  │ AsyncStorage │  │ File System  │ │ │
│  │  │  (Structured)│  │ (Preferences)│  │   (Images)   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                                                   │
│  ┌────────┴───────────────────────────────────────────────┐ │
│  │              External Services Layer                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   OpenAI     │  │   Perenual   │  │ Google Maps  │ │ │
│  │  │  Vision API  │  │   Plant API  │  │    Search    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Navigation Structure

```
App Entry
    │
    ├─ Language Selection (first launch only)
    │       │
    │       └─ Onboarding Flow (first launch only)
    │               │
    └───────────────┴─ Main App (Bottom Tabs)
                        │
                        ├─ Home Tab
                        │   ├─ Scan My Room → Camera → AI Analysis → Plant Detail
                        │   └─ Mood Widget
                        │
                        ├─ My Garden Tab
                        │   └─ Plant Detail (with enriched info)
                        │
                        ├─ Healing Journal Tab
                        │   ├─ New Entry (with camera/gallery)
                        │   └─ Entry Detail
                        │
                        └─ Settings Tab
                            ├─ Language Selector
                            └─ Reset Profile
```

### Data Flow

1. **Onboarding Flow**: User responses → AsyncStorage → Home Screen
2. **Room Analysis Flow**: Camera capture → File System → OpenAI API → Plant recommendations → Display
3. **Plant Detail Flow**: Selected plant → Perenual API (with cache check) → Enriched data → Display
4. **Journal Flow**: Mood + notes + photo → SQLite + File System → Timeline display
5. **Garden Management Flow**: Plant data → SQLite → Care reminders → Notifications
6. **Offline Mode**: All reads from local storage, API calls queued or disabled

## Components and Interfaces

### Core Modules

#### 1. Storage Module

Handles all data persistence operations with a unified interface.

```typescript
interface StorageModule {
  // AsyncStorage operations
  saveOnboardingData(data: OnboardingData): Promise<void>;
  getOnboardingData(): Promise<OnboardingData | null>;
  saveLanguagePreference(language: Language): Promise<void>;
  getLanguagePreference(): Promise<Language | null>;
  saveAIRequestCount(count: number, resetTime: number): Promise<void>;
  getAIRequestCount(): Promise<{ count: number; resetTime: number }>;
  
  // SQLite operations
  initDatabase(): Promise<void>;
  saveJournalEntry(entry: JournalEntry): Promise<number>;
  getJournalEntries(): Promise<JournalEntry[]>;
  deleteJournalEntry(id: number): Promise<void>;
  savePlant(plant: GardenPlant): Promise<number>;
  getGardenPlants(): Promise<GardenPlant[]>;
  updatePlantWateringDate(plantId: number, date: Date): Promise<void>;
  deletePlant(plantId: number): Promise<void>;
  saveMoodCheckIn(mood: MoodCheckIn): Promise<void>;
  cachePlantData(plantName: string, data: PlantAPIResponse, expiryDate: Date): Promise<void>;
  getCachedPlantData(plantName: string): Promise<PlantAPIResponse | null>;
}
```

#### 2. AI Analysis Module

Manages OpenAI Vision API integration for room analysis.

```typescript
interface AIAnalysisModule {
  analyzeRoom(
    imageUri: string,
    healingGoal: HealingGoal,
    budget: Budget,
    language: Language
  ): Promise<PlantRecommendation[]>;
  
  checkDailyLimit(): Promise<boolean>;
  incrementRequestCount(): Promise<void>;
  getRemainingRequests(): Promise<number>;
}

interface PlantRecommendation {
  name: string;
  placement: string;
  healingBenefit: string;
  careDifficulty: 'easy' | 'medium' | 'hard';
  estimatedCost: string;
  wateringFrequencyDays: number;
  encouragingMessage: string;
}
```

#### 3. Plant Database Module

Manages Perenual API integration with caching.

```typescript
interface PlantDatabaseModule {
  searchPlant(plantName: string): Promise<PlantAPIResponse | null>;
  enrichPlantData(plantName: string): Promise<EnrichedPlantData>;
  isCacheValid(plantName: string): Promise<boolean>;
}

interface EnrichedPlantData {
  scientificName?: string;
  family?: string;
  wateringDetails?: string;
  sunlightRequirements?: string[];
  soilType?: string;
  growthRate?: string;
  toxicity?: string;
  imageUrl?: string;
}
```

#### 4. Notification Module

Handles care reminder scheduling and delivery.

```typescript
interface NotificationModule {
  requestPermissions(): Promise<boolean>;
  schedulePlantReminder(
    plantId: number,
    plantName: string,
    nextWateringDate: Date
  ): Promise<string>;
  cancelReminder(notificationId: string): Promise<void>;
  cancelAllReminders(): Promise<void>;
  registerNotificationChannels(): Promise<void>;
}
```

#### 5. Image Management Module

Handles image capture, storage, and retrieval.

```typescript
interface ImageModule {
  capturePhoto(): Promise<string | null>;
  pickFromGallery(allowsMultiple: boolean): Promise<string[]>;
  saveImage(uri: string, directory: string): Promise<string>;
  compressImage(uri: string, quality: number): Promise<string>;
  deleteImage(path: string): Promise<void>;
  imageExists(path: string): Promise<boolean>;
}
```

#### 6. Internationalization Module

Manages language switching and translations.

```typescript
interface I18nModule {
  init(): Promise<void>;
  changeLanguage(language: Language): Promise<void>;
  getCurrentLanguage(): Language;
  t(key: string, options?: object): string;
  isRTL(): boolean;
}

type Language = 'en' | 'ar' | 'fr';
```

### Screen Components

#### 1. Language Selection Screen
- Displays three language options with flags/icons
- Pre-selects device language if supported
- Saves selection to AsyncStorage
- Navigates to onboarding

#### 2. Onboarding Screen
- Multi-step form with healing goal selection
- Budget selection
- Optional plant photo upload
- Progress indicator
- Saves all data to AsyncStorage

#### 3. Home Screen
- Calming color palette display
- "Scan My Room" CTA button
- "My Healing Journey" CTA button
- Daily rotating plant tip
- Mood check-in widget (1-5 emoji scale)
- Records mood scores with timestamps

#### 4. Camera Screen
- Full-screen camera view using expo-camera
- Capture button
- Preview with "Use this photo" and "Retake" options
- Permission handling UI

#### 5. AI Analysis Screen
- Loading indicator during API call
- Display of 3 plant recommendation cards
- Each card shows: name, placement, benefit summary, difficulty, cost
- Tap to view details
- Daily limit indicator
- Error handling UI

#### 6. Plant Detail Screen
- Full healing benefits with scientific backing
- Step-by-step placement guidance
- Comprehensive care instructions (water, light, soil)
- Enriched data from Perenual API
- "Add to My Garden" button
- "Find it Near Me" button (opens Google Maps)

#### 7. Healing Journal Screen
- Timeline view of all entries
- New entry button
- Entry form: mood scale (1-5), text input, photo option
- Entry cards: date, mood emoji, notes preview, thumbnail
- Tap to view full entry
- Delete with confirmation

#### 8. My Garden Screen
- Grid/list of saved plants
- Each plant shows: name, difficulty, last watered date, next watering date
- Visual indicator for plants needing water
- Tap to view full care instructions
- "Mark as Watered" button
- "Remove from Garden" with confirmation

#### 9. Settings Screen
- Language selector (English, Arabic, French)
- Current language highlighted
- "Reset Healing Profile" button with confirmation
- App version display
- Immediate UI update on language change

### Navigation Components

```typescript
// Bottom Tab Navigator
interface BottomTabNavigator {
  Home: undefined;
  MyGarden: undefined;
  HealingJournal: undefined;
  Settings: undefined;
}

// Stack Navigator
interface RootStackNavigator {
  LanguageSelection: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Camera: undefined;
  AIAnalysis: { imageUri: string };
  PlantDetail: { plant: PlantRecommendation | GardenPlant; source: 'ai' | 'garden' };
  JournalEntryDetail: { entryId: number };
}
```

## Data Models

### AsyncStorage Schema

```typescript
// Keys and value types
interface AsyncStorageSchema {
  '@greenheal:language': Language;
  '@greenheal:onboarding': OnboardingData;
  '@greenheal:ai_request_count': string; // JSON: { count: number, resetTime: number }
}

interface OnboardingData {
  healingGoal: 'stress' | 'physical' | 'depression' | 'sleep' | 'wellness';
  budget: 'under10' | '10to30' | 'over30' | 'have_plants';
  existingPlantPhotos?: string[]; // file paths
  completedAt: string; // ISO timestamp
}
```

### SQLite Schema

```sql
-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_score INTEGER NOT NULL CHECK(mood_score >= 1 AND mood_score <= 5),
  notes TEXT,
  photo_path TEXT,
  created_at TEXT NOT NULL
);

-- Garden Plants Table
CREATE TABLE IF NOT EXISTS garden_plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  placement TEXT,
  healing_benefit TEXT,
  care_difficulty TEXT,
  estimated_cost TEXT,
  watering_frequency_days INTEGER NOT NULL,
  last_watered_at TEXT,
  next_watering_at TEXT,
  care_instructions TEXT,
  notification_id TEXT,
  added_at TEXT NOT NULL
);

-- Mood Check-ins Table
CREATE TABLE IF NOT EXISTS mood_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mood_score INTEGER NOT NULL CHECK(mood_score >= 1 AND mood_score <= 5),
  created_at TEXT NOT NULL
);

-- Plant Data Cache Table
CREATE TABLE IF NOT EXISTS plant_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_name TEXT UNIQUE NOT NULL,
  api_response TEXT NOT NULL,
  cached_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_garden_next_watering ON garden_plants(next_watering_at);
CREATE INDEX IF NOT EXISTS idx_mood_created ON mood_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_expiry ON plant_cache(plant_name, expires_at);
```

### TypeScript Data Models

```typescript
interface JournalEntry {
  id?: number;
  moodScore: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  photoPath?: string;
  createdAt: string; // ISO timestamp
}

interface GardenPlant {
  id?: number;
  name: string;
  placement?: string;
  healingBenefit?: string;
  careDifficulty: 'easy' | 'medium' | 'hard';
  estimatedCost?: string;
  wateringFrequencyDays: number;
  lastWateredAt?: string; // ISO timestamp
  nextWateringAt: string; // ISO timestamp
  careInstructions?: string;
  notificationId?: string;
  addedAt: string; // ISO timestamp
}

interface MoodCheckIn {
  id?: number;
  moodScore: 1 | 2 | 3 | 4 | 5;
  createdAt: string; // ISO timestamp
}

interface PlantCacheEntry {
  id?: number;
  plantName: string;
  apiResponse: string; // JSON stringified
  cachedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
}
```

### API Request/Response Models

```typescript
// OpenAI Vision API
interface OpenAIVisionRequest {
  model: 'gpt-4o';
  messages: [
    {
      role: 'system';
      content: string; // System prompt with language and healing goal
    },
    {
      role: 'user';
      content: [
        { type: 'text'; text: string },
        { type: 'image_url'; image_url: { url: string } }
      ];
    }
  ];
  max_tokens: number;
}

interface OpenAIVisionResponse {
  choices: [
    {
      message: {
        content: string; // Parsed to extract 3 PlantRecommendation objects
      };
    }
  ];
}

// Perenual Plant API
interface PerenualSearchRequest {
  q: string; // plant name
  key: string; // API key
}

interface PerenualSearchResponse {
  data: Array<{
    id: number;
    common_name: string;
    scientific_name: string[];
    family: string;
    watering: string;
    sunlight: string[];
  }>;
}

interface PerenualDetailRequest {
  id: number;
  key: string;
}

interface PerenualDetailResponse {
  id: number;
  common_name: string;
  scientific_name: string[];
  family: string;
  watering: string;
  watering_general_benchmark: {
    value: string;
    unit: string;
  };
  sunlight: string[];
  soil: string[];
  growth_rate: string;
  poisonous_to_humans: number;
  poisonous_to_pets: number;
  default_image: {
    original_url: string;
  };
}
```

### File System Structure

```
DocumentDirectory/
├── greenheal/
│   ├── room_photos/
│   │   └── {timestamp}_{uuid}.jpg
│   ├── journal_photos/
│   │   └── {timestamp}_{uuid}.jpg
│   └── onboarding_photos/
│       └── {timestamp}_{uuid}.jpg
```

### Environment Variables

```
OPENAI_API_KEY=sk-...
PERENUAL_API_KEY=sk-...
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.5, 9.1, 9.2, 9.6, 18.3 all test AsyncStorage round-trip for different data types → Combined into Property 1
- Properties 6.6, 9.3, 9.4, 9.5 all test SQLite round-trip for different data types → Combined into Property 2
- Properties 5.5, 7.6, 10.3, 10.6 all test Plant API queries on detail screens → Combined into Property 3
- Properties 10.5, 16.6 both test cached data usage offline → Combined into Property 4
- Properties 17.4, 18.4 both test immediate language UI updates → Combined into Property 5
- Properties 4.3, 17.6 both test language preference in AI requests → Combined into Property 6

### Property 1: AsyncStorage Round-Trip Persistence

*For any* valid data (language preference, onboarding data, AI request count), storing it in AsyncStorage and then retrieving it should return equivalent data.

**Validates: Requirements 1.5, 9.1, 9.2, 9.6, 18.3**

### Property 2: SQLite Round-Trip Persistence

*For any* valid structured data (journal entry, garden plant, mood check-in), storing it in SQLite and then retrieving it should return equivalent data with all fields intact.

**Validates: Requirements 6.6, 9.3, 9.4, 9.5**

### Property 3: Device Language Pre-Selection

*For any* supported device language (English, Arabic, French), the language selection screen should pre-select that language; for any unsupported language, English should be pre-selected.

**Validates: Requirements 1.2, 1.3**

### Property 4: Language Selection Navigation

*For any* language selection, the app should store the preference and navigate to the onboarding screen.

**Validates: Requirements 1.6**

### Property 5: Onboarding Data Persistence

*For any* complete set of onboarding responses (healing goal, budget, optional photos), storing them should make all responses retrievable from AsyncStorage.

**Validates: Requirements 1.11**

### Property 6: Mood Score Recording

*For any* mood score selection (1-5), the app should record the score with a timestamp that can be retrieved from storage.

**Validates: Requirements 2.6**

### Property 7: Daily Tip Rotation

*For any* two different dates, the daily plant healing tip displayed should be deterministic based on the date (same date = same tip, different dates may have different tips).

**Validates: Requirements 2.4**

### Property 8: AI Request Payload Completeness

*For any* room photo submission, the API request should include the photo, healing goal, budget, and language preference.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: AI Response Parsing

*For any* valid AI API response, the app should parse exactly 3 plant recommendations, each containing name, placement, healing benefit, care difficulty, estimated cost, and watering frequency.

**Validates: Requirements 4.5**

### Property 10: Plant Recommendation Display Completeness

*For any* plant recommendation, the displayed card should include plant name, placement suggestion, healing benefit summary, care difficulty, and estimated cost.

**Validates: Requirements 4.6**

### Property 11: AI Request Rate Limiting

*For any* sequence of AI analysis requests within a 24-hour period, the 6th request should be blocked and subsequent requests should be blocked until the reset time.

**Validates: Requirements 4.7**

### Property 12: Plant Database API Enrichment

*For any* plant detail view (from AI recommendations or My Garden), the app should query the Plant Database API to attempt enrichment of care instructions.

**Validates: Requirements 5.5, 7.6, 10.3, 10.6**

### Property 13: Add to Garden Persistence

*For any* plant recommendation, adding it to My Garden should make it retrievable from Local_Storage with all plant data intact.

**Validates: Requirements 5.10**

### Property 14: Journal Entry Timeline Sorting

*For any* set of journal entries, the timeline view should display them sorted by date in descending order (newest first).

**Validates: Requirements 6.7**

### Property 15: Journal Entry Display Completeness

*For any* journal entry in the timeline, the displayed card should include date, mood score, notes preview, and thumbnail if a photo exists.

**Validates: Requirements 6.8**

### Property 16: Journal Entry Deletion

*For any* journal entry, confirming deletion should remove it from Local_Storage and delete any associated photo file from the file system.

**Validates: Requirements 6.11**

### Property 17: Garden Plant Display Completeness

*For any* plant in My Garden, the displayed information should include plant name, care difficulty, and last watered date.

**Validates: Requirements 7.2**

### Property 18: Next Watering Date Calculation

*For any* plant with a watering frequency and last watered date, the calculated next watering date should equal last watered date plus watering frequency days.

**Validates: Requirements 7.3**

### Property 19: Care Reminder Notification Scheduling

*For any* plant that needs watering (current date >= next watering date), a care reminder notification should be scheduled or sent.

**Validates: Requirements 7.4**

### Property 20: Mark as Watered Update

*For any* plant in My Garden, marking it as watered should update the last watered timestamp in Local_Storage to the current time.

**Validates: Requirements 7.8**

### Property 21: Plant Removal Cleanup

*For any* plant in My Garden, confirming removal should delete the plant from Local_Storage and cancel any associated care reminder notifications.

**Validates: Requirements 7.11**

### Property 22: Database Error Handling

*For any* database operation that fails, the app should handle the error gracefully and display a user-friendly error message without crashing.

**Validates: Requirements 9.8**

### Property 23: Plant Data Cache Duration

*For any* Plant Database API response, caching it should make it retrievable for 7 days, after which it should be considered expired.

**Validates: Requirements 10.4**

### Property 24: Offline Cache Usage

*For any* plant detail view while offline, if cached Plant Database data exists and is not expired, the app should display the cached data.

**Validates: Requirements 10.5, 16.6**

### Property 25: Offline Garden Access

*For any* stored plants in My Garden, the app should allow full access to view and manage them while offline.

**Validates: Requirements 16.3**

### Property 26: Offline Journal Access

*For any* stored journal entries, the app should allow full access to view and create new entries while offline.

**Validates: Requirements 16.4**

### Property 27: Offline Mood Check-In

*For any* mood score (1-5), the app should allow mood check-ins while offline that are saved to Local_Storage.

**Validates: Requirements 16.5**

### Property 28: Language Change Immediate Update

*For any* language change (English, Arabic, French), all UI text should update immediately without requiring an app restart.

**Validates: Requirements 17.4, 18.4**

### Property 29: Static Content Translation

*For any* selected language, all static content (onboarding questions, button labels, error messages) should display in that language.

**Validates: Requirements 17.8**

### Property 30: Profile Reset Data Clearing

*For any* onboarding data stored in AsyncStorage, confirming profile reset should clear all onboarding data.

**Validates: Requirements 18.8**

### Property 31: Image Storage Round-Trip

*For any* captured image (room photo, journal photo), saving it using expo-file-system should make it retrievable from the stored file path.

**Validates: Requirements 15.1**

### Property 32: Journal Photo Path Association

*For any* journal entry with a photo, the image file path should be stored in Local_Storage associated with that entry.

**Validates: Requirements 15.2**

### Property 33: Journal Photo Display

*For any* journal entry with a stored photo path, viewing the entry should load and display the image from that path.

**Validates: Requirements 15.3**

### Property 34: Image Compression

*For any* captured image, the app should compress it before storage while maintaining visual quality.

**Validates: Requirements 15.4**

### Property 35: Notification Scheduling with Permissions

*For any* plant added to My Garden when notification permissions are granted, a care reminder notification should be scheduled based on the plant's watering schedule.

**Validates: Requirements 14.3**


## Error Handling

### Error Categories and Strategies

#### 1. Network Errors

**Scenarios:**
- OpenAI API request fails due to network timeout
- Perenual API request fails due to connectivity loss
- API returns 5xx server errors

**Handling Strategy:**
- Detect network connectivity status before making requests
- Display user-friendly error messages: "Unable to connect. Please check your internet connection."
- Provide retry button for failed requests
- For Plant Database API failures, fall back to AI-provided data
- Cache successful responses to enable offline access

**Implementation:**
```typescript
try {
  const response = await axios.get(url);
  return response.data;
} catch (error) {
  if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
    showError(t('errors.network'));
    return null;
  }
  throw error;
}
```

#### 2. API Authentication Errors

**Scenarios:**
- Invalid or expired OpenAI API key
- Invalid or expired Perenual API key
- API rate limits exceeded

**Handling Strategy:**
- Log authentication errors to console for debugging
- Display message: "Service temporarily unavailable. Please try again later."
- For development: Display specific error to help developers identify configuration issues
- Do not expose API keys or sensitive details to users

**Implementation:**
```typescript
if (error.response?.status === 401 || error.response?.status === 403) {
  console.error('API Authentication Error:', error.response.data);
  showError(t('errors.service_unavailable'));
  return null;
}
```

#### 3. Database Errors

**Scenarios:**
- SQLite database initialization fails
- Insert/update/delete operations fail
- Database corruption
- Disk space full

**Handling Strategy:**
- Wrap all database operations in try-catch blocks
- Display user-friendly messages: "Unable to save data. Please try again."
- Log detailed errors for debugging
- Attempt database re-initialization on critical failures
- Provide graceful degradation (e.g., continue without saving)

**Implementation:**
```typescript
async function saveJournalEntry(entry: JournalEntry): Promise<number | null> {
  try {
    const result = await db.runAsync(
      'INSERT INTO journal_entries (mood_score, notes, photo_path, created_at) VALUES (?, ?, ?, ?)',
      [entry.moodScore, entry.notes, entry.photoPath, entry.createdAt]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Database error saving journal entry:', error);
    showError(t('errors.save_failed'));
    return null;
  }
}
```

#### 4. File System Errors

**Scenarios:**
- Image file not found when loading journal entry
- Insufficient storage space for new images
- File write permissions denied
- Image compression fails

**Handling Strategy:**
- Check file existence before attempting to load
- Display placeholder image if file is missing
- Log missing file errors for debugging
- Check available storage before capturing images
- Compress images to reduce storage requirements
- Clean up orphaned files periodically

**Implementation:**
```typescript
async function loadJournalPhoto(photoPath: string): Promise<string | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(photoPath);
    if (!fileInfo.exists) {
      console.warn('Journal photo not found:', photoPath);
      return null; // Display placeholder
    }
    return photoPath;
  } catch (error) {
    console.error('Error loading journal photo:', error);
    return null;
  }
}
```

#### 5. Permission Errors

**Scenarios:**
- Camera permission denied
- Notification permission denied
- Photo library permission denied

**Handling Strategy:**
- Request permissions before attempting to use features
- Display explanatory messages when permissions are denied
- Provide button to open device settings
- Allow app to function with reduced features if permissions denied
- Do not repeatedly prompt for denied permissions

**Implementation:**
```typescript
async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      t('permissions.camera_required'),
      t('permissions.camera_explanation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.open_settings'), onPress: () => Linking.openSettings() }
      ]
    );
    return false;
  }
  return true;
}
```

#### 6. AI Response Parsing Errors

**Scenarios:**
- OpenAI returns malformed JSON
- Response doesn't contain expected 3 plant recommendations
- Missing required fields in plant recommendations
- Response in wrong language

**Handling Strategy:**
- Validate response structure before parsing
- Use default values for missing optional fields
- Display error if unable to parse any recommendations
- Log parsing errors with response sample for debugging
- Provide retry option

**Implementation:**
```typescript
function parsePlantRecommendations(aiResponse: string): PlantRecommendation[] | null {
  try {
    // Attempt to extract structured data from AI response
    const plants = extractPlantsFromText(aiResponse);
    
    if (plants.length !== 3) {
      console.error('Expected 3 plants, got:', plants.length);
      showError(t('errors.ai_parsing_failed'));
      return null;
    }
    
    // Validate each plant has required fields
    for (const plant of plants) {
      if (!plant.name || !plant.wateringFrequencyDays) {
        console.error('Plant missing required fields:', plant);
        showError(t('errors.ai_parsing_failed'));
        return null;
      }
    }
    
    return plants;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    showError(t('errors.ai_parsing_failed'));
    return null;
  }
}
```

#### 7. Offline Mode Errors

**Scenarios:**
- User attempts AI analysis while offline
- User attempts to enrich plant data while offline with no cache
- Connectivity status changes during operation

**Handling Strategy:**
- Display connectivity indicator when offline
- Disable AI analysis features with explanatory message
- Use cached data when available
- Queue operations that require connectivity (if applicable)
- Gracefully handle mid-operation connectivity loss

**Implementation:**
```typescript
function handleAIAnalysisRequest() {
  if (!isConnected) {
    Alert.alert(
      t('offline.ai_unavailable_title'),
      t('offline.ai_unavailable_message'),
      [{ text: t('common.ok') }]
    );
    return;
  }
  // Proceed with AI analysis
}
```

### Error Logging Strategy

- Use console.error for all errors with contextual information
- Include error type, operation being performed, and relevant data
- Do not log sensitive information (API keys, personal data)
- In production, consider integrating error tracking service (Sentry, Bugsnag)

### User-Facing Error Messages

All error messages should be:
- Translated to user's selected language
- Clear and actionable
- Non-technical (avoid jargon)
- Encouraging and supportive (matching app's healing tone)

Example messages:
- "We couldn't connect right now. Please check your internet and try again."
- "Unable to save your entry. Please try again in a moment."
- "Camera access is needed to scan your room. You can enable it in Settings."

## Testing Strategy

### Dual Testing Approach

The GreenHeal app will use both unit testing and property-based testing to ensure comprehensive coverage and correctness.

**Unit Tests** focus on:
- Specific examples and edge cases
- Integration points between components
- Error conditions and boundary cases
- UI component rendering
- Navigation flows

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Data persistence round-trips
- Calculation correctness across input ranges
- API integration contracts
- State management invariants

Together, these approaches provide complementary coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Testing Framework Selection

**Unit Testing:**
- Jest for test runner and assertions
- React Native Testing Library for component testing
- Mock implementations for Expo modules (expo-camera, expo-sqlite, etc.)

**Property-Based Testing:**
- fast-check library for JavaScript/TypeScript
- Minimum 100 iterations per property test
- Custom generators for domain models (JournalEntry, GardenPlant, etc.)

### Property Test Configuration

Each property test must:
1. Run minimum 100 iterations to ensure statistical coverage
2. Include a comment tag referencing the design document property
3. Use descriptive test names matching the property title

**Tag Format:**
```typescript
// Feature: greenheal-mobile-app, Property 1: AsyncStorage Round-Trip Persistence
test('AsyncStorage round-trip persistence', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        language: fc.constantFrom('en', 'ar', 'fr'),
        healingGoal: fc.constantFrom('stress', 'physical', 'depression', 'sleep', 'wellness'),
        budget: fc.constantFrom('under10', '10to30', 'over30', 'have_plants')
      }),
      async (data) => {
        await AsyncStorage.setItem('@greenheal:test', JSON.stringify(data));
        const retrieved = JSON.parse(await AsyncStorage.getItem('@greenheal:test'));
        expect(retrieved).toEqual(data);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
__tests__/
├── unit/
│   ├── components/
│   │   ├── LanguageSelection.test.tsx
│   │   ├── OnboardingScreen.test.tsx
│   │   ├── HomeScreen.test.tsx
│   │   ├── CameraScreen.test.tsx
│   │   ├── AIAnalysisScreen.test.tsx
│   │   ├── PlantDetailScreen.test.tsx
│   │   ├── HealingJournalScreen.test.tsx
│   │   ├── MyGardenScreen.test.tsx
│   │   └── SettingsScreen.test.tsx
│   ├── modules/
│   │   ├── storage.test.ts
│   │   ├── aiAnalysis.test.ts
│   │   ├── plantDatabase.test.ts
│   │   ├── notifications.test.ts
│   │   ├── imageManagement.test.ts
│   │   └── i18n.test.ts
│   ├── navigation/
│   │   └── navigation.test.tsx
│   └── utils/
│       ├── dateCalculations.test.ts
│       └── validators.test.ts
├── property/
│   ├── storage.property.test.ts
│   ├── persistence.property.test.ts
│   ├── calculations.property.test.ts
│   ├── api.property.test.ts
│   └── offline.property.test.ts
└── integration/
    ├── onboardingFlow.test.tsx
    ├── roomScanFlow.test.tsx
    ├── journalFlow.test.tsx
    └── gardenFlow.test.tsx
```

### Custom Generators for Property Tests

```typescript
// Generators for domain models
const journalEntryGenerator = fc.record({
  moodScore: fc.integer({ min: 1, max: 5 }),
  notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  photoPath: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.date().map(d => d.toISOString())
});

const gardenPlantGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  placement: fc.option(fc.string(), { nil: undefined }),
  healingBenefit: fc.option(fc.string(), { nil: undefined }),
  careDifficulty: fc.constantFrom('easy', 'medium', 'hard'),
  estimatedCost: fc.option(fc.string(), { nil: undefined }),
  wateringFrequencyDays: fc.integer({ min: 1, max: 30 }),
  lastWateredAt: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
  nextWateringAt: fc.date().map(d => d.toISOString()),
  careInstructions: fc.option(fc.string(), { nil: undefined }),
  addedAt: fc.date().map(d => d.toISOString())
});

const languageGenerator = fc.constantFrom('en', 'ar', 'fr');

const moodScoreGenerator = fc.integer({ min: 1, max: 5 });
```

### Unit Test Coverage Goals

- Minimum 80% code coverage for business logic modules
- 100% coverage for critical paths (data persistence, API integration)
- All error handling paths tested
- All navigation flows tested
- Permission handling scenarios tested

### Key Unit Test Scenarios

**Language Selection:**
- First launch shows language selection
- Device language pre-selection works
- Unsupported language defaults to English
- Language selection saves to AsyncStorage
- Navigation to onboarding after selection

**Onboarding:**
- All questions display correctly
- Image picker opens for plant photos
- Data saves to AsyncStorage
- Navigation to home after completion
- Returning users skip onboarding

**Home Screen:**
- Mood widget records scores
- Daily tip rotates based on date
- Navigation to camera works
- Navigation to journal works

**Room Analysis:**
- Camera opens with permissions
- Photo capture and preview work
- Retake functionality works
- AI API called with correct payload
- Daily limit enforced (5 requests)
- Limit reset after 24 hours
- Error handling for API failures

**Plant Details:**
- Plant Database API called for enrichment
- Fallback to AI data when API fails
- Add to Garden saves to SQLite
- Find Near Me opens Google Maps

**Healing Journal:**
- Entry creation with all fields
- Photo attachment from camera/gallery
- Timeline sorted by date descending
- Entry deletion removes from DB and file system
- Offline entry creation works

**My Garden:**
- Plants display with correct data
- Next watering date calculated correctly
- Mark as watered updates timestamp
- Notifications scheduled for watering
- Plant removal deletes from DB and cancels notifications
- Offline access works

**Settings:**
- Language change updates UI immediately
- Language change saves to AsyncStorage
- RTL applied for Arabic
- Profile reset clears data and navigates to language selection

**Offline Mode:**
- Connectivity indicator displays when offline
- AI analysis blocked offline
- Journal and Garden accessible offline
- Cached plant data used offline
- Indicator removed when online

### Integration Test Scenarios

1. **Complete Onboarding Flow:** Language selection → Onboarding questions → Home screen
2. **Room Scan to Garden Flow:** Camera → Photo capture → AI analysis → Plant detail → Add to Garden
3. **Journal Entry Flow:** New entry → Add photo → Save → View in timeline → Delete
4. **Garden Management Flow:** Add plant → View details → Mark as watered → Receive notification → Remove plant

### Manual Testing Checklist

- [ ] Camera permissions on first use
- [ ] Notification permissions on first plant add
- [ ] RTL layout for Arabic language
- [ ] Translations complete for all languages
- [ ] Image compression maintains quality
- [ ] Notifications appear at correct times
- [ ] App works offline for local features
- [ ] API rate limiting works correctly
- [ ] Error messages are user-friendly
- [ ] Navigation flows are intuitive
- [ ] Visual design matches specifications
- [ ] Performance is smooth on target devices

### Continuous Integration

- Run all tests on every commit
- Enforce minimum coverage thresholds
- Run property tests with 100 iterations in CI
- Test on both iOS and Android simulators
- Lint code for style consistency
- Type-check with TypeScript strict mode

### Performance Testing

- Measure app launch time (target: < 3 seconds)
- Measure camera open time (target: < 1 second)
- Measure AI analysis response time (depends on API)
- Measure database query performance (target: < 100ms for reads)
- Test with large datasets (100+ journal entries, 50+ plants)
- Monitor memory usage during image operations
- Test offline mode performance


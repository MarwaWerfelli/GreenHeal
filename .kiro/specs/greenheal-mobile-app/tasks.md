# Implementation Plan: GreenHeal Mobile App

## Overview

This implementation plan breaks down the GreenHeal mobile app into incremental coding tasks. The app is built with React Native Expo SDK 51, TypeScript, SQLite for local storage, and integrates with OpenAI GPT-4o Vision API and Perenual Plant API. Each task builds on previous work, with property-based tests using fast-check (100 iterations minimum) to validate correctness properties from the design document.

## Tasks

- [x] 1. Project setup and core infrastructure
  - Initialize Expo project with TypeScript and SDK 51
  - Install dependencies: expo-camera, expo-image-picker, expo-file-system, expo-notifications, expo-sqlite, AsyncStorage, axios, react-navigation, i18next, fast-check
  - Create directory structure: src/screens, src/components, src/modules, src/types, src/utils, src/i18n, __tests__
  - Set up .env file with OPENAI_API_KEY and PERENUAL_API_KEY placeholders
  - Create .env.example file
  - Configure eas.json for APK builds
  - Set up TypeScript interfaces for all data models (JournalEntry, GardenPlant, MoodCheckIn, PlantRecommendation, OnboardingData, etc.)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 2. Storage module implementation
  - [x] 2.1 Create storage module with AsyncStorage operations
    - Implement saveOnboardingData, getOnboardingData
    - Implement saveLanguagePreference, getLanguagePreference
    - Implement saveAIRequestCount, getAIRequestCount
    - _Requirements: 9.1, 9.2, 9.6_
  
  - [x] 2.2 Write property test for AsyncStorage round-trip persistence
    - **Property 1: AsyncStorage Round-Trip Persistence**
    - **Validates: Requirements 1.5, 9.1, 9.2, 9.6, 18.3**
  
  - [x] 2.3 Create storage module with SQLite operations
    - Implement initDatabase with schema creation for journal_entries, garden_plants, mood_checkins, plant_cache tables
    - Implement saveJournalEntry, getJournalEntries, deleteJournalEntry
    - Implement savePlant, getGardenPlants, updatePlantWateringDate, deletePlant
    - Implement saveMoodCheckIn
    - Implement cachePlantData, getCachedPlantData
    - _Requirements: 9.3, 9.4, 9.5, 10.4_
  
  - [x] 2.4 Write property test for SQLite round-trip persistence
    - **Property 2: SQLite Round-Trip Persistence**
    - **Validates: Requirements 6.6, 9.3, 9.4, 9.5**
  
  - [x] 2.5 Write unit tests for database error handling
    - Test graceful error handling for failed operations
    - Test user-friendly error messages
    - _Requirements: 9.8_

- [x] 3. Internationalization setup
  - [x] 3.1 Configure i18next with language resources
    - Create translation files for English, Arabic, French in src/i18n/locales/
    - Translate all static content: onboarding questions, button labels, error messages, screen titles
    - Implement i18n module with init, changeLanguage, getCurrentLanguage, t, isRTL functions
    - Configure RTL support for Arabic
    - _Requirements: 17.1, 17.2, 17.8_
  
  - [x] 3.2 Write property test for static content translation
    - **Property 29: Static Content Translation**
    - **Validates: Requirements 17.8**

- [x] 4. Image management module
  - [x] 4.1 Implement image module
    - Implement capturePhoto using expo-camera
    - Implement pickFromGallery using expo-image-picker
    - Implement saveImage with directory organization (room_photos, journal_photos, onboarding_photos)
    - Implement compressImage for storage optimization
    - Implement deleteImage and imageExists
    - _Requirements: 15.1, 15.4_
  
  - [x] 4.2 Write property test for image storage round-trip
    - **Property 31: Image Storage Round-Trip**
    - **Validates: Requirements 15.1**
  
  - [x] 4.3 Write unit tests for image compression
    - Test compression maintains visual quality
    - Test file size reduction
    - _Requirements: 15.4_

- [x] 5. Notification module
  - [x] 5.1 Implement notification module
    - Implement requestPermissions
    - Implement registerNotificationChannels for Android
    - Implement schedulePlantReminder with date-based scheduling
    - Implement cancelReminder and cancelAllReminders
    - _Requirements: 14.1, 14.3, 14.4_
  
  - [x] 5.2 Write property test for notification scheduling with permissions
    - **Property 35: Notification Scheduling with Permissions**
    - **Validates: Requirements 14.3**

- [x] 6. Language selection screen
  - [x] 6.1 Create LanguageSelectionScreen component
    - Display three language options with flags/icons (English, Arabic, French)
    - Detect device language and pre-select if supported, otherwise default to English
    - Save language selection to AsyncStorage
    - Navigate to onboarding screen after selection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [x] 6.2 Write property test for device language pre-selection
    - **Property 3: Device Language Pre-Selection**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 6.3 Write property test for language selection navigation
    - **Property 4: Language Selection Navigation**
    - **Validates: Requirements 1.6**
  
  - [x] 6.4 Write unit tests for language selection screen
    - Test language options display
    - Test navigation flow
    - _Requirements: 1.1, 1.4_

- [x] 7. Onboarding screen
  - [x] 7.1 Create OnboardingScreen component
    - Display multi-step form with healing goal selection (Stress & Anxiety, Physical Recovery, Depression & Low Mood, Sleep Issues, General Wellness)
    - Display budget selection (Under 10 TND, 10–30 TND, 30+ TND, I already have plants)
    - Display optional plant photo upload with expo-image-picker (multiple selection)
    - Display progress indicator
    - Save all responses to AsyncStorage
    - Navigate to Home screen after completion
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.11, 1.12_
  
  - [x] 7.2 Write property test for onboarding data persistence
    - **Property 5: Onboarding Data Persistence**
    - **Validates: Requirements 1.11**
  
  - [x] 7.3 Write unit tests for onboarding flow
    - Test all questions display
    - Test image picker integration
    - Test navigation to home
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.12_

- [x] 8. Navigation structure
  - [x] 8.1 Set up React Navigation
    - Create bottom tab navigator with Home, My Garden, Healing Journal, Settings tabs
    - Create stack navigator for Language Selection, Onboarding, Main Tabs, Camera, AI Analysis, Plant Detail, Journal Entry Detail
    - Hide bottom tabs on Language Selection and Onboarding screens
    - Show bottom tabs after onboarding completion
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 8.2 Write unit tests for navigation structure
    - Test bottom tab visibility logic
    - Test stack navigation flows
    - _Requirements: 8.3, 8.4, 8.5_

- [x] 9. Home screen
  - [x] 9.1 Create HomeScreen component
    - Apply color palette (#2D6A4F, #74C69D, #F8F4E3, #FEFAE0)
    - Display "Scan My Room" button
    - Display "My Healing Journey" button
    - Display daily rotating plant tip (deterministic based on date)
    - Display mood check-in widget with emoji scale 1-5
    - Record mood score with timestamp to SQLite on selection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 9.2 Write property test for mood score recording
    - **Property 6: Mood Score Recording**
    - **Validates: Requirements 2.6**
  
  - [x] 9.3 Write property test for daily tip rotation
    - **Property 7: Daily Tip Rotation**
    - **Validates: Requirements 2.4**
  
  - [x] 9.4 Write unit tests for home screen
    - Test button navigation
    - Test mood widget interaction
    - _Requirements: 2.2, 2.3, 2.5_

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Camera screen and permissions
  - [x] 11.1 Create CameraScreen component
    - Request camera permissions on first use
    - Display permission explanation if denied
    - Provide button to open device settings if denied
    - Display full-screen camera view using expo-camera
    - Display capture button
    - Display preview with "Use this photo" and "Retake" options
    - Navigate to AI Analysis screen with image URI
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 13.1, 13.2, 13.3, 13.4_
  
  - [x] 11.2 Write unit tests for camera permissions
    - Test permission request flow
    - Test permission denial handling
    - Test settings navigation
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 12. AI analysis module
  - [x] 12.1 Implement AI analysis module
    - Implement analyzeRoom function with OpenAI GPT-4o Vision API integration
    - Include healing goal, budget, and language preference in API request
    - Use system prompt from requirements with language interpolation
    - Parse exactly 3 plant recommendations from response
    - Implement checkDailyLimit (5 requests per 24 hours)
    - Implement incrementRequestCount
    - Implement getRemainingRequests
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [x] 12.2 Write property test for AI request payload completeness
    - **Property 8: AI Request Payload Completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [x] 12.3 Write property test for AI response parsing
    - **Property 9: AI Response Parsing**
    - **Validates: Requirements 4.5**
  
  - [x] 12.4 Write property test for AI request rate limiting
    - **Property 11: AI Request Rate Limiting**
    - **Validates: Requirements 4.7**
  
  - [x] 12.5 Write unit tests for AI analysis error handling
    - Test network error handling
    - Test API authentication errors
    - Test response parsing errors
    - _Requirements: 4.9, 10.9, 10.10_

- [x] 13. AI analysis screen
  - [x] 13.1 Create AIAnalysisScreen component
    - Display loading indicator during API call
    - Display 3 plant recommendation cards with name, placement, benefit summary, difficulty, cost
    - Display daily limit indicator
    - Display error message with retry option on failure
    - Display limit reached message when daily limit exceeded
    - Navigate to Plant Detail screen on card tap
    - _Requirements: 4.6, 4.8, 4.9_
  
  - [x] 13.2 Write property test for plant recommendation display completeness
    - **Property 10: Plant Recommendation Display Completeness**
    - **Validates: Requirements 4.6**
  
  - [x] 13.3 Write unit tests for AI analysis screen
    - Test loading state
    - Test error display
    - Test limit reached message
    - _Requirements: 4.8, 4.9_

- [x] 14. Plant database module
  - [x] 14.1 Implement plant database module
    - Implement searchPlant function with Perenual API integration
    - Implement enrichPlantData function
    - Implement isCacheValid function (7-day expiry)
    - Use axios for HTTP requests
    - Load API key from .env file
    - _Requirements: 10.2, 10.3, 10.4, 10.7, 10.8_
  
  - [x] 14.2 Write property test for plant data cache duration
    - **Property 23: Plant Data Cache Duration**
    - **Validates: Requirements 10.4**
  
  - [x] 14.3 Write unit tests for plant database API
    - Test search functionality
    - Test enrichment logic
    - Test cache validation
    - _Requirements: 10.2, 10.3, 10.4_

- [x] 15. Plant detail screen
  - [x] 15.1 Create PlantDetailScreen component
    - Display full healing benefits with scientific backing
    - Display step-by-step placement guidance
    - Display care instructions (water, light, soil)
    - Query Plant Database API on load to enrich care instructions
    - Display enriched data if API returns results
    - Fall back to AI-provided data if API returns no results
    - Display "Add to My Garden" button
    - Display "Find it Near Me" button (opens Google Maps search)
    - Save plant to SQLite on "Add to My Garden" tap
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_
  
  - [x] 15.2 Write property test for plant database API enrichment
    - **Property 12: Plant Database API Enrichment**
    - **Validates: Requirements 5.5, 7.6, 10.3, 10.6**
  
  - [x] 15.3 Write property test for add to garden persistence
    - **Property 13: Add to Garden Persistence**
    - **Validates: Requirements 5.10**
  
  - [x] 15.4 Write unit tests for plant detail screen
    - Test data display
    - Test API fallback logic
    - Test Google Maps integration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.9_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Healing journal screen
  - [x] 17.1 Create HealingJournalScreen component
    - Display timeline view of all journal entries sorted by date descending
    - Display entry cards with date, mood emoji, notes preview, thumbnail
    - Display new entry button
    - Navigate to entry detail on card tap
    - _Requirements: 6.1, 6.7, 6.8, 6.9_
  
  - [x] 17.2 Write property test for journal entry timeline sorting
    - **Property 14: Journal Entry Timeline Sorting**
    - **Validates: Requirements 6.7**
  
  - [x] 17.3 Write property test for journal entry display completeness
    - **Property 15: Journal Entry Display Completeness**
    - **Validates: Requirements 6.8**
  
  - [x] 17.4 Create journal entry form component
    - Display mood scale 1-5
    - Display text input for notes
    - Display photo option (camera or gallery)
    - Save entry to SQLite with mood score, notes, timestamp, photo path
    - Save photo to file system using image module
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 17.5 Write property test for journal photo path association
    - **Property 32: Journal Photo Path Association**
    - **Validates: Requirements 15.2**
  
  - [x] 17.6 Write property test for journal photo display
    - **Property 33: Journal Photo Display**
    - **Validates: Requirements 15.3**
  
  - [x] 17.7 Create journal entry detail screen
    - Display full entry with all details
    - Display delete button
    - Prompt for confirmation on delete
    - Remove entry from SQLite and delete photo file on confirm
    - _Requirements: 6.9, 6.10, 6.11_
  
  - [x] 17.8 Write property test for journal entry deletion
    - **Property 16: Journal Entry Deletion**
    - **Validates: Requirements 6.11**
  
  - [x] 17.9 Write unit tests for healing journal
    - Test entry creation
    - Test photo attachment
    - Test deletion flow
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.10_

- [x] 18. My garden screen
  - [x] 18.1 Create MyGardenScreen component
    - Display grid/list of all saved plants
    - Display plant name, care difficulty, last watered date for each plant
    - Calculate next watering date (last watered + watering frequency days)
    - Display visual indicator for plants needing water (current date >= next watering date)
    - Navigate to plant detail on tap
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 18.2 Write property test for garden plant display completeness
    - **Property 17: Garden Plant Display Completeness**
    - **Validates: Requirements 7.2**
  
  - [x] 18.3 Write property test for next watering date calculation
    - **Property 18: Next Watering Date Calculation**
    - **Validates: Requirements 7.3**
  
  - [x] 18.4 Write property test for care reminder notification scheduling
    - **Property 19: Care Reminder Notification Scheduling**
    - **Validates: Requirements 7.4**
  
  - [x] 18.5 Create garden plant detail view
    - Display full care instructions
    - Query Plant Database API to display enriched care information
    - Fall back to AI-provided data if API returns no results
    - Display "Mark as Watered" button
    - Display "Remove from Garden" button
    - Update last watered timestamp in SQLite on "Mark as Watered" tap
    - Schedule next care reminder notification
    - Prompt for confirmation on "Remove from Garden" tap
    - Delete plant from SQLite and cancel notifications on confirm
    - _Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11_
  
  - [x] 18.6 Write property test for mark as watered update
    - **Property 20: Mark as Watered Update**
    - **Validates: Requirements 7.8**
  
  - [x] 18.7 Write property test for plant removal cleanup
    - **Property 21: Plant Removal Cleanup**
    - **Validates: Requirements 7.11**
  
  - [x] 18.8 Write unit tests for my garden
    - Test plant display
    - Test watering indicator
    - Test mark as watered flow
    - Test removal flow
    - _Requirements: 7.1, 7.9, 7.10_

- [x] 19. Settings screen
  - [x] 19.1 Create SettingsScreen component
    - Display language selector with English, Arabic, French options
    - Highlight current language preference
    - Update language preference in AsyncStorage on change
    - Update all UI text immediately on language change (no restart required)
    - Apply RTL layout for Arabic
    - Display "Reset Healing Profile" button
    - Display app version information
    - Prompt for confirmation on reset tap
    - Clear all onboarding data from AsyncStorage on confirm
    - Navigate to language selection screen on confirm
    - _Requirements: 17.3, 17.4, 17.5, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10_
  
  - [x] 19.2 Write property test for language change immediate update
    - **Property 28: Language Change Immediate Update**
    - **Validates: Requirements 17.4, 18.4**
  
  - [x] 19.3 Write property test for profile reset data clearing
    - **Property 30: Profile Reset Data Clearing**
    - **Validates: Requirements 18.8**
  
  - [x] 19.4 Write unit tests for settings screen
    - Test language selector
    - Test RTL layout for Arabic
    - Test reset confirmation flow
    - _Requirements: 17.5, 18.5, 18.6, 18.7, 18.9_

- [x] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Offline mode support
  - [x] 21.1 Implement connectivity detection
    - Detect internet connection status
    - Display connectivity indicator when offline
    - Remove indicator when online
    - _Requirements: 16.1, 16.7_
  
  - [x] 21.2 Implement offline feature restrictions
    - Block AI analysis when offline with explanatory message
    - Allow My Garden access with locally stored data
    - Allow Healing Journal access with locally stored entries
    - Allow mood check-ins that save to SQLite
    - Display cached Plant Database data if available and not expired
    - _Requirements: 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [x] 21.3 Write property test for offline cache usage
    - **Property 24: Offline Cache Usage**
    - **Validates: Requirements 10.5, 16.6**
  
  - [x] 21.4 Write property test for offline garden access
    - **Property 25: Offline Garden Access**
    - **Validates: Requirements 16.3**
  
  - [x] 21.5 Write property test for offline journal access
    - **Property 26: Offline Journal Access**
    - **Validates: Requirements 16.4**
  
  - [x] 21.6 Write property test for offline mood check-in
    - **Property 27: Offline Mood Check-In**
    - **Validates: Requirements 16.5**
  
  - [x] 21.7 Write unit tests for offline mode
    - Test connectivity indicator
    - Test AI analysis blocking
    - Test offline feature access
    - _Requirements: 16.1, 16.2, 16.7_

- [x] 22. Error handling implementation
  - [x] 22.1 Implement comprehensive error handling
    - Add network error handling with user-friendly messages
    - Add API authentication error handling
    - Add database error handling with graceful degradation
    - Add file system error handling with placeholders
    - Add permission error handling with settings navigation
    - Add AI response parsing error handling with retry option
    - Add offline mode error handling
    - _Requirements: 9.8, 10.9, 10.10_
  
  - [x] 22.2 Write property test for database error handling
    - **Property 22: Database Error Handling**
    - **Validates: Requirements 9.8**
  
  - [x] 22.3 Write unit tests for error scenarios
    - Test network errors
    - Test API errors
    - Test file system errors
    - Test permission errors
    - _Requirements: 10.9, 10.10, 13.2, 15.5_

- [x] 23. Visual design system implementation
  - [x] 23.1 Apply visual design system
    - Apply color palette consistently (#2D6A4F, #74C69D, #F8F4E3, #FEFAE0)
    - Apply consistent spacing and typography
    - Use soft, rounded corners for cards and buttons
    - Use nature-inspired iconography
    - Provide visual feedback on touch for all interactive elements
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 23.2 Write unit tests for visual design
    - Test color palette application
    - Test touch feedback
    - _Requirements: 12.1, 12.5_

- [x] 24. Integration and final wiring
  - [x] 24.1 Wire all components together
    - Connect navigation flows
    - Connect storage module to all screens
    - Connect AI analysis module to camera and analysis screens
    - Connect plant database module to plant detail screens
    - Connect notification module to garden management
    - Connect i18n module to all screens
    - Connect image module to camera and journal screens
    - Ensure onboarding check on app launch
    - _Requirements: All_
  
  - [x] 24.2 Write integration tests
    - Test complete onboarding flow
    - Test room scan to garden flow
    - Test journal entry flow
    - Test garden management flow
    - _Requirements: All_
    - Test garden management flow
    - _Requirements: All_

- [x] 25. Documentation and build configuration
  - [x] 25.1 Create README documentation
    - Document setup instructions
    - Document build instructions for APK generation
    - Document environment variable configuration
    - Document testing instructions
    - _Requirements: 11.3, 11.4_
  
  - [x] 25.2 Verify build configuration
    - Verify eas.json is properly configured
    - Verify .env.example includes all required variables
    - Test APK build process
    - _Requirements: 11.1, 11.5_

- [x] 26. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with minimum 100 iterations
- All property tests include comment tags referencing design document properties
- Checkpoints ensure incremental validation at key milestones
- Implementation uses TypeScript with React Native Expo SDK 51
- All code should follow React Native and TypeScript best practices
- Error handling should be comprehensive with user-friendly messages
- Offline mode should gracefully degrade features while maintaining core functionality

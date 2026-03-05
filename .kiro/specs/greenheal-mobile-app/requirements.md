# Requirements Document

## Introduction

GreenHeal is a React Native Expo mobile application that helps users transform their living spaces into therapeutic environments using plants. The app combines AI-powered room analysis, plant therapy recommendations, mood tracking, and care management to support users in their healing journey through the proven health benefits of plants.

## Glossary

- **GreenHeal_App**: The React Native Expo mobile application system
- **User**: A person using the app to improve their wellbeing through plant therapy
- **Healing_Goal**: The specific health condition or wellness objective the User is addressing (Stress & Anxiety, Physical Recovery, Depression & Low Mood, Sleep Issues, or General Wellness)
- **Room_Photo**: An image captured by the User showing their living space
- **AI_Analysis_Engine**: The OpenAI GPT-4o Vision API integration that analyzes room photos and generates plant recommendations
- **Plant_Recommendation**: A suggested plant with placement guidance, healing benefits, care instructions, watering frequency, and cost information
- **Healing_Journal**: A personal log where Users track mood, notes, and progress photos over time
- **My_Garden**: A collection of plants the User has saved with care reminders
- **Mood_Score**: A numerical value from 1 to 5 representing the User's emotional state
- **Care_Reminder**: A notification alerting the User to water or care for their plants
- **Onboarding_Data**: User responses to initial questions stored in AsyncStorage
- **Plant_Database**: The Perenual plant API providing plant information and enriched care instructions
- **Local_Storage**: SQLite database for journal entries and garden data
- **Watering_Frequency**: The number of days between watering sessions for a specific plant, provided by the AI_Analysis_Engine
- **Connectivity_Status**: An indicator showing whether the device has internet connection
- **Language_Preference**: The User's selected language (English, Arabic, or French) for the app interface

## Requirements

### Requirement 1: User Onboarding

**User Story:** As a new user, I want to answer questions about my healing needs and budget, so that the app can provide personalized plant recommendations.

#### Acceptance Criteria

1. WHEN the User opens the GreenHeal_App for the first time, THE GreenHeal_App SHALL display a language selection screen
2. THE GreenHeal_App SHALL detect the device language and pre-select it on the language selection screen if supported
3. IF the device language is not supported, THEN THE GreenHeal_App SHALL pre-select English
4. THE GreenHeal_App SHALL present language options: English, Arabic, and French
5. WHEN the User selects a language, THE GreenHeal_App SHALL store the Language_Preference in AsyncStorage
6. WHEN the User selects a language, THE GreenHeal_App SHALL proceed to the onboarding screen
7. THE GreenHeal_App SHALL present the question "What are you healing from?" with options: Stress & Anxiety, Physical Recovery, Depression & Low Mood, Sleep Issues, General Wellness
8. THE GreenHeal_App SHALL present the question "What's your budget for plants?" with options: Under 10 TND, 10–30 TND, 30+ TND, I already have plants
9. THE GreenHeal_App SHALL provide an optional image upload feature asking "Upload photos of plants you already own"
10. WHEN the User selects the image upload option, THE GreenHeal_App SHALL open expo-image-picker with multiple image selection enabled
11. WHEN the User completes all required onboarding questions, THE GreenHeal_App SHALL store the responses in AsyncStorage
12. WHEN onboarding is complete, THE GreenHeal_App SHALL navigate to the Home Screen

### Requirement 2: Home Screen Display

**User Story:** As a user, I want a calming home screen with quick access to key features, so that I can easily navigate the app and stay engaged with my healing journey.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL display a Home Screen with colors from the palette: #2D6A4F, #74C69D, #F8F4E3, #FEFAE0
2. THE GreenHeal_App SHALL display a "Scan My Room" button on the Home Screen
3. THE GreenHeal_App SHALL display a "My Healing Journey" button on the Home Screen
4. THE GreenHeal_App SHALL display a daily rotating plant healing tip on the Home Screen
5. THE GreenHeal_App SHALL display a mood check-in widget with emoji scale from 1 to 5 on the Home Screen
6. WHEN the User selects an emoji on the mood widget, THE GreenHeal_App SHALL record the Mood_Score with timestamp

### Requirement 3: Room Photography

**User Story:** As a user, I want to photograph my room, so that I can receive personalized plant placement recommendations.

#### Acceptance Criteria

1. WHEN the User taps "Scan My Room", THE GreenHeal_App SHALL open the device camera using expo-camera
2. WHEN the User captures a photo, THE GreenHeal_App SHALL display the captured Room_Photo with "Use this photo" and "Retake" options
3. WHEN the User selects "Retake", THE GreenHeal_App SHALL reopen the camera
4. WHEN the User selects "Use this photo", THE GreenHeal_App SHALL navigate to the AI Healing Analysis Screen with the Room_Photo

### Requirement 4: AI-Powered Plant Recommendations

**User Story:** As a user, I want AI-generated plant recommendations based on my room and healing goals, so that I can choose plants that will help my specific condition.

#### Acceptance Criteria

1. WHEN the User submits a Room_Photo, THE AI_Analysis_Engine SHALL send the photo to OpenAI GPT-4o Vision API
2. THE AI_Analysis_Engine SHALL include the User's Healing_Goal and budget in the API request
3. THE AI_Analysis_Engine SHALL include the User's Language_Preference in the system prompt
4. THE AI_Analysis_Engine SHALL use the system prompt: "You are a therapeutic interior designer and plant therapist. Respond in [language]. Analyze this room photo. Consider the lighting, available surfaces, room type, and empty spaces. The user is healing from [condition]. Suggest 3 specific healing plants tailored to their condition, each with: plant name, exact placement in the room, the specific healing benefit for their condition (cite real science briefly), care difficulty (easy/medium), estimated cost, watering frequency in days, and an encouraging message. Keep the tone warm, supportive, and hopeful."
5. WHEN the AI_Analysis_Engine receives a response, THE GreenHeal_App SHALL parse exactly 3 Plant_Recommendations including watering frequency
6. THE GreenHeal_App SHALL display each Plant_Recommendation as a card with plant name, placement suggestion, healing benefit summary, care difficulty, and estimated cost
7. THE GreenHeal_App SHALL limit AI analysis requests to 5 per day per User
8. WHEN the User reaches the daily limit, THE GreenHeal_App SHALL display a message indicating the limit has been reached and when it will reset
9. IF the API request fails, THEN THE GreenHeal_App SHALL display an error message and offer to retry

### Requirement 5: Plant Detail Information

**User Story:** As a user, I want detailed information about each recommended plant, so that I can make informed decisions and learn how to care for it.

#### Acceptance Criteria

1. WHEN the User taps a Plant_Recommendation card, THE GreenHeal_App SHALL display the Plant Detail Screen
2. THE GreenHeal_App SHALL display full healing benefits with scientific backing on the Plant Detail Screen
3. THE GreenHeal_App SHALL display step-by-step placement guidance on the Plant Detail Screen
4. THE GreenHeal_App SHALL display care instructions including water, light, and soil requirements on the Plant Detail Screen
5. WHEN the Plant Detail Screen loads, THE GreenHeal_App SHALL query the Plant_Database API to enrich care instructions with additional plant information
6. IF the Plant_Database API returns no results, THE GreenHeal_App SHALL display only the information provided by the AI_Analysis_Engine
7. THE GreenHeal_App SHALL display an "Add to My Garden" button on the Plant Detail Screen
8. THE GreenHeal_App SHALL display a "Find it Near Me" button on the Plant Detail Screen
9. WHEN the User taps "Find it Near Me", THE GreenHeal_App SHALL open a Google Maps search for the plant name and nearby plant stores
10. WHEN the User taps "Add to My Garden", THE GreenHeal_App SHALL save the plant to Local_Storage in the My_Garden collection

### Requirement 6: Healing Journal

**User Story:** As a user, I want to track my mood and progress over time, so that I can see how plants are affecting my wellbeing.

#### Acceptance Criteria

1. WHEN the User taps "My Healing Journey", THE GreenHeal_App SHALL display the Healing_Journal screen
2. THE GreenHeal_App SHALL provide a mood entry interface with a scale from 1 to 5
3. THE GreenHeal_App SHALL provide a text input field for journal notes
4. THE GreenHeal_App SHALL provide an option to add a photo to journal entries
5. WHEN the User selects the photo option, THE GreenHeal_App SHALL present choices to capture a new photo with the camera or select from the device gallery
6. WHEN the User saves a journal entry, THE GreenHeal_App SHALL store the Mood_Score, notes, timestamp, and optional photo in Local_Storage using expo-sqlite
7. THE GreenHeal_App SHALL display a timeline view of all journal entries sorted by date
8. FOR ALL journal entries, THE GreenHeal_App SHALL display the date, Mood_Score, notes preview, and thumbnail if a photo exists
9. WHEN the User taps a journal entry, THE GreenHeal_App SHALL display the full entry with an option to delete
10. WHEN the User selects delete on a journal entry, THE GreenHeal_App SHALL prompt for confirmation before deletion
11. WHEN the User confirms deletion, THE GreenHeal_App SHALL remove the journal entry from Local_Storage and delete any associated photo files

### Requirement 7: Plant Care Management

**User Story:** As a user, I want to manage my saved plants and receive care reminders, so that I can keep my plants healthy.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL display a My_Garden screen showing all saved plants
2. FOR ALL plants in My_Garden, THE GreenHeal_App SHALL display the plant name, care difficulty, and last watered date
3. THE GreenHeal_App SHALL calculate the next watering date based on the watering frequency provided by the AI_Analysis_Engine
4. WHEN a plant needs watering, THE GreenHeal_App SHALL send a Care_Reminder notification using expo-notifications
5. WHEN the User taps a plant in My_Garden, THE GreenHeal_App SHALL display full care instructions
6. WHEN the User taps a plant in My_Garden, THE GreenHeal_App SHALL query the Plant_Database API to display enriched care information
7. IF the Plant_Database API returns no results, THE GreenHeal_App SHALL display only the information provided by the AI_Analysis_Engine
8. THE GreenHeal_App SHALL provide a "Mark as Watered" button that updates the last watered timestamp in Local_Storage
9. THE GreenHeal_App SHALL provide a "Remove from Garden" button on the plant detail view
10. WHEN the User taps "Remove from Garden", THE GreenHeal_App SHALL prompt for confirmation before removal
11. WHEN the User confirms removal, THE GreenHeal_App SHALL delete the plant from My_Garden in Local_Storage and cancel any associated Care_Reminder notifications

### Requirement 8: Navigation Structure

**User Story:** As a user, I want intuitive navigation between app sections, so that I can easily access all features.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL implement React Navigation with stack and bottom tab navigators
2. THE GreenHeal_App SHALL display bottom tabs for: Home, My Garden, Healing Journal, and Settings
3. WHEN the User is on the Onboarding Screen, THE GreenHeal_App SHALL hide bottom tab navigation
4. WHEN the User is on the Language Selection Screen, THE GreenHeal_App SHALL hide bottom tab navigation
5. WHEN the User completes onboarding, THE GreenHeal_App SHALL display bottom tab navigation
6. THE GreenHeal_App SHALL use stack navigation for Room Scan, AI Analysis, and Plant Detail screens

### Requirement 9: Data Persistence

**User Story:** As a user, I want my data saved locally, so that I can access my information without an internet connection.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL store Onboarding_Data in AsyncStorage
2. THE GreenHeal_App SHALL store Language_Preference in AsyncStorage
3. THE GreenHeal_App SHALL store journal entries in Local_Storage using expo-sqlite
4. THE GreenHeal_App SHALL store My_Garden plant data in Local_Storage using expo-sqlite
5. THE GreenHeal_App SHALL store mood check-in data in Local_Storage using expo-sqlite
6. THE GreenHeal_App SHALL store the daily AI request count and reset timestamp in AsyncStorage
7. WHEN the GreenHeal_App launches, THE GreenHeal_App SHALL retrieve Onboarding_Data from AsyncStorage to determine if onboarding is complete
8. FOR ALL database operations, THE GreenHeal_App SHALL handle errors gracefully and display user-friendly error messages

### Requirement 10: API Integration

**User Story:** As a user, I want the app to leverage external APIs for plant recommendations and information, so that I receive accurate and comprehensive guidance.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL integrate with OpenAI GPT-4o Vision API for room analysis
2. THE GreenHeal_App SHALL integrate with Perenual Plant_Database API for plant information
3. THE GreenHeal_App SHALL query the Plant_Database API on the Plant Detail Screen to enrich care instructions
4. THE GreenHeal_App SHALL cache Plant_Database API responses in Local_Storage for 7 days
5. WHEN displaying plant care instructions offline, THE GreenHeal_App SHALL use cached Plant_Database responses if available
6. THE GreenHeal_App SHALL query the Plant_Database API in My_Garden when viewing individual plant details
7. THE GreenHeal_App SHALL use Axios for all HTTP requests
8. THE GreenHeal_App SHALL load API keys from a .env file
9. WHEN an API request fails due to network issues, THEN THE GreenHeal_App SHALL display a user-friendly error message
10. WHEN an API request fails due to authentication, THEN THE GreenHeal_App SHALL log the error and prompt the user to check configuration

### Requirement 11: Build Configuration

**User Story:** As a developer, I want proper build configuration, so that I can generate APK files for distribution.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL include an eas.json file configured for APK builds
2. THE GreenHeal_App SHALL use Expo SDK version 51
3. THE GreenHeal_App SHALL include a README file with setup instructions
4. THE GreenHeal_App SHALL include a README file with build instructions
5. THE GreenHeal_App SHALL include a .env.example file showing required environment variables

### Requirement 12: Visual Design System

**User Story:** As a user, I want a calming and cohesive visual experience, so that the app itself contributes to my healing journey.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL use the primary color palette: #2D6A4F (dark green), #74C69D (medium green), #F8F4E3 (warm beige), #FEFAE0 (light cream)
2. THE GreenHeal_App SHALL apply consistent spacing and typography across all screens
3. THE GreenHeal_App SHALL use soft, rounded corners for cards and buttons
4. THE GreenHeal_App SHALL use nature-inspired iconography where applicable
5. FOR ALL interactive elements, THE GreenHeal_App SHALL provide visual feedback on touch

### Requirement 13: Camera Permissions

**User Story:** As a user, I want to grant camera permissions, so that I can photograph my room and plants.

#### Acceptance Criteria

1. WHEN the User first attempts to use the camera, THE GreenHeal_App SHALL request camera permissions
2. IF camera permissions are denied, THEN THE GreenHeal_App SHALL display a message explaining why camera access is needed
3. IF camera permissions are denied, THEN THE GreenHeal_App SHALL provide a button to open device settings
4. WHEN camera permissions are granted, THE GreenHeal_App SHALL open the camera interface

### Requirement 14: Notification Permissions

**User Story:** As a user, I want to grant notification permissions, so that I can receive plant care reminders.

#### Acceptance Criteria

1. WHEN the User first adds a plant to My_Garden, THE GreenHeal_App SHALL request notification permissions
2. IF notification permissions are denied, THEN THE GreenHeal_App SHALL continue functioning without Care_Reminder notifications
3. WHEN notification permissions are granted, THE GreenHeal_App SHALL schedule Care_Reminder notifications based on plant watering schedules
4. THE GreenHeal_App SHALL register notification channels for Android devices

### Requirement 15: Image Storage

**User Story:** As a user, I want my room photos and plant photos stored locally, so that I can view my progress over time.

#### Acceptance Criteria

1. WHEN the User captures a Room_Photo, THE GreenHeal_App SHALL save the image using expo-file-system
2. THE GreenHeal_App SHALL store image file paths in Local_Storage associated with journal entries
3. WHEN the User views a journal entry with a photo, THE GreenHeal_App SHALL load and display the image from the stored file path
4. THE GreenHeal_App SHALL compress images to reduce storage space while maintaining visual quality
5. IF an image file is missing, THEN THE GreenHeal_App SHALL display a placeholder and log the error

### Requirement 16: Offline Mode Support

**User Story:** As a user, I want to know what features are available offline, so that I can continue using the app without internet connectivity.

#### Acceptance Criteria

1. WHEN the GreenHeal_App detects no internet connection, THE GreenHeal_App SHALL display a connectivity status indicator
2. WHEN the User attempts to access the AI Analysis Screen without internet, THE GreenHeal_App SHALL display a message indicating that internet connection is required for AI analysis
3. WHILE offline, THE GreenHeal_App SHALL allow access to My_Garden with locally stored plant data
4. WHILE offline, THE GreenHeal_App SHALL allow access to Healing_Journal with locally stored entries
5. WHILE offline, THE GreenHeal_App SHALL allow mood check-ins that are saved to Local_Storage
6. WHILE offline, THE GreenHeal_App SHALL display cached Plant_Database responses if available
7. WHEN internet connectivity is restored, THE GreenHeal_App SHALL remove the connectivity status indicator

### Requirement 17: Multi-Language Support

**User Story:** As a user in Tunisia, I want to use the app in my preferred language, so that I can fully understand and benefit from the healing guidance.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL support English, Arabic, and French languages
2. THE GreenHeal_App SHALL use i18next for internationalization
3. THE GreenHeal_App SHALL provide a language selector in the app settings
4. WHEN the User changes the language, THE GreenHeal_App SHALL update all UI text immediately without requiring an app restart
5. WHEN the selected language is Arabic, THE GreenHeal_App SHALL apply RTL layout direction across all screens
6. THE GreenHeal_App SHALL send the selected language to the AI_Analysis_Engine to receive plant recommendations in the User's language
7. IF the AI response is not in the requested language, THE GreenHeal_App SHALL display the response as received without translation
8. FOR ALL static content, THE GreenHeal_App SHALL display translations in the selected language including onboarding questions, button labels, and error messages



### Requirement 18: Settings Screen

**User Story:** As a user, I want to access app settings, so that I can customize my experience and manage preferences.

#### Acceptance Criteria

1. THE GreenHeal_App SHALL provide a Settings screen accessible from the app navigation
2. THE GreenHeal_App SHALL display a language selector on the Settings screen with options: English, Arabic, and French
3. WHEN the User changes the language on the Settings screen, THE GreenHeal_App SHALL update the Language_Preference in AsyncStorage
4. WHEN the User changes the language on the Settings screen, THE GreenHeal_App SHALL update all UI text immediately without requiring an app restart
5. THE GreenHeal_App SHALL display the current Language_Preference as the selected option in the language selector
6. THE GreenHeal_App SHALL display a "Reset Healing Profile" button on the Settings screen
7. WHEN the User taps "Reset Healing Profile", THE GreenHeal_App SHALL prompt for confirmation before resetting
8. WHEN the User confirms reset, THE GreenHeal_App SHALL clear all Onboarding_Data from AsyncStorage
9. WHEN the User confirms reset, THE GreenHeal_App SHALL navigate to the language selection screen
10. THE GreenHeal_App SHALL display app version information on the Settings screen

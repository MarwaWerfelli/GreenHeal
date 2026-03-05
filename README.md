# GreenHeal 🌿

A React Native Expo mobile app that helps users transform their living spaces into therapeutic environments using the proven health benefits of plants.

## Features

- **Personalized Onboarding**: Understand user's healing goals, budget, and existing plants
- **Room Scanning**: Use camera to capture room photos
- **AI-Powered Analysis**: GPT-4o Vision analyzes rooms and suggests healing plants
- **Healing Journal**: Track mood and progress over time
- **My Garden**: Manage saved plants with care reminders
- **Plant Care Notifications**: Get reminders to water your plants

## Tech Stack

- React Native with Expo SDK 51
- expo-camera, expo-image-picker, expo-file-system, expo-notifications
- expo-sqlite for local data storage
- AsyncStorage for user preferences
- Axios for API calls
- React Navigation (Stack + Bottom Tabs)
- OpenAI GPT-4o Vision API

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed: `npm install -g expo-cli`
- OpenAI API key (get from https://platform.openai.com/api-keys)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd greenheal
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Add your API keys to `.env`
```
OPENAI_API_KEY=your_openai_api_key_here
PERENUAL_API_KEY=your_perenual_api_key_here
```

### Running the App

#### Development Mode

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

#### Testing on Physical Device

1. Install Expo Go app on your phone
2. Scan the QR code from the terminal

### Building APK

1. Install EAS CLI
```bash
npm install -g eas-cli
```

2. Login to Expo
```bash
eas login
```

3. Configure the project
```bash
eas build:configure
```

4. Build APK for Android
```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

5. Download the APK from the Expo dashboard or the link provided in terminal

## Project Structure

```
greenheal/
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── RoomScanScreen.js
│   │   ├── AnalysisScreen.js
│   │   ├── PlantDetailScreen.js
│   │   ├── JournalScreen.js
│   │   └── MyGardenScreen.js
│   ├── services/
│   │   └── openai.js
│   └── utils/
│       ├── database.js
│       └── notifications.js
├── App.js
├── app.json
├── eas.json
├── package.json
└── README.md
```

## Color Palette

- Primary Green: `#2D6A4F`
- Light Green: `#74C69D`
- Cream: `#F8F4E3`
- Light Cream: `#FEFAE0`

## API Requirements

### OpenAI API
- Model: GPT-4o (with vision capabilities)
- Used for room analysis and plant recommendations
- Cost: ~$0.01-0.03 per image analysis

## Permissions Required

- Camera (for room scanning)
- Photo Library (for uploading existing plant photos)
- Notifications (for plant care reminders)

## Troubleshooting

### Camera not working
- Ensure camera permissions are granted in device settings
- Check that expo-camera is properly installed

### API errors
- Verify your OpenAI API key is correct in `.env`
- Check that you have sufficient API credits
- Ensure your API key has access to GPT-4o model

### Build errors
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `npm install expo@latest`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

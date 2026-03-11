# GreenHeal Mobile App

GreenHeal is a plant-based healing companion mobile app built with React Native and Expo. The app helps users discover healing plants for their living spaces through AI-powered room analysis, manage their plant garden, and track their healing journey.

## Features

- 🌍 **Multi-language Support**: English, Arabic (RTL), and French
- 🤖 **AI Room Analysis**: Scan your room and get personalized plant recommendations using GPT-4o Vision
- 🌱 **My Garden**: Track your plants with watering reminders and care instructions
- 📔 **Healing Journal**: Document your healing journey with mood tracking and photos
- 📡 **Offline Mode**: Access your garden and journal even without internet
- 🔔 **Smart Notifications**: Get reminders when your plants need watering
- 🎨 **Beautiful UI**: Nature-inspired design with calming colors

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- For Android: Android Studio or Expo Go app
- For iOS: Xcode (macOS only) or Expo Go app

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd greenheal
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

Note: The `--legacy-peer-deps` flag is required due to React 19 peer dependency conflicts.

### 3. Configure Backend Access

GreenHeal now keeps provider API keys on the **backend only**. Do **not** put OpenAI, Perenual, or Stability keys in `app.json`, Expo `extra`, or the mobile client.

#### Backend setup

Create a backend env file:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and add your backend-only secrets:

```env
OPENAI_API_KEY=your-openai-api-key-here
PERENUAL_API_KEY=your-perenual-api-key-here
STABILITY_API_KEY=your-stability-api-key-here
```

#### Mobile app setup

The mobile app only needs `BACKEND_URL`, which is already exposed in `app.json`.

- default deployed backend: `https://greenhealbackend.vercel.app`
- local Android emulator backend: `http://10.0.2.2:3000`
- local physical-device backend: `http://YOUR_LAN_IP:3000`

If you want to test against a different backend, update `expo.extra.BACKEND_URL` in `app.json`.

### 4. Start the Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your physical device

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

Run specific test file:

```bash
npm test -- __tests__/ai.test.ts
```

## Building for Production

### Android APK

1. Configure EAS Build (first time only):

```bash
npm install -g eas-cli
eas login
eas build:configure
```

2. Build APK:

```bash
eas build --platform android --profile preview
```

The APK will be available for download from the Expo dashboard.

### iOS (macOS only)

```bash
eas build --platform ios --profile preview
```

## Project Structure

```
greenheal/
├── src/
│   ├── components/       # Reusable UI components
│   ├── i18n/            # Internationalization
│   │   └── locales/     # Translation files (en, ar, fr)
│   ├── modules/         # Core functionality modules
│   │   ├── ai.ts        # AI analysis with OpenAI
│   │   ├── connectivity.ts  # Network connectivity
│   │   ├── image.ts     # Image capture and processing
│   │   ├── notifications.ts # Push notifications
│   │   ├── plantDatabase.ts # Perenual API integration
│   │   └── storage.ts   # AsyncStorage & SQLite
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # App screens
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions and constants
├── __tests__/           # Jest test files
├── assets/              # Images and static assets
├── .env.example         # Environment variables template
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
└── package.json        # Dependencies and scripts
```

## Key Technologies

- **React Native 0.81.5**: Mobile app framework
- **Expo SDK 54**: Development platform
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **i18next**: Internationalization
- **SQLite**: Local database for offline storage
- **AsyncStorage**: Key-value storage
- **OpenAI GPT-4o Vision**: AI-powered room analysis
- **Perenual API**: Plant database and care information
- **Jest & React Native Testing Library**: Testing framework
- **fast-check**: Property-based testing

## Features in Detail

### AI Room Analysis

1. Take a photo of your room
2. AI analyzes the space considering lighting, humidity, and your healing goals
3. Get 3 personalized plant recommendations with:
   - Healing benefits
   - Placement guidance
   - Care difficulty
   - Estimated cost
   - Watering frequency

### My Garden

- View all your saved plants in a grid layout
- Visual indicators for plants needing water
- Mark plants as watered
- Get enriched care instructions from Perenual API
- Remove plants from your garden
- Automatic watering reminders

### Healing Journal

- Track your mood on a 1-5 scale with emojis
- Write notes about your day and healing journey
- Attach photos to journal entries
- View timeline of all entries
- Delete entries with confirmation

### Settings

- Change app language (English, Arabic, French)
- RTL support for Arabic
- Reset healing profile
- View app version

### Offline Mode

- Offline indicator when no internet connection
- AI analysis blocked with explanatory message
- Full access to My Garden (SQLite data)
- Full access to Healing Journal (SQLite data)
- Mood check-ins work offline
- Cached plant data displayed when available

## Troubleshooting

### Metro Bundler Issues

If you encounter Metro bundler errors:

```bash
npm start -- --reset-cache
```

### Android Build Issues

Clear build cache:

```bash
cd android
./gradlew clean
cd ..
```

### iOS Build Issues (macOS)

```bash
cd ios
pod install
cd ..
```

### Test Failures

Clear Jest cache:

```bash
npm test -- --clearCache
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## Acknowledgments

- OpenAI for GPT-4o Vision API
- Perenual for plant database API
- Expo team for the amazing development platform
- React Native community for excellent libraries

---

Built with ❤️ for plant lovers and healing seekers

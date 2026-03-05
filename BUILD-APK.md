# Build APK for GreenHeal

Since we're having connectivity issues with Expo Go, let's build a standalone APK.

## Option 1: Build with EAS (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure the project:
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

5. Wait for build to complete (~10-15 minutes)
6. Download the APK from the link provided
7. Install on your phone

## Option 2: Local Build with Expo

```bash
npx expo export --platform android
```

Then use Android Studio to build the APK.

## Option 3: Use Expo Development Build

This creates a custom version of Expo Go for your app:

```bash
eas build --profile development --platform android
```

This will work like Expo Go but specifically for your app, avoiding connectivity issues.

---

## Current Status

The app code is working fine. The issue is network connectivity between your computer and phone preventing Expo Go from downloading the bundle.

Building an APK solves this completely.

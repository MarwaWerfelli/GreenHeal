# Update Icon and Build - Quick Guide

## What Just Happened

✅ Ran `npx expo prebuild --clean` - This regenerated all Android native files with your new icon from `assets/icon.png` and `assets/adaptive-icon.png`

✅ New icon files were created in all Android mipmap folders with timestamp: 8:32 PM (just now!)

## Why You Still See Old Icon

You're currently using **Expo Go** which always shows the Expo Go icon, not your custom icon. This is normal for development.

To see your actual custom icon, you need to install a **standalone build** of your app.

## How to See the New Icon

### Option 1: Build APK with EAS (Recommended - Easiest)

```bash
# Build a preview APK
eas build --platform android --profile preview
```

This will:
1. Build your app with the new icon
2. Give you a download link
3. You install the APK on your phone
4. You'll see the new icon on your home screen!

### Option 2: Build Locally (Requires Java/Android Studio Setup)

If you have Java and Android Studio properly configured:

```bash
# Build and install on connected device/emulator
npx expo run:android
```

**Note:** This failed because Java is not set up. You'd need to:
1. Install Java JDK 17
2. Set JAVA_HOME environment variable
3. Install Android Studio
4. Configure Android SDK

This is more complex, so I recommend Option 1 (EAS build).

## Verify Icon Files

Your new icon has been generated in these locations:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

All with timestamp: **March 8, 2026 8:32 PM** (just regenerated!)

## Quick Command to Build

```bash
# Make sure you're logged in to EAS
eas login

# Build preview APK
eas build --platform android --profile preview
```

Wait 10-15 minutes for the build to complete, then download and install the APK.

## Alternative: Use Development Build

If you want to develop with the custom icon visible:

```bash
# Build development client (one-time)
eas build --platform android --profile development

# Then run with:
npx expo start --dev-client
```

## Summary

✅ Icon files updated in assets folder
✅ Android native files regenerated with new icon
✅ Ready to build

**Next step:** Run `eas build --platform android --profile preview` to create an APK with your new icon!

The icon won't show in Expo Go - you need to build and install the APK to see it.

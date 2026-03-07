# Building GreenHeal APK - Step by Step

## Prerequisites Check

Your project is already configured with:
- ✅ EAS project ID: `3efdec26-ca09-420c-a6d7-d2cf3f924762`
- ✅ Package name: `com.greenheal.app`
- ✅ eas.json configured for APK builds
- ✅ All permissions configured

## Build Steps

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Use your Expo account credentials (marwawerfellis-organization).

### Step 3: Start the Build

For a preview APK (recommended for testing):

```bash
eas build --platform android --profile preview
```

Or for production APK:

```bash
eas build --platform android --profile production
```

### Step 4: Wait for Build

The build process will:
1. Upload your project to Expo servers
2. Build the APK (takes 10-20 minutes)
3. Provide a download link when complete

### Step 5: Download and Install

1. You'll get a URL like: `https://expo.dev/artifacts/...`
2. Open this URL on your Android phone
3. Download the APK
4. Install it (you may need to allow installation from unknown sources)

## What to Expect

During the build, you'll see:
- Project upload progress
- Build queue status
- Build logs (optional to view)
- Download link when complete

## Environment Variables

⚠️ **IMPORTANT**: Your `.env` file with API keys is NOT included in the build by default.

You have two options:

### Option A: Add secrets to EAS (Recommended)

```bash
eas secret:create --scope project --name OPENAI_API_KEY --value "your-key-here"
eas secret:create --scope project --name PERENUAL_API_KEY --value "your-key-here"
```

### Option B: Use app.json extra config

Add to `app.json`:
```json
"extra": {
  "OPENAI_API_KEY": "your-key-here",
  "PERENUAL_API_KEY": "your-key-here"
}
```

Then access in code with:
```typescript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
```

## Troubleshooting

### Build fails with "No credentials"
Run: `eas credentials`

### Build fails with "Invalid package name"
Check `app.json` android.package is set correctly

### Can't install APK on phone
Enable "Install from unknown sources" in Android settings

## After Installation

1. Open GreenHeal app
2. Grant camera and notification permissions
3. Complete onboarding
4. Test all features including notifications!

## Build Status

Check your build status at:
https://expo.dev/accounts/marwawerfellis-organization/projects/greenheal/builds

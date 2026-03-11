# Building GreenHeal APK - Step by Step

## Prerequisites Check

Your project is already configured with:
- ✅ EAS project ID: `1a0cc7a9-b380-41f8-96d1-9e1205873bec`
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

Use your Expo account credentials for the current project owner.

### Step 3: Verify Backend Configuration

Before building, make sure the backend that the app will call is ready:

- backend has `OPENAI_API_KEY`
- backend has `PERENUAL_API_KEY`
- backend has `STABILITY_API_KEY`
- `app.json` `expo.extra.BACKEND_URL` points to that backend

### Step 4: Start the Build

For a preview APK (recommended for testing):

```bash
eas build --platform android --profile preview
```

Or for production APK:

```bash
eas build --platform android --profile production
```

### Step 5: Wait for Build

The build process will:
1. Upload your project to Expo servers
2. Build the APK (takes 10-20 minutes)
3. Provide a download link when complete

### Step 6: Download and Install

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

⚠️ **IMPORTANT**: Provider API keys are backend-only.

Do **not** add `OPENAI_API_KEY`, `PERENUAL_API_KEY`, or `STABILITY_API_KEY` to the mobile build.

The mobile app only needs `BACKEND_URL` in `app.json`:

```json
"extra": {
  "BACKEND_URL": "https://greenhealbackend.vercel.app"
}
```

Configure provider keys on the backend itself via `backend/.env` or your hosting provider's environment-variable dashboard.

## Troubleshooting

### Build fails with "No credentials"
Run: `eas credentials`

### Build fails with authentication error
Run: `eas login`

### APK installs but AI features fail
Check the backend environment variables and confirm `BACKEND_URL` points to the correct deployed backend

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
https://expo.dev/accounts/marwata/projects/greenheal-new/builds

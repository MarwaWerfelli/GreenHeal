# Fix: java.lang.String cannot be cast to java.lang.Boolean

## The Problem

This error occurs when AsyncStorage has corrupted or incompatible data from a previous app version. The app tries to read data but gets the wrong type.

## Solution Applied

I've added automatic error recovery to the app. If it detects corrupted storage data, it will:
1. Clear the corrupted data automatically
2. Start fresh with the language selection screen
3. Log a warning in the console

## How to Test

### Option 1: Let the App Fix Itself (Recommended)
1. Stop Metro bundler (Ctrl+C)
2. Run: `npm start -- --clear`
3. Scan QR code in Expo Go
4. The app should automatically detect and clear corrupted data
5. You'll start at the language selection screen

### Option 2: Manual Clear (If Option 1 Doesn't Work)
1. **Uninstall Expo Go** from your phone
2. **Reinstall Expo Go** from Play Store
3. Run: `npm start -- --clear`
4. Scan QR code
5. Fresh start with no corrupted data

### Option 3: Clear App Data in Expo Go
1. Open Expo Go app
2. Shake your phone to open developer menu
3. Tap "Clear AsyncStorage"
4. Reload the app

## What Changed

Updated `src/navigation/AppNavigator.tsx` to:
- Wrap storage reads in try-catch
- Automatically clear corrupted data
- Continue app initialization even if storage is corrupted
- Log warnings instead of crashing

## Why This Happened

This error typically occurs when:
- App structure changed between versions
- AsyncStorage has data from old app version
- Data types changed in the code
- Storage got corrupted during development

## Prevention

The app now handles this automatically, so it won't crash even if storage is corrupted.

---

**Try Option 1 first** - the app should fix itself automatically now!

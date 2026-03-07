# Downgrade to Expo SDK 51 (Stable)

## Why Downgrade?

Expo SDK 54 with React 19 has compatibility issues in Expo Go, causing the "java.lang.String cannot be cast to java.lang.Boolean" error. SDK 51 is much more stable and widely tested.

## Downgrade Steps

### 1. Update package.json

Replace the dependencies section with SDK 51 versions:

```bash
npm install --legacy-peer-deps \
  expo@~51.0.0 \
  react@18.2.0 \
  react-native@0.74.5 \
  expo-camera@~15.0.16 \
  expo-constants@~16.0.2 \
  expo-file-system@~17.0.1 \
  expo-image-manipulator@~12.0.5 \
  expo-image-picker@~15.0.7 \
  expo-localization@~15.0.3 \
  expo-sqlite@~14.0.6 \
  expo-status-bar@~1.12.1 \
  @expo/metro-runtime@~3.2.3
```

### 2. Update app.json

Change SDK version:

```json
{
  "expo": {
    "sdkVersion": "51.0.0",
    ...
  }
}
```

### 3. Clean and Reinstall

```bash
# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps

# Clear Metro cache
npm start -- --clear
```

### 4. Test

Scan QR code with Expo Go. The app should work without the cast error!

## Alternative: Use Expo SDK 52 (Middle Ground)

If you want newer features but more stability than SDK 54:

```bash
npm install --legacy-peer-deps \
  expo@~52.0.0 \
  react@18.3.1 \
  react-native@0.76.5
```

## Why This Happens

- Expo SDK 54 is very new (released recently)
- React 19 is also very new
- Expo Go hasn't been fully updated for all SDK 54 + React 19 edge cases
- SDK 51 with React 18 is battle-tested and stable

## Recommendation

**For testing in Expo Go**: Use SDK 51 (most stable)
**For production APK build**: SDK 54 is fine (you're not using Expo Go)

---

Would you like me to create a script to automate the downgrade?

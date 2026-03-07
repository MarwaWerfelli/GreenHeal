@echo off
echo ========================================
echo Downgrading to Expo SDK 51 (Stable)
echo ========================================
echo.
echo This will:
echo - Uninstall current packages
echo - Install Expo SDK 51 with React 18
echo - Clear all caches
echo.
pause
echo.

echo Step 1: Removing node_modules...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 3: Installing Expo SDK 51...
call npm install --legacy-peer-deps expo@~51.0.0 react@18.2.0 react-native@0.74.5 react-dom@18.2.0

echo.
echo Step 4: Installing Expo packages...
call npm install --legacy-peer-deps expo-camera@~15.0.16 expo-constants@~16.0.2 expo-file-system@~17.0.1 expo-image-manipulator@~12.0.5 expo-image-picker@~15.0.7 expo-localization@~15.0.3 expo-sqlite@~14.0.6 expo-status-bar@~1.12.1

echo.
echo Step 5: Installing other dependencies...
call npm install --legacy-peer-deps @expo/metro-runtime@~3.2.3 @react-native-async-storage/async-storage@^1.23.1 @react-native-community/netinfo@^11.3.1 @react-navigation/bottom-tabs@^6.5.20 @react-navigation/native@^6.1.17 @react-navigation/stack@^6.3.29 axios@^1.7.2 i18next@^23.11.5 react-i18next@^14.1.2 react-native-gesture-handler@~2.16.1 react-native-safe-area-context@4.10.1 react-native-screens@3.31.1 react-native-web@~0.19.10

echo.
echo ========================================
echo Downgrade Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update app.json to remove sdkVersion (SDK 51 doesn't need it)
echo 2. Run: npm start -- --clear
echo 3. Scan QR code with Expo Go
echo.
pause

@echo off
echo ========================================
echo Building GreenHeal APK
echo ========================================
echo.
echo This will:
echo 1. Login to Expo (if needed)
echo 2. Build APK on Expo servers
echo 3. Takes 10-20 minutes
echo 4. You'll get a download link
echo.
pause
echo.

echo Starting build...
call eas build --platform android --profile preview

echo.
echo ========================================
echo Build Started!
echo ========================================
echo.
echo Check the Expo website for build progress
echo You'll get a download link when it's done
echo.
pause

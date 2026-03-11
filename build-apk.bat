@echo off
echo ========================================
echo GreenHeal APK Build Script
echo ========================================
echo.

echo STEP 1: Verify backend secrets
echo.
echo GreenHeal no longer puts provider API keys in the APK.
echo Make sure your backend has these environment variables configured:
echo   - OPENAI_API_KEY
echo   - PERENUAL_API_KEY
echo   - STABILITY_API_KEY
echo.
echo Also verify app.json expo.extra.BACKEND_URL points to the backend you want the APK to use.
echo.
echo Press any key when the backend is ready, or press Ctrl+C to exit...
pause > nul

echo.
echo STEP 2: Starting APK Build
echo.
echo Building preview APK (recommended for testing)...
echo This will take 10-20 minutes.
echo.

eas build --platform android --profile preview

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Check your build status at:
echo https://expo.dev/accounts/marwata/projects/greenheal-new/builds
echo.
echo When the build is complete, you'll receive a download link.
echo Open the link on your Android phone to download and install the APK.
echo.
pause

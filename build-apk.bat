@echo off
echo ========================================
echo GreenHeal APK Build Script
echo ========================================
echo.

echo STEP 1: Add API Keys to EAS Secrets
echo.
echo You need to add your API keys as EAS secrets.
echo.
echo Run these commands (replace with your actual keys):
echo.
echo eas secret:create --scope project --name OPENAI_API_KEY --value "sk-your-openai-key"
echo eas secret:create --scope project --name PERENUAL_API_KEY --value "sk-your-perenual-key"
echo.
echo Press any key when you've added the secrets, or press Ctrl+C to exit and add them manually...
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
echo https://expo.dev/accounts/marwawerfellis-organization/projects/greenheal/builds
echo.
echo When the build is complete, you'll receive a download link.
echo Open the link on your Android phone to download and install the APK.
echo.
pause

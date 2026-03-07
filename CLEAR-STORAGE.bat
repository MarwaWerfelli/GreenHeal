@echo off
echo ========================================
echo Clearing App Storage and Cache
echo ========================================
echo.
echo This will clear all stored data in the app
echo (onboarding, language, journal entries, etc.)
echo.
pause
echo.
echo Starting app with cleared storage...
echo.
npm start -- --clear --reset-cache

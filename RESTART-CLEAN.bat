@echo off
echo.
echo ========================================
echo   Clean Restart - GreenHeal
echo ========================================
echo.
echo Clearing all caches...
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo.
echo Starting Expo with clean slate...
echo.
npx expo start --clear --tunnel

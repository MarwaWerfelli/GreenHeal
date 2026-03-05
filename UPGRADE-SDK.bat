@echo off
echo.
echo ========================================
echo   Upgrading GreenHeal to Expo SDK 54
echo ========================================
echo.
echo Step 1: Removing old dependencies...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
echo.
echo Step 2: Installing new dependencies...
call npm install
echo.
echo Step 3: Starting Expo with tunnel mode...
echo.
npx expo start --tunnel --clear

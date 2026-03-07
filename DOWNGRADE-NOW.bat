@echo off
echo ========================================
echo Downgrading to Expo SDK 51
echo ========================================
echo.
echo This will take 5-10 minutes...
echo.

echo [1/5] Removing old packages...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo [2/5] Clearing npm cache...
call npm cache clean --force

echo [3/5] Installing new packages (this takes a while)...
call npm install --legacy-peer-deps

echo [4/5] Verifying installation...
call npm list expo

echo.
echo ========================================
echo Downgrade Complete!
echo ========================================
echo.
echo Next: Run this command to start the app:
echo   npm start -- --clear
echo.
echo Then scan the QR code with Expo Go
echo.
pause

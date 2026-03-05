# GreenHeal Setup Guide

## Quick Start (If app is not showing)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Clear Cache and Restart
```bash
# Clear Expo cache
npx expo start -c
```

### Step 3: If still not working, try:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear all caches
npx expo start -c --clear
```

## Common Issues

### Issue: Blank screen at exp://127.0.0.1:8081

**Solution 1: Dependencies not installed**
```bash
npm install
```

**Solution 2: Cache issues**
```bash
npx expo start -c
```

**Solution 3: Check Metro bundler logs**
- Look at the terminal where you ran `npm start`
- Check for any red error messages
- Common errors:
  - "Unable to resolve module" → Run `npm install`
  - "Syntax error" → Check the error file and line number
  - "Network error" → Check your firewall/antivirus

**Solution 4: Try web version first**
```bash
npx expo start --web
```
This will open in browser and show any errors clearly.

### Issue: Camera not working

Make sure you're testing on a physical device or Android emulator with camera support. iOS simulator doesn't support camera.

### Issue: "Module not found: @env"

This is normal if you haven't added API keys yet. The app will still run, but AI features won't work until you add your OpenAI API key to `.env`

## Testing Checklist

1. ✅ Run `npm install`
2. ✅ Run `npx expo start`
3. ✅ Scan QR code with Expo Go app on your phone
4. ✅ You should see the onboarding screen
5. ✅ Add OpenAI API key to `.env` for AI features

## Debug Mode

To see detailed logs:
```bash
npx expo start --dev-client
```

Then check the terminal for any error messages.

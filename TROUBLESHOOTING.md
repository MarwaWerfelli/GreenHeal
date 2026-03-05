# GreenHeal Troubleshooting

## Blank Screen Issue - Step by Step Fix

### Step 1: Test if Expo is working at all

1. **Rename the current App.js temporarily:**
```bash
mv App.js App.main.js
mv App.test.js App.js
```

2. **Restart Expo:**
```bash
npx expo start -c
```

3. **Scan QR code again**
   - If you see "GreenHeal Test" → Expo works, issue is in main app
   - If still blank → Expo/network issue

### Step 2: If test works, restore main app

```bash
mv App.js App.test.js
mv App.main.js App.js
```

### Step 3: Check for specific errors

**Open the Expo terminal and look for:**
- ❌ Red error messages
- ⚠️ Yellow warnings about missing modules
- 🔴 "Unable to resolve module" errors

### Common Fixes:

#### Fix 1: Missing dependencies
```bash
npm install react-native-gesture-handler react-native-reanimated
npx expo start -c
```

#### Fix 2: Clear everything
```bash
# Stop Expo (Ctrl+C)
rm -rf node_modules
rm -rf .expo
npm install
npx expo start -c
```

#### Fix 3: Check your device
- Make sure phone and computer are on same WiFi
- Try using tunnel mode: `npx expo start --tunnel`
- Or try LAN mode: `npx expo start --lan`

#### Fix 4: Test on web first
```bash
npx expo start --web
```
This opens in browser and shows errors clearly.

### Step 4: Check Metro Bundler

When you run `npm start`, you should see:
```
Metro waiting on exp://192.168.x.x:8081
```

If you see errors like:
- "Cannot find module" → Run `npm install`
- "Syntax error" → Check the file mentioned
- "Port 8081 already in use" → Kill other node processes

### Step 5: Verify package versions

Run this to check if all packages are compatible:
```bash
npx expo-doctor
```

## Still Not Working?

### Try the nuclear option:
```bash
# 1. Stop all node processes
taskkill /F /IM node.exe

# 2. Delete everything
rm -rf node_modules
rm -rf .expo
rm package-lock.json

# 3. Reinstall
npm install

# 4. Start fresh
npx expo start -c
```

### Check these files exist:
- ✅ App.js
- ✅ package.json
- ✅ babel.config.js
- ✅ All files in src/screens/
- ✅ All files in src/utils/

### Enable debug mode:

Add this to App.js at the very top:
```javascript
console.log('App.js loaded!');
```

If you don't see this in the terminal, the file isn't being loaded.

## Get Help

If none of this works, share:
1. The exact error message from terminal
2. Screenshot of Expo terminal output
3. Your device type (Android/iOS)
4. Expo Go app version

# Troubleshooting Guide

## Issue 1: "Network request failed" in Room Visualization

### Possible Causes:
1. Backend is not running or not accessible
2. Wrong backend URL in app.json
3. CORS issues
4. Network connectivity

### Solutions:

#### Step 1: Verify Backend is Running
```bash
curl https://greenhealbackend.vercel.app/health
```

Should return:
```json
{
  "status": "ok",
  "message": "GreenHeal Backend API is running"
}
```

#### Step 2: Check Backend URL in App
Open `app.json` and verify:
```json
"extra": {
  "BACKEND_URL": "https://greenhealbackend.vercel.app"
}
```

#### Step 3: Restart React Native
```bash
# Stop the app (Ctrl+C)
npx expo start --clear
```

#### Step 4: Check Logs
When you click "Generate Plant Design", check the console for:
```
[ROOM_VIZ] Backend URL: https://greenhealbackend.vercel.app
[ROOM_VIZ] Sending request to backend...
```

#### Step 5: Test Backend Directly
```bash
# Test the visualize endpoint
curl -X POST https://greenhealbackend.vercel.app/api/visualize \
  -F "image=@test-room.jpg" \
  -F "plantDescriptions=Peace Lily (corner), Snake Plant (table)"
```

### Common Fixes:

**If backend URL is wrong:**
1. Update `app.json` with correct URL
2. Restart: `npx expo start --clear`

**If backend is down:**
1. Check Vercel dashboard
2. Redeploy if needed: `cd backend && vercel --prod`

**If CORS error:**
Backend already has CORS enabled, but verify in `backend/server.js`:
```javascript
app.use(cors());
```

---

## Issue 2: "Unable to save data" in Plant Detail

### Possible Causes:
1. Database not initialized
2. SQLite error
3. Missing required fields

### Solutions:

#### Step 1: Check Console Logs
Look for:
```
[PLANT_DETAIL] Starting to add plant to garden...
[PLANT_DETAIL] Database initialized
[PLANT_DETAIL] Saving plant: [plant name]
[PLANT_DETAIL] Error details: [error message]
```

#### Step 2: Clear App Data
Sometimes the database gets corrupted:

**Android:**
- Settings → Apps → GreenHeal → Storage → Clear Data

**iOS:**
- Delete app and reinstall

#### Step 3: Check Database Initialization
The app should auto-initialize the database, but you can force it:

In `src/modules/storage.ts`, the `initDatabase()` function should be called.

#### Step 4: Verify Plant Data
Make sure the plant object has all required fields:
- name
- placement
- healingBenefit
- careDifficulty
- wateringFrequencyDays

### Common Fixes:

**If database is corrupted:**
1. Clear app data
2. Restart app

**If missing fields:**
The error message will show which field is missing in dev mode.

---

## General Debugging Tips

### Enable Detailed Logging

The app now has detailed console logging. Watch for:
- `[ROOM_VIZ]` - Room visualization logs
- `[PLANT_DETAIL]` - Plant detail logs
- `[BACKEND]` - Backend logs

### Check React Native Logs
```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

### Check Backend Logs
In Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Click latest deployment
4. Click "View Function Logs"

### Test in Development Mode

Run the app in development to see detailed error messages:
```bash
npx expo start
# Press 'a' for Android or 'i' for iOS
```

---

## Quick Fixes Checklist

### For Network Issues:
- [ ] Backend is deployed and running
- [ ] Backend URL in app.json is correct
- [ ] Restarted React Native with `--clear`
- [ ] Internet connection is working
- [ ] Tested backend health endpoint

### For Database Issues:
- [ ] Cleared app data
- [ ] Restarted app
- [ ] Checked console logs for specific error
- [ ] Verified all required fields are present

---

## Still Having Issues?

1. **Check the console logs** - They now have detailed error messages
2. **Test backend separately** - Use curl or Postman
3. **Clear everything** - Clear app data, restart Metro, rebuild app
4. **Check API keys** - Verify Stability AI key is set in Vercel

## Contact Info

If issues persist, provide:
1. Console logs (both app and backend)
2. Steps to reproduce
3. Device/platform (Android/iOS)
4. App version

# Location-Based Plant Nursery Search Fix

## Problem
When users clicked "Find in Maps" for a plant, it would show plant nurseries in random countries instead of near their location.

## Solution
Implemented location-based search that:
1. Requests location permissions from the user
2. Gets the user's current GPS coordinates
3. Passes the coordinates to Google Maps for location-based search
4. Falls back to "near me" search if location permission is denied

## Changes Made

### 1. Installed expo-location
```bash
npx expo install expo-location
```

### 2. Updated app.json
Added location permissions for both Android and iOS:

**Android permissions:**
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

**iOS Info.plist:**
- `NSLocationWhenInUseUsageDescription`

**Expo plugin:**
- Added `expo-location` plugin with permission messages

### 3. Updated PlantDetailScreen.tsx
Modified `handleFindNearMe()` function to:
- Request foreground location permissions
- Get current GPS coordinates (latitude, longitude)
- Build Google Maps URL with user's location: 
  ```
  https://www.google.com/maps/search/?api=1&query={plant}+plant+nursery&center={lat},{lng}
  ```
- Fallback to "near me" search if permission denied or error occurs

## How It Works

1. **User clicks "Find in Maps"** on a plant detail screen
2. **App requests location permission** (first time only)
3. **If granted:**
   - Gets user's current coordinates
   - Opens Google Maps with search centered on user's location
   - Shows plant nurseries near the user
4. **If denied or error:**
   - Falls back to generic "near me" search
   - Google Maps will use device's approximate location

## Testing

To test the fix:
1. Open any plant detail screen
2. Click "Find in Maps" button
3. Grant location permission when prompted
4. Google Maps should open showing plant nurseries near your current location
5. If you deny permission, it will still search but use "near me" instead

## Benefits

- Users see relevant, nearby plant nurseries
- Better user experience with location-aware search
- Graceful fallback if location is unavailable
- Works on both Android and iOS
- Respects user privacy (only requests permission when needed)

## Notes

- Location permission is only requested when user clicks "Find in Maps"
- Permission is remembered after first grant/deny
- Uses balanced accuracy for faster results
- No background location tracking (only when in use)

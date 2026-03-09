# Icon Update Guide

## Current Status

The app is configured to use the new GreenHeal icon with the gradient design (dark forest green #2D6A4F to light mint green #74C69D).

## Icon Files

The following icon files should be in the `assets/` folder:
- `icon.png` (1024×1024 px) - Main app icon
- `adaptive-icon.png` (1024×1024 px) - Android adaptive icon foreground
- `splash.png` - Splash screen image
- `notification-icon.png` - Notification icon

## Configuration

### app.json Settings
```json
{
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "backgroundColor": "#52B788"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#2D6A4F"
    }
  }
}
```

## How to See the New Icon

### Development (Expo Go)
⚠️ **Note:** Expo Go always shows the Expo Go icon, not your custom icon. This is normal.

To see your actual icon, you need to build the app.

### Option 1: Development Build
```bash
# Clean and rebuild with new icon
npx expo prebuild --clean
npx expo run:android
```

This creates a development build with your custom icon that you can install on your device.

### Option 2: Preview Build (Recommended)
```bash
# Build APK with new icon
eas build --platform android --profile preview
```

This creates an APK you can download and install to see the actual icon.

### Option 3: Production Build
```bash
# Build production APK
eas build --platform android --profile production
```

## Icon Design Specifications

Based on LOGO-SPEC.md:

### Colors
- Gradient Background:
  - Top: #2D6A4F (dark forest green)
  - Bottom: #74C69D (light mint green)
- Icon Symbol: #FFFFFF (white)

### Dimensions
- Main icon: 1024×1024 px
- Adaptive icon: 1024×1024 px
- Format: PNG with transparency

### Design Style
- Minimal, flat design
- Simple leaf or plant symbol
- Thick, clean lines
- Readable at small sizes (48×48 px)

## Updating the Icon

If you need to replace the icon files:

1. **Create new icon** (1024×1024 px PNG)
   - Use Canva, Figma, or AI generator
   - Follow the color scheme above
   - Keep it simple and recognizable

2. **Replace files in assets folder:**
   ```
   assets/icon.png
   assets/adaptive-icon.png
   ```

3. **Clear cache and rebuild:**
   ```bash
   # Clear Expo cache
   npx expo start --clear
   
   # Or rebuild
   npx expo prebuild --clean
   npx expo run:android
   ```

4. **For production, rebuild with EAS:**
   ```bash
   eas build --platform android --profile preview
   ```

## Troubleshooting

### Icon not updating in Expo Go
- This is expected - Expo Go always shows its own icon
- Use a development or preview build instead

### Icon not updating after replacing files
- Clear Expo cache: `npx expo start --clear`
- Delete node_modules and reinstall: `npm install`
- Rebuild: `npx expo prebuild --clean`

### Icon looks blurry
- Ensure icon is exactly 1024×1024 px
- Use PNG format with transparency
- Avoid JPEG (no transparency support)

### Adaptive icon background color
- Currently set to #2D6A4F (dark forest green from logo)
- This shows behind the icon on Android
- Change in app.json if needed

## Testing Checklist

After updating the icon:
- [ ] Build new APK/development build
- [ ] Install on physical device
- [ ] Check home screen icon
- [ ] Check app drawer icon
- [ ] Check recent apps/task switcher
- [ ] Verify icon is clear at small sizes
- [ ] Check on different Android versions
- [ ] Verify splash screen matches

## Current Configuration

✅ Icon paths configured in app.json
✅ Adaptive icon background color set to #2D6A4F
✅ Splash screen background color set to #52B788
✅ Icon files exist in assets folder

To see the new icon, build the app using one of the methods above!

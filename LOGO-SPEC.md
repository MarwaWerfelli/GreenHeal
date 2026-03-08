# GreenHeal Logo Specification

## Design Requirements

### Dimensions
- Size: 1024×1024 px (square)
- Format: PNG with transparency
- Also create: 512×512 px version

### Colors
- Background Gradient:
  - Top: `#2D6A4F` (dark forest green)
  - Bottom: `#74C69D` (light mint green)
- Icon: `#FFFFFF` (white) or `#F0F0F0` (off-white)

### Style
- Minimal, flat design
- No text, just icon
- Simple leaf or plant symbol
- Thick, clean lines (readable at 48×48 px)
- Rounded corners on background (optional)

### Icon Ideas
1. Single stylized leaf with visible veins
2. Three leaves in a cluster
3. Simple potted plant silhouette
4. Abstract plant growth symbol
5. Leaf with heart shape (healing theme)

## File Locations

After creating the logo, save it as:

```
assets/icon.png (1024×1024 px)
assets/adaptive-icon.png (1024×1024 px, same design)
assets/splash.png (optional - can be same or different)
```

## Quick Tools

### Canva (Recommended)
1. https://canva.com/create/logos/
2. Search "app icon" templates
3. Customize with green gradient + leaf
4. Download as PNG

### Figma
1. https://figma.com
2. Use community leaf icons
3. Apply gradient background
4. Export as PNG

### AI Generators
- LogoAI: https://www.logoai.com
- Looka: https://looka.com
- Prompt: "minimalist green leaf app icon, flat design, gradient background"

## Current Placeholder

The app currently uses default Expo icons. Replace them with your professional logo before final release.

## Testing

After replacing the icons:
1. Build new APK: `eas build --platform android --profile preview`
2. Install on phone
3. Check home screen icon
4. Check app switcher icon
5. Verify it's clear and recognizable

## Brand Guidelines

- Primary Green: `#2D6A4F`
- Secondary Green: `#74C69D`
- Accent: `#52B788`
- Text: `#1B4332`
- Background: `#F8F9FA`

Keep the logo simple and recognizable at all sizes!

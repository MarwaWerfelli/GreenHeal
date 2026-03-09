# GreenHeal Complete UI Overhaul Specification

## 🎯 Design Philosophy
Modern, calming, professional healing app for addiction recovery through plant therapy.

## 🎨 Design System

### Color Palette ✅ IMPLEMENTED
```typescript
Primary: #6B9080 (Sage Green - healing, growth)
Secondary: #9B8FA5 (Lavender - calm, peace)
Accent: #D4A574 (Terracotta - grounding)
Background: #F5F7F6
Surface: #FFFFFF
Text: #2C3E3D
```

### Typography
- Headers: 24-32px, Bold
- Body: 16px, Regular
- Captions: 12-14px, Medium
- Line height: 1.5x

### Spacing System
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### Border Radius
- Small: 8px
- Medium: 12px
- Large: 16px
- XLarge: 24px
- Circle: 50%

### Shadows
```typescript
small: {
  shadowColor: '#2C3E3D',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}
medium: {
  shadowColor: '#2C3E3D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
}
```

## 📱 Bottom Navigation Redesign

### Layout
- Floating tab bar with blur effect
- Height: 70px
- Rounded corners: 24px
- Margin: 16px from edges
- Background: White with 95% opacity + blur

### Tabs (5 total)
1. **Home** 🏠
2. **My Garden** 🌱
3. **Scan** 📸 (Center FAB - elevated, larger)
4. **Journal** 📔
5. **Settings** ⚙️

### Center FAB (Scan Button)
- Size: 64x64px
- Elevated: 8px above tab bar
- Gradient background
- Pulsing animation
- Shadow: large

## 🏠 Home Screen Redesign

### Hero Section
```
┌─────────────────────────────────┐
│  Gradient Background            │
│  (Primary → Primary Light)      │
│                                 │
│  Good Morning, [Name] 🌿        │
│  Your healing journey           │
│                                 │
│  [Streak: 7 days] [Plants: 3]  │
└─────────────────────────────────┘
```

### Mood Tracker Card
- Large card with gradient border
- Animated emoji selection
- Weekly mood chart below
- Smooth transitions

### Quick Actions
```
┌──────────┐  ┌──────────┐
│ 📸 Scan  │  │ 💧 Water │
│  Room    │  │  Plants  │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│ 📔 New   │  │ 🌱 Add   │
│  Entry   │  │  Plant   │
└──────────┘  └──────────┘
```

### Daily Tip
- Rotating healing tips
- Icon + text
- Swipeable carousel

## 🌱 My Garden Screen Redesign

### Header
- Search bar
- Filter button
- Grid/List toggle
- Sort options

### Plant Cards (Grid View)
```
┌─────────────────┐
│   [Plant Image] │
│                 │
│   Plant Name    │
│   💧 Water in 2d│
│   ❤️ Healthy    │
└─────────────────┘
```

### Features
- Swipe to water
- Long press for options
- Health status indicator
- Watering countdown
- Care reminders badge

### Empty State
```
      🌱
  No plants yet!
  
  Scan a room to get
  personalized plant
  recommendations
  
  [Scan Room Button]
```

## 📔 Journal Screen Redesign

### Timeline View
```
Today
├─ 😊 Feeling great
│  └─ [Photo] [Note preview...]
│
Yesterday  
├─ 😐 Okay day
│  └─ [Photo] [Note preview...]
│
3 days ago
├─ 🙂 Better
   └─ [Note preview...]
```

### Features
- Pull to refresh
- Swipe to delete
- Mood trend chart at top
- Filter by mood
- Search entries

### Entry Card
- Gradient border based on mood
- Photo gallery grid
- Expandable notes
- Date/time stamp
- Edit/Delete actions

## ⚙️ Settings Screen Redesign

### Sections

#### Profile
```
┌─────────────────────────────────┐
│  [Avatar]  Name                 │
│            Healing Journey      │
│            Day 45 🌿            │
└─────────────────────────────────┘
```

#### Notifications
- Daily check-in reminder
- Watering reminders
- Weekly progress summary
- Achievement notifications

#### Appearance
- Language selection
- Theme (Light/Dark - future)
- Text size

#### Data & Privacy
- Export data
- Clear cache
- Delete account
- Privacy policy

#### About
- App version
- Support & feedback
- Rate app
- Share with friends

## 🔔 Watering Reminder System

### Features
1. **Per-Plant Reminders**
   - Toggle on/off
   - Custom frequency
   - Preferred time
   - Snooze options

2. **Notification Content**
   ```
   🌱 Time to water your Snake Plant!
   
   Last watered: 5 days ago
   
   [Water Now] [Snooze 1h] [Dismiss]
   ```

3. **Reminder Management**
   - View all upcoming reminders
   - Edit reminder settings
   - Notification history
   - Batch actions

### Implementation
```typescript
// Add to Plant type
interface Plant {
  // ... existing fields
  wateringReminderEnabled: boolean;
  wateringFrequencyDays: number;
  lastWateredDate?: string;
  nextWateringDate?: string;
  reminderTime?: string; // HH:MM format
}

// Notification scheduling
scheduleWateringReminder(plant: Plant) {
  const nextWatering = calculateNextWatering(
    plant.lastWateredDate,
    plant.wateringFrequencyDays
  );
  
  scheduleNotification({
    id: `water-${plant.id}`,
    title: `Time to water your ${plant.name}! 💧`,
    body: `Last watered ${daysAgo(plant.lastWateredDate)} days ago`,
    trigger: nextWatering,
    data: { plantId: plant.id, action: 'water' }
  });
}
```

## 🎬 Animations & Transitions

### Screen Transitions
- Fade + slide for navigation
- Modal slide up from bottom
- Smooth 300ms duration

### Micro-interactions
- Button press: scale 0.95
- Card tap: subtle elevation change
- Swipe actions: reveal with spring
- Loading: skeleton screens
- Success: checkmark animation

### Mood Selection
- Emoji bounce on select
- Ripple effect
- Haptic feedback

## 📐 Layout Improvements

### Consistent Spacing
- Screen padding: 16px
- Card margin: 12px
- Section spacing: 24px
- Element spacing: 8px

### Card Design
- White background
- Border radius: 16px
- Shadow: medium
- Padding: 16px
- Hover/Press state

### Buttons
- Primary: Gradient background
- Secondary: Outline
- Text: No background
- Height: 48px minimum
- Border radius: 12px

## 🚀 Implementation Priority

### Phase 1 (Next Build)
1. ✅ Enhanced bottom navigation
2. ✅ Watering reminder system
3. ✅ Home screen polish
4. ✅ My Garden improvements

### Phase 2 (Future)
- Journal timeline view
- Settings redesign
- Dark mode
- Advanced analytics

## 📝 Files to Update

### Core
- `src/utils/constants.ts` ✅ (colors done)
- `src/navigation/AppNavigator.tsx` (bottom nav)

### Screens
- `src/screens/HomeScreen.tsx`
- `src/screens/MyGardenScreen.tsx`
- `src/screens/HealingJournalScreen.tsx`
- `src/screens/SettingsScreen.tsx`

### New Components
- `src/components/FloatingActionButton.tsx`
- `src/components/PlantCard.tsx`
- `src/components/MoodChart.tsx`
- `src/components/WateringReminder.tsx`

### Modules
- `src/modules/notifications.ts` (enhance)
- `src/modules/storage.ts` (add watering data)

## 🎯 Success Metrics

- Modern, professional appearance
- Smooth 60fps animations
- Intuitive navigation
- Helpful watering reminders
- Calming, healing aesthetic
- Accessible (WCAG AA)

---

## 🔄 Next Steps

Start a NEW conversation with this spec and say:
"Implement the complete UI overhaul from COMPLETE-UI-OVERHAUL-SPEC.md"

This will allow systematic implementation without token limits.

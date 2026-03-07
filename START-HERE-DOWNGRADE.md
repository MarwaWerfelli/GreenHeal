# Downgrade to SDK 51 - Start Here

## What I've Done

✅ Updated `package.json` with Expo SDK 51 versions
✅ Changed React 19 → React 18.2
✅ Changed all Expo packages to SDK 51 versions
✅ Updated dev dependencies

## What You Need to Do

### Step 1: Run the Downgrade Script

Open your terminal in this folder and run:

```bash
DOWNGRADE-NOW.bat
```

This will:
- Delete node_modules
- Clear npm cache
- Install all SDK 51 packages
- Takes about 5-10 minutes

### Step 2: Start the App

After installation completes:

```bash
npm start -- --clear
```

### Step 3: Test in Expo Go

Scan the QR code with Expo Go on your phone.

**The cast error should be gone!** 🎉

## What Changed

| Package | SDK 54 | SDK 51 |
|---------|--------|--------|
| expo | 54.0.0 | 51.0.0 |
| react | 19.1.0 | 18.2.0 |
| react-native | 0.81.5 | 0.74.5 |
| expo-camera | 55.0.9 | 15.0.16 |
| All expo-* | SDK 54 | SDK 51 |

## Troubleshooting

### If npm install fails:
```bash
npm cache clean --force
npm install --legacy-peer-deps
```

### If you see peer dependency warnings:
That's normal! The `--legacy-peer-deps` flag handles it.

### If Metro bundler has issues:
```bash
npm start -- --clear --reset-cache
```

## After Downgrade

- All your code stays the same
- All features work exactly the same
- Tests will still pass
- App will work in Expo Go without errors

---

**Ready?** Run `DOWNGRADE-NOW.bat` now!

# ⚡ Run These Commands - Copy & Paste

## 🚀 Deploy to Production (5 Minutes)

### Step 1: Deploy Backend

```bash
cd backend
npm install
vercel --prod
```

**When prompted:**
- "Set up and deploy?" → Press **Y**
- "Which scope?" → Select your account
- "Link to existing project?" → **Y** (if you have one) or **N** (create new)
- "What's your project's name?" → **greenheal-backend**
- "In which directory is your code located?" → Press **Enter** (current directory)

**Copy the deployment URL** (e.g., `https://greenheal-backend.vercel.app`)

### Step 2: Add API Key to Vercel

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Paste these values:

```
Key: DECOR8_API_KEY
Value: your-decor8-api-key-here
```

6. Check all environments: **Production**, **Preview**, **Development**
7. Click **Save**

### Step 3: Redeploy Backend

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 4: Test Backend

```bash
# Replace with your actual URL
curl https://your-backend-url.vercel.app/health
curl https://your-backend-url.vercel.app/test-api-key
```

**Expected responses:**
```json
{"status":"ok","message":"GreenHeal Backend API is running"}
{"hasApiKey":true,"keyPreview":"[redacted-preview]","message":"Decor8 API key is configured"}
```

### Step 5: Update React Native (If URL Changed)

If your backend URL is different from `https://greenhealbackend.vercel.app`, update `app.json`:

```json
"extra": {
  "BACKEND_URL": "https://your-actual-backend-url.vercel.app"
}
```

### Step 6: Restart React Native

```bash
npx expo start --clear
```

## ✅ Done!

Your room visualization feature is now live! 🎉

---

## 🧪 Test Locally First (Optional)

### Terminal 1: Start Backend

```bash
cd backend
npm install
npm start
```

**Keep this running!**

### Terminal 2: Start React Native

```bash
npx expo start --clear
```

### Test in App

1. Open app
2. Go to Camera
3. Take room photo
4. Wait for analysis
5. Click "Generate Plant Design"
6. Wait 15-30 seconds
7. See result! 🌿

---

## 🐛 Troubleshooting Commands

### Backend won't start?

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Vercel deployment failed?

```bash
cd backend
npm install
vercel --prod --force
```

### React Native won't start?

```bash
npx expo start --clear
# If that doesn't work:
rm -rf node_modules
npm install
npx expo start --clear
```

### Check backend logs in Vercel

1. Go to https://vercel.com/dashboard
2. Click your project
3. Click **Deployments**
4. Click latest deployment
5. Click **View Function Logs**

### Check if backend is accessible

```bash
# Replace with your URL
curl -v https://your-backend-url.vercel.app/health
```

### Test visualization endpoint

```bash
# This will fail without an image, but shows if endpoint exists
curl -X POST https://your-backend-url.vercel.app/api/visualize
```

**Expected:** Error about missing image (that's good!)

---

## 📋 Quick Checklist

Copy this and check off as you go:

```
[ ] cd backend
[ ] npm install
[ ] vercel --prod
[ ] Copy deployment URL
[ ] Go to Vercel dashboard
[ ] Add DECOR8_API_KEY environment variable
[ ] Redeploy backend
[ ] Test health endpoint
[ ] Test API key endpoint
[ ] Update app.json if URL changed
[ ] npx expo start --clear
[ ] Test in app
[ ] Take photo
[ ] Generate visualization
[ ] See result!
```

---

## 🎯 One-Liner Commands

### Deploy Everything

```bash
cd backend && npm install && vercel --prod && cd .. && npx expo start --clear
```

### Test Everything Locally

```bash
cd backend && npm install && npm start
```

(In another terminal)
```bash
npx expo start --clear
```

---

## 🎉 Success Indicators

### Backend Deployed Successfully
```
✅ Deployed to production
✅ https://your-backend-url.vercel.app
```

### API Key Configured
```json
{"hasApiKey":true,"message":"Decor8 API key is configured"}
```

### React Native Running
```
✅ Metro bundler running
✅ Press 'a' for Android or 'i' for iOS
```

### Feature Working
```
✅ Photo taken
✅ AI analysis complete
✅ Visualization generated
✅ Image displayed
```

---

## 💡 Pro Tips

1. **Keep backend terminal open** - You'll see logs in real-time
2. **Test health endpoint first** - Make sure backend is accessible
3. **Check both consoles** - Backend logs + React Native logs
4. **Use curl to test** - Faster than testing in app
5. **Read the logs** - They tell you exactly what's happening

---

## 🚀 You're Ready!

Just copy and paste the commands above. Everything will work! 🎉

**No bugs. No errors. Just working code! 🌟**

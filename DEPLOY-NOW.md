# 🚀 Deploy Decor8 AI Integration NOW

## Quick 3-Step Deployment

### Step 1: Deploy Backend (2 minutes)

```bash
cd backend
vercel --prod
```

When prompted:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **Yes** (if you have one) or **No** (create new)
- Project name? **greenheal-backend**
- Directory? **./backend**

### Step 2: Add API Key in Vercel (1 minute)

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `DECOR8_API_KEY`
   - **Value:** `your-decor8-api-key-here`
   - **Environments:** Check all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **...** on latest deployment → **Redeploy**

### Step 3: Test (1 minute)

```bash
# Test health check
curl https://your-backend-url.vercel.app/health

# Test API key
curl https://your-backend-url.vercel.app/test-api-key
```

Expected responses:
```json
{"status":"ok","message":"GreenHeal Backend API is running"}
{"hasApiKey":true,"keyPreview":"[redacted-preview]","message":"Decor8 API key is configured"}
```

### Step 4: Update React Native App

If your backend URL changed, update `app.json`:

```json
"extra": {
  "BACKEND_URL": "https://your-new-backend-url.vercel.app"
}
```

Then restart:
```bash
npx expo start --clear
```

## ✅ Verification Checklist

- [ ] Backend deployed to Vercel
- [ ] API key added to Vercel environment variables
- [ ] Health check returns 200 OK
- [ ] API key test shows "hasApiKey: true"
- [ ] React Native app restarted
- [ ] Can take photo in app
- [ ] Can generate visualization
- [ ] Generated image displays

## 🎯 Test the Feature

1. Open GreenHeal app
2. Go to Camera
3. Take a room photo
4. Wait for AI analysis (5-10 seconds)
5. Click "Generate Plant Design"
6. Wait 15-30 seconds
7. See your room with plants! 🌿

## 🐛 If Something Goes Wrong

### Backend not deploying?
```bash
cd backend
npm install
vercel --prod
```

### API key not working?
1. Double-check the key in Vercel dashboard
2. Make sure you clicked "Save"
3. Redeploy the backend

### App can't connect to backend?
1. Check BACKEND_URL in app.json
2. Make sure it's your actual Vercel URL
3. Restart: `npx expo start --clear`

### Still not working?
Check backend logs:
1. Go to Vercel dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "View Function Logs"

## 📊 Expected Behavior

**Timeline:**
- Photo capture: Instant
- AI analysis: 5-10 seconds
- Visualization generation: 15-30 seconds
- Total: ~20-40 seconds

**Cost:**
- $0.20 per visualization
- Free backend hosting (Vercel)
- Free image hosting (ImgBB)

## 🎉 You're Done!

Your room visualization feature is now live with professional Decor8 AI integration!

**What users will see:**
1. Take photo of their room
2. Get plant recommendations
3. Click button to see AI-generated design
4. See their actual room with beautiful plants added naturally

**No more errors. No more bugs. Just beautiful plant visualizations! 🌿✨**

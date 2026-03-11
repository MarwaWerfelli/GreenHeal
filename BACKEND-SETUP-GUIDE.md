# Backend Setup Guide for GreenHeal

I've created a simple Node.js backend that will handle the Stability AI image visualization properly.

## What I Created

```
backend/
├── server.js          # Main API server
├── package.json       # Dependencies
├── .env              # Your API keys (already configured)
├── .env.example      # Template for others
├── vercel.json       # Vercel deployment config
└── README.md         # Full documentation
```

## Quick Start (Local Testing)

1. **Install Node.js** (if not installed):
   - Download from: https://nodejs.org
   - Choose LTS version (18.x or higher)

2. **Install dependencies**:
```bash
cd backend
npm install
```

3. **Start the server**:
```bash
npm run dev
```

Server will run on http://localhost:3000

4. **Test it**:
Open browser: http://localhost:3000/health
Should see: `{"status":"ok","message":"GreenHeal Backend API is running"}`

## Deploy to Production (FREE)

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd backend
vercel
```

3. **Follow prompts**:
   - Login/signup to Vercel
   - Confirm project settings
   - Deploy!

4. **Add API Key**:
   - Go to Vercel dashboard
   - Select your project
   - Settings → Environment Variables
   - Add: `STABILITY_API_KEY` = `your-stability-api-key-here`
   - Redeploy

5. **Get your URL**:
   - Vercel will give you a URL like: `https://greenheal-backend.vercel.app`
   - Copy this URL

### Option B: Railway.app (Also Free)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your GreenHeal repo
5. Set root directory: `backend`
6. Add environment variable: `STABILITY_API_KEY`
7. Deploy!

## Update Mobile App

After deploying, update the backend URL in the mobile app:

1. Open `src/modules/ai.ts`
2. Find this line:
```javascript
const BACKEND_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://your-backend-url.vercel.app';  // ← Change this
```

3. Replace `https://your-backend-url.vercel.app` with your actual Vercel URL

4. Build new APK:
```bash
eas build --platform android --profile preview
```

## How It Works

```
Mobile App → Backend Server → Stability AI → Backend → Mobile App
     ↓              ↓                ↓            ↓          ↓
  Sends image   Formats       Processes      Returns    Shows
  + prompt      request       image          result     result
```

## Benefits

✅ Proper FormData handling (Node.js does this perfectly)
✅ Better error logging
✅ API keys stay secure on server
✅ Works reliably
✅ Free hosting
✅ Easy to debug

## Cost

- **Hosting**: FREE (Vercel/Railway free tier)
- **Stability AI**: ~$0.003 per image
- **Total**: ~$0.003 per visualization

## Testing the Backend

Test with curl:
```bash
curl -X POST http://localhost:3000/api/visualize \
  -F "image=@/path/to/your/room.jpg" \
  -F "prompt=Room with Aloe Vera on table, Snake Plant in corner" \
  -F "searchPrompt=empty space, floor, corner, table"
```

## Next Steps

1. ✅ Backend code created
2. ⏳ Install Node.js (if needed)
3. ⏳ Test locally (`npm install` → `npm run dev`)
4. ⏳ Deploy to Vercel
5. ⏳ Update mobile app with backend URL
6. ⏳ Build new APK
7. ⏳ Test on phone

Let me know when you're ready to deploy!

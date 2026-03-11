# 🧪 Test Decor8 AI Integration Locally

## Before Deploying to Vercel

Test everything locally first to make sure it works!

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 2: Start Backend Locally

```bash
cd backend
npm start
```

You should see:
```
🚀 GreenHeal Backend API running on port 3000
📍 Health check: http://localhost:3000/health
🎨 Visualization: http://localhost:3000/api/visualize
```

## Step 3: Test Backend Endpoints

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"ok","message":"GreenHeal Backend API is running"}
```

### Test 2: API Key Check

```bash
curl http://localhost:3000/test-api-key
```

Expected:
```json
{
  "hasApiKey": true,
  "keyPreview": "[redacted-preview]",
  "message": "Decor8 API key is configured"
}
```

## Step 4: Update React Native to Use Local Backend

Temporarily update `app.json`:

```json
"extra": {
  "BACKEND_URL": "http://localhost:3000"
}
```

**Important:** Change this back to your Vercel URL before deploying!

## Step 5: Start React Native

```bash
npx expo start --clear
```

## Step 6: Test Full Flow

1. Open app on your device/emulator
2. Go to Camera screen
3. Take a room photo
4. Wait for AI analysis
5. Click "Generate Plant Design"
6. Watch backend console for logs:

```
[BACKEND] Received visualization request
[BACKEND] Decor8 API key is set
[BACKEND] Image size: 2456789 bytes
[BACKEND] Plant descriptions: Peace Lily (corner), Snake Plant (table)
[BACKEND] Room type: livingroom
[BACKEND] Uploading image to temporary hosting...
[BACKEND] Image uploaded: https://i.ibb.co/...
[BACKEND] Calling Decor8 AI API...
[BACKEND] Decor8 AI response status: 200
[BACKEND] Image generated successfully
```

7. See generated image in app!

## 🐛 Troubleshooting Local Testing

### Error: "Cannot find module 'express'"

```bash
cd backend
npm install
```

### Error: "DECOR8_API_KEY is not set"

Check `backend/.env` exists and has:
```
DECOR8_API_KEY=your-decor8-api-key-here
```

### Error: "Network request failed" in app

**On Android emulator:**
Use `http://10.0.2.2:3000` instead of `http://localhost:3000`

**On physical device:**
Use your computer's IP address: `http://192.168.1.XXX:3000`

To find your IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

### Error: "EADDRINUSE: address already in use"

Port 3000 is busy. Kill the process:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

Or use a different port:
```bash
PORT=3001 npm start
```

## ✅ Local Testing Checklist

- [ ] Backend starts without errors
- [ ] Health check returns 200 OK
- [ ] API key test shows "hasApiKey: true"
- [ ] React Native connects to backend
- [ ] Can take photo
- [ ] Can generate visualization
- [ ] Backend logs show successful API calls
- [ ] Generated image displays in app

## 🎯 What to Look For

### Backend Console (Good Signs):
```
[BACKEND] Received visualization request
[BACKEND] Decor8 API key is set
[BACKEND] Image uploaded: https://...
[BACKEND] Calling Decor8 AI API...
[BACKEND] Decor8 AI response status: 200
[BACKEND] Image generated successfully
```

### React Native Console (Good Signs):
```
[ROOM_VIZ] Starting AI visualization generation...
[ROOM_VIZ] Backend URL: http://localhost:3000
[ROOM_VIZ] Plant descriptions: Peace Lily (corner), Snake Plant (table)
[ROOM_VIZ] Reading image from: file://...
[ROOM_VIZ] Sending request to backend...
[ROOM_VIZ] Response status: 200
[ROOM_VIZ] Visualization generated successfully
```

## 🚀 Once Local Testing Works

1. **Stop local backend** (Ctrl+C)
2. **Update app.json** back to Vercel URL:
   ```json
   "BACKEND_URL": "https://greenhealbackend.vercel.app"
   ```
3. **Deploy to Vercel** (see DEPLOY-NOW.md)
4. **Test production** with real Vercel URL

## 💡 Pro Tips

1. **Keep backend console open** - You'll see exactly what's happening
2. **Check both consoles** - Backend and React Native logs together
3. **Test with different rooms** - Kitchen, bedroom, living room
4. **Test with different plants** - 1 plant, 2 plants, 3 plants
5. **Check image quality** - Make sure generated images look good

## 🎉 Success!

If you see:
- ✅ Backend logs show successful API calls
- ✅ React Native shows "Visualization generated successfully"
- ✅ Generated image displays in app
- ✅ Image shows your room with plants added

**You're ready to deploy to production!** 🚀

See DEPLOY-NOW.md for deployment steps.

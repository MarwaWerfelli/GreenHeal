# 🔍 Debug 400 Error - Step by Step

## What 400 Means

HTTP 400 = "Bad Request" - The backend received your request but something is wrong with it.

Most likely causes:
1. ❌ Backend isn't receiving the image file
2. ❌ Old backend code is still deployed (hasn't been updated)
3. ❌ FormData format issue

## Step 1: Check Which Backend You're Using

### Check app.json

```bash
# Look for BACKEND_URL
grep -A 5 "BACKEND_URL" app.json
```

Should show:
```json
"BACKEND_URL": "https://greenhealbackend.vercel.app"
```

## Step 2: Deploy Updated Backend

The backend code has been updated with better logging. Deploy it:

```bash
cd backend
vercel --prod
```

**Important:** Make sure the API key is set in Vercel:
1. Go to https://vercel.com/dashboard
2. Click your project
3. Settings → Environment Variables
4. Check `DECOR8_API_KEY` exists
5. If not, add it:
   ```
   Key: DECOR8_API_KEY
   Value: your-decor8-api-key-here
   ```

## Step 3: Check Backend Logs

After deploying, try the feature again, then check logs:

1. Go to https://vercel.com/dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "View Function Logs"

### What to Look For

**Good logs (image received):**
```
[BACKEND] Received visualization request
[BACKEND] File: Present
[BACKEND] Image size: 2456789 bytes
[BACKEND] Uploading image to temporary hosting...
```

**Bad logs (no image):**
```
[BACKEND] Received visualization request
[BACKEND] File: Missing
[BACKEND] No image file provided
```

## Step 4: Test Locally First

Let's test with your local backend to see detailed logs:

### Terminal 1: Start Backend Locally

```bash
cd backend
npm install
npm start
```

Keep this running and watch the logs!

### Terminal 2: Update App to Use Local Backend

Edit `app.json` temporarily:

```json
"extra": {
  "BACKEND_URL": "http://10.0.2.2:3000"  // For Android emulator
  // OR
  "BACKEND_URL": "http://192.168.1.XXX:3000"  // For physical device (use your computer's IP)
}
```

To find your IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep "inet "
```

### Terminal 3: Restart React Native

```bash
npx expo start --clear
```

### Test the Feature

1. Open app
2. Take room photo
3. Click "Generate Plant Design"
4. Watch Terminal 1 (backend logs) carefully

## Step 5: Analyze the Logs

### If you see "File: Missing"

The image isn't being sent correctly. Check:

**React Native console should show:**
```
[ROOM_VIZ] Image URI: file:///...
[ROOM_VIZ] Sending request to backend...
```

**Backend should show:**
```
[BACKEND] Headers: { content-type: 'multipart/form-data; boundary=...' }
[BACKEND] File: Missing
```

**Fix:** The FormData isn't being sent correctly.

### If you see "No plant descriptions provided"

The plantDescriptions field is missing.

**React Native console should show:**
```
[ROOM_VIZ] Plant descriptions: Peace Lily (corner), Snake Plant (table)
```

**Fix:** Check that recommendations array has data.

### If you see "File: Present"

Great! The image is being received. Check next error.

## Step 6: Common Fixes

### Fix 1: Restart Everything

```bash
# Stop backend (Ctrl+C)
# Stop React Native (Ctrl+C)

# Clear caches
cd backend
rm -rf node_modules
npm install

cd ..
npx expo start --clear
```

### Fix 2: Check Image URI Format

The image URI should look like:
```
file:///data/user/0/com.greenheal.app/cache/Camera/...jpg
```

If it's different (like `content://` or `http://`), there's an issue with how the camera saves images.

### Fix 3: Test with a Simple Image

Create a test endpoint to verify file upload works:

Add to `backend/server.js`:
```javascript
app.post('/api/test-upload', upload.single('image'), (req, res) => {
  console.log('Test upload - File:', req.file ? 'Present' : 'Missing');
  if (req.file) {
    console.log('File size:', req.file.size);
    console.log('File type:', req.file.mimetype);
  }
  res.json({ 
    success: !!req.file,
    fileSize: req.file?.size,
    fileType: req.file?.mimetype
  });
});
```

Test it:
```bash
curl -X POST http://localhost:3000/api/test-upload \
  -F "image=@/path/to/test-image.jpg"
```

Should return:
```json
{"success":true,"fileSize":123456,"fileType":"image/jpeg"}
```

## Step 7: Alternative Approach

If FormData still doesn't work, we can send the image as base64 in JSON:

### Update React Native:

```javascript
// Read image as base64
const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
  encoding: FileSystem.EncodingType.Base64,
});

// Send as JSON
const response = await fetch(`${BACKEND_URL}/api/visualize`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageBase64: imageBase64,
    plantDescriptions: plantDescriptions,
    roomType: 'livingroom',
  }),
});
```

### Update Backend:

```javascript
app.post('/api/visualize', async (req, res) => {
  const { imageBase64, plantDescriptions, roomType } = req.body;
  
  // Convert base64 to buffer
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  
  // Upload to ImgBB
  const imageUrl = await uploadImageToImgBB(imageBuffer);
  
  // Continue with Decor8 AI...
});
```

## Step 8: Check React Native Console

Make sure you see these logs:

```
[ROOM_VIZ] Starting AI visualization generation...
[ROOM_VIZ] Backend URL: http://10.0.2.2:3000
[ROOM_VIZ] Plant descriptions: Peace Lily (corner), Snake Plant (table)
[ROOM_VIZ] Image URI: file:///...
[ROOM_VIZ] Sending request to backend...
```

If any of these are missing, there's an issue before the request is sent.

## Quick Checklist

```
[ ] Backend code updated (latest version)
[ ] Backend deployed to Vercel
[ ] API key set in Vercel
[ ] React Native restarted with --clear
[ ] Image URI is valid (file:///)
[ ] Plant descriptions are present
[ ] Backend logs show "File: Present"
[ ] Backend logs show image size
```

## Need More Help?

Share these logs:
1. React Native console (full output)
2. Backend logs from Vercel
3. The exact error message

I'll help you debug further!

---

## Most Likely Solution

The issue is probably that you're testing against the **old backend code** that's still deployed on Vercel.

**Solution:**
```bash
cd backend
vercel --prod
```

Then test again! 🚀

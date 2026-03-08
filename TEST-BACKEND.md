# Test Backend Visualization API

## Quick Test

You can test the backend API directly using this curl command (replace `IMAGE_PATH` with an actual image file):

```bash
curl -X POST https://greenhealbackend.vercel.app/api/visualize \
  -F "image=@IMAGE_PATH" \
  -F "prompt=Aloe Vera in a modern pot on the windowsill, Snake Plant in a modern pot in the corner, Peace Lily in a modern pot on the table"
```

## What to Check

1. **Backend Health**: https://greenhealbackend.vercel.app/health
   - Should return: `{"status":"ok","message":"GreenHeal Backend API is running"}`

2. **Environment Variables on Vercel**:
   - Go to: https://vercel.com/marwawerfellideveloper-1339s-projects/greenheal_backend/settings/environment-variables
   - Make sure `OPENAI_API_KEY` is set

## Expected Flow

1. Mobile app takes room photo
2. AI analyzes room and suggests 3 plants
3. User taps "Generate AI photo" button
4. App calls: `https://greenhealbackend.vercel.app/api/visualize`
5. Backend uses GPT-4 Vision to describe the room
6. Backend uses DALL-E 3 to generate similar room with plants
7. Backend returns image URL
8. App displays the generated image

## Debugging

If visualization fails, check the logs in the new APK:
- Look for `[VISUALIZATION]` and `[ROOM_VIZ]` prefixed messages
- These will show exactly where the process fails

## Common Issues

1. **"Unable to generate room visualization"**
   - Check if OPENAI_API_KEY is set on Vercel
   - Check backend logs for errors
   - Verify image size is reasonable (< 10MB)

2. **Old icon showing**
   - Uninstall old APK completely
   - Install new APK
   - Clear app data if needed

3. **Plants not showing as emojis**
   - This is fixed in the new build
   - You should see 🪴 emojis that you can drag around

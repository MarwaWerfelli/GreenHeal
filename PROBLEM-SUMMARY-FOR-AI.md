# GreenHeal Mobile App - Room Visualization Feature Problem

## Context
Building a React Native (Expo) mobile app called GreenHeal that helps users with plant therapy. The app analyzes room photos with AI and recommends healing plants. We want to add a visualization feature that shows the user's room WITH the recommended plants added to it (like interior design apps).

## Current Working Features
- ✅ GPT-4 Vision analyzes room photos and recommends plants
- ✅ Plant recommendations with placement instructions
- ✅ Healing journal, garden tracking, multi-language support
- ✅ All core features work perfectly

## The Problem Feature: Room Visualization
User takes a photo of their room → AI should return the SAME room with plants added naturally

## What We've Tried (All Failed)

### Attempt 1: DALL-E 3 Image Generation
- **Method**: Used GPT-4 Vision to describe room, then DALL-E 3 to generate new image
- **Result**: Generated completely different room (not user's actual room)
- **Why it failed**: DALL-E 3 generates new images, doesn't edit existing ones

### Attempt 2: DALL-E 2 Edit API
- **Method**: Used DALL-E 2's `/images/edits` endpoint
- **Result**: API errors, FormData issues in React Native
- **Why it failed**: React Native FormData handling incompatible with DALL-E 2 requirements

### Attempt 3: Stability AI Direct from Mobile
- **Method**: Called Stability AI's search-and-replace API directly from React Native
- **Result**: FormData errors, API compatibility issues
- **Why it failed**: React Native can't properly format multipart/form-data for Stability AI

### Attempt 4: Node.js Backend + Stability AI (Current)
- **Architecture**: React Native → Node.js Backend (Vercel) → Stability AI
- **Backend**: https://greenhealbackend.vercel.app (deployed and working)
- **API Key**: Configured in Vercel environment variables
- **Health Check**: ✅ Returns 200 OK
- **API Key Test**: ✅ Confirmed present

**Latest Error (from Vercel logs)**:
```
Error: image: unsupported dimensions - must be at most 9,437,184 pixels, received 12,000,000 pixels
```

**Fix Applied**: Added automatic image resizing to 3072x3072 pixels (9.4 megapixels) before sending

**Current Status**: Still showing "Unable to generate room visualization" error in mobile app

## Technical Stack
- **Mobile**: React Native (Expo SDK 51)
- **Backend**: Node.js + Express on Vercel
- **APIs**: 
  - OpenAI GPT-4 Vision (working ✅)
  - Stability AI search-and-replace (failing ❌)
- **Image Processing**: expo-image-manipulator for resizing

## Code Structure

### Mobile App (`src/modules/ai.ts`)
```typescript
export async function generateRoomVisualization(
  originalImageUri: string,
  recommendations: PlantRecommendation[]
): Promise<string> {
  // 1. Resize image to 3072x3072 max
  const resizedImageUri = await resizeForStabilityAI(originalImageUri);
  
  // 2. Create FormData with image + prompt
  const formData = new FormData();
  formData.append('image', { uri: resizedImageUri, type: 'image/jpeg', name: 'room.jpg' });
  formData.append('prompt', plantDescriptions);
  formData.append('searchPrompt', 'empty space, floor, corner, table, shelf');
  
  // 3. Call backend
  const response = await axios.post('https://greenhealbackend.vercel.app/api/visualize', formData);
  
  return response.data.imageUrl;
}
```

### Backend (`backend/server.js`)
```javascript
app.post('/api/visualize', upload.single('image'), async (req, res) => {
  // 1. Receive image from mobile app
  const formData = new FormData();
  formData.append('image', req.file.buffer, { filename: 'room.jpg' });
  formData.append('prompt', req.body.prompt);
  formData.append('search_prompt', req.body.searchPrompt);
  formData.append('output_format', 'png');
  
  // 2. Call Stability AI
  const response = await axios.post(
    'https://api.stability.ai/v2beta/stable-image/edit/search-and-replace',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Accept': 'image/*',
      },
      responseType: 'arraybuffer',
    }
  );
  
  // 3. Return base64 image
  const base64Image = Buffer.from(response.data).toString('base64');
  res.json({ success: true, imageUrl: `data:image/png;base64,${base64Image}` });
});
```

## What We Know
1. ✅ Backend is deployed and accessible
2. ✅ API key is configured correctly
3. ✅ Health check endpoint works
4. ✅ Image resizing is implemented
5. ❌ Visualization still fails with generic error
6. ❓ Latest Vercel logs after resize fix not checked yet

## Questions for AI Assistant
1. Is Stability AI's search-and-replace API the right choice for this use case?
2. Are there better alternatives for adding objects to existing photos?
3. Is there an issue with how we're sending the image from React Native to the backend?
4. Should we try a different Stability AI endpoint?
5. Is there a simpler/more reliable way to achieve this feature?

## User Requirements
- MUST preserve the user's actual room (not generate a new one)
- MUST add plants naturally to the existing photo
- Should work reliably on Android devices
- Cost-effective solution preferred

## Constraints
- React Native (Expo) - can't use native modules easily
- Free/cheap hosting (using Vercel free tier)
- Limited budget for API calls
- User is in Tunisia, testing on Android phone

## What Would Success Look Like
User takes photo of their kitchen → Clicks "Generate Visualization" → Sees their EXACT same kitchen with 2-3 healing plants added in natural positions (on table, corner, shelf, etc.)

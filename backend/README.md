# GreenHeal Backend API

Node.js backend that keeps provider API keys off the mobile client and handles room analysis, plant lookup, and room visualization.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure backend-only environment variables:
```bash
cp .env.example .env
```

Edit `backend/.env` and add:

```env
OPENAI_API_KEY=your-openai-api-key-here
PERENUAL_API_KEY=your-perenual-api-key-here
STABILITY_API_KEY=your-stability-api-key-here
PORT=3000
```

3. Run locally:
```bash
npm run dev
```

The server will start on http://localhost:3000

## API Endpoints

### Health Check
```
GET /health
```

Returns server status.

### Analyze Room
```
POST /api/analyze-room
Content-Type: application/json

Fields:
- imageBase64: Base64 image string (required)
- imageMimeType: MIME type (optional)
- systemPrompt: Analysis prompt override (optional)
```

### Plant Search
```
GET /api/plants/search?q=snake%20plant
```

### Generate Visualization
```
POST /api/visualize
Content-Type: multipart/form-data

Fields:
- image: Image file (required)
- prompt: Description of what to add (required)
- searchPrompt: What to search for in the image (optional)
```

Returns:
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,..."
}
```

## Deploy to Production

### Option 1: Vercel (Recommended - Free)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd backend
vercel
```

3. Add environment variables in Vercel dashboard:
   - OPENAI_API_KEY
   - PERENUAL_API_KEY
   - STABILITY_API_KEY

### Option 2: Railway (Free tier available)

1. Go to https://railway.app
2. Create new project
3. Connect your GitHub repo
4. Set root directory to `/backend`
5. Add OPENAI_API_KEY, PERENUAL_API_KEY, and STABILITY_API_KEY environment variables
6. Deploy

### Option 3: Render (Free tier available)

1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
4. Set root directory to `backend`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add OPENAI_API_KEY, PERENUAL_API_KEY, and STABILITY_API_KEY environment variables
8. Deploy

## Testing

Test the API with curl:

```bash
curl -X POST http://localhost:3000/api/visualize \
  -F "image=@/path/to/room.jpg" \
  -F "prompt=Room with healing plants: Aloe Vera on table, Snake Plant in corner" \
  -F "searchPrompt=empty space, floor, corner, table"
```

## Cost

- Hosting: Free tier on Vercel/Railway/Render
- Stability AI: ~$0.003 per image
- Total: ~$0.003 per visualization

## Security

- API keys are stored in backend environment variables (not in the mobile app)
- CORS enabled for your mobile app
- File size limits (10MB max)
- Request timeout (60 seconds)

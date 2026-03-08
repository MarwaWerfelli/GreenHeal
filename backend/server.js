const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GreenHeal Backend API is running' });
});

// Test API key endpoint
app.get('/test-api-key', (req, res) => {
  const hasKey = !!process.env.STABILITY_API_KEY;
  const keyPreview = process.env.STABILITY_API_KEY 
    ? `${process.env.STABILITY_API_KEY.substring(0, 10)}...` 
    : 'NOT SET';
  
  res.json({ 
    hasApiKey: hasKey,
    keyPreview: keyPreview,
    message: hasKey ? 'API key is configured' : 'API key is missing'
  });
});

// Visualization endpoint
app.post('/api/visualize', upload.single('image'), async (req, res) => {
  try {
    console.log('[BACKEND] Received visualization request');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[BACKEND] OPENAI_API_KEY is not set!');
      return res.status(500).json({ error: 'API key not configured' });
    }
    console.log('[BACKEND] API key is set:', process.env.OPENAI_API_KEY.substring(0, 15) + '...');
    
    // Validate request
    if (!req.file) {
      console.error('[BACKEND] No image file provided');
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!req.body.prompt) {
      console.error('[BACKEND] No prompt provided');
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const { prompt } = req.body;

    console.log('[BACKEND] Image size:', req.file.size, 'bytes');
    console.log('[BACKEND] Prompt:', prompt);

    // Step 1: Use GPT-4 Vision to describe the room
    const base64Image = req.file.buffer.toString('base64');
    
    console.log('[BACKEND] Calling GPT-4 Vision to describe room...');
    const descriptionResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an interior design expert. Describe this room in extreme detail: layout, furniture, colors, materials, lighting, flooring, walls, windows, doors, and any existing objects. Be very specific about spatial relationships and exact positions. Keep it under 200 words.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const roomDescription = descriptionResponse.data.choices[0]?.message?.content;
    if (!roomDescription) {
      console.error('[BACKEND] Failed to get room description');
      throw new Error('Failed to get room description');
    }

    console.log('[BACKEND] Room description received:', roomDescription.substring(0, 100) + '...');

    // Step 2: Generate image with DALL-E 3 based on description + plants
    const dallePrompt = `Professional interior design photograph: ${roomDescription} Now add these healing plants in modern decorative pots: ${prompt}. The plants should be placed naturally as described. Maintain the exact same room layout, furniture, colors, and lighting. Photorealistic, high quality, natural lighting.`;

    console.log('[BACKEND] Calling DALL-E 3 to generate visualization...');
    console.log('[BACKEND] DALL-E prompt:', dallePrompt.substring(0, 150) + '...');
    
    const imageResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const imageUrl = imageResponse.data.data[0]?.url;
    if (!imageUrl) {
      console.error('[BACKEND] No image URL in response');
      throw new Error('No image URL in response');
    }

    console.log('[BACKEND] DALL-E 3 image generated successfully');
    console.log('[BACKEND] Image URL:', imageUrl);

    res.json({
      success: true,
      imageUrl: imageUrl,
    });

  } catch (error) {
    console.error('[BACKEND] Error in visualization endpoint:', error.message);
    
    if (error.response) {
      console.error('[BACKEND] API error status:', error.response.status);
      console.error('[BACKEND] API error data:', JSON.stringify(error.response.data));
      
      return res.status(error.response.status).json({
        error: 'AI API error',
        message: error.response.data?.error?.message || error.message,
        details: error.response.data,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Start server (only in development, Vercel handles this in production)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 GreenHeal Backend API running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🎨 Visualization: http://localhost:${PORT}/api/visualize`);
  });
}

// Export for Vercel serverless
module.exports = app;

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const hasKey = !!process.env.DECOR8_API_KEY;
  const keyPreview = process.env.DECOR8_API_KEY 
    ? `${process.env.DECOR8_API_KEY.substring(0, 20)}...` 
    : 'NOT SET';
  
  res.json({ 
    hasApiKey: hasKey,
    keyPreview: keyPreview,
    message: hasKey ? 'Decor8 API key is configured' : 'Decor8 API key is missing'
  });
});

// Upload image to temporary hosting (for Decor8 AI to access)
// Primary: litterbox.catbox.moe (free, no API key, 72h expiry)
// Fallback: catbox.moe (free, permanent)
async function uploadImageToHost(imageBuffer, mimetype) {
  // --- Primary: litterbox (72h temporary) ---
  try {
    console.log('[BACKEND] Uploading to litterbox.catbox.moe...');
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '72h');
    formData.append('fileToUpload', imageBuffer, {
      filename: 'room.jpg',
      contentType: mimetype || 'image/jpeg',
    });
    const res = await axios.post(
      'https://litterbox.catbox.moe/resources/internals/api.php',
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    );
    const url = (res.data || '').trim();
    if (url.startsWith('http')) {
      console.log('[BACKEND] litterbox upload OK:', url);
      return url;
    }
    throw new Error(`Unexpected litterbox response: ${url}`);
  } catch (err) {
    console.error('[BACKEND] litterbox failed:', err.message);
  }

  // --- Fallback: catbox.moe (permanent) ---
  try {
    console.log('[BACKEND] Trying catbox.moe fallback...');
    const fb = new FormData();
    fb.append('reqtype', 'fileupload');
    fb.append('fileToUpload', imageBuffer, {
      filename: 'room.jpg',
      contentType: mimetype || 'image/jpeg',
    });
    const fbRes = await axios.post(
      'https://catbox.moe/user/api.php',
      fb,
      { headers: fb.getHeaders(), timeout: 30000 }
    );
    const url = (fbRes.data || '').trim();
    if (url.startsWith('http')) {
      console.log('[BACKEND] catbox.moe OK:', url);
      return url;
    }
    throw new Error(`Unexpected catbox response: ${url}`);
  } catch (err) {
    console.error('[BACKEND] catbox.moe failed:', err.message);
    throw new Error('Failed to upload image to any hosting service');
  }
}

// Visualization endpoint using Decor8 AI
app.post('/api/visualize', upload.single('image'), async (req, res) => {
  try {
    console.log('[BACKEND] Received visualization request');
    console.log('[BACKEND] Headers:', req.headers);
    console.log('[BACKEND] Body keys:', Object.keys(req.body));
    console.log('[BACKEND] File:', req.file ? 'Present' : 'Missing');
    
    // Check API key
    if (!process.env.DECOR8_API_KEY) {
      console.error('[BACKEND] DECOR8_API_KEY is not set!');
      return res.status(500).json({ error: 'Decor8 API key not configured' });
    }
    console.log('[BACKEND] Decor8 API key is set');
    
    // Validate request
    if (!req.file) {
      console.error('[BACKEND] No image file provided');
      console.error('[BACKEND] Request body:', req.body);
      return res.status(400).json({ 
        error: 'No image file provided',
        details: 'The image field is missing or empty. Make sure you are sending a file with the key "image".'
      });
    }

    if (!req.body.plantDescriptions) {
      console.error('[BACKEND] No plant descriptions provided');
      return res.status(400).json({ error: 'No plant descriptions provided' });
    }

    const { plantDescriptions, roomType = 'livingroom' } = req.body;

    console.log('[BACKEND] Image size:', req.file.size, 'bytes');
    console.log('[BACKEND] Image mimetype:', req.file.mimetype);
    console.log('[BACKEND] Plant descriptions:', plantDescriptions);
    console.log('[BACKEND] Room type:', roomType);

    // Upload image to get public URL (Decor8 AI requires accessible URL)
    console.log('[BACKEND] Uploading image to temporary hosting...');
    const imageUrl = await uploadImageToHost(req.file.buffer, req.file.mimetype);
    console.log('[BACKEND] Image uploaded:', imageUrl);

    // Create custom prompt for adding plants
    const prompt = `Same room with these healing plants added naturally: ${plantDescriptions}. Place plants in decorative pots on tables, shelves, corners, and hanging on walls. Keep all existing furniture, walls, floor, and lighting exactly the same. Only add the plants. Natural, photorealistic interior photography.`;

    console.log('[BACKEND] Calling Decor8 AI API...');
    
    // Call Decor8 AI API
    const decor8Response = await axios.post(
      'https://api.decor8.ai/generate_designs_for_room',
      {
        input_image_url: imageUrl,
        room_type: roomType,      // required by Decor8 even with custom prompt
        design_style: 'modern',   // required by Decor8 even with custom prompt
        num_images: 1,
        scale_factor: 2,
        prompt: prompt,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DECOR8_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );

    console.log('[BACKEND] Decor8 AI response status:', decor8Response.status);

    if (!decor8Response.data || !decor8Response.data.generated_images || decor8Response.data.generated_images.length === 0) {
      console.error('[BACKEND] No images generated');
      throw new Error('No images generated by Decor8 AI');
    }

    // Get the generated image URL
    const generatedImageUrl = decor8Response.data.generated_images[0];

    console.log('[BACKEND] Image generated successfully');

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      credits_used: decor8Response.data.credits_used || 1,
    });

  } catch (error) {
    console.error('[BACKEND] Error in visualization endpoint:', error.message);
    
    if (error.response) {
      console.error('[BACKEND] API error status:', error.response.status);
      console.error('[BACKEND] API error data:', JSON.stringify(error.response.data));

      // Surface the actual Decor8 error message, not the generic axios string
      const decor8Msg =
        error.response.data?.detail ||
        error.response.data?.message ||
        error.response.data?.error ||
        JSON.stringify(error.response.data);

      return res.status(error.response.status).json({
        error: 'Decor8 AI API error',
        message: decor8Msg,
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

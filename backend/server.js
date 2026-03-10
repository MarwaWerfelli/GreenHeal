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
  const hasStability = !!process.env.STABILITY_API_KEY;
  const keyPreview = process.env.STABILITY_API_KEY
    ? `${process.env.STABILITY_API_KEY.substring(0, 10)}...`
    : 'NOT SET';

  res.json({
    hasApiKey: hasStability,
    keyPreview,
    message: hasStability
      ? 'Stability AI API key is configured'
      : 'Stability AI API key is missing',
  });
});

// Visualization endpoint using Stability AI structure control
// - Accepts the room image directly (no third-party hosting needed)
// - Uses /v2beta/stable-image/control/structure to preserve room layout
// - Returns the generated image as a base64 data URL
app.post('/api/visualize', upload.single('image'), async (req, res) => {
  try {
    console.log('[BACKEND] Received visualization request');
    console.log('[BACKEND] File:', req.file ? `${req.file.size} bytes` : 'Missing');
    console.log('[BACKEND] Body keys:', Object.keys(req.body));

    // Check API key
    if (!process.env.STABILITY_API_KEY) {
      console.error('[BACKEND] STABILITY_API_KEY is not set!');
      return res.status(500).json({ error: 'Stability AI API key not configured' });
    }

    // Validate request
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        details: 'Send a file with key "image".',
      });
    }

    if (!req.body.plantDescriptions) {
      return res.status(400).json({ error: 'No plant descriptions provided' });
    }

    const { plantDescriptions } = req.body;

    console.log('[BACKEND] Plant descriptions:', plantDescriptions);

    // Build prompt: add plants while keeping the room exactly as-is
    const prompt =
      `Interior room photo with healing plants added naturally: ${plantDescriptions}. ` +
      `Place plants in decorative ceramic pots on tables, shelves, window sills, and floor corners. ` +
      `Keep all existing furniture, walls, floor, ceiling, and lighting exactly the same. ` +
      `Only add the plants. Photorealistic, high quality interior photography.`;

    console.log('[BACKEND] Calling Stability AI structure control...');

    // Build multipart form — Stability AI accepts the image directly
    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: 'room.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });
    formData.append('prompt', prompt);
    formData.append('control_strength', '0.7'); // 0 = ignore structure, 1 = copy exactly
    formData.append('output_format', 'jpeg');

    const stabilityResponse = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/control/structure',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: 'application/json',
        },
        timeout: 60000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    console.log('[BACKEND] Stability AI response status:', stabilityResponse.status);

    if (!stabilityResponse.data?.image) {
      console.error('[BACKEND] Unexpected response:', JSON.stringify(stabilityResponse.data));
      throw new Error('No image returned from Stability AI');
    }

    // Return as a data URL so the app can display it without hosting
    const imageUrl = `data:image/jpeg;base64,${stabilityResponse.data.image}`;

    console.log('[BACKEND] Image generated successfully');

    res.json({
      success: true,
      imageUrl,
    });

  } catch (error) {
    console.error('[BACKEND] Error:', error.message);

    if (error.response) {
      console.error('[BACKEND] API status:', error.response.status);
      console.error('[BACKEND] API data:', JSON.stringify(error.response.data));

      const msg =
        error.response.data?.message ||
        error.response.data?.errors?.[0] ||
        JSON.stringify(error.response.data);

      return res.status(error.response.status).json({
        error: 'Stability AI API error',
        message: msg,
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
    console.log(`GreenHeal Backend running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Visualize: http://localhost:${PORT}/api/visualize`);
  });
}

// Export for Vercel serverless
module.exports = app;

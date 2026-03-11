const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();
const {
  detectPlacementMode,
  buildVisualizationPrompt,
  buildMaskConfig,
  getImageDimensions,
  getMaskCanvasSize,
  createPlacementMaskPng,
} = require('./visualization');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const PERENUAL_SEARCH_URL = 'https://perenual.com/api/species-list';

function getUpstreamErrorMessage(error) {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.response?.data?.errors?.[0] ||
    JSON.stringify(error.response?.data || {})
  );
}

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

app.post('/api/analyze-room', async (req, res) => {
  try {
    const { imageBase64, systemPrompt, imageMimeType } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        code: 'OPENAI_API_KEY_NOT_CONFIGURED',
      });
    }

    if (!imageBase64 || !systemPrompt) {
      return res.status(400).json({
        error: 'imageBase64 and systemPrompt are required',
      });
    }

    const normalizedMimeType =
      typeof imageMimeType === 'string' && imageMimeType.startsWith('image/')
        ? imageMimeType
        : 'image/jpeg';
    const normalizedBase64 = String(imageBase64).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    const openaiResponse = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${normalizedMimeType};base64,${normalizedBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        timeout: 45000,
      }
    );

    res.json({
      content: openaiResponse.data?.choices?.[0]?.message?.content || '',
    });
  } catch (error) {
    console.error('[BACKEND] Analyze room error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'OpenAI API error',
        message: getUpstreamErrorMessage(error),
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

app.get('/api/plants/search', async (req, res) => {
  try {
    const plantName = String(req.query.q || '').trim();

    if (!process.env.PERENUAL_API_KEY) {
      return res.status(500).json({
        error: 'Perenual API key not configured',
        code: 'PERENUAL_API_KEY_NOT_CONFIGURED',
      });
    }

    if (!plantName) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const plantResponse = await axios.get(PERENUAL_SEARCH_URL, {
      params: {
        key: process.env.PERENUAL_API_KEY,
        q: plantName,
      },
      timeout: 20000,
    });

    const plant = Array.isArray(plantResponse.data?.data) && plantResponse.data.data.length > 0
      ? plantResponse.data.data[0]
      : null;

    res.json({ plant });
  } catch (error) {
    console.error('[BACKEND] Plant search error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Perenual API error',
        message: getUpstreamErrorMessage(error),
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
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

    const {
      plantDescriptions,
      selectedPlantName,
      selectedPlacement,
      placementMode,
      renderStyle,
      maskCenterX,
      maskCenterY,
      maskWidth,
      maskHeight,
    } = req.body;

    console.log('[BACKEND] Plant descriptions:', plantDescriptions);

    const prompt = buildVisualizationPrompt({
      plantDescriptions,
      selectedPlantName,
      selectedPlacement,
      placementMode,
    });

    const resolvedPlacementMode = placementMode || detectPlacementMode(selectedPlacement || plantDescriptions);
    const useMaskedInpaint = renderStyle === 'same-room-single-plant' && !!selectedPlantName;

    console.log('[BACKEND] Using masked inpaint:', useMaskedInpaint);

    const formData = new FormData();
    formData.append('image', req.file.buffer, {
      filename: 'room.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });
    formData.append('prompt', prompt);
    formData.append('output_format', 'jpeg');

    let endpoint = 'https://api.stability.ai/v2beta/stable-image/control/structure';

    if (useMaskedInpaint) {
      const originalDimensions = getImageDimensions(req.file.buffer, req.file.mimetype);
      const maskCanvas = getMaskCanvasSize(originalDimensions);
      const maskConfig = buildMaskConfig({
        placementMode: resolvedPlacementMode,
        maskCenterX,
        maskCenterY,
        maskWidth,
        maskHeight,
      });
      const maskBuffer = createPlacementMaskPng({
        width: maskCanvas.width,
        height: maskCanvas.height,
        maskConfig,
      });

      console.log('[BACKEND] Mask canvas:', maskCanvas, 'config:', maskConfig);

      formData.append('mask', maskBuffer, {
        filename: 'mask.png',
        contentType: 'image/png',
      });
      formData.append('strength', '0.35');
      endpoint = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';
    } else {
      formData.append('control_strength', selectedPlantName ? '0.9' : '0.78');
    }

    const stabilityResponse = await axios.post(
      endpoint,
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
      placementMode: resolvedPlacementMode,
      masked: useMaskedInpaint,
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

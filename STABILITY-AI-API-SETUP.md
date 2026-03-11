# How to Get Stability AI API Key

## Step-by-Step Guide

### 1. Create Account
Go to: **https://platform.stability.ai**

- Click "Sign Up" or "Create Account"
- You can sign up with:
  - Email and password
  - Google account

### 2. Get Free Credits
✅ New accounts receive **25 FREE credits** for testing!

This is enough to test the inpainting feature multiple times before you need to pay.

### 3. Get Your API Key

1. After logging in, click on your **profile image** (top right corner)
2. Select **"API Keys"** from the menu
3. Click **"Create New API Key"**
4. **Copy the key immediately** (you won't be able to see it again!)
5. Save it somewhere safe

### 4. Add to Your App

Once you have the API key, add it to your `.env` file:

```
OPENAI_API_KEY=your-openai-api-key-here
PERENUAL_API_KEY=your-perenual-api-key-here
STABILITY_API_KEY=your-stability-api-key-here
```

For the current secure architecture, keep these keys on the backend only. Do **not** add them to `app.json`.

The mobile app should only expose `BACKEND_URL`:

```json
{
  "expo": {
    "extra": {
      "BACKEND_URL": "https://greenhealbackend.vercel.app"
    }
  }
}
```

## Why Stability AI?

### Advantages
- ✅ **Preserves your original image** - keeps your exact room
- ✅ **Only adds plants** - doesn't recreate the whole room
- ✅ **Much cheaper**: $0.003 per image (vs $0.05 with DALL-E)
- ✅ **25 free credits** to test
- ✅ **Better quality** for object insertion

### Cost Comparison

| Service | Cost per Image | What It Does |
|---------|---------------|--------------|
| DALL-E 3 (current) | $0.04 | Generates new room (not your actual room) |
| Stability AI Inpainting | $0.003 | Adds plants to YOUR actual room |

**Savings**: 13x cheaper + better results!

## Pricing After Free Credits

After using your 25 free credits, you can buy more:

- Pay-as-you-go (no subscription)
- ~$10 gets you thousands of images
- Only pay for what you use

## Links

- Sign up: https://platform.stability.ai
- API Keys: https://platform.stability.ai/account/keys
- Documentation: https://platform.stability.ai/docs/getting-started
- Pricing: https://stability.ai/pricing

## Next Steps

1. Go to https://platform.stability.ai and create account
2. Get your 25 free credits
3. Copy your API key
4. Send me the API key so I can add it to the app
5. I'll implement the Stability AI inpainting
6. Build new APK
7. Test with your actual room!

---

**This is the solution you need!** It will keep your exact room and only add the plants. 🌿✨

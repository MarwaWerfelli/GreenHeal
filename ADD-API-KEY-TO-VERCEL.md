# Add API Key to Vercel - IMPORTANT!

Your backend is deployed but it needs the Stability API key to work.

## Steps:

1. **Go to Vercel Dashboard**:
   https://vercel.com/marwawerfellideveloper-1339s-projects/greenheal_backend

2. **Click on your project**: `greenheal_backend`

3. **Go to Settings** (top menu)

4. **Click "Environment Variables"** (left sidebar)

5. **Add New Variable**:
   - Key: `STABILITY_API_KEY`
   - Value: `your-stability-api-key-here`
   - Environment: Select "Production", "Preview", and "Development"
   - Click "Save"

6. **Redeploy**:
   - Go to "Deployments" tab
   - Click the three dots (...) on the latest deployment
   - Click "Redeploy"
   - Wait for it to finish

## Verify It Works

Test your backend:

```bash
curl https://greenhealbackend.vercel.app/health
```

Should return:
```json
{"status":"ok","message":"GreenHeal Backend API is running"}
```

## After Adding API Key

Once the API key is added and redeployed, build a new APK:

```bash
eas build --platform android --profile preview
```

The visualization feature will now work through your backend! 🎉

# Backend API Keys Setup for APK Build

GreenHeal no longer embeds provider secrets in the mobile app.

## Important Rule

Do **not** add `OPENAI_API_KEY`, `PERENUAL_API_KEY`, or `STABILITY_API_KEY` to:

- `app.json`
- Expo `extra`
- EAS secrets for the mobile build
- any client-side `.env` consumed by the app bundle

Those keys must live on the **backend only**.

## What the APK Actually Needs

The APK only needs a working backend URL.

Current mobile config:

```json
"extra": {
  "BACKEND_URL": "https://greenhealbackend.vercel.app",
  "eas": {
    "projectId": "1a0cc7a9-b380-41f8-96d1-9e1205873bec"
  }
}
```

## Backend Secrets You Must Configure

Set these on the backend that the app will call:

```env
OPENAI_API_KEY=your-openai-api-key-here
PERENUAL_API_KEY=your-perenual-api-key-here
STABILITY_API_KEY=your-stability-api-key-here
PORT=3000
```

## Local Backend Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Add the three provider keys above
3. Start the backend with `cd backend && npm run dev`
4. If you want the mobile app to use the local backend, update `app.json` `expo.extra.BACKEND_URL`

## Hosted Backend Setup

If you deploy the backend to Vercel, Railway, or Render, add the same three environment variables in the hosting dashboard and redeploy.

## Build After Backend Setup

Once the backend is configured, run:

```bash
eas build --platform android --profile preview
```

Or use:

```bash
build-apk.bat
```

The build will take roughly 10-20 minutes and will return a download link when complete.

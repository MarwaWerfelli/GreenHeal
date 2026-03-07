# API Keys Setup for APK Build

You have **TWO OPTIONS** to add your API keys for the APK build:

## Option 1: Add Keys to app.json (EASIEST)

1. Open `app.json`
2. Find the `extra` section
3. Add your API keys:

```json
"extra": {
  "eas": {
    "projectId": "3efdec26-ca09-420c-a6d7-d2cf3f924762"
  },
  "OPENAI_API_KEY": "sk-your-actual-openai-key-here",
  "PERENUAL_API_KEY": "sk-your-actual-perenual-key-here"
}
```

4. Save the file
5. Run the build

⚠️ **Note**: Don't commit this file to Git with your keys! Add app.json to .gitignore if sharing code.

## Option 2: Use EAS Secrets (MORE SECURE)

Run these commands in your terminal:

```bash
eas secret:create --scope project --name OPENAI_API_KEY --value "sk-your-actual-openai-key"
eas secret:create --scope project --name PERENUAL_API_KEY --value "sk-your-actual-perenual-key"
```

To view your secrets:
```bash
eas secret:list
```

To delete a secret:
```bash
eas secret:delete --name OPENAI_API_KEY
```

## Getting Your API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Perenual API Key
1. Go to https://perenual.com/docs/api
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the key (starts with `sk-`)

## Which Option Should I Use?

- **Use Option 1 (app.json)** if:
  - You want the quickest setup
  - You're not sharing your code publicly
  - You're building for personal use

- **Use Option 2 (EAS Secrets)** if:
  - You're sharing code on GitHub
  - You want better security
  - You're building for production/distribution

## After Adding Keys

Run the build command:

```bash
eas build --platform android --profile preview
```

Or simply run:
```bash
./build-apk.bat
```

The build will take 10-20 minutes and you'll get a download link when complete!

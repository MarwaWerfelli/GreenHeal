# Complete Guide: How to Get API Keys

This guide will walk you through getting both API keys needed for GreenHeal's AI features.

---

## 🔑 1. OpenAI API Key (For AI Plant Analysis)

### Step 1: Create Account

1. Visit: **https://platform.openai.com/signup**
2. Sign up with:
   - Email address, OR
   - Google account, OR
   - Microsoft account
3. Verify your email

### Step 2: Add Payment Method

1. Go to: **https://platform.openai.com/account/billing**
2. Click **"Add payment method"**
3. Enter your credit/debit card details
4. **Set a spending limit** (recommended: $10 for testing)

💰 **Cost Info:**
- GPT-4o-mini: ~$0.15 per 1M input tokens
- For GreenHeal: ~$0.01-0.05 per room analysis
- $10 = approximately 200-1000 room analyses

### Step 3: Get Your API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Name it: "GreenHeal App"
4. Click **"Create secret key"**
5. **COPY THE KEY IMMEDIATELY** - you won't see it again!
6. Your key looks like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Set Usage Limits (Important!)

1. Go to: **https://platform.openai.com/account/limits**
2. Set **"Monthly budget"**: $10 (or your preferred amount)
3. Enable **"Email notifications"** for usage alerts
4. This prevents unexpected charges!

---

## 🌱 2. Perenual API Key (For Plant Database)

### Step 1: Create Account

1. Visit: **https://perenual.com/docs/api**
2. Click **"Get API Key"** or **"Sign Up"**
3. Fill in:
   - Your name
   - Email address
   - Password
4. Verify your email

### Step 2: Choose a Plan

**FREE PLAN** (Perfect for testing):
- ✅ 300 API calls per day
- ✅ Access to full plant database
- ✅ All plant information
- 💰 **Cost: $0**

**BASIC PLAN** (For regular use):
- ✅ 5,000 API calls per day
- ✅ All features
- 💰 **Cost: ~$7-15/month**

**PRO PLAN** (For heavy usage):
- ✅ Unlimited API calls
- ✅ Priority support
- 💰 **Cost: ~$30-50/month**

**Recommendation:** Start with FREE plan for testing!

### Step 3: Get Your API Key

1. After signing up, go to your **Dashboard**
2. Your API key will be displayed
3. It looks like: `sk-xxxxxxxxxxxxxxxxxxxxxxxx`
4. **Copy and save it**

---

## 📝 3. Add Keys to Your Backend

Do **not** add provider keys to `app.json`, Expo `extra`, or a mobile client `.env`.

### Option A: Local Backend

1. Open `backend/.env`
2. Add your keys there:

```env
OPENAI_API_KEY=your-openai-api-key-here
PERENUAL_API_KEY=your-perenual-api-key-here
STABILITY_API_KEY=your-stability-api-key-here
```

3. Start the backend from the `backend` folder
4. Point the mobile app at that backend by updating `expo.extra.BACKEND_URL` in `app.json` if needed

### Option B: Hosted Backend

1. Open your backend hosting dashboard
2. Add the same three environment variables there
3. Redeploy the backend
4. Keep the mobile app pointed at that backend URL

---

## ✅ 4. Test Your Keys

You can test provider keys directly before adding them to the backend, but the shipped mobile app should never contain them.

### Test OpenAI Key (Windows PowerShell)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_OPENAI_KEY_HERE"
}
$body = @{
    model = "gpt-4o-mini"
    messages = @(@{role="user"; content="Hello"})
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" -Method Post -Headers $headers -Body $body
```

If it works, you'll see a response with "Hello" reply!

### Test Perenual Key

Open this URL in your browser (replace YOUR_KEY):

```
https://perenual.com/api/species-list?key=YOUR_PERENUAL_KEY_HERE
```

If it works, you'll see a JSON response with plant data!

---

## 💰 5. Cost Summary

### For Testing (First Month)
- **OpenAI:** $10 one-time (covers 200-1000 analyses)
- **Perenual:** $0 (free plan, 300 calls/day)
- **Total:** $10

### For Regular Use (Monthly)
- **OpenAI:** $5-20/month (depending on usage)
- **Perenual:** $0 (free) or $7-15 (basic plan)
- **Total:** $5-35/month

---

## 🔒 6. Security Tips

### ✅ DO:
- Keep your API keys secret
- Set spending limits on OpenAI
- Monitor usage regularly
- Store provider keys in backend environment variables only
- Delete keys if compromised

### ❌ DON'T:
- Share keys publicly
- Commit keys to GitHub
- Leave unlimited spending enabled
- Use same keys for multiple apps
- Put provider keys in `app.json`, Expo `extra`, or the mobile bundle

---

## 🆘 7. Troubleshooting

### "Invalid API Key" Error

**OpenAI:**
- ✅ Check you copied the FULL key (starts with `sk-proj-`)
- ✅ Verify billing is set up
- ✅ Make sure key wasn't revoked

**Perenual:**
- ✅ Check you copied the full key
- ✅ Verify account is active
- ✅ Check you haven't exceeded daily limit

### "Insufficient Quota" (OpenAI)

- Add payment method
- Increase spending limit
- Check usage: https://platform.openai.com/usage

### "Rate Limit Exceeded" (Perenual)

- You hit the daily limit (300 for free plan)
- Wait 24 hours OR upgrade to paid plan

---

## 📋 8. Quick Checklist

Before building your APK:

- [ ] Created OpenAI account
- [ ] Added payment method to OpenAI
- [ ] Got OpenAI API key
- [ ] Set spending limit on OpenAI
- [ ] Created Perenual account
- [ ] Got Perenual API key
- [ ] Added both keys to `.env` file
- [ ] Tested both keys work
- [ ] Ready to build APK!

---

## 🔗 9. Important Links

### OpenAI
- Sign up: https://platform.openai.com/signup
- API Keys: https://platform.openai.com/api-keys
- Billing: https://platform.openai.com/account/billing
- Usage: https://platform.openai.com/usage
- Pricing: https://openai.com/api/pricing
- Support: https://help.openai.com

### Perenual
- Sign up: https://perenual.com/docs/api
- Dashboard: https://perenual.com/user/api
- Pricing: https://perenual.com/pricing
- Support: https://perenual.com/contact

---

## 🎯 10. What Happens Next?

Once you have both keys:

1. **Add them to `.env` file**
2. **Build the APK**: Run `eas build --platform android --profile preview`
3. **Wait 10-20 minutes** for build to complete
4. **Download APK** from the build link
5. **Install on your phone**
6. **Test AI features!**

The app will now have FULL functionality:
- ✅ AI room analysis
- ✅ Plant recommendations
- ✅ Plant database queries
- ✅ All other features

---

**Need help?** Check the troubleshooting section or visit the support links above!

**Ready to build?** Make sure both keys are in your `.env` file and run the build command! 🚀

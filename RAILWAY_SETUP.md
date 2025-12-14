# Railway Deployment Guide

## Setting up Google Sheets Credentials on Railway

Railway doesn't support uploading files directly, so you have **3 options** to configure your Google credentials:

### ✅ Option 1: JSON Credentials as Environment Variable (EASIEST for Railway)

1. Open your `credentials.json` file from Google Cloud Console
2. Copy the **entire JSON content** (all of it, as one string)
3. In Railway dashboard:
   - Go to your project → **Variables** tab
   - Click **+ New Variable**
   - Name: `GOOGLE_CREDENTIALS_JSON`
   - Value: Paste the entire JSON (make sure it's on one line, or Railway will handle it)
   - Click **Add**

4. Also add:
   - `GOOGLE_SHEET_ID` = your Google Sheet ID
   - `PORT` = 3000 (or Railway will auto-assign)

**Example:**
```
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"my-project","private_key_id":"abc123",...}
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### Option 2: Individual Environment Variables

If you prefer, you can extract values from your JSON:

1. In Railway, add these variables:
   - `GOOGLE_PRIVATE_KEY` = The `private_key` value from your JSON (keep the `\n` characters)
   - `GOOGLE_CLIENT_EMAIL` = The `client_email` value from your JSON
   - `GOOGLE_SHEET_ID` = your Google Sheet ID

**Note:** Make sure the private key includes the full key with `\n` characters preserved.

### Option 3: Build-time File (Advanced)

If you really need a file, you can:
1. Base64 encode your credentials.json
2. Store it as an environment variable
3. Decode and write it during Railway's build process

But **Option 1 is recommended** - it's the simplest and most secure.

## Quick Steps for Railway:

1. **Connect your GitHub repo** to Railway
2. **Add Environment Variables** in Railway dashboard:
   - `GOOGLE_CREDENTIALS_JSON` = (paste full JSON content)
   - `GOOGLE_SHEET_ID` = (your sheet ID)
3. **Deploy!** Railway will automatically build and deploy your app

## Getting Your Google Sheet ID

From your Google Sheet URL:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
```

Copy the part between `/d/` and `/edit` - that's your `GOOGLE_SHEET_ID`.

## Security Notes

- ✅ Never commit `credentials.json` to git (already in `.gitignore`)
- ✅ Railway environment variables are encrypted and secure
- ✅ Each Railway environment can have different credentials


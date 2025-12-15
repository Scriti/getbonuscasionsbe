# Railway Deployment Guide

## Setting up Firestore on Railway

Railway doesn't support uploading files directly, so you have **2 options** to configure your Firestore credentials:

### ✅ Option 1: JSON Credentials as Environment Variable (EASIEST for Railway)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Download the JSON file
4. Copy the **entire JSON content** (all of it, as one string)
5. In Railway dashboard:
   - Go to your project → **Variables** tab
   - Click **+ New Variable**
   - Name: `FIRESTORE_CREDENTIALS_JSON`
   - Value: Paste the entire JSON (make sure it's on one line, or Railway will handle it)
   - Click **Add**

6. Also add:
   - `FIRESTORE_PROJECT_ID` = `getbonuscasinos` (your Firebase project ID)
   - `PORT` = 3000 (or Railway will auto-assign)

**Example:**
```
FIRESTORE_CREDENTIALS_JSON={"type":"service_account","project_id":"getbonuscasinos","private_key_id":"abc123",...}
FIRESTORE_PROJECT_ID=getbonuscasinos
```

### Option 2: Use Default Credentials (Advanced)

If you're using Railway's built-in Firebase integration or have default credentials configured, you can just set:
- `FIRESTORE_PROJECT_ID` = `getbonuscasinos`

## Quick Steps for Railway:

1. **Connect your GitHub repo** to Railway
2. **Add Environment Variables** in Railway dashboard:
   - `FIRESTORE_CREDENTIALS_JSON` = (paste full JSON content from Firebase)
   - `FIRESTORE_PROJECT_ID` = `getbonuscasinos`
3. **Deploy!** Railway will automatically build and deploy your app

## Getting Your Firebase Project ID

From your Firebase Console:
- Go to **Project Settings** (gear icon)
- Your **Project ID** is shown at the top (e.g., `getbonuscasinos`)

## Firestore Collection

The service reads from the **`bonuses`** collection in Firestore. Make sure your documents have these fields:
- `id` (string)
- `brandName` (string)
- `logo` (string)
- `welcomeBonus` (string)
- `bonusDetails` (string)
- `wager` (string)
- `minDeposit` (string)
- `trackingLink` (string)
- `tags` (string - comma-separated, will be parsed into array)
- `type` (string | null)

## Security Notes

- ✅ Never commit `firestore-credentials.json` to git (already in `.gitignore`)
- ✅ Railway environment variables are encrypted and secure
- ✅ Each Railway environment can have different credentials

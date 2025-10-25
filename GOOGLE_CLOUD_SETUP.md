# 🔧 Google Cloud Storage Setup for Long Audio Files

## Why GCS is Needed

Google Speech-to-Text API has limitations:
- **Synchronous API (`recognize`)**: Max 60 seconds
- **Streaming API**: Max 5 minutes (also complex for this use case)
- **Long-running API (`longRunningRecognize`)**: Unlimited duration, but requires audio in GCS

For interview responses that may exceed 1 minute, we'll use GCS + LongRunningRecognize.

---

## 📝 Step-by-Step Setup in Google Cloud Console

### 1. Create a Google Cloud Storage Bucket

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project** (the same one with Speech-to-Text API enabled)
3. **Navigate to Cloud Storage**:
   - Click the hamburger menu (☰) → **Cloud Storage** → **Buckets**
4. **Click "CREATE BUCKET"**

5. **Configure the bucket:**

   **Step 1: Name your bucket**
   - Bucket name: `interview-coach-audio` (must be globally unique)
   - If taken, try: `interview-coach-audio-[your-initials]` or `interview-coach-audio-[random-number]`
   - Click **CONTINUE**

   **Step 2: Choose where to store your data**
   - Location type: **Region** (cheaper and faster)
   - Location: Choose closest to you (e.g., `us-central1`, `us-east1`, `asia-south1`)
   - Click **CONTINUE**

   **Step 3: Choose a storage class**
   - Default class: **Standard**
   - Click **CONTINUE**

   **Step 4: Access control**
   - Access control: **Uniform** (recommended)
   - Uncheck "Enforce public access prevention"
   - Click **CONTINUE**

   **Step 5: Protect your data**
   - Protection tools: Leave defaults
   - Click **CREATE**

6. **Your bucket is created!** Note down the exact bucket name.

---

### 2. Set Bucket Permissions

You need to ensure your service account can write to the bucket:

1. **Click on your newly created bucket** name
2. **Go to "PERMISSIONS" tab**
3. **Click "GRANT ACCESS"**
4. **Add your service account:**
   - New principals: Paste your service account email
     - Find it in your JSON key file: `client_email` field
     - Should look like: `your-project@your-project.iam.gserviceaccount.com`
   - Role: **Storage Object Admin**
   - Click **SAVE**

---

### 3. Set Lifecycle Policy (Optional but Recommended)

To auto-delete old audio files and save costs:

1. **In your bucket, go to "LIFECYCLE" tab**
2. **Click "ADD A RULE"**
3. **Configure:**
   - Action: **Delete object**
   - Condition: **Age** → `1` day
   - Click **CREATE**

This will automatically delete audio files older than 24 hours (you don't need to keep them forever).

---

### 4. Verify Your Service Account Has Required APIs

Make sure these APIs are enabled in your Google Cloud Project:

1. **Go to APIs & Services** → **Enabled APIs & services**
2. **Verify these are enabled:**
   - ✅ Cloud Speech-to-Text API
   - ✅ Cloud Storage API (should be enabled by default)

If not enabled:
- Click **+ ENABLE APIS AND SERVICES**
- Search for "Cloud Storage API"
- Click **ENABLE**

---

## 🔑 What You'll Need

After setup, you should have:

1. **Bucket Name**: e.g., `interview-coach-audio`
2. **Service Account JSON Key**: Already have from STT setup
3. **Service Account with Permissions**:
   - Speech-to-Text API User
   - Storage Object Admin (on your bucket)

---

## 🌍 Bucket Name Examples

Choose one that's unique:
- `interview-coach-audio-pankaj`
- `interview-coach-audio-2024`
- `interview-coach-temp-audio`
- `ic-stt-audio-files`

---

## 💰 Costs (Approximate)

**Cloud Storage Pricing:**
- Standard Storage: $0.020 per GB per month
- Class A Operations (uploads): $0.05 per 10,000 operations
- With lifecycle deletion after 1 day, costs are minimal

**Example:**
- 100 interviews/day
- 2 MB average audio file
- = 200 MB/day = 6 GB/month
- **Cost: ~$0.12/month** 🎉

**Long-Running Recognition:**
- Same pricing as regular Speech-to-Text
- $0.006 per 15 seconds (enhanced model)

---

## ✅ Verification Checklist

Before proceeding with code:
- [ ] Bucket created with a unique name
- [ ] Service account has "Storage Object Admin" role on bucket
- [ ] Lifecycle policy set to delete after 1 day (optional)
- [ ] Cloud Storage API enabled
- [ ] Noted down bucket name for `.env` file

---

## 🚀 Next Steps

Once you complete the above:
1. Tell me your **bucket name**
2. I'll update the code to:
   - Upload audio files to GCS
   - Use LongRunningRecognize API with GCS URIs
   - Handle audio of any length
3. Add bucket name to `.env` file

---

## 🆘 Troubleshooting

**Error: "Bucket name already taken"**
- Bucket names are globally unique across all Google Cloud
- Try adding your initials or random numbers

**Error: "Permission denied"**
- Ensure service account has "Storage Object Admin" role
- Check that you granted access on the correct bucket

**Error: "Cloud Storage API not enabled"**
- Go to APIs & Services → Enable Cloud Storage API

**Where is my service account email?**
- Open your JSON key file
- Look for `"client_email"` field
- Copy the full email address

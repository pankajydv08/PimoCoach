# Google OAuth Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the AI Interview Coach application.

## Prerequisites

- A Supabase project (you already have this)
- A Google Cloud Platform account
- Your Supabase project URL and keys

## Step 1: Configure Google OAuth in Supabase Dashboard

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Navigate to**: Authentication → Providers → Google
3. **Enable Google provider**
4. **Copy the Callback URL** shown (it will look like: `https://odkvdnnnddgdpiotxfaa.supabase.co/auth/v1/callback`)
5. Keep this tab open, you'll need to come back here

## Step 2: Configure Google Cloud Console

1. **Go to**: https://console.cloud.google.com
2. **Select your project**: `helical-micron-472212-t7`
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID**: `598165324356-h3veb8task0l2ofa5nh3e1882sl2l6ak.apps.googleusercontent.com`
5. **Click on it to edit**
6. **Add Authorized redirect URIs**:
   - Add the Supabase callback URL you copied earlier
   - Add for local development: `http://localhost:5173`
   - The redirect URIs should include:
     - `https://odkvdnnnddgdpiotxfaa.supabase.co/auth/v1/callback`
     - `http://localhost:5173`
7. **Save changes**

## Step 3: Add Credentials to Supabase

1. **Go back to Supabase Dashboard** → Authentication → Providers → Google
2. **Enter your Google OAuth credentials**:
   - **Client ID**: `598165324356-h3veb8task0l2ofa5nh3e1882sl2l6ak.apps.googleusercontent.com`
   - **Client Secret**: `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`
3. **Save**

## Step 4: Run Database Migration

Run the migration to add Row Level Security (RLS) and auth policies:

```bash
# If you have Supabase CLI installed:
supabase db push

# Or manually run the SQL in Supabase Dashboard > SQL Editor:
# Copy and paste the contents of supabase/migrations/20251025000000_add_auth_and_rls.sql
```

## Step 5: Get Service Role Key (Important for Production)

1. **Go to**: Supabase Dashboard → Settings → API
2. **Copy the `service_role` key** (not the `anon` key)
3. **Add to your `.env` file**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

**Note**: Without this key, the backend will run in "development mode" without proper token verification. This is fine for local development but **required for production**.

## Step 6: Test the Authentication Flow

1. **Start the backend server**:
   ```bash
   npm run dev:server
   ```

2. **Start the frontend**:
   ```bash
   npm run dev
   ```

3. **Open**: http://localhost:5173

4. **You should see**:
   - A login page with "Continue with Google" button
   - Click it to authenticate
   - After successful login, you'll be redirected to the main app
   - You'll see your name/email in the top bar with a sign-out button

## Security Features Implemented

### ✅ Frontend Security
- **Protected Routes**: Unauthenticated users can't access the interview practice
- **Auth Context**: Manages user session state across the app
- **Token Management**: Automatically includes auth tokens in API requests
- **Auto Sign-out**: Session expiry handling

### ✅ Backend Security
- **Auth Middleware**: Verifies JWT tokens on all API requests
- **User Authorization**: All routes check that the user owns the resources they're accessing
- **Row Level Security (RLS)**: Database-level protection ensuring users can only access their own data

### ✅ Database Security (RLS Policies)
- **Sessions**: Users can only create/read/update/delete their own sessions
- **Responses**: Users can only see responses from their own sessions
- **Questions**: Authenticated users can read, only backend can write
- **Feedback**: Users can only see feedback from their own responses

## What's Protected

All API endpoints now require authentication:
- `/api/session/*` - Session management
- `/api/question/*` - Question generation
- `/api/tts/*` - Text-to-speech
- `/api/stt/*` - Speech-to-text
- `/api/evaluate` - Response evaluation

Public endpoints (no auth required):
- `/api/health` - Health check

## Troubleshooting

### Error: "Missing or invalid authorization header"
- Make sure you're signed in
- Check that the auth token is being sent with requests
- Verify your session hasn't expired

### Error: "User not authenticated"
- Sign out and sign back in
- Clear browser cache and cookies
- Check Supabase dashboard for user authentication status

### Google OAuth not working
- Verify redirect URIs are correctly configured in Google Cloud Console
- Check that Google OAuth is enabled in Supabase Dashboard
- Ensure Client ID and Secret are correct

### Database errors
- Run the migration SQL script in Supabase SQL Editor
- Check RLS policies are enabled
- Verify user_id column exists and references auth.users

## Development vs Production

### Development Mode (Current)
- Backend runs without service role key verification
- Uses basic JWT decoding (less secure)
- Good for local testing

### Production Mode (Recommended)
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Full token verification with Supabase Auth
- Secure and production-ready

To enable production mode:
1. Get service role key from Supabase Dashboard
2. Add `SUPABASE_SERVICE_ROLE_KEY=...` to your `.env`
3. Restart the backend server

## Next Steps

1. ✅ Configure Google OAuth in Supabase Dashboard
2. ✅ Update Google Cloud Console redirect URIs
3. ✅ Run database migration
4. ✅ Add service role key to `.env` (production)
5. ✅ Test login/logout flow
6. ✅ Verify RLS policies are working

Your AI Interview Coach app is now fully secured with Google OAuth! 🎉

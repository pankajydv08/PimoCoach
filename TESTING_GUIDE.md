# Quick Test Guide - Google OAuth Authentication

## 🚀 Quick Start

1. **Configure Google OAuth in Supabase** (see AUTH_SETUP.md for detailed steps)
2. **Start servers**:
   ```powershell
   # Terminal 1 - Backend
   npm run dev:server
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

3. **Open** http://localhost:5173

## ✅ What to Test

### 1. Login Flow
- [ ] See login page with Google button
- [ ] Click "Continue with Google"
- [ ] Google OAuth popup appears
- [ ] Select your Google account
- [ ] Redirected back to app
- [ ] See your name/email in top bar

### 2. Protected Routes
- [ ] Can't access interview without login
- [ ] After login, can start interview session
- [ ] All API calls include auth token

### 3. User-Specific Data
- [ ] Each user only sees their own sessions
- [ ] Can't access other users' data
- [ ] Sessions are properly linked to user ID

### 4. Sign Out
- [ ] Click "Sign Out" button
- [ ] Redirected to login page
- [ ] Can't access protected routes
- [ ] Must sign in again to continue

## 🔍 Verification Checklist

### Browser Console
```javascript
// Check if user is authenticated
localStorage.getItem('supabase.auth.token')

// Should see token object with access_token
```

### Network Tab (DevTools)
- [ ] API requests include `Authorization: Bearer <token>` header
- [ ] Responses return 401 if not authenticated
- [ ] Responses return 200 if authenticated

### Backend Logs
```
🎙️  AI Interview Coach API running on port 5000
📊 Health check: http://localhost:5000/api/health
🔐 Authentication: Development mode (unverified)
```

## 🐛 Common Issues & Fixes

### Issue: "Missing or invalid authorization header"
**Fix**: User not logged in or token expired
- Sign out and sign back in
- Clear browser storage

### Issue: Redirect loop after Google login
**Fix**: Check redirect URIs in Google Cloud Console
- Must include Supabase callback URL
- Must include `http://localhost:5173`

### Issue: "User not authenticated" despite being logged in
**Fix**: Session not synced
- Refresh the page
- Check browser console for errors
- Verify Supabase project is accessible

### Issue: Backend shows "Development mode"
**Fix**: Service role key not configured (optional for dev)
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- Get key from Supabase Dashboard > Settings > API
- Restart backend server

## 📊 Test Scenarios

### Scenario 1: New User First Login
1. User clicks "Continue with Google"
2. Completes Google OAuth flow
3. User profile auto-created in database
4. Redirected to main app
5. Can start interview session

### Scenario 2: Returning User
1. User previously authenticated
2. Session cookie/token still valid
3. Auto-logged in on page load
4. Can access all features immediately

### Scenario 3: Expired Session
1. User's token has expired
2. Automatic redirect to login
3. User re-authenticates
4. Seamlessly continues

### Scenario 4: Multiple Users
1. User A logs in, creates session
2. User A logs out
3. User B logs in
4. User B cannot see User A's sessions
5. RLS policies enforced at database level

## 🔐 Security Verification

### Test RLS Policies
Open Supabase Dashboard > SQL Editor and run:

```sql
-- Check sessions are user-scoped
SELECT * FROM interview_sessions WHERE user_id != auth.uid();
-- Should return 0 rows (or error if RLS working)

-- Check your own sessions
SELECT * FROM interview_sessions WHERE user_id = auth.uid();
-- Should return only your sessions
```

### Test API Authorization
```bash
# Without token (should fail)
curl http://localhost:5000/api/session/start -X POST

# With token (should succeed)
curl http://localhost:5000/api/session/start \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"session_type": "general"}'
```

## ✨ Expected Behavior

### ✅ Login Page
- Clean, professional UI
- Google logo and branding
- Feature list display
- Loading states during auth

### ✅ Main App (After Login)
- User info bar at top
- Profile picture (if available from Google)
- Name and email displayed
- Sign out button accessible
- Interview practice fully functional

### ✅ API Calls
- All requests authenticated
- User context available in backend
- RLS enforced at database
- Proper error handling

## 🎉 Success Indicators

- ✅ Can log in with Google account
- ✅ Profile info displayed correctly
- ✅ Can create and access interview sessions
- ✅ Cannot access other users' data
- ✅ Can sign out and sign back in
- ✅ Backend logs show authentication status
- ✅ Network requests include auth headers

Your authentication is working if all indicators are green! 🚀

# 🔧 Troubleshooting Guide

## Issues Fixed

### ✅ 1. Google STT Audio Length Error
**Error:** `Sync input too long. For audio longer than 1 min use LongRunningRecognize`

**Solution Implemented:**
- Updated `server/utils/googleSTT.ts` with automatic fallback to streaming recognition
- Audio >55 seconds now uses `streamingRecognize()` API instead of `recognize()`
- Added retry logic: if sync recognition fails, automatically retries with streaming
- No user-facing changes needed - handles long audio transparently

**Technical Details:**
```typescript
// Automatically detects audio duration
const approximateDurationSeconds = audioBuffer.length / (48000 * 2);

// Uses streaming API for long audio
if (approximateDurationSeconds > 55) {
  return await transcribeAudioBufferStreaming(audioBuffer);
}
```

---

### ✅ 2. TypeScript Compilation Errors
**Errors:** Unused imports causing build failures

**Solution Implemented:**
- Removed unused imports: `InterviewQuestion`, `ArrowLeft`, `Settings`, `onExit`
- Fixed TypeScript type annotations for Google Speech API
- All compilation errors resolved

---

### ⚠️ 3. Network Access Error (EACCES)
**Error:** `connect EACCES 172.64.149.246:443` (Supabase connection blocked)

**Root Cause:** Windows Firewall blocking Node.js outbound connections

**Solution Options:**

#### Option A: Automated Fix (Recommended)
1. **Run the firewall fix script as Administrator:**
   ```powershell
   # Right-click PowerShell → "Run as Administrator"
   cd C:\Users\panks\Downloads\interviewcoach\project
   .\fix-firewall.ps1
   ```
   
   This script will:
   - Locate your Node.js installation
   - Create firewall rules allowing:
     - Outbound: HTTPS/HTTP (ports 443, 80) for Supabase
     - Inbound: Dev servers (ports 5000, 5173)

#### Option B: Manual Firewall Configuration
1. Open **Windows Security**
2. Go to **Firewall & network protection**
3. Click **Allow an app through firewall**
4. Click **Change settings** (requires admin)
5. Click **Allow another app...**
6. Browse to: `C:\Program Files\nodejs\node.exe`
7. Add and check **both Private and Public** boxes

#### Option C: Temporary Disable (Testing Only)
1. Open **Windows Security** → **Firewall & network protection**
2. Click **Private network**
3. Turn off **Windows Defender Firewall** (temporarily)
4. Test if app works
5. **Re-enable firewall after testing**

#### Option D: Check Antivirus
If you have third-party antivirus (Norton, McAfee, Avast, etc.):
1. Open antivirus settings
2. Add exception for `node.exe`
3. Allow network connections for Node.js

---

## How to Restart and Test

### 1. Close Existing Terminals
Close both terminal windows running the dev servers.

### 2. Fix Firewall (Choose one option above)
Run the PowerShell script or configure manually.

### 3. Restart Development Servers

**Terminal 1 - Backend:**
```powershell
cd C:\Users\panks\Downloads\interviewcoach\project\server
npm run dev:server
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\panks\Downloads\interviewcoach\project
npm run dev
```

### 4. Verify Success
You should see:
- ✅ `🔐 Authentication: Enabled (verified)` (no more EACCES errors)
- ✅ Backend running on `http://localhost:5000`
- ✅ Frontend running on `http://localhost:5173`

### 5. Test the App
1. Open browser to `http://localhost:5173`
2. Log in with Google
3. Start an interview session
4. Record a response (try recording >1 minute to test new STT feature)
5. Check Dashboard for session history

---

## Still Having Issues?

### Network Diagnostics
```powershell
# Test Supabase connectivity
Test-NetConnection lvsbudgwsujdrhimuqci.supabase.co -Port 443

# Should show: TcpTestSucceeded : True
```

### Check Firewall Rules
```powershell
# List Node.js firewall rules
Get-NetFirewallRule -DisplayName "*Node*" | Format-Table DisplayName, Enabled, Direction, Action
```

### Environment Variables
Make sure `.env` file has:
```env
VITE_SUPABASE_URL=https://lvsbudgwsujdrhimuqci.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GITHUB_TOKEN=your_github_token
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
```

### Corporate Network/VPN
If you're on a corporate network:
- VPN may block certain connections
- Proxy settings may need configuration
- Contact IT department for firewall exceptions

---

## What's New in This Fix

1. **Smart Audio Handling:**
   - Automatically handles both short and long audio recordings
   - No manual intervention needed
   - Better error messages

2. **Firewall Automation:**
   - One-click script to configure Windows Firewall
   - Safer than disabling firewall completely
   - Properly scoped rules (only needed ports)

3. **Code Quality:**
   - Fixed all TypeScript compilation errors
   - Proper type annotations
   - Clean build process

---

## Next Steps After Fixing

Once everything is running:
1. Test Practice Mode with various response lengths
2. Test Train Mode with custom job descriptions
3. Check Dashboard displays session history correctly
4. Verify Google OAuth still works
5. Test Pimsleur repetition cycle

If you encounter any other issues, check the console logs in both terminals for detailed error messages.

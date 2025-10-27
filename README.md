# AI Pimsleur-Style Interview Coach

An interactive voice-based interview training application that uses the proven Pimsleur language learning methodology adapted for interview practice. Practice answering interview questions with real-time AI feedback on clarity, confidence, and technical accuracy.

## 🎯 Features

### Core Features
- **🔐 Google OAuth Authentication**: Secure sign-in with Google account
- **🎓 Two Learning Modes**: 
  - **Practice Mode**: Answer questions yourself and get feedback
  - **Train Mode**: Learn from AI model answers with Pimsleur method
- **📝 Custom Training**: Generate job-specific questions from job descriptions
- **🎙️ Voice Interaction**: Natural speech synthesis (TTS) and speech recognition (STT)
- **🤖 AI Evaluation**: GitHub Models GPT-4o powered analysis
- **📊 Real-time Feedback**: Immediate constructive feedback
- **🔄 Pimsleur Method**: Sentence-by-sentence repetition with dynamic pauses
- **📈 Session Analytics**: Track your progress over time

### Security Features
- **🔒 Row Level Security (RLS)**: Database-level data protection
- **👤 User-Specific Data**: Each user can only access their own sessions
- **🎫 JWT Authentication**: Secure token-based API access
- **🛡️ Protected Routes**: Frontend route protection

## 🏗️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Lucide React for icons
- Supabase Auth for authentication

### Backend
- Node.js with Express + TypeScript
- GitHub Models API (GPT-4o) for AI evaluation
- Google Cloud Text-to-Speech for voice synthesis
- Google Cloud Speech-to-Text for transcription
- Supabase for database and authentication

## 📋 Prerequisites

Before running this application, you need:

1. **Supabase Account**
   - Project URL and anon key (already configured)
   - Service role key (for production)

2. **Google Cloud Account**
   - Project with TTS and STT APIs enabled
   - OAuth 2.0 credentials configured
   - Service account credentials JSON file

3. **GitHub Account**
   - GitHub Models API access
   - Personal access token

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update the `.env` file:

```env
# Supabase (already configured)
VITE_SUPABASE_URL=https://odkvdnnnddgdpiotxfaa.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# IMPORTANT: For production, add service role key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API Base URL
VITE_API_URL=http://localhost:5000/api

# GitHub Models API
GITHUB_TOKEN=your_github_token_here
GITHUB_MODEL=gpt-4o

# Google Cloud (for TTS/STT)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json

# Google OAuth (already configured)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### 3. Set Up Google OAuth Authentication

**📖 See [AUTH_SETUP.md](./AUTH_SETUP.md) for detailed instructions**

Quick steps:
1. Configure Google OAuth in Supabase Dashboard
2. Add redirect URIs in Google Cloud Console
3. Run database migration for RLS policies
4. Test the login flow

### 4. Set Up Google Cloud Services

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API
3. Download service account credentials JSON
4. Update `GOOGLE_APPLICATION_CREDENTIALS` in `.env`

### 5. Database Setup

Run the authentication and RLS migration:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: Manual via Supabase Dashboard
# Copy SQL from: supabase/migrations/20251025000000_add_auth_and_rls.sql
# Run in: Supabase Dashboard > SQL Editor
```

## 🎮 Running the Application

### Development Mode

Run both servers:

**Terminal 1 - Backend API:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Access the app:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

### Production Build

```bash
npm run build
```

## 🔐 Authentication Flow

1. **User visits app** → Sees login page
2. **Clicks "Continue with Google"** → OAuth popup
3. **Google authentication** → User grants permission
4. **Redirect to app** → User profile created automatically
5. **Access protected features** → All API calls authenticated
6. **Sign out** → Clears session, redirects to login

## 🎯 How It Works

### Practice Mode
1. Listen to interview question
2. Record your answer
3. Get AI feedback on clarity, confidence, and accuracy
4. Move to next question

### Train Mode (Pimsleur Method)

**Default Training:**
1. Hear interview question
2. AI provides expert model answer
3. Answer split into sentences
4. **For each sentence:**
   - Hear sentence
   - Dynamic pause (based on sentence length)
   - Repeat the sentence (no recording)
5. Try answering the question yourself
6. Get evaluation and feedback

**Custom Training (Job-Based):**
1. Paste job description
2. GPT generates relevant questions & answers
3. Same Pimsleur learning flow
4. Questions tailored to the specific role

### AI Evaluation Metrics

The system evaluates:
- **Clarity Score (0-100)**: Structure and understandability
- **Confidence Score (0-100)**: Natural delivery and assurance
- **Technical Accuracy (0-100)**: Correctness and relevance
- **Speech Patterns**: Filler words, pace, pauses

## 🔒 Security Features

### Frontend Security
- ✅ Protected routes (login required)
- ✅ Auth context for session management
- ✅ Automatic token inclusion in API calls
- ✅ Session expiry handling

### Backend Security
- ✅ JWT token verification on all routes
- ✅ User authorization checks
- ✅ Request validation
- ✅ CORS protection

### Database Security (RLS)
- ✅ Users can only access their own sessions
- ✅ Users can only see their own responses
- ✅ Authenticated users can read questions
- ✅ Service role required for writing questions
- ✅ Automatic user profile creation

## 📡 API Endpoints

**📖 See [docs/API.md](./docs/API.md) for complete API documentation with examples**

**📋 OpenAPI Specification: [swagger.yml](./swagger.yml)** - Import into Postman or Swagger Editor

### Quick Reference

#### Public Routes
- `GET /api/health` - Health check

#### Protected Routes (Auth Required)

**Session Management**
- `POST /api/session/start` - Create new session
- `GET /api/session/:id` - Get session details
- `PUT /api/session/:id` - Update session
- `POST /api/session/:id/complete` - Complete session
- `GET /api/session/:id/responses` - Get all responses
- `GET /api/session/user/history` - Get user session history

**Interview Questions**
- `POST /api/question/next` - Get next question
- `POST /api/question/model-answer` - Generate model answer
- `POST /api/question/custom-qa` - Generate custom Q&A from job description
- `GET /api/question/:id` - Get question by ID

**Voice Services**
- `POST /api/tts/synthesize` - Text to speech
- `POST /api/stt/transcribe` - Speech to text

**Evaluation**
- `POST /api/evaluate` - Evaluate user response with GPT-4o

For detailed request/response formats, authentication, and examples, see the [API Documentation](./docs/API.md).

## 📁 Project Structure

```
├── server/                  # Backend API
│   ├── middleware/         # Auth middleware
│   │   └── auth.ts        # JWT verification
│   ├── routes/             # API route handlers
│   ├── utils/              # Service modules
│   │   ├── azureGPT.ts    # GitHub Models GPT integration
│   │   ├── googleSTT.ts   # Speech-to-Text
│   │   ├── googleTTS.ts   # Text-to-Speech
│   │   └── supabase.ts    # Database client
│   └── server.ts           # Express server
├── src/
│   ├── components/         # React components
│   │   ├── Login.tsx            # Login page
│   │   ├── ProtectedRoute.tsx   # Route guard
│   │   ├── AudioPlayer.tsx      # Audio playback
│   │   ├── MicButton.tsx        # Recording control
│   │   ├── InterviewPractice.tsx # Main interface
│   │   └── SessionAnalytics.tsx  # Progress tracking
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx     # Auth state management
│   ├── hooks/              # Custom React hooks
│   │   └── usePimsleurCycle.ts # State machine
│   ├── services/           # API client
│   │   └── api.ts         # API calls with auth
│   ├── lib/                # Utilities
│   │   └── supabase.ts    # Supabase client
│   └── types/              # TypeScript types
└── supabase/               # Database
    └── migrations/         # SQL migrations
```

## 🧪 Testing

**📖 See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed testing instructions**

Quick test checklist:
- [ ] Can log in with Google
- [ ] User profile displays correctly
- [ ] Can create interview sessions
- [ ] Cannot access other users' data
- [ ] Can sign out successfully
- [ ] API calls include auth headers

## 🐛 Troubleshooting

### Authentication Issues

**Error: "Missing or invalid authorization header"**
- Sign out and sign back in
- Clear browser cache/cookies
- Check Supabase session in localStorage

**Google OAuth not working**
- Verify redirect URIs in Google Cloud Console
- Check OAuth credentials in Supabase Dashboard
- Ensure callback URL is correct

### Database Issues

**Error: "Failed to create session"**
- Check RLS policies are enabled
- Run the migration SQL script
- Verify user_id references auth.users

**Cannot see own data**
- Check RLS policies in Supabase Dashboard
- Verify auth.uid() is working
- Check user is properly authenticated

### API Issues

**401 Unauthorized**
- Token expired - re-authenticate
- Missing auth header - check API client
- Service role key not set (production)

**Backend shows "Development mode"**
- Normal for local development
- Add `SUPABASE_SERVICE_ROLE_KEY` for production
- Get key from Supabase Dashboard > Settings > API

## 📚 Documentation

- **[docs/API.md](./docs/API.md)** - Complete API documentation with examples
- **[swagger.yml](./swagger.yml)** - OpenAPI 3.0 specification
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Complete authentication setup guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing and verification guide
- [Supabase Docs](https://supabase.com/docs) - Database and auth documentation
- [GitHub Models](https://github.com/marketplace/models) - AI model documentation

## 🎓 Learning Resources

- [Pimsleur Method](https://www.pimsleur.com/learn/blog/how-the-pimsleur-method-works) - Language learning methodology
- [Interview Best Practices](https://www.thebalancecareers.com/top-interview-tips-2061328) - Interview preparation tips

## 📄 License

MIT

## 💬 Support

For issues or questions:
- Check [AUTH_SETUP.md](./AUTH_SETUP.md) for authentication help
- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing help
- Review Supabase Dashboard for database issues
- Check browser console for frontend errors
- Check server logs for backend errors

# GitHub Copilot Instructions for PimoCoach

## Project Overview

PimoCoach is an AI-powered interview training application that uses the Pimsleur language learning methodology adapted for interview practice. The app provides voice-based interview training with real-time AI feedback.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Supabase Auth** for authentication
- **Chart.js** with react-chartjs-2 for analytics visualization

### Backend
- **Node.js** with Express + TypeScript
- **GitHub Models API (GPT-4o)** for AI evaluation
- **Google Cloud Text-to-Speech** for voice synthesis
- **Google Cloud Speech-to-Text** for transcription
- **AssemblyAI** for alternative speech-to-text
- **Supabase** for database and authentication

## Build, Lint, and Test Commands

```bash
# Install dependencies
npm install

# Development - Frontend (runs on http://localhost:5173)
npm run dev

# Development - Backend (runs on http://localhost:5000)
npm run dev:server

# Build for production
npm run build

# Lint code
npm run lint

# Type check
npm run typecheck

# Preview production build
npm run preview
```

## Project Structure

```
├── server/                  # Backend API (Express + TypeScript)
│   ├── middleware/         # Auth middleware
│   │   └── auth.ts        # JWT verification with Supabase
│   ├── routes/             # API route handlers
│   ├── types/              # Backend TypeScript types
│   ├── utils/              # Service modules (GPT, TTS, STT, Supabase)
│   └── server.ts           # Express server setup
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API client
│   ├── lib/                # Utilities (Supabase client)
│   ├── types/              # Frontend TypeScript types
│   └── utils/              # Helper utilities
├── supabase/               # Database
│   └── migrations/         # SQL migrations
└── docs/                   # Documentation
```

## Coding Conventions

### TypeScript
- **Always use TypeScript** for all `.ts` and `.tsx` files
- **Define interfaces** for component props, API responses, and data structures
- **Use type imports** when importing only types: `import type { ChartData } from 'chart.js'`
- **Avoid `any` type** - use proper typing or `unknown` if necessary

### React Components
- **Use functional components** with hooks (no class components)
- **Export as named exports**: `export function ComponentName() { }`
- **Use `useCallback`** for event handlers to optimize re-renders
- **Use `useMemo`** for expensive computations
- **Import React hooks from 'react'**: `import { useState, useEffect } from 'react'`

### Import Organization
Follow this order for imports:
1. React and React hooks
2. Third-party libraries
3. Local components
4. Services and API
5. Types
6. Utilities
7. Icons (from lucide-react)

Example:
```typescript
import { useState, useCallback } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { startSession, getNextQuestion } from '../services/api';
import { InterviewSession, Evaluation } from '../types';
import { Loader2, CheckCircle2 } from 'lucide-react';
```

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';

// 2. Interface definitions
interface MyComponentProps {
  prop1: string;
  prop2?: number;
}

// 3. Component function
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // 4. State hooks
  const [state, setState] = useState<string>('');
  
  // 5. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 6. Callbacks
  const handleClick = useCallback(() => {
    // ...
  }, []);
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### API and Services
- **All API calls go through** `src/services/api.ts`
- **Include auth token** in all authenticated API requests
- **Use async/await** for asynchronous operations
- **Handle errors gracefully** with try-catch blocks
- **Return typed responses** from API functions

### Authentication
- **Use `AuthContext`** for authentication state
- **Protect routes** with `ProtectedRoute` component
- **Include Bearer token** in API headers: `Authorization: Bearer ${token}`
- **Backend auth middleware** (`authMiddleware`) verifies JWT tokens
- **Use Supabase Auth** for user management

### State Management
- **Use React Context** for global state (e.g., AuthContext)
- **Use local state** (`useState`) for component-specific state
- **Use custom hooks** for complex state logic (e.g., `usePimsleurCycle`)
- **Keep state minimal** - derive values when possible

### Styling
- **Use Tailwind CSS** utility classes
- **Follow mobile-first** responsive design
- **Use Tailwind color palette** (e.g., `bg-blue-500`, `text-gray-700`)
- **Avoid inline styles** unless dynamic styling is required
- **Use Lucide React** for all icons

### Error Handling
- **Display user-friendly error messages** in the UI
- **Log errors to console** for debugging
- **Use try-catch** for async operations
- **Return error responses** with appropriate HTTP status codes

### Security Practices
- **Never commit secrets** - use environment variables
- **Use Row Level Security (RLS)** in Supabase for data protection
- **Validate user input** on both client and server
- **Use prepared statements** or ORM queries to prevent SQL injection
- **Verify JWT tokens** on protected routes

### Database (Supabase)
- **Use RLS policies** to restrict data access by user
- **Reference `auth.users`** for user IDs
- **Use `auth.uid()`** in RLS policies to get current user
- **Create migrations** in `supabase/migrations/` directory

## Environment Variables

Required environment variables (see `.env.example`):

**Frontend (prefixed with VITE_):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

**Backend:**
- `GITHUB_TOKEN` - GitHub Models API token
- `GITHUB_MODEL` - Model name (default: gpt-4o)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud credentials JSON
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (production)
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key
- `PORT` - Server port (default: 5000)

## Key Features and Patterns

### Pimsleur Method Implementation
- **Sentence-by-sentence repetition** with dynamic pauses
- **State machine** implemented in `usePimsleurCycle` hook
- **Dynamic pause calculation** based on sentence length
- States: `listening_question`, `generating_answer`, `learning_sentence`, `pausing`, `recording_user`, `evaluating`, `showing_feedback`, `completed`

### Interview Modes
1. **Practice Mode** - Answer questions and get AI feedback
2. **Train Mode** - Learn from AI model answers with Pimsleur method
   - Default: Pre-defined questions
   - Custom: Generate questions from job description

### AI Evaluation
- Uses **GitHub Models GPT-4o** for response evaluation
- Evaluates **clarity, confidence, and technical accuracy** (0-100 scores)
- Provides **constructive feedback** on speech patterns

### Voice Interaction
- **Text-to-Speech**: Google Cloud TTS for question playback
- **Speech-to-Text**: AssemblyAI or Google Cloud STT for transcription
- **Audio handling**: Base64-encoded audio in API responses

## Common Tasks

### Adding a New API Endpoint
1. Create route handler in `server/routes/`
2. Add route to `server/server.ts` with appropriate middleware
3. Add API client function in `src/services/api.ts`
4. Define types in `src/types/` and `server/types/`

### Adding a New React Component
1. Create component file in `src/components/`
2. Use TypeScript and define props interface
3. Export as named export
4. Follow component structure conventions
5. Use Tailwind CSS for styling

### Database Changes
1. Create migration file in `supabase/migrations/`
2. Include RLS policies for user data protection
3. Test migration locally
4. Document changes in migration comments

## Documentation

Refer to these documentation files for detailed information:
- **[README.md](../README.md)** - Setup and usage guide
- **[docs/API.md](../docs/API.md)** - Complete API documentation
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines
- **[TESTING_GUIDE.md](../TESTING_GUIDE.md)** - Testing instructions
- **[swagger.yml](../swagger.yml)** - OpenAPI specification

## Testing Checklist

When making changes:
- [ ] Run `npm run lint` to check for code issues
- [ ] Run `npm run typecheck` to verify TypeScript types
- [ ] Test authentication flow (login/logout)
- [ ] Verify API calls include auth headers
- [ ] Test on both development servers (frontend + backend)
- [ ] Check browser console for errors
- [ ] Verify responsive design on mobile

## Important Notes

- **Development mode** runs without token verification if `SUPABASE_SERVICE_ROLE_KEY` is not set
- **Production** requires `SUPABASE_SERVICE_ROLE_KEY` for proper JWT verification
- **RLS policies** ensure users can only access their own data
- **CORS** is enabled for cross-origin requests
- **Request size limit** is 50mb for audio uploads

## Best Practices

1. **Keep changes minimal** - make focused, single-purpose changes
2. **Follow existing patterns** - match the style of surrounding code
3. **Test thoroughly** - verify changes work in development environment
4. **Handle errors** - always include error handling for API calls
5. **Type everything** - use TypeScript types consistently
6. **Document complex logic** - add comments for non-obvious code
7. **Use existing utilities** - leverage existing hooks, contexts, and services
8. **Secure by default** - always consider security implications

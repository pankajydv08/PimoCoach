# API Quick Reference Card

Quick reference for PimoCoach API endpoints. For detailed documentation, see [API.md](./API.md).

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/health` require Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Health Check

### Check API Status
```bash
GET /health
```
No auth required. Returns service availability status.

---

## Sessions

### Start Session
```bash
POST /session/start
{
  "session_type": "technical",      # general|technical|behavioral
  "difficulty_level": "medium"      # easy|medium|hard
}
```

### Get Session
```bash
GET /session/{sessionId}
```

### Update Session
```bash
PUT /session/{sessionId}
{
  "status": "paused"               # active|paused|completed|abandoned
}
```

### Complete Session
```bash
POST /session/{sessionId}/complete
```

### Get Session Responses
```bash
GET /session/{sessionId}/responses
```

### Get User History
```bash
GET /session/user/history
```

---

## Questions

### Get Next Question
```bash
POST /question/next
{
  "sessionId": "uuid",
  "category": "behavioral",         # behavioral|technical|custom
  "difficulty": "medium"            # easy|medium|hard
}
```

### Get Model Answer
```bash
POST /question/model-answer
{
  "questionText": "Tell me about yourself",
  "category": "behavioral"
}
```

### Generate Custom Q&A
```bash
POST /question/custom-qa
{
  "jobDescription": "Senior Engineer...",
  "sessionId": "uuid"              # optional
}
```

### Get Question by ID
```bash
GET /question/{questionId}
```

---

## Evaluation

### Evaluate Response
```bash
POST /evaluate
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "questionNumber": 1,
  "transcript": "My answer...",
  "questionText": "The question?"
}
```

Returns: response, feedback, and evaluation scores (0-10)

---

## Speech Services

### Transcribe Audio
```bash
POST /stt/transcribe
Content-Type: multipart/form-data

audio: <file>                      # Max 10MB, MP3/WAV/WebM/M4A/OGG
```

### Synthesize Speech
```bash
POST /tts/synthesize
{
  "text": "Text to speak"
}
```
Returns: Base64-encoded MP3 audio

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Auth required/failed |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

---

## Error Response Format
```json
{
  "error": "Error message",
  "message": "Detailed description"
}
```

---

## Quick cURL Examples

### Start Session
```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_type":"technical","difficulty_level":"hard"}'
```

### Get Next Question
```bash
curl -X POST http://localhost:5000/api/question/next \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","category":"behavioral"}'
```

### Transcribe Audio
```bash
curl -X POST http://localhost:5000/api/stt/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@recording.mp3"
```

### Synthesize Speech
```bash
curl -X POST http://localhost:5000/api/tts/synthesize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'
```

---

## Score Ranges

All evaluation scores are on a 0-10 scale:
- **Clarity Score**: How clear and articulate
- **Confidence Score**: Confidence level demonstrated
- **Technical Accuracy**: Correctness of content
- **Filler Word Count**: Count of um, uh, like, etc.
- **Speech Pace**: Words per minute
- **Pause Count**: Number of significant pauses

---

## Typical Workflow

1. **Start Session** → Get session ID
2. **Get Next Question** → Get question
3. **Synthesize Speech** → Play question audio
4. **Transcribe Audio** → Convert user's answer to text
5. **Evaluate Response** → Get feedback
6. **Repeat 2-5** → Continue practice
7. **Complete Session** → Calculate final scores
8. **Get Session Responses** → Review all answers

---

## Data Models (TypeScript)

### InterviewSession
```typescript
{
  id: string;                    // UUID
  session_type: string;          // general|technical|behavioral
  difficulty_level: string;      // easy|medium|hard
  status: string;                // active|paused|completed|abandoned
  total_questions: number;
  avg_clarity_score: number;     // 0-10
  avg_confidence_score: number;  // 0-10
}
```

### InterviewQuestion
```typescript
{
  id: string;                    // UUID
  question_text: string;
  category: string;              // behavioral|technical|custom
  difficulty: string;            // easy|medium|hard
}
```

### GPTEvaluation
```typescript
{
  clarity_score: number;         // 0-10
  confidence_score: number;      // 0-10
  technical_accuracy: number;    // 0-10
  filler_word_count: number;
  speech_pace: number;           // words per minute
  pause_count: number;
  feedback_text: string;
  improvement_suggestions: string[];
  strengths: string[];
  areas_to_improve: string[];
}
```

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# GitHub Models
GITHUB_TOKEN=your-github-token

# AssemblyAI
ASSEMBLYAI_API_KEY=your-assemblyai-key

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

---

## Resources

- **Full Documentation**: [API.md](./API.md)
- **OpenAPI Spec**: [swagger.yml](../swagger.yml)
- **Swagger Editor**: https://editor.swagger.io/
- **Import to Postman**: Use swagger.yml

---

**Last Updated**: October 27, 2025

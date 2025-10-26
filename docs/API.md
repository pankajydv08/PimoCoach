# PimoCoach API Documentation

## Overview

PimoCoach is an AI-powered interview coaching platform that helps users practice and improve their interview skills. This API provides endpoints for managing interview sessions, generating questions, evaluating responses, and handling speech-to-text and text-to-speech functionality.

**Base URL**: `http://localhost:5000/api`

**API Version**: 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Codes](#error-codes)
3. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Session Management](#session-management)
   - [Question Management](#question-management)
   - [Response Evaluation](#response-evaluation)
   - [Speech-to-Text](#speech-to-text)
   - [Text-to-Speech](#text-to-speech)
4. [Data Models](#data-models)

---

## Authentication

All endpoints except `/api/health` require authentication using JWT tokens provided by Supabase.

### Authentication Method

**Type**: Bearer Token

**Header**: `Authorization: Bearer <JWT_TOKEN>`

### Getting a Token

Tokens are obtained through Supabase authentication. Users must sign in through the application's login interface, which returns a JWT token.

### Example

```http
GET /api/session/user/history
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Authentication Errors

| Status Code | Error Message | Description |
|------------|---------------|-------------|
| 401 | Missing or invalid authorization header | No Authorization header or invalid format |
| 401 | Invalid or expired token | Token is expired or invalid |
| 401 | User not authenticated | Token doesn't contain valid user information |

---

## Error Codes

### Standard Error Response Format

```json
{
  "error": "Error message",
  "message": "Detailed error description (optional)"
}
```

### HTTP Status Codes

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required or failed |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Missing required fields: sessionId, questionId, transcript, questionText"
}
```

#### 401 Unauthorized
```json
{
  "error": "User not authenticated"
}
```

#### 404 Not Found
```json
{
  "error": "Session not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Endpoints

### Health Check

#### GET /api/health

Check API health status and service availability.

**Authentication**: Not required

**Request**: None

**Response**: 200 OK

```json
{
  "status": "ok",
  "timestamp": "2025-10-27T12:34:56.789Z",
  "services": {
    "supabase": true,
    "github_models": true,
    "assemblyai": true,
    "google_cloud_tts": true
  }
}
```

**Response Fields**:
- `status` (string): API status ("ok" or "error")
- `timestamp` (string): ISO 8601 timestamp
- `services` (object): Boolean flags for each service availability

**Example**:

```bash
curl http://localhost:5000/api/health
```

---

### Session Management

#### POST /api/session/start

Create a new interview session.

**Authentication**: Required

**Request Body**:

```json
{
  "session_type": "general",
  "difficulty_level": "medium"
}
```

**Parameters**:
- `session_type` (string, optional): Type of interview ("general", "technical", "behavioral"). Default: "general"
- `difficulty_level` (string, optional): Difficulty level ("easy", "medium", "hard"). Default: "medium"

**Response**: 200 OK

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "session_type": "general",
    "difficulty_level": "medium",
    "status": "active",
    "total_questions": 0,
    "avg_clarity_score": 0,
    "avg_confidence_score": 0,
    "started_at": "2025-10-27T12:00:00.000Z",
    "created_at": "2025-10-27T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Failed to create session

**Example**:

```bash
curl -X POST http://localhost:5000/api/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_type": "technical", "difficulty_level": "hard"}'
```

---

#### GET /api/session/:sessionId

Get details of a specific session.

**Authentication**: Required

**URL Parameters**:
- `sessionId` (string, required): UUID of the session

**Response**: 200 OK

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "session_type": "technical",
    "difficulty_level": "hard",
    "status": "active",
    "total_questions": 5,
    "avg_clarity_score": 7.5,
    "avg_confidence_score": 8.2,
    "started_at": "2025-10-27T12:00:00.000Z",
    "completed_at": null,
    "created_at": "2025-10-27T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 401: User not authenticated
- 404: Session not found
- 500: Failed to fetch session

**Example**:

```bash
curl http://localhost:5000/api/session/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### PUT /api/session/:sessionId

Update session details.

**Authentication**: Required

**URL Parameters**:
- `sessionId` (string, required): UUID of the session

**Request Body**:

```json
{
  "status": "paused",
  "difficulty_level": "hard"
}
```

**Parameters** (all optional):
- `status` (string): Session status ("active", "paused", "completed", "abandoned")
- `session_type` (string): Type of interview
- `difficulty_level` (string): Difficulty level

**Response**: 200 OK

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "session_type": "technical",
    "difficulty_level": "hard",
    "status": "paused",
    "total_questions": 5,
    "avg_clarity_score": 7.5,
    "avg_confidence_score": 8.2,
    "started_at": "2025-10-27T12:00:00.000Z",
    "completed_at": null,
    "created_at": "2025-10-27T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Failed to update session

**Example**:

```bash
curl -X PUT http://localhost:5000/api/session/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'
```

---

#### POST /api/session/:sessionId/complete

Mark a session as completed and calculate average scores.

**Authentication**: Required

**URL Parameters**:
- `sessionId` (string, required): UUID of the session

**Request Body**: None

**Response**: 200 OK

```json
{
  "session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "session_type": "technical",
    "difficulty_level": "hard",
    "status": "completed",
    "total_questions": 10,
    "avg_clarity_score": 7.8,
    "avg_confidence_score": 8.5,
    "started_at": "2025-10-27T12:00:00.000Z",
    "completed_at": "2025-10-27T13:30:00.000Z",
    "created_at": "2025-10-27T12:00:00.000Z"
  }
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Failed to calculate averages or complete session

**Example**:

```bash
curl -X POST http://localhost:5000/api/session/550e8400-e29b-41d4-a716-446655440000/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### GET /api/session/:sessionId/responses

Get all responses for a specific session with question details and feedback.

**Authentication**: Required

**URL Parameters**:
- `sessionId` (string, required): UUID of the session

**Response**: 200 OK

```json
{
  "responses": [
    {
      "id": "resp-uuid-1",
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "question_id": "quest-uuid-1",
      "question_number": 1,
      "audio_transcript": "I would start by gathering requirements...",
      "clarity_score": 8.5,
      "confidence_score": 7.8,
      "technical_accuracy": 9.0,
      "filler_word_count": 3,
      "speech_pace": 145,
      "pause_count": 2,
      "created_at": "2025-10-27T12:05:00.000Z",
      "interview_questions": {
        "question_text": "How would you approach a new project?",
        "category": "behavioral",
        "difficulty": "medium"
      },
      "feedback_history": [
        {
          "id": "feed-uuid-1",
          "feedback_text": "Strong answer with clear structure...",
          "improvement_suggestions": ["Add more specific examples"],
          "strengths": ["Clear communication", "Logical flow"],
          "areas_to_improve": ["Technical depth"]
        }
      ]
    }
  ]
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Failed to fetch responses

**Example**:

```bash
curl http://localhost:5000/api/session/550e8400-e29b-41d4-a716-446655440000/responses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### GET /api/session/user/history

Get all sessions for the authenticated user.

**Authentication**: Required

**Request**: None

**Response**: 200 OK

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "session_type": "technical",
      "difficulty_level": "hard",
      "status": "completed",
      "total_questions": 10,
      "avg_clarity_score": 7.8,
      "avg_confidence_score": 8.5,
      "started_at": "2025-10-27T12:00:00.000Z",
      "completed_at": "2025-10-27T13:30:00.000Z",
      "created_at": "2025-10-27T12:00:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "session_type": "behavioral",
      "difficulty_level": "medium",
      "status": "active",
      "total_questions": 3,
      "avg_clarity_score": 8.2,
      "avg_confidence_score": 7.9,
      "started_at": "2025-10-26T10:00:00.000Z",
      "completed_at": null,
      "created_at": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

**Response Fields**:
- `sessions` (array): Array of session objects, ordered by creation date (most recent first)

**Error Responses**:
- 401: User not authenticated
- 500: Failed to fetch sessions

**Example**:

```bash
curl http://localhost:5000/api/session/user/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Question Management

#### POST /api/question/next

Get the next interview question for a session.

**Authentication**: Required

**Request Body**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "behavioral",
  "difficulty": "medium"
}
```

**Parameters**:
- `sessionId` (string, required): UUID of the session
- `category` (string, optional): Question category ("behavioral", "technical", "custom"). Default: "behavioral"
- `difficulty` (string, optional): Difficulty level ("easy", "medium", "hard"). Default: "medium"

**Response**: 200 OK

```json
{
  "question": {
    "id": "quest-uuid-1",
    "question_text": "Tell me about a time when you had to handle a difficult team member.",
    "category": "behavioral",
    "difficulty": "medium",
    "expected_keywords": ["communication", "conflict resolution", "teamwork"],
    "follow_up_prompts": ["What was the outcome?", "What did you learn?"],
    "created_at": "2025-10-27T11:00:00.000Z"
  }
}
```

**Behavior**:
- Avoids previously asked questions in the session
- Fetches from database first
- Generates new question using AI if no suitable questions found
- Automatically saves generated questions to database

**Error Responses**:
- 500: Failed to generate or fetch question

**Example**:

```bash
curl -X POST http://localhost:5000/api/question/next \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "category": "technical",
    "difficulty": "hard"
  }'
```

---

#### POST /api/question/model-answer

Generate a model answer for a question using AI.

**Authentication**: Required

**Request Body**:

```json
{
  "questionText": "Tell me about a time when you had to handle a difficult team member.",
  "category": "behavioral",
  "difficulty": "medium"
}
```

**Parameters**:
- `questionText` (string, required): The interview question
- `category` (string, optional): Question category. Default: "behavioral"
- `difficulty` (string, optional): Difficulty level. Default: "medium"

**Response**: 200 OK

```json
{
  "modelAnswer": "In my previous role as a team lead, I encountered a situation where a team member was consistently missing deadlines and showing resistance to feedback. I approached this by first having a one-on-one conversation to understand their perspective..."
}
```

**Error Responses**:
- 400: Question text is required
- 500: Failed to generate model answer

**Example**:

```bash
curl -X POST http://localhost:5000/api/question/model-answer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is your greatest weakness?",
    "category": "behavioral",
    "difficulty": "easy"
  }'
```

---

#### POST /api/question/custom-qa

Generate a custom question and answer based on a job description.

**Authentication**: Required

**Request Body**:

```json
{
  "jobDescription": "Senior Software Engineer role focusing on distributed systems, microservices architecture, and cloud infrastructure. Required: 5+ years experience with Java, Spring Boot, Kubernetes, AWS.",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Parameters**:
- `jobDescription` (string, required): The job description or posting
- `sessionId` (string, optional): Session ID to avoid duplicate questions

**Response**: 200 OK

```json
{
  "question": {
    "id": "quest-uuid-2",
    "question_text": "Can you describe your experience with designing and implementing microservices architecture in a cloud environment?",
    "category": "custom",
    "difficulty": "medium",
    "expected_keywords": [],
    "follow_up_prompts": [],
    "created_at": "2025-10-27T12:15:00.000Z"
  },
  "modelAnswer": "I have extensive experience with microservices architecture. In my previous role, I designed and implemented a microservices-based system using Spring Boot and Docker..."
}
```

**Behavior**:
- Uses AI to generate relevant questions based on job description
- Avoids previously asked questions if sessionId provided
- Automatically saves generated questions to database
- Generates both question and model answer

**Error Responses**:
- 400: Job description is required
- 500: Failed to generate custom Q&A or save question

**Example**:

```bash
curl -X POST http://localhost:5000/api/question/custom-qa \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Full Stack Developer with React and Node.js",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

#### GET /api/question/:questionId

Get details of a specific question.

**Authentication**: Required

**URL Parameters**:
- `questionId` (string, required): UUID of the question

**Response**: 200 OK

```json
{
  "question": {
    "id": "quest-uuid-1",
    "question_text": "Tell me about a time when you had to handle a difficult team member.",
    "category": "behavioral",
    "difficulty": "medium",
    "expected_keywords": ["communication", "conflict resolution", "teamwork"],
    "follow_up_prompts": ["What was the outcome?", "What did you learn?"],
    "created_at": "2025-10-27T11:00:00.000Z"
  }
}
```

**Error Responses**:
- 404: Question not found
- 500: Failed to fetch question

**Example**:

```bash
curl http://localhost:5000/api/question/quest-uuid-1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Response Evaluation

#### POST /api/evaluate

Evaluate a user's response to an interview question using AI.

**Authentication**: Required

**Request Body**:

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "questionId": "quest-uuid-1",
  "questionNumber": 1,
  "transcript": "I would start by having a one-on-one conversation with the team member to understand their perspective and identify any underlying issues...",
  "questionText": "Tell me about a time when you had to handle a difficult team member."
}
```

**Parameters**:
- `sessionId` (string, required): UUID of the session
- `questionId` (string, required): UUID of the question
- `questionNumber` (number, required): Question number in the session
- `transcript` (string, required): User's spoken response (transcribed)
- `questionText` (string, required): The interview question

**Response**: 200 OK

```json
{
  "response": {
    "id": "resp-uuid-1",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "question_id": "quest-uuid-1",
    "question_number": 1,
    "audio_transcript": "I would start by having a one-on-one conversation...",
    "clarity_score": 8.5,
    "confidence_score": 7.8,
    "technical_accuracy": 9.0,
    "filler_word_count": 3,
    "speech_pace": 145,
    "pause_count": 2,
    "gpt_evaluation": "{...}",
    "created_at": "2025-10-27T12:20:00.000Z"
  },
  "feedback": {
    "id": "feed-uuid-1",
    "response_id": "resp-uuid-1",
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "feedback_text": "Your response demonstrates strong communication skills and emotional intelligence...",
    "improvement_suggestions": [
      "Include more specific metrics or outcomes",
      "Mention follow-up actions taken"
    ],
    "strengths": [
      "Clear structure using STAR method",
      "Emphasis on empathy and understanding",
      "Proactive approach to conflict resolution"
    ],
    "areas_to_improve": [
      "Provide more specific examples",
      "Quantify the impact of your actions"
    ],
    "created_at": "2025-10-27T12:20:00.000Z"
  },
  "evaluation": {
    "clarity_score": 8.5,
    "confidence_score": 7.8,
    "technical_accuracy": 9.0,
    "filler_word_count": 3,
    "speech_pace": 145,
    "pause_count": 2,
    "feedback_text": "Your response demonstrates strong communication skills...",
    "improvement_suggestions": [
      "Include more specific metrics or outcomes",
      "Mention follow-up actions taken"
    ],
    "strengths": [
      "Clear structure using STAR method",
      "Emphasis on empathy and understanding",
      "Proactive approach to conflict resolution"
    ],
    "areas_to_improve": [
      "Provide more specific examples",
      "Quantify the impact of your actions"
    ]
  }
}
```

**Response Fields**:

Scores range from 0-10:
- `clarity_score`: How clear and articulate the response is
- `confidence_score`: Confidence level demonstrated
- `technical_accuracy`: Accuracy of technical content (if applicable)
- `filler_word_count`: Number of filler words (um, uh, like, etc.)
- `speech_pace`: Words per minute
- `pause_count`: Number of significant pauses

**Behavior**:
- Uses AI (Azure GPT) to analyze response
- Saves response and feedback to database
- Provides detailed, actionable feedback
- Analyzes speech patterns and content quality

**Error Responses**:
- 400: Missing required fields
- 500: Evaluation service unavailable or failed to save

**Example**:

```bash
curl -X POST http://localhost:5000/api/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "questionId": "quest-uuid-1",
    "questionNumber": 1,
    "transcript": "I would start by having a conversation...",
    "questionText": "How would you handle a difficult team member?"
  }'
```

---

### Speech-to-Text

#### POST /api/stt/transcribe

Transcribe audio to text using AssemblyAI.

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Request Parameters**:
- `audio` (file, required): Audio file (max 10MB)

**Supported Audio Formats**:
- MP3
- WAV
- WebM
- M4A
- OGG

**Response**: 200 OK

```json
{
  "transcript": "I would start by having a one-on-one conversation with the team member to understand their perspective and identify any underlying issues that might be affecting their performance.",
  "success": true
}
```

**Response Fields**:
- `transcript` (string): Transcribed text from audio
- `success` (boolean): Whether transcription was successful

**Error Responses**:
- 400: Audio file is required
- 500: AssemblyAI STT service unavailable

**Example**:

```bash
curl -X POST http://localhost:5000/api/stt/transcribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@response.mp3"
```

**Example with JavaScript**:

```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'response.webm');

const response = await fetch('http://localhost:5000/api/stt/transcribe', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data.transcript);
```

---

### Text-to-Speech

#### POST /api/tts/synthesize

Convert text to speech audio using Google Cloud TTS.

**Authentication**: Required

**Request Body**:

```json
{
  "text": "Tell me about a time when you had to handle a difficult team member."
}
```

**Parameters**:
- `text` (string, required): Text to convert to speech

**Response**: 200 OK

```json
{
  "audio": "//uQx...[base64 encoded audio data]...==",
  "format": "mp3"
}
```

**Response Fields**:
- `audio` (string): Base64-encoded MP3 audio data
- `format` (string): Audio format (always "mp3")

**Audio Specifications**:
- Format: MP3
- Encoding: Base64
- Voice: Google Cloud TTS default voice
- Language: English (US)

**Error Responses**:
- 400: Text is required
- 500: TTS service unavailable

**Example**:

```bash
curl -X POST http://localhost:5000/api/tts/synthesize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the text-to-speech system."
  }'
```

**Example with JavaScript**:

```javascript
const response = await fetch('http://localhost:5000/api/tts/synthesize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Tell me about yourself.'
  })
});

const data = await response.json();

// Convert base64 to audio
const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
audio.play();
```

---

## Data Models

### InterviewSession

```typescript
{
  id: string;                    // UUID
  user_id: string;               // UUID of the user
  session_type: string;          // "general", "technical", "behavioral"
  difficulty_level: string;      // "easy", "medium", "hard"
  started_at: string;            // ISO 8601 timestamp
  completed_at?: string;         // ISO 8601 timestamp (optional)
  total_questions: number;       // Total number of questions answered
  avg_clarity_score: number;     // Average clarity score (0-10)
  avg_confidence_score: number;  // Average confidence score (0-10)
  status: string;                // "active", "paused", "completed", "abandoned"
  created_at: string;            // ISO 8601 timestamp
}
```

### InterviewQuestion

```typescript
{
  id: string;                    // UUID
  question_text: string;         // The interview question
  category: string;              // "behavioral", "technical", "custom"
  difficulty: string;            // "easy", "medium", "hard"
  expected_keywords: string[];   // Array of expected keywords
  follow_up_prompts: string[];   // Array of follow-up questions
  created_at: string;            // ISO 8601 timestamp
}
```

### UserResponse

```typescript
{
  id: string;                    // UUID
  session_id: string;            // UUID of the session
  question_id: string;           // UUID of the question
  question_number: number;       // Question number in session
  audio_transcript?: string;     // Transcribed audio response
  clarity_score?: number;        // Clarity score (0-10)
  confidence_score?: number;     // Confidence score (0-10)
  technical_accuracy?: number;   // Technical accuracy (0-10)
  filler_word_count: number;     // Count of filler words
  speech_pace?: number;          // Words per minute
  pause_count: number;           // Number of significant pauses
  gpt_evaluation?: string;       // JSON string of GPT evaluation
  created_at: string;            // ISO 8601 timestamp
}
```

### FeedbackHistory

```typescript
{
  id: string;                    // UUID
  response_id: string;           // UUID of the response
  session_id: string;            // UUID of the session
  feedback_text: string;         // Detailed feedback text
  improvement_suggestions: string[]; // Array of improvement suggestions
  strengths: string[];           // Array of identified strengths
  areas_to_improve: string[];    // Array of areas to improve
  created_at: string;            // ISO 8601 timestamp
}
```

### GPTEvaluation

```typescript
{
  clarity_score: number;         // 0-10
  confidence_score: number;      // 0-10
  technical_accuracy: number;    // 0-10
  filler_word_count: number;     // Count
  speech_pace: number;           // Words per minute
  pause_count: number;           // Count
  feedback_text: string;         // Detailed feedback
  improvement_suggestions: string[]; // Array of suggestions
  strengths: string[];           // Array of strengths
  areas_to_improve: string[];    // Array of areas to improve
}
```

---

## Rate Limits

Currently, there are no rate limits enforced. However, external service limits apply:

- **AssemblyAI**: Depends on your plan (check AssemblyAI dashboard)
- **Google Cloud TTS**: 4 million characters per month (free tier)
- **Azure OpenAI/GitHub Models**: Depends on your plan

---

## Webhooks

Webhooks are not currently supported.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class PimoCoachAPI {
  private baseUrl = 'http://localhost:5000/api';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Session methods
  async startSession(type = 'general', difficulty = 'medium') {
    return this.request('/session/start', {
      method: 'POST',
      body: JSON.stringify({ session_type: type, difficulty_level: difficulty })
    });
  }

  async getSession(sessionId: string) {
    return this.request(`/session/${sessionId}`);
  }

  async completeSession(sessionId: string) {
    return this.request(`/session/${sessionId}/complete`, { method: 'POST' });
  }

  async getUserHistory() {
    return this.request('/session/user/history');
  }

  // Question methods
  async getNextQuestion(sessionId: string, category = 'behavioral', difficulty = 'medium') {
    return this.request('/question/next', {
      method: 'POST',
      body: JSON.stringify({ sessionId, category, difficulty })
    });
  }

  async getModelAnswer(questionText: string, category = 'behavioral') {
    return this.request('/question/model-answer', {
      method: 'POST',
      body: JSON.stringify({ questionText, category })
    });
  }

  // Evaluation
  async evaluateResponse(data: {
    sessionId: string;
    questionId: string;
    questionNumber: number;
    transcript: string;
    questionText: string;
  }) {
    return this.request('/evaluate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Speech services
  async transcribe(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    return fetch(`${this.baseUrl}/stt/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    }).then(res => res.json());
  }

  async synthesize(text: string) {
    return this.request('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
}

// Usage
const api = new PimoCoachAPI('your-token-here');
const { session } = await api.startSession('technical', 'hard');
const { question } = await api.getNextQuestion(session.id, 'technical', 'hard');
```

---

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Start session
curl -X POST http://localhost:5000/api/session/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_type": "technical", "difficulty_level": "hard"}'

# Get next question
curl -X POST http://localhost:5000/api/question/next \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "SESSION_ID", "category": "behavioral"}'

# Evaluate response
curl -X POST http://localhost:5000/api/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "questionId": "QUESTION_ID",
    "questionNumber": 1,
    "transcript": "My answer...",
    "questionText": "The question?"
  }'
```

### Using Postman

1. Import the OpenAPI specification (see `swagger.yml`)
2. Set up environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `token`: Your JWT token
3. Use the pre-configured requests

---

## Environment Variables

The following environment variables are required for the API to function:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure OpenAI / GitHub Models
GITHUB_TOKEN=your-github-token
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-api-key

# AssemblyAI
ASSEMBLYAI_API_KEY=your-assemblyai-key

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## Changelog

### Version 1.0.0 (2025-10-27)

- Initial API release
- Session management endpoints
- Question generation and retrieval
- AI-powered response evaluation
- Speech-to-text transcription
- Text-to-speech synthesis
- JWT-based authentication

---

## Support

For issues, questions, or feature requests, please:

1. Check the [Troubleshooting Guide](../TROUBLESHOOTING.md)
2. Review the [Testing Guide](../TESTING_GUIDE.md)
3. Open an issue on GitHub

---

## License

See LICENSE file in the project root.

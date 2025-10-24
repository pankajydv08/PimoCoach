/*
  # AI Interview Coach Database Schema

  ## Overview
  Creates tables for managing interview practice sessions using the Pimsleur method.
  Tracks questions, user responses, AI evaluations, and session analytics.

  ## New Tables

  ### `interview_sessions`
  Stores overall session information and performance metrics
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, nullable) - Optional user tracking for future auth
  - `session_type` (text) - Interview category (technical, behavioral, general)
  - `difficulty_level` (text) - easy, medium, hard
  - `started_at` (timestamptz) - Session start time
  - `completed_at` (timestamptz, nullable) - Session end time
  - `total_questions` (integer) - Number of questions asked
  - `avg_clarity_score` (numeric) - Average clarity rating (0-100)
  - `avg_confidence_score` (numeric) - Average confidence rating (0-100)
  - `status` (text) - active, paused, completed, abandoned
  - `created_at` (timestamptz) - Record creation time

  ### `interview_questions`
  Stores interview questions and metadata
  - `id` (uuid, primary key) - Unique question identifier
  - `question_text` (text) - The interview question
  - `category` (text) - Question type (behavioral, technical, situational)
  - `difficulty` (text) - easy, medium, hard
  - `expected_keywords` (text array) - Key concepts to look for in answers
  - `follow_up_prompts` (text array) - Suggested follow-up questions
  - `created_at` (timestamptz) - Record creation time

  ### `user_responses`
  Stores user answers and AI evaluations
  - `id` (uuid, primary key) - Unique response identifier
  - `session_id` (uuid, foreign key) - Links to interview_sessions
  - `question_id` (uuid, foreign key) - Links to interview_questions
  - `question_number` (integer) - Order in session sequence
  - `audio_transcript` (text) - STT transcription of user's answer
  - `clarity_score` (numeric) - AI-evaluated clarity rating (0-100)
  - `confidence_score` (numeric) - AI-evaluated confidence rating (0-100)
  - `technical_accuracy` (numeric) - Technical correctness score (0-100)
  - `filler_word_count` (integer) - Count of um, uh, like, etc.
  - `speech_pace` (numeric) - Words per minute
  - `pause_count` (integer) - Number of significant pauses
  - `gpt_evaluation` (text) - Raw GPT evaluation response
  - `created_at` (timestamptz) - Record creation time

  ### `feedback_history`
  Stores AI-generated feedback and improvement suggestions
  - `id` (uuid, primary key) - Unique feedback identifier
  - `response_id` (uuid, foreign key) - Links to user_responses
  - `session_id` (uuid, foreign key) - Links to interview_sessions
  - `feedback_text` (text) - Human-readable feedback
  - `improvement_suggestions` (text array) - Specific action items
  - `strengths` (text array) - Positive aspects identified
  - `areas_to_improve` (text array) - Weakness categories
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - Enable RLS on all tables
  - Public access policies for demo/unauthenticated usage
  - Ready for user-based policies when authentication is added

  ## Indexes
  - Session lookup by status and date
  - Question lookup by category and difficulty
  - Response lookup by session
  - Feedback lookup by session
*/

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_type text NOT NULL DEFAULT 'general',
  difficulty_level text NOT NULL DEFAULT 'medium',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  total_questions integer DEFAULT 0,
  avg_clarity_score numeric(5,2) DEFAULT 0,
  avg_confidence_score numeric(5,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create interview_questions table
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium',
  expected_keywords text[] DEFAULT '{}',
  follow_up_prompts text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_responses table
CREATE TABLE IF NOT EXISTS user_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  question_number integer NOT NULL DEFAULT 1,
  audio_transcript text,
  clarity_score numeric(5,2),
  confidence_score numeric(5,2),
  technical_accuracy numeric(5,2),
  filler_word_count integer DEFAULT 0,
  speech_pace numeric(6,2),
  pause_count integer DEFAULT 0,
  gpt_evaluation text,
  created_at timestamptz DEFAULT now()
);

-- Create feedback_history table
CREATE TABLE IF NOT EXISTS feedback_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES user_responses(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  feedback_text text NOT NULL,
  improvement_suggestions text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  areas_to_improve text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo mode)
-- These allow unauthenticated users to practice interviews

CREATE POLICY "Anyone can create sessions"
  ON interview_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view their sessions"
  ON interview_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update sessions"
  ON interview_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view questions"
  ON interview_questions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert questions"
  ON interview_questions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create responses"
  ON user_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view responses"
  ON user_responses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create feedback"
  ON feedback_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view feedback"
  ON feedback_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON interview_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_questions_category ON interview_questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_responses_session ON user_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON user_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback_history(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_response ON feedback_history(response_id);

-- Insert sample interview questions
INSERT INTO interview_questions (question_text, category, difficulty, expected_keywords, follow_up_prompts) VALUES
  ('Tell me about yourself and your background', 'behavioral', 'easy', 
   ARRAY['experience', 'education', 'skills', 'passion'], 
   ARRAY['What motivated you to pursue this field?', 'What are your key strengths?']),
  
  ('Describe a challenging project you worked on', 'behavioral', 'medium',
   ARRAY['problem', 'solution', 'teamwork', 'outcome', 'learned'],
   ARRAY['What would you do differently?', 'How did you handle conflicts?']),
  
  ('Where do you see yourself in five years?', 'behavioral', 'easy',
   ARRAY['growth', 'goals', 'learning', 'leadership'],
   ARRAY['What skills do you want to develop?', 'How does this role fit your goals?']),
  
  ('Explain a time you failed and what you learned', 'behavioral', 'medium',
   ARRAY['mistake', 'responsibility', 'lesson', 'improvement'],
   ARRAY['How did you recover?', 'What changed in your approach?']),
  
  ('How do you handle pressure and tight deadlines?', 'behavioral', 'medium',
   ARRAY['prioritize', 'organize', 'communicate', 'calm'],
   ARRAY['Can you give a specific example?', 'What techniques do you use?']),
  
  ('Why do you want to work here?', 'behavioral', 'easy',
   ARRAY['company', 'mission', 'culture', 'opportunity', 'values'],
   ARRAY['What excites you most about this role?', 'What research have you done?']),
  
  ('Describe your ideal work environment', 'behavioral', 'easy',
   ARRAY['collaboration', 'autonomy', 'feedback', 'growth'],
   ARRAY['How do you work with different personality types?']),
  
  ('Tell me about a conflict with a coworker', 'behavioral', 'hard',
   ARRAY['disagreement', 'resolution', 'communication', 'respect'],
   ARRAY['What did you learn about working with others?'])
ON CONFLICT DO NOTHING;
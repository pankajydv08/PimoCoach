export interface InterviewSession {
  id: string;
  user_id?: string;
  session_type: string;
  difficulty_level: string;
  started_at: string;
  completed_at?: string;
  total_questions: number;
  avg_clarity_score: number;
  avg_confidence_score: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  created_at: string;
}

export type QuestionCategory = 'technical' | 'behavioral' | 'situational' | 'company-specific' | 'general';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface InterviewQuestion {
  id: string;
  question_text: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  expected_keywords: string[];
  follow_up_prompts: string[];
  created_at: string;
}

export interface UserResponse {
  id: string;
  session_id: string;
  question_id: string;
  question_number: number;
  audio_transcript?: string;
  clarity_score?: number;
  confidence_score?: number;
  technical_accuracy?: number;
  filler_word_count: number;
  speech_pace?: number;
  pause_count: number;
  gpt_evaluation?: string;
  created_at: string;
  interview_questions?: InterviewQuestion;
  feedback_history?: FeedbackHistory[];
}

export interface FeedbackHistory {
  id: string;
  response_id: string;
  session_id: string;
  feedback_text: string;
  improvement_suggestions: string[];
  strengths: string[];
  areas_to_improve: string[];
  created_at: string;
}

export type InterviewMode = 'practice' | 'train';

export type TrainMethod = 'default' | 'custom';

export type PimsleurState =
  | 'IDLE'
  | 'ASK'
  | 'PAUSE1'
  | 'REPEAT'
  | 'PAUSE2'
  | 'LISTEN'
  | 'EVALUATE'
  | 'FEEDBACK'
  | 'NEXT'
  // Train mode specific states
  | 'MODEL_ANSWER'
  | 'PAUSE_AFTER_MODEL'
  | 'REPEAT_ANSWER'
  | 'PAUSE_AFTER_REPEAT';

export interface Evaluation {
  clarity_score: number;
  confidence_score: number;
  technical_accuracy: number;
  filler_word_count: number;
  speech_pace: number;
  pause_count: number;
  feedback_text: string;
  improvement_suggestions: string[];
  strengths: string[];
  areas_to_improve: string[];
}

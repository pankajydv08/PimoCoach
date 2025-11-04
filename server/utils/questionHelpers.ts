import { supabase } from './supabase';

interface SessionAverages {
  avgClarity: number;
  avgConfidence: number;
  totalQuestions: number;
}

interface UserResponseWithQuestion {
  interview_questions?: {
    question_text?: string;
  } | null;
}

interface UserResponseScores {
  clarity_score?: number;
  confidence_score?: number;
}

/**
 * Calculate average of a numeric field from an array of objects
 */
function calculateAverage<T>(
  items: T[],
  fieldAccessor: (item: T) => number | undefined | null,
  defaultValue: number = 0
): number {
  if (!items || items.length === 0) {
    return defaultValue;
  }

  const sum = items.reduce((acc, item) => acc + (fieldAccessor(item) || 0), 0);
  return sum / items.length;
}

/**
 * Get list of previously asked question texts for a session
 */
export async function getPreviousQuestions(sessionId: string): Promise<string[]> {
  const { data: existingResponses, error } = await supabase
    .from('user_responses')
    .select('interview_questions(question_text)')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error fetching previous questions:', error);
    return [];
  }

  return (existingResponses as UserResponseWithQuestion[])
    ?.map(r => r.interview_questions?.question_text)
    .filter((text): text is string => Boolean(text)) || [];
}

/**
 * Calculate average scores for a session
 */
export async function calculateSessionAverages(sessionId: string): Promise<SessionAverages> {
  const { data: responses, error } = await supabase
    .from('user_responses')
    .select('clarity_score, confidence_score')
    .eq('session_id', sessionId);

  if (error || !responses || responses.length === 0) {
    return { avgClarity: 0, avgConfidence: 0, totalQuestions: 0 };
  }

  const typedResponses = responses as UserResponseScores[];

  const avgClarity = calculateAverage(
    typedResponses,
    r => r.clarity_score
  );

  const avgConfidence = calculateAverage(
    typedResponses,
    r => r.confidence_score
  );

  return {
    avgClarity,
    avgConfidence,
    totalQuestions: responses.length
  };
}

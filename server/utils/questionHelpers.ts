import { supabase } from './supabase';

interface SessionAverages {
  avgClarity: number;
  avgConfidence: number;
  totalQuestions: number;
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

  return existingResponses?.map(
    (r: any) => r.interview_questions?.question_text
  ).filter(Boolean) || [];
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

  const avgClarity = responses.reduce(
    (sum: number, r: any) => sum + (r.clarity_score || 0), 
    0
  ) / responses.length;

  const avgConfidence = responses.reduce(
    (sum: number, r: any) => sum + (r.confidence_score || 0), 
    0
  ) / responses.length;

  return {
    avgClarity,
    avgConfidence,
    totalQuestions: responses.length
  };
}

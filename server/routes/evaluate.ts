import express from 'express';
import { supabase } from '../utils/supabase';
import { evaluateResponse } from '../utils/azureGPT';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🔍 Received evaluate request body:', req.body);
    
    const {
      sessionId,
      questionId,
      questionNumber,
      transcript,
      questionText
    } = req.body;

    console.log('🔍 Extracted fields:', {
      sessionId: sessionId ? 'present' : 'MISSING',
      questionId: questionId ? 'present' : 'MISSING', 
      questionNumber: questionNumber ? 'present' : 'MISSING',
      transcript: transcript ? 'present' : 'MISSING',
      questionText: questionText ? 'present' : 'MISSING'
    });

    if (!sessionId || !questionId || !transcript || !questionText) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        error: 'Missing required fields: sessionId, questionId, transcript, questionText'
      });
    }

    console.log('Evaluating response for question:', questionText);
    console.log('Transcript:', transcript);

    const evaluation = await evaluateResponse(questionText, transcript);
    
    console.log('Evaluation completed successfully');

    const { data: responseData, error: responseError } = await supabase
      .from('user_responses')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        question_number: questionNumber,
        audio_transcript: transcript,
        clarity_score: evaluation.clarity_score,
        confidence_score: evaluation.confidence_score,
        technical_accuracy: evaluation.technical_accuracy,
        filler_word_count: evaluation.filler_word_count,
        speech_pace: evaluation.speech_pace,
        pause_count: evaluation.pause_count,
        gpt_evaluation: JSON.stringify(evaluation)
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error saving response:', responseError);
      return res.status(500).json({ error: 'Failed to save response' });
    }

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_history')
      .insert({
        response_id: responseData.id,
        session_id: sessionId,
        feedback_text: evaluation.feedback_text,
        improvement_suggestions: evaluation.improvement_suggestions,
        strengths: evaluation.strengths,
        areas_to_improve: evaluation.areas_to_improve
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
    }

    res.json({
      response: responseData,
      feedback: feedbackData,
      evaluation
    });
  } catch (error) {
    console.error('Error in /evaluate:', error);
    res.status(500).json({
      error: 'Evaluation service unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

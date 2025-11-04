import express from 'express';
import { supabase } from '../utils/supabase';
import { AuthRequest } from '../middleware/auth';
import { verifyAuthUser } from '../utils/authHelpers';
import { handleRouteError } from '../utils/errorHandler';
import { calculateSessionAverages } from '../utils/questionHelpers';

const router = express.Router();

router.post('/start', async (req: AuthRequest, res) => {
  try {
    const { session_type = 'general', difficulty_level = 'medium' } = req.body;
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        session_type,
        difficulty_level,
        user_id,
        status: 'active',
        total_questions: 0,
        avg_clarity_score: 0,
        avg_confidence_score: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.json({ session: data });
  } catch (error) {
    handleRouteError(res, error, '/start');
  }
});

router.get('/:sessionId', async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session: data });
  } catch (error) {
    handleRouteError(res, error, 'GET /:sessionId');
  }
});

router.put('/:sessionId', async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const updates = req.body;
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { data, error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }

    res.json({ session: data });
  } catch (error) {
    handleRouteError(res, error, 'PUT /:sessionId');
  }
});

router.post('/:sessionId/complete', async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { avgClarity, avgConfidence, totalQuestions } = await calculateSessionAverages(sessionId);

    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        avg_clarity_score: avgClarity,
        avg_confidence_score: avgConfidence,
        total_questions: totalQuestions
      })
      .eq('id', sessionId)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error completing session:', error);
      return res.status(500).json({ error: 'Failed to complete session' });
    }

    res.json({ session: data });
  } catch (error) {
    handleRouteError(res, error, '/complete');
  }
});

router.get('/:sessionId/responses', async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { data, error } = await supabase
      .from('user_responses')
      .select(`
        *,
        interview_questions (
          question_text,
          category,
          difficulty
        ),
        feedback_history (*)
      `)
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }

    res.json({ responses: data || [] });
  } catch (error) {
    handleRouteError(res, error, 'GET /:sessionId/responses');
  }
});

// Get all sessions for the authenticated user
router.get('/user/history', async (req: AuthRequest, res) => {
  try {
    const user_id = verifyAuthUser(req, res);

    if (!user_id) return;

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    res.json({ sessions: data || [] });
  } catch (error) {
    handleRouteError(res, error, 'GET /user/history');
  }
});

export default router;

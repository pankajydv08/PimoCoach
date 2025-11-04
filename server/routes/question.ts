import express from 'express';
import { supabase } from '../utils/supabase';
import { generateQuestion, generateModelAnswer, generateCustomQA } from '../utils/azureGPT';
import { handleRouteError, sendErrorResponse } from '../utils/errorHandler';

const router = express.Router();

router.post('/next', async (req, res) => {
  try {
    const { sessionId, category = 'behavioral', difficulty = 'medium' } = req.body;

    const { data: existingResponses, error: responsesError } = await supabase
      .from('user_responses')
      .select('interview_questions(question_text)')
      .eq('session_id', sessionId);

    if (responsesError) {
      console.error('Error fetching existing responses:', responsesError);
    }

    const previousQuestions = existingResponses?.map(
      r => (r as any).interview_questions?.question_text
    ).filter(Boolean) || [];

    const { data: availableQuestions, error: questionsError } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('category', category)
      .eq('difficulty', difficulty)
      .not('question_text', 'in', `(${previousQuestions.map(q => `"${q}"`).join(',')})`)
      .limit(5);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    }

    let question;

    if (availableQuestions && availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      question = availableQuestions[randomIndex];
    } else {
      try {
        const generatedText = await generateQuestion(category, difficulty, previousQuestions);

        const { data: newQuestion, error: insertError } = await supabase
          .from('interview_questions')
          .insert({
            question_text: generatedText,
            category,
            difficulty,
            expected_keywords: [],
            follow_up_prompts: []
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting generated question:', insertError);
          return res.status(500).json({ error: 'Failed to generate question' });
        }

        question = newQuestion;
      } catch (gptError) {
        console.error('Error generating question with GPT:', gptError);
        return res.status(500).json({ error: 'Failed to generate question' });
      }
    }

    res.json({ question });
  } catch (error) {
    handleRouteError(res, error, '/next');
  }
});

router.post('/model-answer', async (req, res) => {
  try {
    const { questionText, category = 'behavioral', difficulty = 'medium' } = req.body;

    if (!questionText) {
      return sendErrorResponse(res, 400, 'Question text is required');
    }

    const modelAnswer = await generateModelAnswer(questionText, category, difficulty);

    res.json({ modelAnswer });
  } catch (error) {
    handleRouteError(res, error, '/model-answer');
  }
});

router.post('/custom-qa', async (req, res) => {
  try {
    const { jobDescription, sessionId } = req.body;

    if (!jobDescription) {
      return sendErrorResponse(res, 400, 'Job description is required');
    }

    // Get previously asked questions for this session
    const { data: existingResponses } = await supabase
      .from('user_responses')
      .select('interview_questions(question_text)')
      .eq('session_id', sessionId || '');

    const previousQuestions = existingResponses?.map(
      r => (r as any).interview_questions?.question_text
    ).filter(Boolean) || [];

    const { question, answer } = await generateCustomQA(jobDescription, previousQuestions);

    // Save the generated question to database
    const { data: newQuestion, error: insertError } = await supabase
      .from('interview_questions')
      .insert({
        question_text: question,
        category: 'custom',
        difficulty: 'medium',
        expected_keywords: [],
        follow_up_prompts: []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting custom question:', insertError);
      return res.status(500).json({ error: 'Failed to save question' });
    }

    res.json({ 
      question: newQuestion,
      modelAnswer: answer 
    });
  } catch (error) {
    handleRouteError(res, error, '/custom-qa');
  }
});

router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;

    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('id', questionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching question:', error);
      return res.status(500).json({ error: 'Failed to fetch question' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ question: data });
  } catch (error) {
    handleRouteError(res, error, 'GET /:questionId');
  }
});

export default router;

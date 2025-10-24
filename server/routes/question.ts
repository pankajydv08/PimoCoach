import express from 'express';
import { supabase } from '../utils/supabase';
import { generateQuestion, generateModelAnswer, generateCustomQA } from '../utils/azureGPT';

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
    console.error('Error in /next:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/model-answer', async (req, res) => {
  try {
    const { questionText, category = 'behavioral', difficulty = 'medium' } = req.body;

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const modelAnswer = await generateModelAnswer(questionText, category, difficulty);

    res.json({ modelAnswer });
  } catch (error) {
    console.error('Error in /model-answer:', error);
    res.status(500).json({ error: 'Failed to generate model answer' });
  }
});

router.post('/custom-qa', async (req, res) => {
  try {
    const { jobDescription, sessionId } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
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
    console.error('Error in /custom-qa:', error);
    res.status(500).json({ error: 'Failed to generate custom Q&A' });
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
    console.error('Error in GET /:questionId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

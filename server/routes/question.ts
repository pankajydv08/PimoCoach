import express from 'express';
import { supabase } from '../utils/supabase';
import { 
  generateQuestion, 
  generateModelAnswer, 
  generateCustomQA,
  analyzeJobDescription,
  generateQuestionPool 
} from '../utils/azureGPT';

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
    const { jobDescription, sessionId, generatePool = false } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Analyze the job description first
    const jobAnalysis = await analyzeJobDescription(jobDescription);
    console.log('Job Analysis:', jobAnalysis);

    // Get previously asked questions for this session
    const { data: existingResponses } = await supabase
      .from('user_responses')
      .select('interview_questions(question_text)')
      .eq('session_id', sessionId || '');

    const previousQuestions = existingResponses?.map(
      r => (r as any).interview_questions?.question_text
    ).filter(Boolean) || [];

    // Generate question pool if requested (for first time or when pool is empty)
    let questionPool = null;
    if (generatePool) {
      questionPool = await generateQuestionPool(jobDescription, jobAnalysis, 8);
      console.log('Generated question pool:', questionPool?.length, 'questions');
    }

    // Generate one question using enhanced analysis
    const { question, answer, category, difficulty, skillsTested } = await generateCustomQA(
      jobDescription, 
      previousQuestions, 
      jobAnalysis
    );

    // Save the generated question to database
    const { data: newQuestion, error: insertError } = await supabase
      .from('interview_questions')
      .insert({
        question_text: question,
        category: category,
        difficulty: difficulty,
        expected_keywords: skillsTested,
        follow_up_prompts: []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting custom question:', insertError);
      return res.status(500).json({ error: 'Failed to save question' });
    }

    // Skills gap analysis - identify which skills are being tested vs required
    const allRequiredSkills = [...jobAnalysis.requiredSkills, ...jobAnalysis.technicalSkills];
    
    // Create lowercase sets for efficient O(1) lookups
    const testedSkillsLower = new Set(skillsTested.map(s => s.toLowerCase()));
    
    const skillsGapAnalysis = allRequiredSkills.filter(skill => {
      const skillLower = skill.toLowerCase();
      // Check if any tested skill matches
      for (const tested of testedSkillsLower) {
        if (tested.includes(skillLower) || skillLower.includes(tested)) {
          return false; // Skill is tested, exclude from gap
        }
      }
      return true; // Skill not tested, include in gap
    });

    res.json({ 
      question: newQuestion,
      modelAnswer: answer,
      jobAnalysis: jobAnalysis,
      skillsGapAnalysis: skillsGapAnalysis.slice(0, 5), // Top 5 untested skills
      questionPool: questionPool,
      skillsTested: skillsTested
    });
  } catch (error) {
    console.error('Error in /custom-qa:', error);
    res.status(500).json({ error: 'Failed to generate custom Q&A' });
  }
});

router.post('/analyze-job', async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const jobAnalysis = await analyzeJobDescription(jobDescription);

    res.json({ jobAnalysis });
  } catch (error) {
    console.error('Error in /analyze-job:', error);
    res.status(500).json({ error: 'Failed to analyze job description' });
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

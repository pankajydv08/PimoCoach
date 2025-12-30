import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { GPTEvaluation, JobAnalysis, QuestionPoolItem } from '../types';

const token = process.env.GITHUB_TOKEN || '';
const endpoint = "https://models.github.ai/inference";
const model = process.env.GITHUB_MODEL || "gpt-4o";

let client: ReturnType<typeof ModelClient> | null = null;

function getClient() {
  if (!client) {
    if (!token) {
      throw new Error('GitHub token not configured. Please set GITHUB_TOKEN in your .env file');
    }
    client = ModelClient(endpoint, new AzureKeyCredential(token));
  }
  return client;
}

// Default job analysis for fallback scenarios
const DEFAULT_JOB_ANALYSIS: JobAnalysis = {
  jobTitle: 'Position',
  jobCategory: 'general',
  difficultyLevel: 'mid',
  requiredSkills: [],
  keyResponsibilities: [],
  experienceLevel: 'Not specified',
  technicalSkills: [],
  softSkills: []
};

const INTERVIEWER_SYSTEM_PROMPT = `You are an AI Interview Coach using the Pimsleur method for interview practice.

Your role is to:
1. Generate interview questions appropriate to the difficulty level and category
2. Evaluate user responses for clarity, confidence, and technical accuracy
3. Provide warm, encouraging, and constructive feedback
4. Focus on helping users improve their speaking skills and interview performance

When evaluating responses, analyze:
- Clarity: How well-structured and understandable is the answer?
- Confidence: Does the speaker sound assured and natural?
- Technical Accuracy: Is the content correct and relevant?
- Speaking patterns: Filler words (um, uh, like), pace, pauses

Provide actionable feedback that helps users improve specific aspects of their delivery.`;

export async function generateQuestion(
  category: string = 'behavioral',
  difficulty: string = 'medium',
  previousQuestions: string[] = []
): Promise<string> {
  try {
    const client = getClient();

    const prompt = `Generate one interview question for the following criteria:
- Category: ${category}
- Difficulty: ${difficulty}
${previousQuestions.length > 0 ? `- Avoid these already asked questions: ${previousQuestions.join(', ')}` : ''}

Return ONLY the question text, nothing else.`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.8,
        max_tokens: 150
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    return response.body.choices[0]?.message?.content?.trim() || 'Tell me about yourself.';
  } catch (error) {
    console.error('Error generating question:', error);
    return 'Tell me about yourself and your background.';
  }
}

export async function generateModelAnswer(
  question: string,
  category: string = 'behavioral',
  difficulty: string = 'medium'
): Promise<string> {
  try {
    const client = getClient();

    const prompt = `Generate a model answer for this interview question:
Question: "${question}"
Category: ${category}
Difficulty: ${difficulty}

Create a concise, professional answer (2-3 sentences, about 30-50 words) that demonstrates:
- Clear structure and confidence
- Relevant content
- Natural speaking style
- Professional tone

Return ONLY the model answer text, nothing else.`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.7,
        max_tokens: 200
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    return response.body.choices[0]?.message?.content?.trim() || 'I am a dedicated professional with strong skills in my field.';
  } catch (error) {
    console.error('Error generating model answer:', error);
    return 'I am a dedicated professional with strong skills and experience in my field.';
  }
}

export async function analyzeJobDescription(
  jobDescription: string
): Promise<JobAnalysis> {
  try {
    const client = getClient();

    const prompt = `Analyze this job description and extract key information:

Job Description:
"""
${jobDescription}
"""

Provide a detailed analysis in JSON format with these exact fields:
{
  "jobTitle": "<extracted or inferred job title>",
  "jobCategory": "<category: software_engineer, data_analyst, product_manager, designer, sales, marketing, hr, finance, operations, or other>",
  "difficultyLevel": "<entry, mid, or senior based on experience requirements>",
  "requiredSkills": ["<skill1>", "<skill2>", ...],
  "keyResponsibilities": ["<responsibility1>", "<responsibility2>", ...],
  "experienceLevel": "<e.g., '2-4 years', '5+ years', 'entry-level'>",
  "technicalSkills": ["<technical skill1>", "<technical skill2>", ...],
  "softSkills": ["<soft skill1>", "<soft skill2>", ...]
}

Guidelines:
- For jobTitle: Extract from description or infer from requirements
- For jobCategory: Choose the most appropriate category
- For difficultyLevel: 'entry' for 0-2 years, 'mid' for 2-5 years, 'senior' for 5+ years
- For requiredSkills: List all mentioned skills and technologies
- For keyResponsibilities: Extract main duties and responsibilities
- For technicalSkills: Programming languages, frameworks, tools, technologies
- For softSkills: Communication, leadership, teamwork, problem-solving, etc.`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: 'You are an expert HR analyst and job description parser. Extract structured information from job descriptions accurately.' },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const content = response.body.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(content) as JobAnalysis;

    return {
      jobTitle: analysis.jobTitle || DEFAULT_JOB_ANALYSIS.jobTitle,
      jobCategory: analysis.jobCategory || DEFAULT_JOB_ANALYSIS.jobCategory,
      difficultyLevel: analysis.difficultyLevel || DEFAULT_JOB_ANALYSIS.difficultyLevel,
      requiredSkills: analysis.requiredSkills || DEFAULT_JOB_ANALYSIS.requiredSkills,
      keyResponsibilities: analysis.keyResponsibilities || DEFAULT_JOB_ANALYSIS.keyResponsibilities,
      experienceLevel: analysis.experienceLevel || DEFAULT_JOB_ANALYSIS.experienceLevel,
      technicalSkills: analysis.technicalSkills || DEFAULT_JOB_ANALYSIS.technicalSkills,
      softSkills: analysis.softSkills || DEFAULT_JOB_ANALYSIS.softSkills
    };
  } catch (error) {
    console.error('Error analyzing job description:', error);
    return { ...DEFAULT_JOB_ANALYSIS };
    };
  }
}

export async function generateQuestionPool(
  jobDescription: string,
  jobAnalysis: JobAnalysis,
  poolSize: number = 8
): Promise<QuestionPoolItem[]> {
  try {
    const client = getClient();

    const difficultyMap = {
      'entry': 'easy to medium',
      'mid': 'medium',
      'senior': 'medium to hard'
    };

    const prompt = `Based on this job description and analysis, generate ${poolSize} diverse interview questions with model answers:

Job Description:
"""
${jobDescription}
"""

Job Analysis:
- Title: ${jobAnalysis.jobTitle}
- Category: ${jobAnalysis.jobCategory}
- Level: ${jobAnalysis.difficultyLevel}
- Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
- Technical Skills: ${jobAnalysis.technicalSkills.join(', ')}
- Soft Skills: ${jobAnalysis.softSkills.join(', ')}

Generate a JSON response with a "questions" array containing ${poolSize} question objects with these exact fields:
{
  "questions": [
    {
      "question": "<specific interview question>",
      "answer": "<concise model answer, 2-3 sentences, 30-50 words>",
      "category": "<behavioral, technical, or situational>",
      "difficulty": "<easy, medium, or hard>",
      "skillsTested": ["<skill1>", "<skill2>"]
    },
    ...
  ]
}

Requirements:
- Create a diverse mix of question types (behavioral, technical, situational)
- Questions should test different skills from the job requirements
- Difficulty should be ${difficultyMap[jobAnalysis.difficultyLevel]} based on ${jobAnalysis.difficultyLevel} level
- Include questions about technical skills: ${jobAnalysis.technicalSkills.slice(0, 3).join(', ')}
- Include questions about soft skills: ${jobAnalysis.softSkills.slice(0, 3).join(', ')}
- Each question should be directly relevant to the role
- Model answers should demonstrate relevant experience
- Vary the difficulty across the pool
- Make questions specific to the role, not generic`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const content = response.body.choices[0]?.message?.content || '{"questions":[]}';
    const parsed = JSON.parse(content) as { questions: QuestionPoolItem[] };

    return parsed.questions || [];
  } catch (error) {
    console.error('Error generating question pool:', error);
    return [];
  }
}

export async function generateCustomQA(
  jobDescription: string,
  previousQuestions: string[] = [],
  jobAnalysis?: JobAnalysis
): Promise<{ question: string; answer: string; category: string; difficulty: string; skillsTested: string[] }> {
  try {
    const client = getClient();

    // Use provided analysis or create a quick one
    const analysis = jobAnalysis || { ...DEFAULT_JOB_ANALYSIS };

    const difficultyMap = {
      'entry': 'easy to medium',
      'mid': 'medium',
      'senior': 'medium to hard'
    };

    const prompt = `Based on this job description, generate ONE highly relevant interview question and a model answer:

Job Description:
"""
${jobDescription}
"""

Job Analysis:
- Title: ${analysis.jobTitle}
- Category: ${analysis.jobCategory}
- Level: ${analysis.difficultyLevel}
- Required Skills: ${analysis.requiredSkills.slice(0, 5).join(', ')}
- Technical Skills: ${analysis.technicalSkills.slice(0, 3).join(', ')}
- Soft Skills: ${analysis.softSkills.slice(0, 3).join(', ')}

${previousQuestions.length > 0 ? `Previously asked questions (avoid these): ${previousQuestions.join(', ')}` : ''}

Generate a JSON response with these exact fields:
{
  "question": "<A specific, relevant interview question based on the job description>",
  "answer": "<A concise, professional model answer (2-3 sentences, 30-50 words)>",
  "category": "<behavioral, technical, or situational>",
  "difficulty": "<easy, medium, or hard>",
  "skillsTested": ["<skill1>", "<skill2>"]
}

The question should:
- Be directly relevant to the job requirements
- Test skills/experience mentioned in the job description
- Be appropriate for ${analysis.difficultyLevel} level (${difficultyMap[analysis.difficultyLevel]} difficulty)
- Be behavioral, technical, or situational based on the role
- Be clear and specific
- Test one or more of the required skills

The answer should:
- Demonstrate relevant experience for ${analysis.jobTitle}
- Show skills matching the job requirements
- Be confident and professional
- Be natural and conversational
- Be 30-50 words (2-3 sentences)`;

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const content = response.body.choices[0]?.message?.content || '{}';
    const qa = JSON.parse(content) as { 
      question: string; 
      answer: string; 
      category?: string; 
      difficulty?: string; 
      skillsTested?: string[] 
    };

    return {
      question: qa.question || 'Tell me about your relevant experience.',
      answer: qa.answer || 'I have extensive experience that aligns well with this role.',
      category: qa.category || 'behavioral',
      difficulty: qa.difficulty || 'medium',
      skillsTested: qa.skillsTested || []
    };
  } catch (error) {
    console.error('Error generating custom Q&A:', error);
    return {
      question: 'Tell me about your relevant experience for this role.',
      answer: 'I have extensive experience that aligns well with the requirements of this position.',
      category: 'behavioral',
      difficulty: 'medium',
      skillsTested: []
    };
  }
}

export async function evaluateResponse(
  question: string,
  transcript: string
): Promise<GPTEvaluation> {
  try {
    console.log('Getting GitHub Models client...');
    const client = getClient();

    console.log('Preparing evaluation prompt...');
    const prompt = `Evaluate this interview response:

Question: "${question}"
Answer: "${transcript}"

Analyze the response and provide a JSON evaluation with these exact fields:
{
  "clarity_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "technical_accuracy": <number 0-100>,
  "filler_word_count": <integer>,
  "speech_pace": <words per minute estimate>,
  "pause_count": <estimate of significant pauses>,
  "feedback_text": "<warm, conversational feedback paragraph>",
  "improvement_suggestions": ["<specific actionable tip>", "<another tip>"],
  "strengths": ["<what they did well>"],
  "areas_to_improve": ["<specific area to work on>"]
}

Be encouraging but honest. Focus on helping them improve their interview skills.`;

    console.log('Calling GitHub Models API...');
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        model: model,
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      }
    });

    console.log('API Response status:', response.status);

    if (isUnexpected(response)) {
      console.error('Unexpected response from GitHub Models:', response.body);
      throw new Error(response.body?.error?.message || 'API request failed');
    }

    const content = response.body.choices[0]?.message?.content || '{}';
    console.log('Parsing evaluation response...');
    const evaluation = JSON.parse(content) as GPTEvaluation;

    return {
      clarity_score: evaluation.clarity_score || 50,
      confidence_score: evaluation.confidence_score || 50,
      technical_accuracy: evaluation.technical_accuracy || 50,
      filler_word_count: evaluation.filler_word_count || 0,
      speech_pace: evaluation.speech_pace || 120,
      pause_count: evaluation.pause_count || 0,
      feedback_text: evaluation.feedback_text || 'Good effort! Keep practicing.',
      improvement_suggestions: evaluation.improvement_suggestions || [],
      strengths: evaluation.strengths || [],
      areas_to_improve: evaluation.areas_to_improve || []
    };
  } catch (error) {
    console.error('Error evaluating response:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return {
      clarity_score: 50,
      confidence_score: 50,
      technical_accuracy: 50,
      filler_word_count: 0,
      speech_pace: 120,
      pause_count: 0,
      feedback_text: 'Thank you for your response. Keep practicing to improve your interview skills.',
      improvement_suggestions: ['Practice speaking more slowly and clearly'],
      strengths: ['You attempted the question'],
      areas_to_improve: ['Clarity and structure']
    };
  }
}

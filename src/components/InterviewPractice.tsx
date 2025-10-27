import { QuestionSkeleton } from './Skeleton';
import { useState, useCallback, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { MicButton } from './MicButton';
import { usePimsleurCycle } from '../hooks/usePimsleurCycle';
import { InterviewSession, Evaluation, InterviewMode, TrainMethod, QuestionCategory, DifficultyLevel } from '../types';
import {
  startSession,
  getNextQuestion,
  synthesizeSpeech,
  transcribeAudio,
  evaluateResponse,
  getModelAnswer,
  getCustomQA,
  completeSession
} from '../services/api';
import { Loader2, CheckCircle2, AlertCircle, GraduationCap, Target, Sparkles, BookOpen, Filter, Trophy, Star, TrendingUp } from 'lucide-react';

interface InterviewPracticeProps {
  initialMode?: InterviewMode;
  onExit?: () => void;
}

interface SessionSummary {
  questionsAnswered: number;
  avgClarity: number;
  avgConfidence: number;
  avgAccuracy: number;
  totalScore: number;
}

export function InterviewPractice({ initialMode = 'practice' }: InterviewPracticeProps) {
  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [trainMethod, setTrainMethod] = useState<TrainMethod | null>(null);
  const [category, setCategory] = useState<QuestionCategory>('behavioral');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [showJobDescInput, setShowJobDescInput] = useState(false);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [hasStarted, setHasStarted] = useState(false);
  const [modelAnswer, setModelAnswer] = useState<string>('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);

  const {
    currentState,
    currentQuestion,
    startCycle,
    moveToNextState,
    updateState
  } = usePimsleurCycle({
    mode,
    pauseDuration: 3000
  });

  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { session: newSession } = await startSession('behavioral', difficulty);
      setSession(newSession);

      // For custom train mode, generate question from job description
      if (mode === 'train' && trainMethod === 'custom' && jobDescription) {
        const { question, modelAnswer: answer } = await getCustomQA(jobDescription, newSession.id);
        setQuestionNumber(1);
        setModelAnswer(answer);

        const { audio } = await synthesizeSpeech(question.question_text);
        startCycle(question);
        // Set audio after state transition to prevent race condition
        setAudioBase64(audio);
      } else {
        // Default mode: get question from database
        const { question } = await getNextQuestion(newSession.id, category, difficulty);
        setQuestionNumber(1);

        const { audio } = await synthesizeSpeech(question.question_text);
        
        startCycle(question);
        setAudioBase64(audio);
      }
      
      setHasStarted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
      console.error('Session initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startCycle, mode, trainMethod, jobDescription, category, difficulty]);

  const handleStartInterview = (selectedMode: InterviewMode, method?: TrainMethod) => {
    setMode(selectedMode);
    if (selectedMode === 'train' && method) {
      setTrainMethod(method);
      if (method === 'custom') {
        setShowJobDescInput(true);
        return; // Don't start yet, wait for job description
      }
    }
    initializeSession();
  };

  const handleJobDescriptionSubmit = () => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }
    setShowJobDescInput(false);
    initializeSession();
  };

  // Helper function to split text into sentences
  const splitIntoSentences = (text: string): string[] => {
    // Split by sentence-ending punctuation, keeping the punctuation
    return text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
  };

  // Helper function to estimate reading time for a sentence (in ms)
  const estimateReadingTime = (sentence: string): number => {
    // Average reading speed: ~150 words per minute = 2.5 words per second
    // Add base time for processing
    const wordCount = sentence.split(/\s+/).length;
    const readingTime = (wordCount / 2.5) * 1000; // Convert to milliseconds
    return Math.max(2000, readingTime + 1000); // Minimum 2s, add 1s buffer
  };

  // Train mode: Play sentences one by one with pauses
  const playNextSentence = useCallback(async (sentenceArray: string[], index: number) => {
    if (index >= sentenceArray.length) {
      // All sentences played, move to next state
      moveToNextState(); // Move to PAUSE_AFTER_REPEAT
      return;
    }

    const sentence = sentenceArray[index];
    setCurrentSentenceIndex(index);

    try {
      // Synthesize this sentence
      const { audio } = await synthesizeSpeech(sentence);
      setAudioBase64(audio);

      // Wait for audio to play, then pause for user to repeat
      // The pause will be handled by the audio ended callback
    } catch (err) {
      console.error('Error synthesizing sentence:', err);
      // Skip to next sentence if there's an error
      setTimeout(() => playNextSentence(sentenceArray, index + 1), 1000);
    }
  }, [moveToNextState]);

  // Auto-transitions for Practice mode
  useEffect(() => {
    if (mode === 'practice' && currentState === 'ASK') {
      // After question ends, wait a moment then move to LISTEN state
      // The transition will be handled by handleAudioEnded
    }
  }, [currentState, mode]);

  // Auto-transitions for Train mode
  useEffect(() => {
    if (mode === 'train') {
      if (currentState === 'PAUSE1') {
        // After question, wait 2s then show model answer
        const timer = setTimeout(async () => {
          if (!currentQuestion) return;
          
          try {
            const { modelAnswer: answer } = await getModelAnswer(
              currentQuestion.question_text,
              currentQuestion.category,
              currentQuestion.difficulty
            );
            setModelAnswer(answer);
            
            const { audio } = await synthesizeSpeech(answer);
            moveToNextState(); // Move to MODEL_ANSWER
            setAudioBase64(audio);
          } catch (err) {
            setError('Failed to generate model answer');
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      if (currentState === 'PAUSE_AFTER_MODEL') {
        // After model answer, wait 2s then start sentence-by-sentence repetition
        const timer = setTimeout(() => {
          if (!modelAnswer) return;
          
          // Split model answer into sentences
          const sentenceArray = splitIntoSentences(modelAnswer);
          setSentences(sentenceArray);
          setCurrentSentenceIndex(0);
          
          // Clear any previous audio before transitioning
          setAudioBase64('');
          
          // Start playing first sentence
          moveToNextState(); // Move to REPEAT_ANSWER
          
          // Small delay to ensure state transition completes before setting new audio
          setTimeout(() => {
            playNextSentence(sentenceArray, 0);
          }, 100);
        }, 2000);
        return () => clearTimeout(timer);
      }
      
      if (currentState === 'PAUSE_AFTER_REPEAT') {
        // After repeat, wait 2s then start recording
        const timer = setTimeout(() => {
          moveToNextState(); // Move to LISTEN
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentState, mode, currentQuestion, modelAnswer, moveToNextState]);

  const handleAudioEnded = useCallback(async () => {
    if (mode === 'practice') {
      // Practice mode audio handling
      if (currentState === 'ASK') {
        // After question plays, move directly to LISTEN (recording) state
        moveToNextState();
      } else if (currentState === 'FEEDBACK') {
        moveToNextState();
      }
    } else {
      // Train mode audio handling
      if (currentState === 'ASK') {
        moveToNextState(); // Go to PAUSE1
      } else if (currentState === 'MODEL_ANSWER') {
        moveToNextState(); // Go to PAUSE_AFTER_MODEL
      } else if (currentState === 'REPEAT_ANSWER') {
        // After each sentence plays, pause for user to repeat
        const pauseTime = estimateReadingTime(sentences[currentSentenceIndex]);
        
        setTimeout(() => {
          // Play next sentence
          playNextSentence(sentences, currentSentenceIndex + 1);
        }, pauseTime);
      } else if (currentState === 'FEEDBACK') {
        moveToNextState();
      }
    }
  }, [currentState, currentQuestion, moveToNextState, mode, sentences, currentSentenceIndex, estimateReadingTime, playNextSentence]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    if (!session || !currentQuestion) return;

    setIsLoading(true);
    setError(null);

    try {
      const { transcript: audioTranscript } = await transcribeAudio(audioBlob);
      setTranscript(audioTranscript);

      updateState('EVALUATE');

      // In train mode, evaluate against model answer; in practice mode, against question
      // (previously constructed evaluationContext removed — API call uses explicit parameters)

      const { evaluation } = await evaluateResponse(
        session.id,
        currentQuestion.id,
        questionNumber,
        currentQuestion.question_text,
        audioTranscript
      );

      setCurrentEvaluation(evaluation);

      // Store evaluation for session summary
      setAllEvaluations(prev => [...prev, evaluation]);

      const feedbackText = mode === 'train'
        ? `Great job practicing! ${evaluation.feedback_text}`
        : evaluation.feedback_text;

      const { audio } = await synthesizeSpeech(feedbackText);
      
      updateState('FEEDBACK');
      // Set audio after state transition to prevent race condition
      setAudioBase64(audio);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process recording';
      setError(`Evaluation error: ${errorMessage}. Continuing with manual feedback.`);
      console.error('Recording processing error:', err);
      
      // Create a basic evaluation as fallback
      const fallbackEvaluation: Evaluation = {
        clarity_score: 70,
        confidence_score: 70,
        technical_accuracy: 70,
        filler_word_count: 0,
        speech_pace: 120,
        pause_count: 0,
        feedback_text: mode === 'train'
          ? 'Good effort practicing! Keep working on matching the model answer\'s structure and delivery.'
          : 'Thank you for your response. Keep practicing to improve your interview skills.',
        improvement_suggestions: mode === 'train' 
          ? ['Practice repeating the model answer', 'Focus on clarity and confidence']
          : ['Speak clearly and confidently', 'Structure your answer well'],
        strengths: ['You attempted the question', 'Keep practicing!'],
        areas_to_improve: ['Clarity', 'Confidence']
      };
      
      setCurrentEvaluation(fallbackEvaluation);
      
      try {
        const { audio } = await synthesizeSpeech(fallbackEvaluation.feedback_text);
        updateState('FEEDBACK');
        setAudioBase64(audio);
      } catch (ttsErr) {
        console.error('TTS also failed:', ttsErr);
        updateState('FEEDBACK');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, currentQuestion, questionNumber, updateState, mode, modelAnswer]);

  const handleEndSession = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      console.log('Completing session:', session.id);
      
      // Calculate session summary from all evaluations
      // Calculate session summary from all evaluations
      let claritySum = 0;
      let confidenceSum = 0;
      let accuracySum = 0;

      allEvaluations.forEach(e => {
        claritySum += e.clarity_score;
        confidenceSum += e.confidence_score;
        accuracySum += e.technical_accuracy;
      });

      const summary: SessionSummary = {
        questionsAnswered: questionNumber,
        avgClarity: allEvaluations.length > 0 ? claritySum / allEvaluations.length : 0,
        avgConfidence: allEvaluations.length > 0 ? confidenceSum / allEvaluations.length : 0,
        avgAccuracy: allEvaluations.length > 0 ? accuracySum / allEvaluations.length : 0,
        totalScore: 0 // Will be calculated
      };
      
      // Calculate overall score (average of all metrics)
      summary.totalScore = (summary.avgClarity + summary.avgConfidence + summary.avgAccuracy) / 3;
      
      setSessionSummary(summary);
      
      // Save session to backend
      await completeSession(session.id);
      console.log('Session completed successfully');
      
      // Show completion modal instead of navigating away
      setShowCompletionModal(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to complete session:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete session');
      setIsLoading(false);
    }
  }, [session, questionNumber, allEvaluations]);

  const handleContinueSession = useCallback(() => {
    // Close modal and allow user to continue with more questions
    setShowCompletionModal(false);
    setSessionSummary(null);
  }, []);

  const handleReturnToDashboard = useCallback(() => {
    // Navigate back to dashboard
    window.location.href = '/';
  }, []);

  const handleNextQuestion = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);
    setTranscript('');
    setCurrentEvaluation(null);
    setModelAnswer('');
    setSentences([]);
    setCurrentSentenceIndex(0);

    try {
      // For custom train mode, generate from job description
      if (mode === 'train' && trainMethod === 'custom' && jobDescription) {
        const { question, modelAnswer: answer } = await getCustomQA(jobDescription, session.id);
        setQuestionNumber(prev => prev + 1);
        setModelAnswer(answer);

        const { audio } = await synthesizeSpeech(question.question_text);
        
        startCycle(question);
        setAudioBase64(audio);
      } else {
        // Default mode
        const { question } = await getNextQuestion(session.id, category, difficulty);
        setQuestionNumber(prev => prev + 1);

        const { audio } = await synthesizeSpeech(question.question_text);
        
        startCycle(question);
        setAudioBase64(audio);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load next question');
      console.error('Next question error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session, startCycle, mode, trainMethod, jobDescription, category, difficulty]);

  const getStateDisplay = () => {
    switch (currentState) {
      case 'ASK':
        return { title: 'Listen to the Question', color: 'text-blue-600' };
      case 'PAUSE1':
        return { title: 'Processing...', color: 'text-gray-600' };
      case 'REPEAT':
        return { title: 'Repeat After Me', color: 'text-purple-600' };
      case 'PAUSE2':
        return { title: 'Your Turn', color: 'text-green-600' };
      case 'MODEL_ANSWER':
        return { title: 'Listen to Model Answer', color: 'text-indigo-600' };
      case 'PAUSE_AFTER_MODEL':
        return { title: 'Get Ready to Repeat...', color: 'text-gray-600' };
      case 'REPEAT_ANSWER':
        return { 
          title: sentences.length > 0 
            ? `Repeat Sentence ${currentSentenceIndex + 1}/${sentences.length}` 
            : 'Repeat the Answer', 
          color: 'text-purple-600' 
        };
      case 'PAUSE_AFTER_REPEAT':
        return { title: 'Now Try Yourself', color: 'text-green-600' };
      case 'LISTEN':
        return { title: 'Recording Your Answer', color: 'text-red-600' };
      case 'EVALUATE':
        return { title: 'Evaluating Response', color: 'text-orange-600' };
      case 'FEEDBACK':
        return { title: 'Feedback', color: 'text-teal-600' };
      case 'NEXT':
        return { title: 'Ready for Next Question', color: 'text-green-600' };
      default:
        return { title: 'Initializing', color: 'text-gray-600' };
    }
  };

  const stateDisplay = getStateDisplay();

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-card rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Interview Coach
          </h1>
          <p className="text-gray-600">Practice with the Pimsleur method</p>
        </div>

        {!hasStarted && !showJobDescInput ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Choose Your Learning Mode
              </h2>
              <p className="text-gray-600 mb-6">
                Select how you want to practice your interview skills
              </p>
            </div>

            {/* Question Filters */}
            <div className="w-full max-w-3xl mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-800">Question Preferences</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as QuestionCategory)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="behavioral">Behavioral</option>
                    <option value="technical">Technical</option>
                    <option value="situational">Situational</option>
                    <option value="company-specific">Company-Specific</option>
                    <option value="general">General</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {category === 'behavioral' && 'Past experiences & work behavior'}
                    {category === 'technical' && 'Technical skills & knowledge'}
                    {category === 'situational' && 'Hypothetical scenarios'}
                    {category === 'company-specific' && 'Company culture & fit'}
                    {category === 'general' && 'General interview questions'}
                  </p>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {difficulty === 'easy' && 'Great for beginners & warm-up'}
                    {difficulty === 'medium' && 'Standard interview difficulty'}
                    {difficulty === 'hard' && 'Advanced & challenging questions'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-8">
              {/* Practice Mode Card */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Practice Mode</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Answer questions on your own. Perfect for testing your current skills and getting personalized feedback.
                </p>
                <ul className="text-sm text-gray-500 mb-4 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Listen to questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Answer in your own words</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Get detailed feedback</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleStartInterview('practice')}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Start Practice Mode
                </button>
              </div>

              {/* Train Mode Card */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap className="w-8 h-8 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">Train Mode</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Learn with Pimsleur method. Listen to model answers, repeat them, then try answering yourself.
                </p>
                
                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => handleStartInterview('train', 'default')}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    Default Training
                  </button>
                  <button
                    onClick={() => handleStartInterview('train', 'custom')}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Custom (Job-Based)
                  </button>
                </div>
                
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Default: General interview questions</li>
                  <li>• Custom: Questions from your job description</li>
                </ul>
              </div>
            </div>
            
            {isLoading && (
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Preparing your session...</span>
              </div>
            )}
          </div>
        ) : showJobDescInput ? (
          <div className="flex flex-col items-center justify-center py-16 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Enter Job Description
              </h2>
              <p className="text-gray-600 mb-6">
                Paste the job description below and AI will generate relevant interview questions and model answers
              </p>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here... (e.g., job title, requirements, responsibilities, skills needed)"
              className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none mb-4"
            />

            {error && (
              <div className="w-full flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-4 w-full">
              <button
                onClick={() => {
                  setShowJobDescInput(false);
                  setJobDescription('');
                  setError(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleJobDescriptionSubmit}
                disabled={isLoading || !jobDescription.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Start Training
                  </>
                )}
              </button>
            </div>
          </div>
        ) : isLoading && currentState === 'IDLE' ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Preparing your interview session...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">
                    Question {questionNumber}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    mode === 'train' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {mode === 'train' ? '🎓 Train Mode' : '🎯 Practice Mode'}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 capitalize">
                    {category}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 capitalize">
                    {difficulty}
                  </span>
                </div>
                <span className={`text-lg font-semibold ${stateDisplay.color}`}>
                  {stateDisplay.title}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                {isLoading ? (
                  <QuestionSkeleton />
                ) : currentQuestion ? (
                  <p className="text-xl text-gray-800 text-center font-medium">
                    {currentQuestion.question_text}
                  </p>
                ) : null}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Show model answer in train mode */}
              {mode === 'train' && modelAnswer && ['MODEL_ANSWER', 'PAUSE_AFTER_MODEL', 'REPEAT_ANSWER', 'PAUSE_AFTER_REPEAT', 'LISTEN'].includes(currentState) && (
                <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-indigo-900 mb-2">
                    Model Answer:
                  </p>
                  {currentState === 'REPEAT_ANSWER' && sentences.length > 0 ? (
                    <div className="space-y-2">
                      {sentences.map((sentence, index) => (
                        <p
                          key={index}
                          className={`transition-all duration-300 ${
                            index === currentSentenceIndex
                              ? 'text-gray-900 font-semibold bg-yellow-100 px-2 py-1 rounded'
                              : index < currentSentenceIndex
                              ? 'text-gray-500 italic'
                              : 'text-gray-600 italic'
                          }`}
                        >
                          {sentence}
                        </p>
                      ))}
                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                        <span className="bg-yellow-200 px-2 py-0.5 rounded">
                          Sentence {currentSentenceIndex + 1} of {sentences.length}
                        </span>
                        <span>← Repeat this sentence</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 italic">{modelAnswer}</p>
                  )}
                </div>
              )}

              <div className="flex justify-center mb-6">
                <AudioPlayer
                  audioBase64={audioBase64}
                  autoPlay={['ASK', 'REPEAT', 'MODEL_ANSWER', 'REPEAT_ANSWER', 'FEEDBACK'].includes(currentState)}
                  onEnded={handleAudioEnded}
                />
              </div>

              {currentState === 'LISTEN' && (
                <div className="flex justify-center">
                  <MicButton
                    onRecordingComplete={handleRecordingComplete}
                    disabled={isLoading}
                  />
                </div>
              )}

              {transcript && currentState !== 'LISTEN' && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Your Response:
                  </p>
                  <p className="text-gray-700">{transcript}</p>
                </div>
              )}

              {currentEvaluation && currentState === 'FEEDBACK' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-700 mb-1">Clarity</p>
                      <p className="text-2xl font-bold text-green-900">
                        {Math.round(currentEvaluation.clarity_score)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-700 mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {Math.round(currentEvaluation.confidence_score)}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-700 mb-1">Accuracy</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {Math.round(currentEvaluation.technical_accuracy)}
                      </p>
                    </div>
                  </div>

                  {currentEvaluation.strengths.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Strengths
                      </p>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                        {currentEvaluation.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEvaluation.improvement_suggestions.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-orange-900 mb-2">
                        Improvement Tips
                      </p>
                      <ul className="list-disc list-inside text-sm text-orange-800 space-y-1">
                        {currentEvaluation.improvement_suggestions.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {currentState === 'NEXT' && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleEndSession}
                    disabled={isLoading}
                    className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    End Session
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={isLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Loading...' : 'Next Question'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Session Completion Modal */}
      {showCompletionModal && sessionSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-6 border-b border-muted bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="text-center">
                {/* Celebration Animation for Good Performance */}
                {sessionSummary.totalScore >= 75 && (
                  <div className="mb-4 animate-bounce">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                      <Star className="w-6 h-6 text-yellow-400 animate-pulse delay-75" />
                      <Star className="w-6 h-6 text-yellow-400 animate-pulse delay-150" />
                    </div>
                  </div>
                )}
                
                {sessionSummary.totalScore >= 75 ? (
                  <>
                    <h2 className="text-3xl font-bold text-primary mb-2">Outstanding Performance! 🎉</h2>
                    <p className="text-muted">You crushed this session!</p>
                  </>
                ) : sessionSummary.totalScore >= 60 ? (
                  <>
                    <h2 className="text-3xl font-bold text-primary mb-2">Great Job! 👏</h2>
                    <p className="text-muted">You're making solid progress!</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-primary mb-2">Session Complete! ✓</h2>
                    <p className="text-muted">Keep practicing to improve!</p>
                  </>
                )}
              </div>
            </div>

            {/* Modal Body - Session Summary */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Overall Score Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 text-center border-2 border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-muted mb-2">Overall Score</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-5xl font-bold text-primary">
                      {Math.round(sessionSummary.totalScore)}
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-muted">/100</div>
                      {sessionSummary.totalScore >= 75 && (
                        <div className="text-xs text-green-600 font-semibold">Excellent!</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions Answered */}
                <div className="bg-card rounded-lg p-4 border border-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted">Questions Answered</p>
                        <p className="text-2xl font-bold text-primary">{sessionSummary.questionsAnswered}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Breakdown
                  </h3>
                  
                  {/* Clarity Score */}
                  <div className="bg-card rounded-lg p-4 border border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">Clarity</span>
                      <span className="text-lg font-bold text-primary">{Math.round(sessionSummary.avgClarity)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sessionSummary.avgClarity}%` }}
                      />
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-card rounded-lg p-4 border border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">Confidence</span>
                      <span className="text-lg font-bold text-primary">{Math.round(sessionSummary.avgConfidence)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sessionSummary.avgConfidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Accuracy Score */}
                  <div className="bg-card rounded-lg p-4 border border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-primary">Technical Accuracy</span>
                      <span className="text-lg font-bold text-primary">{Math.round(sessionSummary.avgAccuracy)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sessionSummary.avgAccuracy}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Motivational Message */}
                {sessionSummary.totalScore >= 75 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Amazing work!</strong> You're demonstrating excellent interview skills. Keep up this momentum!
                    </p>
                  </div>
                ) : sessionSummary.totalScore >= 60 ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>You're on the right track!</strong> Continue practicing to refine your skills further.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      <strong>Keep going!</strong> Every practice session helps you improve. Consider reviewing the feedback and trying again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="px-6 py-4 border-t border-muted bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between gap-4">
              <button
                onClick={handleContinueSession}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Continue Practicing
              </button>
              <button
                onClick={handleReturnToDashboard}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

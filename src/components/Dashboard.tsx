import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSessionHistory, getSessionResponses } from '../services/api';
import {
  StatsSkeleton,
  SessionHistorySkeleton
} from './Skeleton';
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Target, 
  Clock, 
  BarChart3,
  Play,
  History,
  ChevronRight,
  Trophy,
  Zap,
  BookOpen,
  GraduationCap,
  X,
  MessageSquare
} from 'lucide-react';

interface SessionSummary {
  id: string;
  created_at: string;
  session_type: string;
  difficulty_level: string;
  total_questions: number;
  avg_clarity_score: number;
  avg_confidence_score: number;
  status: string;
  completed_at?: string;
}

interface SessionResponse {
  id: string;
  question_number: number;
  audio_transcript: string;
  clarity_score: number;
  confidence_score: number;
  gpt_evaluation: string;
  interview_questions: {
    question_text: string;
    category: string;
    difficulty: string;
  };
}

interface DashboardProps {
  onStartPractice: (mode: 'practice' | 'train') => void;
}

export function Dashboard({ onStartPractice }: DashboardProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [sessionResponses, setSessionResponses] = useState<SessionResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalQuestions: 0,
    avgClarity: 0,
    avgConfidence: 0,
    recentSessions: 0
  });

  useEffect(() => {
    fetchSessionHistory();
  }, []);

  const fetchSessionHistory = async () => {
    try {
      console.log('Fetching session history...');
      const data = await getUserSessionHistory();
      console.log('Session history data:', data);
      const sessionsList = data.sessions || [];
      console.log('Sessions list:', sessionsList);
      
      setSessions(sessionsList);
      
      // Calculate stats
      const completed = sessionsList.filter((s: SessionSummary) => s.status === 'completed');
      console.log('Completed sessions:', completed);
      const recentSessions = sessionsList.filter((s: SessionSummary) => {
        const sessionDate = new Date(s.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate > weekAgo;
      });

      const calculatedStats = {
        totalSessions: completed.length,
        totalQuestions: completed.reduce((sum: number, s: SessionSummary) => sum + (s.total_questions || 0), 0),
        avgClarity: completed.length > 0 
          ? completed.reduce((sum: number, s: SessionSummary) => sum + (s.avg_clarity_score || 0), 0) / completed.length 
          : 0,
        avgConfidence: completed.length > 0
          ? completed.reduce((sum: number, s: SessionSummary) => sum + (s.avg_confidence_score || 0), 0) / completed.length
          : 0,
        recentSessions: recentSessions.length
      };

      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch session history:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleViewSession = async (session: SessionSummary) => {
    setSelectedSession(session);
    setLoadingResponses(true);
    try {
      const data = await getSessionResponses(session.id);
      setSessionResponses(data.responses || []);
    } catch (error) {
      console.error('Failed to fetch session responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleCloseSessionDetail = () => {
    setSelectedSession(null);
    setSessionResponses([]);
  };

  return (
    <div className="min-h-screen bg-app p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">Track your progress and continue your interview practice journey</p>
        </div>

        {/* Quick Start Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Practice Mode */}
          <button
            onClick={() => onStartPractice('practice')}
            className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Practice Mode</h3>
            <p className="text-gray-600 text-sm mb-4">
              Answer questions on your own and receive personalized AI feedback
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Play className="w-4 h-4" />
              <span>Start Practicing</span>
            </div>
          </button>

          {/* Train Mode */}
          <button
            onClick={() => onStartPractice('train')}
            className="bg-card rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 text-left group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Train Mode</h3>
            <p className="text-gray-600 text-sm mb-4">
              Learn from AI model answers using the Pimsleur method
            </p>
            <div className="flex items-center gap-2 text-purple-600 font-medium">
              <Play className="w-4 h-4" />
              <span>Start Training</span>
            </div>
          </button>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-card rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          {/* Total Questions */}
          <div className="bg-card rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
              </div>
            </div>
          </div>

          {/* Avg Clarity */}
          <div className="bg-card rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Clarity Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgClarity > 0 ? Math.round(stats.avgClarity) : '--'}
                </p>
              </div>
            </div>
          </div>

          {/* Avg Confidence */}
          <div className="bg-card rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avgConfidence > 0 ? Math.round(stats.avgConfidence) : '--'}
                </p>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Session History */}
  <div className="bg-card rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-muted flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            </div>
            {sessions.length > 5 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-muted">Loading sessions...</p>
            <div className="p-6">
              <SessionHistorySkeleton />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-6">Start your first interview practice session to track your progress</p>
              <button
                onClick={() => onStartPractice('practice')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start First Session
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--muted)' }}>
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleViewSession(session)}
                  className="w-full p-6 hover:bg-opacity-5 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {session.session_type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {session.difficulty_level}
                        </span>
                        {session.status === 'completed' ? (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            In Progress
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.total_questions} questions
                        </span>
                      </div>
                      {session.status === 'completed' && (
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(session.avg_clarity_score)}`}>
                            Clarity: {Math.round(session.avg_clarity_score)}%
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(session.avg_confidence_score)}`}>
                            Confidence: {Math.round(session.avg_confidence_score)}%
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Performance Insights (if there are sessions) */}
        {sessions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">Performance Trend</h3>
              </div>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600 text-sm">
                  {stats.recentSessions > 0 
                    ? `You completed ${stats.recentSessions} session${stats.recentSessions > 1 ? 's' : ''} this week!`
                    : 'No sessions this week. Start practicing to track your progress!'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {selectedSession.session_type}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    {selectedSession.difficulty_level}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatDate(selectedSession.created_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseSessionDetail}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingResponses ? (
                <div className="py-6 px-4">
                  <SessionHistorySkeleton />
                </div>
              ) : sessionResponses.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No responses found for this session</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sessionResponses.map((response, index) => (
                    <div key={response.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      {/* Question */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">Question</h3>
                        </div>
                        <p className="text-gray-700 ml-10">{response.interview_questions.question_text}</p>
                      </div>

                      {/* Your Answer */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 ml-10">Your Answer:</h4>
                        <p className="text-gray-800 ml-10 bg-white p-4 rounded-lg border border-gray-200">
                          {response.audio_transcript || 'No transcript available'}
                        </p>
                      </div>

                      {/* Scores */}
                      {response.clarity_score !== null && response.confidence_score !== null && (
                        <div className="flex items-center gap-4 ml-10 mb-4">
                          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${getScoreColor(response.clarity_score)}`}>
                            Clarity: {Math.round(response.clarity_score)}%
                          </div>
                          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${getScoreColor(response.confidence_score)}`}>
                            Confidence: {Math.round(response.confidence_score)}%
                          </div>
                        </div>
                      )}

                      {/* AI Feedback */}
                      {response.gpt_evaluation && (
                        <div className="ml-10">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">AI Feedback:</h4>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{response.gpt_evaluation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedSession.status === 'completed' && (
                  <span>
                    Session completed • {selectedSession.total_questions} questions answered
                  </span>
                )}
              </div>
              <button
                onClick={handleCloseSessionDetail}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

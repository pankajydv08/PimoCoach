import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSessionHistory } from '../services/api';
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
  GraduationCap
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

interface DashboardProps {
  onStartPractice: (mode: 'practice' | 'train') => void;
}

export function Dashboard({ onStartPractice }: DashboardProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
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
      const data = await getUserSessionHistory();
      const sessionsList = data.sessions || [];
      
      setSessions(sessionsList);
      
      // Calculate stats
      const completed = sessionsList.filter((s: SessionSummary) => s.status === 'completed');
      const recentSessions = sessionsList.filter((s: SessionSummary) => {
        const sessionDate = new Date(s.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sessionDate > weekAgo;
      });

      setStats({
        totalSessions: completed.length,
        totalQuestions: completed.reduce((sum: number, s: SessionSummary) => sum + s.total_questions, 0),
        avgClarity: completed.length > 0 
          ? completed.reduce((sum: number, s: SessionSummary) => sum + s.avg_clarity_score, 0) / completed.length 
          : 0,
        avgConfidence: completed.length > 0
          ? completed.reduce((sum: number, s: SessionSummary) => sum + s.avg_confidence_score, 0) / completed.length
          : 0,
        recentSessions: recentSessions.length
      });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
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
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 text-left group"
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
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500 text-left group"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <div className="bg-white rounded-xl p-6 shadow-md">
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
          <div className="bg-white rounded-xl p-6 shadow-md">
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
          <div className="bg-white rounded-xl p-6 shadow-md">
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
          <div className="bg-white rounded-xl p-6 shadow-md">
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

        {/* Session History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
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
              <p className="mt-4 text-gray-600">Loading sessions...</p>
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
            <div className="divide-y divide-gray-200">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {session.session_type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {session.difficulty_level}
                        </span>
                        {session.status === 'completed' && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
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
                    <button className="text-gray-400 hover:text-gray-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
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
    </div>
  );
}

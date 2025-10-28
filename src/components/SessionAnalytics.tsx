import { useEffect, useState } from 'react';
import { exportSessionToCSV } from '../utils/export';
import { UserResponse, InterviewSession } from '../types';
import { getSession, getSessionResponses } from '../services/api';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

interface SessionAnalyticsProps {
  sessionId: string;
}

export function SessionAnalytics({ sessionId }: SessionAnalyticsProps) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionData, responsesData] = await Promise.all([
          getSession(sessionId),
          getSessionResponses(sessionId)
        ]);

        setSession(sessionData.session);
        setResponses(responsesData.responses);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-600">Session not found</p>
      </div>
    );
  }

  const clarityScores = responses.map(r => r.clarity_score || 0);
  const confidenceScores = responses.map(r => r.confidence_score || 0);
  const avgClarity = clarityScores.reduce((a, b) => a + b, 0) / clarityScores.length || 0;
  const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Summary</h1>
              <p className="text-gray-600 mb-8">Review your performance and track your progress</p>
            </div>
            <div>
              {responses.length > 0 && (
                <button
                  onClick={() => exportSessionToCSV(session, responses)}
                  className="px-4 py-2 bg-white border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Questions</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {responses.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-900">Avg Clarity</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {Math.round(avgClarity)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Avg Confidence</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {Math.round(avgConfidence)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Status</span>
              </div>
              <p className="text-lg font-bold text-orange-900 capitalize">
                {session.status}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Question History</h2>

            {responses.map((response, index) => (
              <div key={response.id} className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                      Question {index + 1}
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {response.interview_questions?.question_text}
                    </p>
                  </div>
                </div>

                {response.audio_transcript && (
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Your Answer:
                    </p>
                    <p className="text-gray-600">{response.audio_transcript}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Clarity</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(response.clarity_score || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(response.confidence_score || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(response.technical_accuracy || 0)}
                    </p>
                  </div>
                </div>

                {response.feedback_history && response.feedback_history.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Feedback</p>
                    <p className="text-sm text-blue-800 mb-3">
                      {response.feedback_history[0].feedback_text}
                    </p>

                    {response.feedback_history[0].improvement_suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-blue-900 mb-1">
                          Tips for Improvement:
                        </p>
                        <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
                          {response.feedback_history[0].improvement_suggestions.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

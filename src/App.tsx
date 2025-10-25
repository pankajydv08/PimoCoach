import { useState } from 'react';
import { InterviewPractice } from './components/InterviewPractice';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogOut, User, Home, Mic } from 'lucide-react';

type AppView = 'dashboard' | 'practice' | 'train';
type InterviewMode = 'practice' | 'train';

function AppContent() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('practice');

  if (!user) {
    return <Login />;
  }

  const handleStartInterview = (mode: InterviewMode) => {
    setInterviewMode(mode);
    setCurrentView(mode);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="relative min-h-screen">
      {/* Navigation bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo/Title */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <Mic className="w-6 h-6" />
              <span>Interview Coach</span>
            </button>

            {/* Navigation Links */}
            <nav className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <ProtectedRoute>
        {currentView === 'dashboard' ? (
          <Dashboard onStartPractice={handleStartInterview} />
        ) : (
          <InterviewPractice 
            initialMode={interviewMode}
            onExit={handleBackToDashboard}
          />
        )}
      </ProtectedRoute>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

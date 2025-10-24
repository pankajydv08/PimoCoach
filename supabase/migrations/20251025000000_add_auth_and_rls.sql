-- Enable Google OAuth provider in Supabase Auth
-- Note: This must also be configured in Supabase Dashboard > Authentication > Providers > Google
-- Add your Google OAuth credentials there

-- Update interview_sessions table to ensure user_id is properly linked to auth.users
ALTER TABLE interview_sessions 
  DROP CONSTRAINT IF EXISTS interview_sessions_user_id_fkey;

ALTER TABLE interview_sessions
  ADD CONSTRAINT interview_sessions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create index for better query performance on user_id
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id 
  ON interview_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_status 
  ON interview_sessions(user_id, status);

-- Add RLS (Row Level Security) policies for interview_sessions
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" 
  ON interview_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can only create sessions for themselves
CREATE POLICY "Users can create own sessions" 
  ON interview_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own sessions
CREATE POLICY "Users can update own sessions" 
  ON interview_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" 
  ON interview_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for interview_questions
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Questions are readable by authenticated users
CREATE POLICY "Authenticated users can view questions" 
  ON interview_questions 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert questions (via backend)
CREATE POLICY "Service role can insert questions" 
  ON interview_questions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Add RLS policies for user_responses
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see responses from their own sessions
CREATE POLICY "Users can view own responses" 
  ON user_responses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      WHERE interview_sessions.id = user_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Policy: Users can insert responses to their own sessions
CREATE POLICY "Users can create own responses" 
  ON user_responses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      WHERE interview_sessions.id = session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own responses
CREATE POLICY "Users can update own responses" 
  ON user_responses 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions 
      WHERE interview_sessions.id = user_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Add RLS policies for feedback_history
ALTER TABLE feedback_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feedback from their own responses
CREATE POLICY "Users can view own feedback" 
  ON feedback_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_responses 
      JOIN interview_sessions ON interview_sessions.id = user_responses.session_id
      WHERE user_responses.id = feedback_history.response_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Policy: Service role can insert feedback (via backend)
CREATE POLICY "Service role can insert feedback" 
  ON feedback_history 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Create a user profile table to store additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

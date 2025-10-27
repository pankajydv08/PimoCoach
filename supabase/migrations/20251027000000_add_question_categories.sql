/*
  # Add Question Categories Enhancement
  
  Adds specific question categories and updates existing questions
  to support Technical, Behavioral, Situational, and Company-specific categories
*/

-- Create a check constraint for valid categories
ALTER TABLE interview_questions 
DROP CONSTRAINT IF EXISTS interview_questions_category_check;

ALTER TABLE interview_questions
ADD CONSTRAINT interview_questions_category_check 
CHECK (category IN ('technical', 'behavioral', 'situational', 'company-specific', 'general'));

-- Update existing questions to use the new categories
UPDATE interview_questions 
SET category = 'behavioral'
WHERE category = 'general' OR category NOT IN ('technical', 'behavioral', 'situational', 'company-specific');

-- Insert sample questions for each category

-- Technical Questions
INSERT INTO interview_questions (question_text, category, difficulty, expected_keywords, follow_up_prompts) VALUES
  ('Explain the difference between var, let, and const in JavaScript', 'technical', 'easy',
   ARRAY['scope', 'hoisting', 'reassignment', 'block-scoped'],
   ARRAY['When would you use each?', 'What are the best practices?']),
   
  ('What is the time complexity of common sorting algorithms?', 'technical', 'medium',
   ARRAY['O(n log n)', 'quicksort', 'mergesort', 'bubble sort', 'efficiency'],
   ARRAY['Which algorithm would you choose and why?', 'What about space complexity?']),
   
  ('Describe how REST APIs work and their key principles', 'technical', 'medium',
   ARRAY['HTTP', 'stateless', 'resources', 'CRUD', 'endpoints'],
   ARRAY['How do you handle authentication?', 'REST vs GraphQL?']),
   
  ('Explain database normalization and why it matters', 'technical', 'hard',
   ARRAY['1NF', '2NF', '3NF', 'redundancy', 'integrity'],
   ARRAY['What are the trade-offs?', 'When would you denormalize?']);

-- Situational Questions
INSERT INTO interview_questions (question_text, category, difficulty, expected_keywords, follow_up_prompts) VALUES
  ('How would you handle a situation where a client is unhappy with the project progress?', 'situational', 'medium',
   ARRAY['communication', 'transparency', 'solution', 'expectations'],
   ARRAY['What steps would you take first?', 'How do you prevent this?']),
   
  ('If you disagreed with your manager''s technical decision, what would you do?', 'situational', 'medium',
   ARRAY['respect', 'data', 'communication', 'compromise', 'team'],
   ARRAY['How do you present your perspective?', 'What if they still disagree?']),
   
  ('Your team is falling behind on a deadline. What actions would you take?', 'situational', 'hard',
   ARRAY['prioritize', 'communicate', 'resources', 'realistic', 'stakeholders'],
   ARRAY['How do you decide what to cut?', 'How do you prevent this?']),
   
  ('A team member is not contributing equally. How do you address this?', 'situational', 'hard',
   ARRAY['private conversation', 'understand', 'support', 'accountability'],
   ARRAY['What if the behavior continues?', 'How do you keep team morale up?']);

-- Company-specific Questions
INSERT INTO interview_questions (question_text, category, difficulty, expected_keywords, follow_up_prompts) VALUES
  ('What do you know about our company and why do you want to join us?', 'company-specific', 'easy',
   ARRAY['research', 'mission', 'values', 'products', 'culture', 'alignment'],
   ARRAY['What excites you most?', 'How do your values align with ours?']),
   
  ('How would you contribute to our company culture?', 'company-specific', 'medium',
   ARRAY['collaboration', 'innovation', 'values', 'teamwork', 'diversity'],
   ARRAY['Can you give specific examples?', 'What have you done in past roles?']),
   
  ('What do you think are the biggest challenges facing our industry?', 'company-specific', 'hard',
   ARRAY['trends', 'competition', 'innovation', 'market', 'technology'],
   ARRAY['How would you address these?', 'What opportunities do you see?']),
   
  ('If you were hired, what would be your priorities in the first 90 days?', 'company-specific', 'medium',
   ARRAY['learn', 'relationships', 'understand', 'contribute', 'goals'],
   ARRAY['How would you measure success?', 'What resources would you need?']);

-- Add more technical questions
INSERT INTO interview_questions (question_text, category, difficulty, expected_keywords, follow_up_prompts) VALUES
  ('What is your experience with version control systems like Git?', 'technical', 'easy',
   ARRAY['branches', 'commits', 'merge', 'pull request', 'collaboration'],
   ARRAY['Describe your typical Git workflow', 'How do you handle merge conflicts?']),
   
  ('Explain the concept of dependency injection', 'technical', 'hard',
   ARRAY['decoupling', 'testing', 'constructor', 'interface', 'IoC'],
   ARRAY['What are the benefits?', 'Can you give a real-world example?']);

-- Create an index on category for better filtering performance
CREATE INDEX IF NOT EXISTS idx_questions_category_difficulty 
ON interview_questions(category, difficulty);

-- Add comment to table
COMMENT ON COLUMN interview_questions.category IS 
'Question category: technical, behavioral, situational, company-specific, or general';

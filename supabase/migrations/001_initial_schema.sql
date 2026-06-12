-- Enable pg_trgm extension for question text similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- USERS TABLE
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text, -- null for OAuth users
  avatar_url text,
  role text DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  target_exams text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- QUESTIONS BANK
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL CHECK (subject IN (
    'Quantitative Aptitude','Reasoning','English',
    'General Awareness','Computer Awareness'
  )),
  topic text NOT NULL,
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  question_text text NOT NULL,
  options jsonb NOT NULL, -- string[]
  correct_index int NOT NULL,
  explanation text NOT NULL,
  source text DEFAULT 'gemini' 
    CHECK (source IN ('gemini','groq','human','pyp','model')),
  exam_tag text, -- 'SBI PO 2024', 'IBPS PO XIV', etc.
  is_verified boolean DEFAULT false,
  times_attempted int DEFAULT 0,
  times_correct int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- TEST SESSIONS
CREATE TABLE public.test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('Full-Length','Subject','Topic','Custom')),
  subject text,
  topic text,
  level int DEFAULT 1,
  total_questions int NOT NULL,
  negative_marking boolean DEFAULT true,
  negative_value numeric(3,2) DEFAULT 0.25,
  sectional_timer boolean DEFAULT false,
  score_pct numeric(5,2),
  correct_answers int,
  wrong_answers int,
  unattempted int,
  time_spent_seconds int,
  is_cleared boolean,
  is_completed boolean DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- INDIVIDUAL QUESTION ATTEMPTS
CREATE TABLE public.question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  selected_index int, -- null = unattempted
  is_correct boolean,
  time_spent_seconds int,
  is_marked_for_review boolean DEFAULT false,
  attempted_at timestamptz DEFAULT now()
);

-- USER UNLOCKED LEVELS
CREATE TABLE public.user_levels (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  unlocked_level int DEFAULT 1,
  PRIMARY KEY (user_id, category)
);

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'notification','job','current_affair','roadmap_topic','question'
  )),
  reference_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, reference_id)
);

-- ROADMAP PROGRESS
CREATE TABLE public.roadmap_progress (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id text NOT NULL,
  status text DEFAULT 'Locked' CHECK (status IN (
    'Locked','Learning','Practicing','Completed'
  )),
  time_spent_minutes int DEFAULT 0,
  last_studied_at timestamptz,
  PRIMARY KEY (user_id, topic_id)
);

-- REMINDERS
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_date date NOT NULL,
  alert_type text CHECK (alert_type IN ('30_days','10_days','2_days','1_day')),
  is_auto_generated boolean DEFAULT false,
  is_triggered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- EXAM NOTIFICATIONS
CREATE TABLE public.exam_notifications (
  id text PRIMARY KEY,
  organization text NOT NULL,
  title text NOT NULL,
  pdf_url text,
  vacancy_count int,
  eligibility text,
  notification_release date,
  registration_start date,
  registration_end date,
  fee_deadline date,
  admit_card_release date,
  exam_date date,
  result_date date,
  interview_date date,
  final_selection_date date,
  official_website text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- CURRENT AFFAIRS
CREATE TABLE public.current_affairs (
  id text PRIMARY KEY,
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  summary text NOT NULL,
  published_at timestamptz,
  source_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- LIKED FORMULAS / HANDNOTES
CREATE TABLE public.liked_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  formula_id text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  shortcut text,
  topic text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, formula_id)
);

-- USER PREFERENCES
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme IN ('light','dark')),
  enable_notifications boolean DEFAULT true,
  enable_calendar_sync boolean DEFAULT false,
  target_exams text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- QUESTION REPORTS
CREATE TABLE public.question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'wrong_answer','unclear_question','wrong_options',
    'calculation_error','other'
  )),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','reviewed','fixed')),
  created_at timestamptz DEFAULT now()
);

-- SPACED REPETITION
CREATE TABLE public.spaced_repetition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  item_id text NOT NULL, -- question_id or formula_id
  item_type text CHECK (item_type IN ('question','formula')),
  easiness_factor numeric DEFAULT 2.5,
  interval_days int DEFAULT 1,
  repetition_count int DEFAULT 0,
  next_review_date date DEFAULT CURRENT_DATE,
  last_reviewed_at timestamptz,
  UNIQUE(user_id, item_id, item_type)
);

-- DAILY GOALS
CREATE TABLE public.daily_goals (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  goal_date date NOT NULL,
  goal_type text CHECK (goal_type IN ('questions','minutes','tests')),
  goal_target int NOT NULL,
  goal_achieved int DEFAULT 0,
  is_completed boolean DEFAULT false,
  PRIMARY KEY (user_id, goal_date)
);

-- RATE LIMITS
CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  count int DEFAULT 0,
  window_start timestamptz DEFAULT now()
);

-- DOUBTS CHAT LOGS
CREATE TABLE public.doubts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  is_helpful boolean, -- null = unrated, true = thumbs up, false = thumbs down
  created_at timestamptz DEFAULT now()
);

-- LEADERBOARD VIEW
CREATE MATERIALIZED VIEW public.leaderboard AS
SELECT
  u.id as user_id,
  u.name,
  u.avatar_url,
  COUNT(ts.id) as total_tests,
  AVG(ts.score_pct) as avg_score,
  MAX(ts.score_pct) as best_score,
  SUM(ts.correct_answers) as total_correct,
  PERCENT_RANK() OVER (ORDER BY AVG(ts.score_pct)) as percentile
FROM public.users u
JOIN public.test_sessions ts ON ts.user_id = u.id
WHERE ts.is_completed = true
GROUP BY u.id, u.name, u.avatar_url;

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;

-- Note: questions, exam_notifications, current_affairs, rate_limits do not require user-level RLS restrict,
-- but we enable RLS to allow select for all and write for admin/system.
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own_profile" ON public.users FOR ALL USING (id = auth.uid());
CREATE POLICY "users_own_data_test_sessions" ON public.test_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_question_attempts" ON public.question_attempts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_user_levels" ON public.user_levels FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_bookmarks" ON public.bookmarks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_roadmap_progress" ON public.roadmap_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_reminders" ON public.reminders FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_liked_formulas" ON public.liked_formulas FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_user_preferences" ON public.user_preferences FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_question_reports" ON public.question_reports FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_spaced_repetition" ON public.spaced_repetition FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_daily_goals" ON public.daily_goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "users_own_data_doubts" ON public.doubts FOR ALL USING (user_id = auth.uid());

-- Global public tables select policies (anyone can read)
CREATE POLICY "allow_select_questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "allow_select_exam_notifications" ON public.exam_notifications FOR SELECT USING (true);
CREATE POLICY "allow_select_current_affairs" ON public.current_affairs FOR SELECT USING (true);
CREATE POLICY "allow_all_rate_limits" ON public.rate_limits FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_questions_subject_topic ON public.questions(subject, topic);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_question_attempts_user ON public.question_attempts(user_id);
CREATE INDEX idx_test_sessions_user ON public.test_sessions(user_id);
CREATE INDEX idx_test_sessions_completed ON public.test_sessions(is_completed, completed_at);
CREATE INDEX idx_questions_question_text_trgm ON public.questions USING gin (question_text gin_trgm_ops);

-- User Synchronization Trigger from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, password_hash, avatar_url)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.encrypted_password,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = excluded.email,
      name = excluded.name,
      password_hash = excluded.password_hash,
      avatar_url = excluded.avatar_url;
  
  -- Create default user preferences row
  INSERT INTO public.user_preferences (user_id, theme, enable_notifications, enable_calendar_sync, target_exams)
  VALUES (new.id, 'light', true, false, '{}')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


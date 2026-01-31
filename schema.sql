

-- schema.sql

-- 1. PREPARATION & HELPERS
-- Enable Row Level Security by default
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;

-- Helper function to get a user's role from their profile
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PROFILES TABLE (links to auth.users)
-- Create a table for public user profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  role TEXT DEFAULT 'student'::text NOT NULL,
  grade TEXT,
  subscription_status TEXT DEFAULT 'free'::text NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  progress JSONB DEFAULT '{}'::jsonb,
  photo_url TEXT,

  PRIMARY KEY (id)
);
CREATE INDEX ON public.profiles (role);
CREATE INDEX ON public.profiles (email);

-- RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, photo_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. EDUCATIONAL CONTENT TABLES
CREATE TABLE public.curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  curriculum_id UUID NOT NULL REFERENCES public.curriculums ON DELETE CASCADE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units ON DELETE CASCADE,
  type TEXT,
  duration TEXT,
  content JSONB,
  template_type TEXT DEFAULT 'STANDARD'::text,
  universal_config JSONB,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  path_root_scene_id UUID -- Foreign key will be added later
);

-- Indexes for performance
CREATE INDEX ON public.units (curriculum_id);
CREATE INDEX ON public.lessons (unit_id);

-- RLS for educational content
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content is viewable by authenticated users." ON public.curriculums FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Content is viewable by authenticated users." ON public.units FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Content is viewable by authenticated users." ON public.lessons FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/Teachers can manage content." ON public.curriculums FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admins/Teachers can manage content." ON public.units FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admins/Teachers can manage content." ON public.lessons FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));


-- 4. QUIZZES AND QUESTIONS TABLES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  grade TEXT,
  subject TEXT,
  category TEXT,
  duration INT,
  is_premium BOOLEAN DEFAULT false,
  max_attempts INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT,
  choices JSONB,
  correct_choice_id TEXT,
  score INT,
  unit_id UUID REFERENCES public.units ON DELETE CASCADE,
  difficulty TEXT,
  solution TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.quiz_questions (
  quiz_id UUID NOT NULL REFERENCES public.quizzes ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, question_id)
);

CREATE TABLE public.student_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes ON DELETE CASCADE,
  score INT,
  max_score INT,
  answers JSONB,
  time_spent INT,
  status TEXT DEFAULT 'completed'::text,
  manual_grades JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quizzes
CREATE INDEX ON public.questions (unit_id);
CREATE INDEX ON public.student_quiz_attempts (student_id);
CREATE INDEX ON public.student_quiz_attempts (quiz_id);

-- RLS for quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quizzes are viewable by authenticated users." ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Questions are viewable by authenticated users." ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Quiz questions mapping is viewable." ON public.quiz_questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins/Teachers can manage quizzes." ON public.quizzes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admins/Teachers can manage questions." ON public.questions FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admins/Teachers can manage quiz questions." ON public.quiz_questions FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Students can crud their own attempts." ON public.student_quiz_attempts FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Admins/Teachers can view all attempts." ON public.student_quiz_attempts FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));


-- 5. INTERACTIVE LESSON PATH TABLES (NEW)
CREATE TABLE public.lesson_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  decisions JSONB,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  current_scene_id UUID NOT NULL REFERENCES public.lesson_scenes ON DELETE CASCADE,
  answers JSONB,
  uploaded_files JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Add foreign key constraint to lessons table now that lesson_scenes exists
ALTER TABLE public.lessons
ADD CONSTRAINT fk_path_root_scene_id
FOREIGN KEY (path_root_scene_id)
REFERENCES public.lesson_scenes(id)
ON DELETE SET NULL;

-- Indexes for lesson paths
CREATE INDEX ON public.lesson_scenes (lesson_id);
CREATE INDEX ON public.student_lesson_progress (student_id, lesson_id);

-- RLS for lesson paths
ALTER TABLE public.lesson_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scenes are viewable by authenticated users." ON public.lesson_scenes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins/Teachers can manage scenes." ON public.lesson_scenes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Students can manage their own progress." ON public.student_lesson_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Admins/Teachers can view all student progress." ON public.student_lesson_progress FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));


-- 6. STUDENT INTERACTION & ANALYTICS TABLE (NEW)
CREATE TABLE public.student_interaction_events (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    from_scene_id UUID REFERENCES public.lesson_scenes(id) ON DELETE SET NULL,
    to_scene_id UUID REFERENCES public.lesson_scenes(id) ON DELETE SET NULL,
    decision_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX ON public.student_interaction_events (lesson_id);
CREATE INDEX ON public.student_interaction_events (student_id);

-- RLS for analytics events
ALTER TABLE public.student_interaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can log their own interactions."
ON public.student_interaction_events FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins and Teachers can view all interactions."
ON public.student_interaction_events FOR SELECT
USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

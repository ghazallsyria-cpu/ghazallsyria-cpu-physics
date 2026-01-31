
import React, { useState } from 'react';
import { Database, Code, CheckCircle2, Copy, Info, ExternalLink } from 'lucide-react';

const DatabaseSchemaSetup: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const supabaseSQL = `-- 1. PREPARATION & HELPERS
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
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
  specialization TEXT,
  years_experience INT,
  bio TEXT,
  avatar TEXT,
  grades_taught TEXT[],
  permissions TEXT[],
  job_title TEXT,
  last_seen TIMESTAMPTZ,
  PRIMARY KEY (id)
);

-- ENSURE CRITICAL COLUMNS EXIST (Migration Fix)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}'::jsonb;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, photo_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. EDUCATIONAL CONTENT
CREATE TABLE IF NOT EXISTS public.curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  curriculum_id UUID NOT NULL REFERENCES public.curriculums ON DELETE CASCADE,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lessons (
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
  path_root_scene_id UUID
);

ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Content read access" ON public.curriculums;
CREATE POLICY "Content read access" ON public.curriculums FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Content write access" ON public.curriculums;
CREATE POLICY "Content write access" ON public.curriculums FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Units read access" ON public.units;
CREATE POLICY "Units read access" ON public.units FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Units write access" ON public.units;
CREATE POLICY "Units write access" ON public.units FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Lessons read access" ON public.lessons;
CREATE POLICY "Lessons read access" ON public.lessons FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Lessons write access" ON public.lessons;
CREATE POLICY "Lessons write access" ON public.lessons FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 4. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
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

CREATE TABLE IF NOT EXISTS public.questions (
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

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  quiz_id UUID NOT NULL REFERENCES public.quizzes ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.student_quiz_attempts (
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

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz read" ON public.quizzes;
CREATE POLICY "Quiz read" ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Quiz write" ON public.quizzes;
CREATE POLICY "Quiz write" ON public.quizzes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Question read" ON public.questions;
CREATE POLICY "Question read" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Question write" ON public.questions;
CREATE POLICY "Question write" ON public.questions FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "QuizQuestion read" ON public.quiz_questions;
CREATE POLICY "QuizQuestion read" ON public.quiz_questions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "QuizQuestion write" ON public.quiz_questions;
CREATE POLICY "QuizQuestion write" ON public.quiz_questions FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Attempts read own" ON public.student_quiz_attempts;
CREATE POLICY "Attempts read own" ON public.student_quiz_attempts FOR SELECT USING (auth.uid() = student_id OR get_user_role(auth.uid()) IN ('admin', 'teacher'));
DROP POLICY IF EXISTS "Attempts insert" ON public.student_quiz_attempts;
CREATE POLICY "Attempts insert" ON public.student_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Attempts update" ON public.student_quiz_attempts;
CREATE POLICY "Attempts update" ON public.student_quiz_attempts FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 5. SETTINGS & EXTRAS
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings read" ON public.settings;
CREATE POLICY "Settings read" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Settings write" ON public.settings;
CREATE POLICY "Settings write" ON public.settings FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE TABLE IF NOT EXISTS public.home_page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  placement TEXT,
  priority TEXT,
  title TEXT,
  content TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.home_page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "HomeContent read" ON public.home_page_content;
CREATE POLICY "HomeContent read" ON public.home_page_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "HomeContent write" ON public.home_page_content;
CREATE POLICY "HomeContent write" ON public.home_page_content FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  teacher_name TEXT,
  start_time TEXT,
  status TEXT,
  topic TEXT,
  platform TEXT,
  stream_url TEXT,
  meeting_id TEXT,
  passcode TEXT,
  target_grades TEXT[],
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sessions read" ON public.live_sessions;
CREATE POLICY "Sessions read" ON public.live_sessions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Sessions write" ON public.live_sessions;
CREATE POLICY "Sessions write" ON public.live_sessions FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 6. INTERACTIVE LESSONS
CREATE TABLE IF NOT EXISTS public.lesson_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  decisions JSONB,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.lesson_scenes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Scenes read" ON public.lesson_scenes;
CREATE POLICY "Scenes read" ON public.lesson_scenes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Scenes write" ON public.lesson_scenes;
CREATE POLICY "Scenes write" ON public.lesson_scenes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons ON DELETE CASCADE,
  current_scene_id UUID NOT NULL REFERENCES public.lesson_scenes ON DELETE CASCADE,
  answers JSONB,
  uploaded_files JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Progress own" ON public.student_lesson_progress;
CREATE POLICY "Progress own" ON public.student_lesson_progress FOR ALL USING (auth.uid() = student_id);

CREATE TABLE IF NOT EXISTS public.student_interaction_events (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    from_scene_id UUID REFERENCES public.lesson_scenes(id) ON DELETE SET NULL,
    to_scene_id UUID REFERENCES public.lesson_scenes(id) ON DELETE SET NULL,
    decision_text TEXT,
    event_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_interaction_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Event insert" ON public.student_interaction_events;
CREATE POLICY "Event insert" ON public.student_interaction_events FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Event read" ON public.student_interaction_events;
CREATE POLICY "Event read" ON public.student_interaction_events FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 7. FORUMS
CREATE TABLE IF NOT EXISTS public.forum_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  "order" INT
);
CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.forum_sections ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  "order" INT,
  moderator_uid UUID,
  moderator_name TEXT
);
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_uid UUID,
  author_name TEXT,
  author_email TEXT,
  title TEXT,
  content TEXT,
  tags TEXT[],
  upvotes INT DEFAULT 0,
  replies JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  is_escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.forum_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Forums read" ON public.forum_sections;
CREATE POLICY "Forums read" ON public.forum_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Forums write" ON public.forum_sections;
CREATE POLICY "Forums write" ON public.forum_sections FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Subforums read" ON public.forums;
CREATE POLICY "Subforums read" ON public.forums FOR SELECT USING (true);
DROP POLICY IF EXISTS "Subforums write" ON public.forums;
CREATE POLICY "Subforums write" ON public.forums FOR ALL USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Posts read" ON public.forum_posts;
CREATE POLICY "Posts read" ON public.forum_posts FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Posts insert" ON public.forum_posts;
CREATE POLICY "Posts insert" ON public.forum_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Posts update" ON public.forum_posts;
CREATE POLICY "Posts update" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_uid OR get_user_role(auth.uid()) = 'admin');

-- 8. EXPERIMENTS
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  thumbnail TEXT,
  grade TEXT,
  type TEXT,
  custom_html TEXT,
  is_future_lab BOOLEAN DEFAULT false,
  parameters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Exp read" ON public.experiments;
CREATE POLICY "Exp read" ON public.experiments FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Exp write" ON public.experiments;
CREATE POLICY "Exp write" ON public.experiments FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 9. NOTIFICATIONS & INVOICES
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  type TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notif own" ON public.notifications;
CREATE POLICY "Notif own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notif create system" ON public.notifications;
CREATE POLICY "Notif create system" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  plan_id TEXT,
  amount NUMERIC,
  status TEXT,
  track_id TEXT,
  auth_code TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice read own" ON public.invoices;
CREATE POLICY "Invoice read own" ON public.invoices FOR SELECT USING (auth.uid() = user_id OR get_user_role(auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Invoice manage" ON public.invoices;
CREATE POLICY "Invoice manage" ON public.invoices FOR ALL USING (get_user_role(auth.uid()) = 'admin');
`;

    const handleCopy = () => {
        navigator.clipboard.writeText(supabaseSQL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-5xl mx-auto py-12 animate-fadeIn font-['Tajawal'] text-right" dir="rtl">
            <header className="mb-12 border-r-4 border-[#00d2ff] pr-8">
                <h2 className="text-4xl font-black text-white flex items-center gap-4">
                    <Database className="text-[#00d2ff]" /> تهيئة قاعدة البيانات <span className="text-[#00d2ff]">Supabase</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">الكود البرمجي لبناء كافة الجداول والصلاحيات المطلوبة للمنصة.</p>
            </header>

            <div className="glass-panel p-10 rounded-[60px] border-white/5 bg-black/40 relative shadow-2xl">
                <div className="absolute top-0 right-0 p-8 text-[120px] font-black text-white/[0.02] -rotate-12 pointer-events-none select-none">
                    SQL
                </div>
                
                <div className="relative z-10">
                    <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[40px] mb-10">
                        <div className="flex items-start gap-4">
                            <Info size={24} className="text-blue-400 shrink-0" />
                            <div>
                                <h4 className="font-black text-blue-400">تعليمات التشغيل</h4>
                                <ol className="list-decimal list-inside mt-2 space-y-2 text-gray-300 text-sm leading-relaxed">
                                    <li>انسخ الكود أدناه بالكامل.</li>
                                    <li>اذهب إلى لوحة تحكم <b>Supabase</b>.</li>
                                    <li>من القائمة الجانبية، اختر <b>SQL Editor</b>.</li>
                                    <li>الصق الكود واضغط على <b className="text-white">Run</b>.</li>
                                    <li>سيتم إصلاح الجداول وإضافة الأعمدة المفقودة (مثل role) تلقائياً.</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <Code size={20}/> مخطط البيانات (Schema)
                        </h3>
                        <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                            فتح Supabase SQL <ExternalLink size={12}/>
                        </a>
                    </div>
                    
                    <div className="relative group">
                        <pre className="bg-[#050a10] p-8 rounded-[40px] text-[10px] font-mono text-green-400 overflow-x-auto ltr text-left border border-white/10 h-96 no-scrollbar shadow-inner">
                            {supabaseSQL}
                        </pre>
                        <button 
                            onClick={handleCopy}
                            className="absolute top-6 right-6 p-4 bg-[#00d2ff] text-black rounded-2xl hover:bg-white transition-all flex items-center gap-2 text-xs font-black shadow-xl hover:scale-105"
                        >
                            {copied ? <CheckCircle2 size={18}/> : <Copy size={18}/>}
                            {copied ? 'تم النسخ!' : 'نسخ الكود'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSchemaSetup;


import React, { useState } from 'react';
import { Database, Code, CheckCircle2, Copy, Info, ExternalLink } from 'lucide-react';

const DatabaseSchemaSetup: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const supabaseSQL = `-- 1. PREPARATION & CLEANUP (Fix Type Mismatches)
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;

-- Drop problematic join tables first to allow altering parents
DROP TABLE IF EXISTS public.quiz_questions;
DROP TABLE IF EXISTS public.student_quiz_attempts;

-- 2. FIX TABLE ID TYPES (Convert TEXT to UUID if necessary)
DO $$
DECLARE
    col_type text;
BEGIN
    -- CHECK QUIZZES
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'id';
    
    IF col_type = 'text' THEN
        -- Remove invalid IDs that cannot be cast to UUID
        DELETE FROM public.quizzes WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        -- Convert to UUID
        ALTER TABLE public.quizzes ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.quizzes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    -- CHECK QUESTIONS
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'id';
    
    IF col_type = 'text' THEN
        DELETE FROM public.questions WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.questions ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  PRIMARY KEY (id)
);

-- Ensure Columns
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grades_taught TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. RECREATE QUIZZES (If not exists)
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

-- 5. RECREATE QUESTIONS (If not exists)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT,
  choices JSONB,
  correct_choice_id TEXT,
  score INT,
  unit_id UUID, -- Optional link to unit
  difficulty TEXT,
  solution TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECREATE JOIN TABLES (Now types are guaranteed to match)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.student_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT,
  max_score INT,
  answers JSONB,
  time_spent INT,
  status TEXT DEFAULT 'completed'::text,
  manual_grades JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OTHER TABLES (Curriculum, Units, Lessons)
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

-- 8. POLICIES & SECURITY
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper Function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Basic Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Quizzes read" ON public.quizzes;
CREATE POLICY "Quizzes read" ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Quizzes write" ON public.quizzes;
CREATE POLICY "Quizzes write" ON public.quizzes FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Attempts read own" ON public.student_quiz_attempts;
CREATE POLICY "Attempts read own" ON public.student_quiz_attempts FOR SELECT USING (auth.uid() = student_id OR get_user_role(auth.uid()) IN ('admin', 'teacher'));
DROP POLICY IF EXISTS "Attempts insert" ON public.student_quiz_attempts;
CREATE POLICY "Attempts insert" ON public.student_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Attempts update" ON public.student_quiz_attempts;
CREATE POLICY "Attempts update" ON public.student_quiz_attempts FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

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

-- 10. NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, photo_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
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
                                    <li>سيتم حل مشكلة توافق الأنواع (UUID/TEXT) تلقائياً.</li>
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

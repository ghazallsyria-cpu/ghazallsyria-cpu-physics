
import React, { useState } from 'react';
import { Database, Code, CheckCircle2, Copy, Info, ExternalLink } from 'lucide-react';

const DatabaseSchemaSetup: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const supabaseSQL = `-- 1. AGGRESSIVE CLEANUP & PREPARATION
-- We drop dependent tables to allow changing ID types on parent tables
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.student_quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.student_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.student_interaction_events CASCADE;
DROP TABLE IF EXISTS public.lesson_scenes CASCADE;

-- 2. FIX PROFILES TABLE (Must match auth.users uuid)
DO $$
BEGIN
    -- Only try to convert if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Remove non-UUID IDs (garbage data that can't be converted)
        DELETE FROM public.profiles WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        
        -- Convert id to UUID
        ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING id::uuid;
        
        -- Ensure columns exist
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'::text NOT NULL;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'::text NOT NULL;
    ELSE
        -- Create if missing
        CREATE TABLE public.profiles (
            id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
            name TEXT,
            email TEXT,
            role TEXT DEFAULT 'student',
            PRIMARY KEY (id)
        );
    END IF;
END $$;

-- 3. FIX QUIZZES (Convert TEXT ID to UUID)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quizzes') THEN
        DELETE FROM public.quizzes WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.quizzes ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.quizzes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.quizzes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL
        );
    END IF;
    -- Add missing columns
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS max_attempts INT;
END $$;

-- 4. FIX QUESTIONS (Convert TEXT ID to UUID)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
        DELETE FROM public.questions WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.questions ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            text TEXT NOT NULL
        );
    END IF;
    -- Add missing columns
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS choices JSONB;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS correct_choice_id TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS score INT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS solution TEXT;
END $$;

-- 5. RECREATE DEPENDENT TABLES (With UUID FKs)
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

-- 6. CONTENT TABLES (Curriculum, Units, Lessons)
-- Ensure IDs are UUID
DO $$ BEGIN
    -- Curriculums
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'curriculums') THEN
        DELETE FROM public.curriculums WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.curriculums ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.curriculums ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.curriculums (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS subject TEXT;
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS title TEXT;

    -- Units
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units') THEN
        DELETE FROM public.units WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        DELETE FROM public.units WHERE curriculum_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.units ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.units ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE public.units ALTER COLUMN curriculum_id TYPE UUID USING curriculum_id::uuid;
    ELSE
        CREATE TABLE public.units (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), curriculum_id UUID REFERENCES public.curriculums(id) ON DELETE CASCADE);
    END IF;
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0;

    -- Lessons
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lessons') THEN
        DELETE FROM public.lessons WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        DELETE FROM public.lessons WHERE unit_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.lessons ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.lessons ALTER COLUMN id SET DEFAULT gen_random_uuid();
        ALTER TABLE public.lessons ALTER COLUMN unit_id TYPE UUID USING unit_id::uuid;
    ELSE
        CREATE TABLE public.lessons (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE);
    END IF;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content JSONB;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'STANDARD';
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS path_root_scene_id UUID;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
END $$;

-- 7. INTERACTIVE & ANALYTICS TABLES
CREATE TABLE IF NOT EXISTS public.lesson_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  decisions JSONB,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  current_scene_id UUID NOT NULL REFERENCES public.lesson_scenes(id) ON DELETE CASCADE,
  answers JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

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

-- 8. RESTORE POLICIES & HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interaction_events ENABLE ROW LEVEL SECURITY;

-- Apply basic read policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users." ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users." ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Quizzes read" ON public.quizzes;
CREATE POLICY "Quizzes read" ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Attempts read own" ON public.student_quiz_attempts;
CREATE POLICY "Attempts read own" ON public.student_quiz_attempts FOR SELECT USING (auth.uid() = student_id OR get_user_role(auth.uid()) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Attempts insert" ON public.student_quiz_attempts;
CREATE POLICY "Attempts insert" ON public.student_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Attempts update" ON public.student_quiz_attempts;
CREATE POLICY "Attempts update" ON public.student_quiz_attempts FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- 9. USER TRIGGER
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

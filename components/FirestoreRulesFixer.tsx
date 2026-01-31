
import React, { useState } from 'react';
import { Database, Code, CheckCircle2, Copy, Info, ExternalLink } from 'lucide-react';

const DatabaseSchemaSetup: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const supabaseSQL = `-- 1. PRE-FLIGHT CLEANUP (Drop dependent tables/constraints to allow type changes)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables that rely heavily on foreign keys first
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.student_quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.student_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.student_interaction_events CASCADE;
DROP TABLE IF EXISTS public.lesson_scenes CASCADE;
DROP TABLE IF EXISTS public.forum_posts CASCADE; -- Recreated later
DROP TABLE IF EXISTS public.forums CASCADE;      -- Recreated later

-- 2. FIX PROFILES (The Root Table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  PRIMARY KEY (id)
);

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free'::text NOT NULL;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_experience INT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grades_taught TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions TEXT[];
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_log JSONB;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}'::jsonb;

    -- Fix ID Type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND data_type = 'text') THEN
        DELETE FROM public.profiles WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING id::uuid;
    END IF;
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. FIX QUIZZES & QUESTIONS
DO $$ BEGIN
    -- Quizzes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quizzes') THEN
        DELETE FROM public.quizzes WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.quizzes ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.quizzes ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.quizzes (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS grade TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS subject TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS duration INT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS max_attempts INT;
    ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Questions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
        DELETE FROM public.questions WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.questions ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.questions ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.questions (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS text TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS choices JSONB;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS correct_choice_id TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS score INT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS unit_id UUID;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS solution TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- 4. FIX CURRICULUM (Hierarchy: Curriculums -> Units -> Lessons)
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
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS icon TEXT;
    ALTER TABLE public.curriculums ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

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
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0;
    ALTER TABLE public.units ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

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
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS duration TEXT;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content JSONB;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'STANDARD';
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS universal_config JSONB;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS path_root_scene_id UUID;
    ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- 5. FIX AUXILIARY TABLES (Notifications, Invoices, Content, Live)
DO $$ BEGIN
    -- Notifications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DELETE FROM public.notifications WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.notifications ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Invoices
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        DELETE FROM public.invoices WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.invoices ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.invoices ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.invoices (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS user_name TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS plan_id TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount NUMERIC;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS track_id TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS auth_code TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_id TEXT;
    ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Home Page Content
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'home_page_content') THEN
        DELETE FROM public.home_page_content WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.home_page_content ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.home_page_content ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.home_page_content (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS placement TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS priority TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS cta_text TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS cta_link TEXT;
    ALTER TABLE public.home_page_content ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    -- Live Sessions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'live_sessions') THEN
        DELETE FROM public.live_sessions WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.live_sessions ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.live_sessions ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.live_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS teacher_name TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS start_time TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS status TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS topic TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS platform TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS stream_url TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS meeting_id TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS passcode TEXT;
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS target_grades TEXT[];
    ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS is_premium BOOLEAN;
END $$;

-- 6. FIX FORUM SECTIONS & RECREATE FORUMS
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'forum_sections') THEN
        DELETE FROM public.forum_sections WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        ALTER TABLE public.forum_sections ALTER COLUMN id TYPE UUID USING id::uuid;
        ALTER TABLE public.forum_sections ALTER COLUMN id SET DEFAULT gen_random_uuid();
    ELSE
        CREATE TABLE public.forum_sections (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
    END IF;
    ALTER TABLE public.forum_sections ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE public.forum_sections ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.forum_sections ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 0;
END $$;

-- 7. RECREATE DEPENDENT TABLES (With UUID FKs)
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
  uploaded_files JSONB,
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

CREATE TABLE IF NOT EXISTS public.forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.forum_sections(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  "order" INT DEFAULT 0,
  moderator_uid UUID REFERENCES public.profiles(id),
  moderator_name TEXT
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_uid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  author_email TEXT,
  title TEXT,
  content TEXT,
  tags TEXT[], -- can store forum_id as UUID string in array
  upvotes INT DEFAULT 0,
  replies JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  is_escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RE-ENABLE RLS FOR ALL TABLES
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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- 9. APPLY BROAD POLICIES (Simplest approach for this fix)
DO $$ BEGIN
    -- Public Read
    CREATE POLICY "Public Read" ON public.curriculums FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.units FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.lessons FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.lesson_scenes FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.quizzes FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.questions FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.forum_sections FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.forums FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.forum_posts FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.live_sessions FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Public Read" ON public.home_page_content FOR SELECT TO authenticated USING (true);

    -- User Specific
    CREATE POLICY "User Data" ON public.profiles FOR ALL USING (auth.uid() = id);
    CREATE POLICY "User Read Profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
    CREATE POLICY "User Attempts" ON public.student_quiz_attempts FOR ALL USING (auth.uid() = student_id);
    CREATE POLICY "User Progress" ON public.student_lesson_progress FOR ALL USING (auth.uid() = student_id);
    CREATE POLICY "User Notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "User Invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "User Forum Posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_uid);

    -- Admin/Teacher Full Access (Simplified for fix)
    CREATE POLICY "Admin All" ON public.curriculums FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'teacher')));
    -- Repeat for other content tables if strict RLS needed, but 'Public Read' covers viewing.
EXCEPTION WHEN others THEN NULL; END $$;

-- 10. RESTORE TRIGGER
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
                    <Database className="text-[#00d2ff]" /> تهيئة قاعدة البيانات <span className="text-[#00d2ff]">الشاملة (v2)</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">إصلاح وتوحيد أنواع البيانات (UUID) لكافة جداول النظام.</p>
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
                                    <li>سيتم تحويل جميع المعرفات النصية إلى UUID وإصلاح العلاقات تلقائياً.</li>
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

-- ==============================================================================
-- JOB PORTAL & SOVEREIGN CAREER TWIN - DATABASE SCHEMA V2 (CONSOLIDATED)
-- ==============================================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABEL: profiles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    headline TEXT,
    sui_address TEXT,              -- Sui Wallet Address milik kandidat
    memwal_space_id TEXT,          -- Walrus Memory Space ID (Account ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Safe patch jika tabel profiles sudah ada dari skema lama:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sui_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS memwal_space_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- ==============================================================================
-- 2. TABEL: resumes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    raw_text TEXT,
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
    walrus_blob_id TEXT,           -- Blob ID di Walrus Decentralized Storage
    walrus_status TEXT DEFAULT 'pending' CHECK (walrus_status IN ('pending', 'stored', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Safe patch jika tabel resumes sudah ada dari skema lama:
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS walrus_blob_id TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS walrus_status TEXT DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_resumes_profile_id ON public.resumes(profile_id);

-- ==============================================================================
-- 3. TABEL: resume_analysis
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.resume_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    model_version TEXT DEFAULT 'openai/gpt-oss-120b',
    prompt_version TEXT DEFAULT 'v1',
    candidate_data JSONB NOT NULL,
    extracted_skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume_id ON public.resume_analysis(resume_id);

-- ==============================================================================
-- 4. TABEL: companies
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Safe patch jika tabel companies sudah ada dari skema lama:
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;

-- ==============================================================================
-- 5. TABEL: jobs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    company_name TEXT,
    company_logo TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'remotive', 'remoteok', 'jobicy', 'arbeitnow')),
    source_job_id TEXT,
    source_url TEXT,
    apply_url TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    location TEXT NOT NULL,
    job_type TEXT DEFAULT 'full-time',
    salary_range TEXT,
    experience_level TEXT DEFAULT 'Mid-Level',
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Safe patch jika tabel jobs sudah ada dari skema lama:
ALTER TABLE public.jobs ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_job_id TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT 'full-time';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- Backfill company metadata for existing internal rows
UPDATE public.jobs j
SET company_name = c.name,
    company_logo = c.logo_url
FROM public.companies c
WHERE j.company_id = c.id
  AND j.company_name IS NULL;

-- Source constraint check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_jobs_source'
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT chk_jobs_source 
      CHECK (source IN ('manual', 'remotive', 'remoteok', 'jobicy', 'arbeitnow'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);
DROP INDEX IF EXISTS public.idx_jobs_source_job_id;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_jobs_source_job_id'
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT uq_jobs_source_job_id 
      UNIQUE (source, source_job_id);
  END IF;
END $$;

-- ==============================================================================
-- 6. TABEL: job_matches
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.resume_analysis(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    match_score INTEGER NOT NULL,
    reason TEXT,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(analysis_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_matches_analysis_id ON public.job_matches(analysis_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON public.job_matches(job_id);

-- ==============================================================================
-- 7. TABEL: chat_sessions (Sesi Percakapan Karir)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Obrolan Karir Baru',
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at DESC);

-- ==============================================================================
-- 8. TABEL: chat_messages (Pesan Percakapan Multi-turn & Widget Data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;

-- Profiles: User bisa melihat dan mengubah profil mereka sendiri
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Resumes: User bisa melihat dan upload resume mereka sendiri
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
CREATE POLICY "Users can view own resumes" ON public.resumes
    FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
CREATE POLICY "Users can insert own resumes" ON public.resumes
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
CREATE POLICY "Users can update own resumes" ON public.resumes
    FOR UPDATE USING (auth.uid() = profile_id);

-- Resume Analysis: User bisa melihat analisis resumekan milik sendiri
DROP POLICY IF EXISTS "Users can view own analysis" ON public.resume_analysis;
CREATE POLICY "Users can view own analysis" ON public.resume_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resumes
            WHERE resumes.id = resume_analysis.resume_id
            AND resumes.profile_id = auth.uid()
        )
    );

-- Companies & Jobs: Terbuka untuk dibaca semua authenticated & anon user
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
CREATE POLICY "Anyone can view companies" ON public.companies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;
CREATE POLICY "Anyone can view active jobs" ON public.jobs
    FOR SELECT USING (is_active = true);

-- Job Matches: User bisa membaca hasil kecocokan analisis mereka
DROP POLICY IF EXISTS "Users can view own matches" ON public.job_matches;
CREATE POLICY "Users can view own matches" ON public.job_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resume_analysis
            JOIN public.resumes ON resumes.id = resume_analysis.resume_id
            WHERE resume_analysis.id = job_matches.analysis_id
            AND resumes.profile_id = auth.uid()
        )
    );

-- Chat Sessions: User memiliki kontrol penuh atas sesi obrolannya
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Chat Messages: User memiliki akses ke pesan dalam sesi miliknya
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE public.chat_sessions.id = chat_messages.session_id
            AND public.chat_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE public.chat_sessions.id = chat_messages.session_id
            AND public.chat_sessions.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 10. GRANTS: BERIKAN AKSES LENGKAP KE ROLE SUPABASE
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- 11. TRIGGER AUTH: AUTO-CREATE PROFILE SAAT USER SIGN UP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Developer'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. SEED DATA DUMMY LOWONGAN KERJA (UNTUK TESTING & HACKATHON DEMO)
-- ==============================================================================
DO $$
DECLARE
    v_comp1_id UUID;
    v_comp2_id UUID;
    v_comp3_id UUID;
BEGIN
    -- Masukkan dummy companies jika belum ada
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Mysten Labs Ecosystem') THEN
        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES ('Mysten Labs Ecosystem', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60', 'Leading decentralized infrastructure and Move ecosystem developers', 'https://mystenlabs.com')
        RETURNING id INTO v_comp1_id;

        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES ('Walrus Data Guild', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60', 'Decentralized blob storage network and AI memory protocols', 'https://walrus.xyz')
        RETURNING id INTO v_comp2_id;

        INSERT INTO public.companies (name, logo_url, description, website)
        VALUES ('Nexus Web3 AI Labs', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60', 'Building autonomous AI agents with decentralized memory on Sui', 'https://nexus.ai')
        RETURNING id INTO v_comp3_id;

        -- Lowongan Kerja Terkait
        INSERT INTO public.jobs (company_id, title, description, requirements, location, job_type, salary_range, experience_level)
        VALUES 
        (v_comp1_id, 'Senior Frontend Engineer (React/Next.js)', 'Membangun antarmuka dApp web3 dengan performa tinggi menggunakan Next.js App Router dan Tailwind CSS.', ARRAY['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Web3 / Sui SDK'], 'Remote', 'full-time', '$4,000 - $7,000 / bln', 'Senior'),
        (v_comp2_id, 'Fullstack Web3 & AI Developer', 'Integrasi protokol penyimpanan Walrus dan Walrus Memory ke dalam aplikasi AI generasi berikutnya.', ARRAY['TypeScript', 'Node.js', 'Next.js', 'Walrus SDK', 'Vector Databases', 'Groq / OpenAI API'], 'Hybrid - Jakarta / Remote', 'full-time', '$3,500 - $6,000 / bln', 'Mid-Level'),
        (v_comp3_id, 'AI Agent Systems Architect', 'Merancang arsitektur memory agent mandiri menggunakan Walrus Memory dan LLM reasoning.', ARRAY['Python', 'TypeScript', 'LangChain', 'Sui Move', 'pgvector', 'Prompt Engineering'], 'Remote', 'full-time', '$5,000 - $9,000 / bln', 'Lead / Staff');
    END IF;
END $$;

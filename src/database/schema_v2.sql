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

-- ==============================================================================
-- 5. TABEL: jobs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    location TEXT NOT NULL,
    job_type TEXT DEFAULT 'full-time',
    salary_range TEXT,
    experience_level TEXT DEFAULT 'Mid-Level',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);

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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
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

-- ==============================================================================
-- 8. TRIGGER AUTH: AUTO-CREATE PROFILE SAAT USER SIGN UP
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Candidate'),
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
-- 9. SEED DATA DUMMY LOWONGAN KERJA (UNTUK TESTING & HACKATHON DEMO)
-- ==============================================================================
DO $$
DECLARE
    v_comp1_id UUID;
    v_comp2_id UUID;
    v_comp3_id UUID;
BEGIN
    -- Masukkan dummy companies jika belum ada
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
END $$;


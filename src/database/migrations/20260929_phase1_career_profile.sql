-- ==============================================================================
-- MIGRATION: Phase 1A - Canonical CareerProfile & Work Mode
-- Date: 2026-09-29
-- Description: Creates canonical career_profiles table with RLS and adds work_mode to jobs
-- ==============================================================================

-- 1. Ensure jobs table has clean, non-inferred work_mode column
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'unknown' 
  CHECK (work_mode IN ('remote', 'hybrid', 'onsite', 'unknown'));

-- Remotive jobs are verified remote by API contract; others remain 'unknown' unless explicit
UPDATE public.jobs 
SET work_mode = 'remote'
WHERE source = 'remotive' AND (work_mode IS NULL OR work_mode = 'unknown');

-- 2. Create Canonical CareerProfile Table (Single canonical active row per user)
CREATE TABLE IF NOT EXISTS public.career_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    current_onboarding_step INT NOT NULL DEFAULT 1 CHECK (current_onboarding_step BETWEEN 1 AND 4),
    profile_version INT NOT NULL DEFAULT 1,
    profile_origin TEXT NOT NULL DEFAULT 'web' CHECK (profile_origin IN ('web', 'v1_migrated')),
    
    background JSONB NOT NULL DEFAULT '{"education": [], "experience": [], "projects": []}'::jsonb,
    capabilities JSONB NOT NULL DEFAULT '{"extraction_status": "unattempted", "skills": [], "suppressed_skills": []}'::jsonb,
    career_intent JSONB NOT NULL DEFAULT '{"target_roles": [], "target_level": null, "employment_types": []}'::jsonb,
    preferences JSONB NOT NULL DEFAULT '{"locations": [], "work_modes": [], "priorities": [], "salary": null, "negative_preferences": []}'::jsonb,
    constraints JSONB NOT NULL DEFAULT '{"relocation_prohibited": false, "work_mode_strict": false}'::jsonb,
    
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT career_profiles_profile_id_key UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_career_profiles_status ON public.career_profiles(status);
CREATE INDEX IF NOT EXISTS idx_career_profiles_onboarding ON public.career_profiles(profile_id, onboarding_completed);

-- 3. Row Level Security: Strict Read-Only Client Policy
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to ensure idempotency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'career_profiles' 
      AND policyname = 'Users can read own career profile'
  ) THEN
    DROP POLICY "Users can read own career profile" ON public.career_profiles;
  END IF;
END $$;

CREATE POLICY "Users can read own career profile"
    ON public.career_profiles
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

-- NOTE ON MUTATIONS:
-- Deliberately, NO client-facing INSERT, UPDATE, or DELETE policies exist for 'authenticated'.
-- All career profile lifecycle transitions and mutations MUST be executed server-side
-- via authenticated API routes using domain-validated service layers.

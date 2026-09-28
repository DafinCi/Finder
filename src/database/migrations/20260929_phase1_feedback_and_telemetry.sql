-- ==============================================================================
-- MIGRATION: Phase 1A - Feedback Events, Materialized Bookmarks, and Telemetry
-- Date: 2026-09-29
-- Description: Creates saved_jobs, job_feedback_events, and job_interaction_telemetry
-- ==============================================================================

-- 1. Materialized Bookmarks Table (Current State)
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT saved_jobs_profile_job_unique UNIQUE (profile_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_profile ON public.saved_jobs(profile_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created ON public.saved_jobs(created_at DESC);

-- 2. Deliberate Behavioral History (Append-Only Event Log)
CREATE TABLE IF NOT EXISTS public.job_feedback_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('save', 'unsave', 'reject', 'external_apply_clicked', 'interview')),
    reason TEXT CHECK (reason IS NULL OR reason IN (
        'too_senior',
        'too_junior',
        'tech_mismatch',
        'location_work_mode',
        'salary',
        'company',
        'role_mismatch',
        'employment_type',
        'not_interested',
        'other'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_job_feedback_profile_event ON public.job_feedback_events(profile_id, event_type);
CREATE INDEX IF NOT EXISTS idx_job_feedback_job ON public.job_feedback_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_feedback_created ON public.job_feedback_events(created_at DESC);

-- 3. Passive Interaction Telemetry (Quarantined Operational Logs)
CREATE TABLE IF NOT EXISTS public.job_interaction_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('impression', 'card_click', 'drawer_view')),
    duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_telemetry_created ON public.job_interaction_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_profile ON public.job_interaction_telemetry(profile_id);

-- 4. Row Level Security Policies
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_interaction_telemetry ENABLE ROW LEVEL SECURITY;

-- Helper to safely recreate policies
DO $$
BEGIN
  -- saved_jobs
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_jobs' AND policyname = 'Users can manage own saved jobs') THEN
    DROP POLICY "Users can manage own saved jobs" ON public.saved_jobs;
  END IF;
  CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

  -- job_feedback_events
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_feedback_events' AND policyname = 'Users can read own feedback events') THEN
    DROP POLICY "Users can read own feedback events" ON public.job_feedback_events;
  END IF;
  CREATE POLICY "Users can read own feedback events" ON public.job_feedback_events FOR SELECT TO authenticated USING (profile_id = auth.uid());

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_feedback_events' AND policyname = 'Users can insert own feedback events') THEN
    DROP POLICY "Users can insert own feedback events" ON public.job_feedback_events;
  END IF;
  CREATE POLICY "Users can insert own feedback events" ON public.job_feedback_events FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

  -- job_interaction_telemetry
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_interaction_telemetry' AND policyname = 'Users can insert own telemetry') THEN
    DROP POLICY "Users can insert own telemetry" ON public.job_interaction_telemetry;
  END IF;
  CREATE POLICY "Users can insert own telemetry" ON public.job_interaction_telemetry FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
END $$;

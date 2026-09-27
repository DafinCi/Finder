-- ==============================================================================
-- MIGRATION: Phase 0 - External Job Identity, Sources, URLs & Lifecycle Metadata
-- Date: 2026-09-25
-- Description: Additive schema migration to support multi-provider job ingestion
--              (Remotive, RemoteOK, Jobicy, Arbeitnow) while preserving internal jobs.
-- ==============================================================================

-- 1. Make company_id nullable to decouple external jobs from internal company records
ALTER TABLE public.jobs ALTER COLUMN company_id DROP NOT NULL;

-- 2. Add cached/denormalized company branding for external jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 3. Add source provider identity and external ID tracking
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_job_id TEXT;

-- 4. Add distinct source URL (origin listing) and apply URL (application target)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_url TEXT;

-- 5. Add synchronization lifecycle timestamps
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());

-- 6. Backfill existing internal/manual jobs with company metadata from companies table
UPDATE public.jobs j
SET company_name = c.name,
    company_logo = c.logo_url
FROM public.companies c
WHERE j.company_id = c.id
  AND j.company_name IS NULL;

-- 7. Add Check Constraint on allowed sources (safe idempotent check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_jobs_source'
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT chk_jobs_source 
      CHECK (source IN ('manual', 'remotive', 'remoteok', 'jobicy', 'arbeitnow'));
  END IF;
END $$;

-- 8. Table-level Unique Constraint: Enforce uniqueness for external provider jobs
-- In PostgreSQL, NULL != NULL, so multiple manual/internal jobs (where source_job_id IS NULL)
-- safely coexist, while ensuring idempotent PostgREST upserts on (source, source_job_id).
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

-- 9. Query & Filter Performance Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_last_synced_at ON public.jobs(last_synced_at DESC);


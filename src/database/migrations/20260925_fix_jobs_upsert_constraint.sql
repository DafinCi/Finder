-- ==============================================================================
-- MIGRATION: Fix PostgreSQL / PostgREST Upsert Constraint for Jobs
-- Date: 2026-09-25
-- Description: Replaces the partial unique index (idx_jobs_source_job_id) with a
--              table-level UNIQUE constraint (uq_jobs_source_job_id) so PostgREST
--              upsert with onConflict: "source,source_job_id" matches without 42P10.
-- ==============================================================================

-- 1. Remove the old partial index
DROP INDEX IF EXISTS public.idx_jobs_source_job_id;

-- 2. Add table-level unique constraint
-- Note: In standard PostgreSQL, NULL != NULL, so multiple rows with
-- source = 'manual' and source_job_id = NULL can coexist without conflict.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_jobs_source_job_id'
  ) THEN
    ALTER TABLE public.jobs 
    ADD CONSTRAINT uq_jobs_source_job_id 
    UNIQUE (source, source_job_id);
  END IF;
END $$;
